package org.distributed.stumatchdistributed.web.controller;

import org.distributed.stumatchdistributed.model.ChunkDistribution;
import org.distributed.stumatchdistributed.network.NetworkController;
import org.distributed.stumatchdistributed.web.dto.DistributionResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

/**
 * REST Controller for file operations.
 *
 * Handles:
 * - File uploads
 * - Distribution across nodes
 * - Retrieval operations
 *
 * @author Your Name
 * @version 1.0
 */
@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {
    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    private final NetworkController networkController;

    @Autowired
    public FileController(NetworkController networkController) {
        this.networkController = networkController;
    }

    /**
     * POST /api/files/upload
     * Uploads a file and distributes it across nodes.
     *
     * Form data:
     * - file: The file to upload
     * - chunkSize: (optional) Chunk size in MB, default 2
     *
     * Returns distribution information.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "chunkSize", defaultValue = "2") int chunkSizeMB) {

        try {
            log.info("API request: POST /api/files/upload - file={}, size={} bytes",
                    file.getOriginalFilename(), file.getSize());

            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "File is empty"));
            }

            // Save file temporarily
            Path tempFile = Files.createTempFile("upload_", "_" + file.getOriginalFilename());
            Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);

            log.info("File saved temporarily: {}", tempFile);

            // Distribute file
            long startTime = System.currentTimeMillis();
            ChunkDistribution distribution = networkController.distributeFile(tempFile, chunkSizeMB);
            long distributionTime = System.currentTimeMillis() - startTime;

            // Create response DTO
            DistributionResultDTO result = new DistributionResultDTO(
                    file.getOriginalFilename(),
                    distribution.getTotalChunks(),
                    file.getSize(),
                    distributionTime,
                    distribution.getDistribution()
            );

            // Clean up temp file
            Files.deleteIfExists(tempFile);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to upload and distribute file", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/files/test
     * Creates and distributes a test file.
     * Useful for testing without actual file upload.
     */
    @GetMapping("/test")
    public ResponseEntity<?> testDistribution(
            @RequestParam(value = "sizeMB", defaultValue = "5") int sizeMB,
            @RequestParam(value = "chunkSize", defaultValue = "2") int chunkSizeMB) {

        try {
            log.info("API request: GET /api/files/test - sizeMB={}", sizeMB);

            // Create test file
            Path testFile = Files.createTempFile("test_", ".dat");
            byte[] data = new byte[sizeMB * 1024 * 1024];
            // Fill with random data
            new java.util.Random().nextBytes(data);
            Files.write(testFile, data);

            log.info("Test file created: {} ({} MB)", testFile, sizeMB);

            // Distribute
            long startTime = System.currentTimeMillis();
            ChunkDistribution distribution = networkController.distributeFile(testFile, chunkSizeMB);
            long distributionTime = System.currentTimeMillis() - startTime;

            // Create response
            DistributionResultDTO result = new DistributionResultDTO(
                    "test_file.dat",
                    distribution.getTotalChunks(),
                    (long) sizeMB * 1024 * 1024,
                    distributionTime,
                    distribution.getDistribution()
            );

            // Clean up
            Files.deleteIfExists(testFile);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to create and distribute test file", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
