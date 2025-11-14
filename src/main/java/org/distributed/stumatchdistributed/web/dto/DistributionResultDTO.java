package org.distributed.stumatchdistributed.web.dto;


import java.util.List;
import java.util.Map;

/**
 * DTO for file distribution results.
 * Contains information about how chunks were distributed.
 *
 * @author Your Name
 * @version 1.0
 */
public class DistributionResultDTO {
    private String fileName;
    private int totalChunks;
    private long totalSizeBytes;
    private long distributionTimeMs;
    private Map<String, List<String>> nodeToChunks; // nodeId -> list of chunkIds

    // Constructors
    public DistributionResultDTO() {
    }

    public DistributionResultDTO(String fileName, int totalChunks, long totalSizeBytes,
                                 long distributionTimeMs, Map<String, List<String>> nodeToChunks) {
        this.fileName = fileName;
        this.totalChunks = totalChunks;
        this.totalSizeBytes = totalSizeBytes;
        this.distributionTimeMs = distributionTimeMs;
        this.nodeToChunks = nodeToChunks;
    }

    // Getters and Setters
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public int getTotalChunks() {
        return totalChunks;
    }

    public void setTotalChunks(int totalChunks) {
        this.totalChunks = totalChunks;
    }

    public long getTotalSizeBytes() {
        return totalSizeBytes;
    }

    public void setTotalSizeBytes(long totalSizeBytes) {
        this.totalSizeBytes = totalSizeBytes;
    }

    public long getDistributionTimeMs() {
        return distributionTimeMs;
    }

    public void setDistributionTimeMs(long distributionTimeMs) {
        this.distributionTimeMs = distributionTimeMs;
    }

    public Map<String, List<String>> getNodeToChunks() {
        return nodeToChunks;
    }

    public void setNodeToChunks(Map<String, List<String>> nodeToChunks) {
        this.nodeToChunks = nodeToChunks;
    }
}
