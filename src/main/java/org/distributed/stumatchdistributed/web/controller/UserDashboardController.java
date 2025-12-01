package org.distributed.stumatchdistributed.web.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.distributed.stumatchdistributed.auth.entity.UserAccount;
import org.distributed.stumatchdistributed.auth.service.UserContextService;
import org.distributed.stumatchdistributed.storage.entity.FileMetadata;
import org.distributed.stumatchdistributed.storage.entity.UserStorage;
import org.distributed.stumatchdistributed.storage.repository.FileMetadataRepository;
import org.distributed.stumatchdistributed.storage.service.UserStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class UserDashboardController {

    private final UserContextService userContextService;
    private final UserStorageService userStorageService;
    private final FileMetadataRepository fileMetadataRepository;

    /**
     * GET /api/user/dashboard
     * Returns user's storage info, quota, usage, file count
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserDashboard(Authentication authentication) {
        try {
            log.info("API request: GET /api/user/dashboard");
            
            UserAccount user = userContextService.requireUserByEmail(authentication.getName());
            UserStorage storage = userStorageService.getStorageByUser(user);
            List<FileMetadata> files = fileMetadataRepository.findByOwner(user);

            Map<String, Object> dashboard = new HashMap<>();
            
            // User info
            dashboard.put("userName", user.getFullName() != null ? user.getFullName() : user.getEmail());
            dashboard.put("email", user.getEmail());
            
            // Storage info
            dashboard.put("quotaBytes", storage.getQuotaBytes());
            dashboard.put("usedBytes", storage.getUsedBytes());
            dashboard.put("availableBytes", storage.getQuotaBytes() - storage.getUsedBytes());
            dashboard.put("usagePercentage", (double) storage.getUsedBytes() / storage.getQuotaBytes() * 100);
            
            // File info
            dashboard.put("totalFiles", files.size());
            dashboard.put("diskId", storage.getDiskId());
            dashboard.put("storageState", storage.getState().toString());
            
            // Format sizes
            dashboard.put("quotaGB", formatBytes(storage.getQuotaBytes()));
            dashboard.put("usedGB", formatBytes(storage.getUsedBytes()));
            dashboard.put("availableGB", formatBytes(storage.getQuotaBytes() - storage.getUsedBytes()));

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            log.error("Failed to get user dashboard", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/user/dashboard/files
     * Returns list of user's files with details
     */
    @GetMapping("/files")
    public ResponseEntity<?> getUserFiles(Authentication authentication) {
        try {
            log.info("API request: GET /api/user/dashboard/files");
            
            UserAccount user = userContextService.requireUserByEmail(authentication.getName());
            List<FileMetadata> files = fileMetadataRepository.findByOwner(user);

            return ResponseEntity.ok(files);
        } catch (Exception e) {
            log.error("Failed to get user files", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
