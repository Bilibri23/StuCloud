package org.distributed.stumatchdistributed.web.dto;


/**
 * Data Transfer Object for node information.
 *
 * Design Pattern: DTO Pattern
 * - Separates internal models from external API representation
 * - Allows API changes without affecting internal structure
 *
 * @author Your Name
 * @version 1.0
 */
public class NodeInfoDTO {
    private String nodeId;
    private String address;
    private long usedStorageBytes;
    private long totalStorageBytes;
    private double utilizationPercent;
    private int numChunks;

    // Constructors
    public NodeInfoDTO() {}

    public NodeInfoDTO(String nodeId, String address, long usedStorageBytes,
                       long totalStorageBytes, double utilizationPercent, int numChunks) {
        this.nodeId = nodeId;
        this.address = address;
        this.usedStorageBytes = usedStorageBytes;
        this.totalStorageBytes = totalStorageBytes;
        this.utilizationPercent = utilizationPercent;
        this.numChunks = numChunks;
    }

    // Getters and Setters (required for JSON serialization)
    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public long getUsedStorageBytes() { return usedStorageBytes; }
    public void setUsedStorageBytes(long usedStorageBytes) {
        this.usedStorageBytes = usedStorageBytes;
    }

    public long getTotalStorageBytes() { return totalStorageBytes; }
    public void setTotalStorageBytes(long totalStorageBytes) {
        this.totalStorageBytes = totalStorageBytes;
    }

    public double getUtilizationPercent() { return utilizationPercent; }
    public void setUtilizationPercent(double utilizationPercent) {
        this.utilizationPercent = utilizationPercent;
    }

    public int getNumChunks() { return numChunks; }
    public void setNumChunks(int numChunks) { this.numChunks = numChunks; }
}

