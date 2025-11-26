package org.distributed.stumatchdistributed.storage.service;

import org.distributed.stumatchdistributed.auth.entity.UserAccount;
import org.distributed.stumatchdistributed.config.StorageProperties;
import org.distributed.stumatchdistributed.storage.entity.FileMetadata;
import org.distributed.stumatchdistributed.storage.entity.UserStorage;
import org.distributed.stumatchdistributed.storage.repository.FileMetadataRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final UserStorageService userStorageService;
    private final StorageProperties storageProperties;

    public FileService(FileMetadataRepository fileMetadataRepository,
                       UserStorageService userStorageService,
                       StorageProperties storageProperties) {
        this.fileMetadataRepository = fileMetadataRepository;
        this.userStorageService = userStorageService;
        this.storageProperties = storageProperties;
    }

    public List<FileMetadata> listFiles(UserAccount user) {
        return fileMetadataRepository.findByOwnerIdAndDeletedFalseOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public FileMetadata upload(UserAccount user, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        long size = file.getSize();
        userStorageService.assertHasCapacity(user, size);

        UserStorage storage = userStorageService.getStorage(user);
        Path fileDir = resolveUserFileDirectory(storage);

        try {
            Files.createDirectories(fileDir);
            String objectKey = UUID.randomUUID().toString();
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file.bin";
            Path targetPath = fileDir.resolve(objectKey);
            Files.copy(file.getInputStream(), targetPath);

            FileMetadata metadata = FileMetadata.builder()
                    .owner(user)
                    .fileName(fileName)
                    .objectKey(objectKey)
                    .sizeBytes(size)
                    .contentType(file.getContentType())
                    .storagePath(targetPath.toString())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            FileMetadata saved = fileMetadataRepository.save(metadata);
            userStorageService.incrementUsage(user, size);
            return saved;

        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
    }

    public ResponseEntity<byte[]> download(UserAccount user, UUID fileId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .filter(file -> file.getOwner().getId().equals(user.getId()) && !file.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        try {
            Path path = Path.of(metadata.getStoragePath());
            byte[] bytes = Files.readAllBytes(path);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(
                            metadata.getContentType() != null ? metadata.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                    .body(bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read file", e);
        }
    }

    @Transactional
    public void delete(UserAccount user, UUID fileId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .filter(file -> file.getOwner().getId().equals(user.getId()) && !file.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("File not found"));

        metadata.setDeleted(true);
        metadata.setDeletedAt(LocalDateTime.now());
        fileMetadataRepository.save(metadata);

        try {
            Files.deleteIfExists(Path.of(metadata.getStoragePath()));
        } catch (IOException ignored) {}

        userStorageService.decrementUsage(user, metadata.getSizeBytes());
    }

    private Path resolveUserFileDirectory(UserStorage storage) {
        Path usersDir = storageProperties.userDisksPath();
        return usersDir.resolve(storage.getDiskId() + "_files");
    }
}

