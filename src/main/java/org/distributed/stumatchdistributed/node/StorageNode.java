package org.distributed.stumatchdistributed.node;

import org.distributed.stumatchdistributed.model.NodeStatus;
import io.grpc.Server;
import io.grpc.ServerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Represents a single storage node in the distributed system.
 *
 * Design Principles Applied:
 * - Single Responsibility: Manages storage for one node
 * - Encapsulation: Internal state is private
 * - Thread-Safety: Uses concurrent collections
 *
 * Each node runs as a SEPARATE PROCESS with its own gRPC server.
 *
 * @author Your Name
 * @version 1.0
 */
public class StorageNode {
    private static final Logger log = LoggerFactory.getLogger(StorageNode.class);

    // Node configuration (immutable)
    private final String nodeId;
    private final String ipAddress;
    private final int port;
    private final long totalStorageBytes;
    private final long totalRamBytes;
    private final int cpuCores;
    private final long bandwidthBitsPerSecond;

    // Storage state (mutable, thread-safe)
    private final Map<String, byte[]> storedChunks;
    private long usedStorageBytes;

    // gRPC server
    private Server server;

    /**
     * Private constructor to enforce builder pattern.
     * Use StorageNode.builder() to create instances.
     */
    private StorageNode(Builder builder) {
        this.nodeId = builder.nodeId;
        this.ipAddress = builder.ipAddress;
        this.port = builder.port;
        this.totalStorageBytes = builder.storageGB * 1024L * 1024 * 1024;
        this.totalRamBytes = builder.ramGB * 1024L * 1024 * 1024;
        this.cpuCores = builder.cpuCores;
        this.bandwidthBitsPerSecond = builder.bandwidthMbps * 1_000_000L;

        this.storedChunks = new ConcurrentHashMap<>();
        this.usedStorageBytes = 0;

        logNodeCreation();
    }

    /**
     * Starts the gRPC server for this node.
     * Blocks until server is terminated.
     *
     * @throws IOException if server cannot start
     */
    public void start() throws IOException, InterruptedException {
        server = ServerBuilder.forPort(port)
                .addService(new NodeServiceImpl(this))
                .build()
                .start();

        log.info("✅ Node {} started on port {}", nodeId, port);
        log.info("🌐 Ready to accept storage requests");

        // Shutdown hook for graceful termination
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.warn("⚠️ Shutting down node {}", nodeId);
            try {
                StorageNode.this.stop();
            } catch (InterruptedException e) {
                log.error("Error during shutdown", e);
            }
        }));

        server.awaitTermination();
    }

    /**
     * Stops the gRPC server gracefully.
     */
    public void stop() throws InterruptedException {
        if (server != null) {
            server.shutdown().awaitTermination(30, TimeUnit.SECONDS);
            log.info("Node {} stopped", nodeId);
        }
    }

    /**
     * Stores a chunk on this node.
     * <p>
     * Business Rules:
     * - Checks available storage before accepting
     * - Simulates network transfer time based on bandwidth
     * - Updates storage utilization
     *
     * @param chunkId Unique identifier for the chunk
     * @param data    Chunk data
     * @return true if stored successfully, false if insufficient space
     */
    public synchronized boolean storeChunk(String chunkId, byte[] data) {
        long chunkSize = data.length;

        // Business rule: Check capacity
        if (usedStorageBytes + chunkSize > totalStorageBytes) {
            log.warn("❌ Insufficient storage for chunk {} (need {} bytes, available {} bytes)",
                    chunkId, chunkSize, totalStorageBytes - usedStorageBytes);
            return false;
        }

        // Simulate network transfer time
        simulateTransferDelay(chunkSize);

        // Store the chunk
        storedChunks.put(chunkId, data);
        usedStorageBytes += chunkSize;

        double utilization = (usedStorageBytes * 100.0) / totalStorageBytes;
        log.info("✅ Stored chunk: {} ({} bytes) - Utilization: {:.2f}%",
                chunkId, chunkSize, utilization);

        return true;
    }

    /**
     * Retrieves a chunk from this node.
     *
     * @param chunkId Chunk identifier
     * @return Chunk data or null if not found
     */
    public synchronized byte[] retrieveChunk(String chunkId) {
        byte[] data = storedChunks.get(chunkId);

        if (data != null) {
            log.info("📤 Retrieved chunk: {} ({} bytes)", chunkId, data.length);
        } else {
            log.warn("❌ Chunk not found: {}", chunkId);
        }

        return data;
    }

    /**
     * Gets current node status snapshot.
     *
     * @return Immutable NodeStatus object
     */
    public synchronized NodeStatus getStatus() {
        double utilization = (usedStorageBytes * 100.0) / totalStorageBytes;

        return new NodeStatus(
                nodeId,
                usedStorageBytes,
                totalStorageBytes,
                storedChunks.size(),
                utilization
        );
    }

    /**
     * Simulates network transfer delay based on bandwidth.
     * Educational: Shows how network constraints affect performance.
     *
     * @param dataSize Size of data being transferred
     */
    private void simulateTransferDelay(long dataSize) {
        long transferTimeMs = (dataSize * 8 * 1000) / bandwidthBitsPerSecond;

        try {
            log.debug("⏱️ Simulating transfer time: {} ms", transferTimeMs);
            Thread.sleep(transferTimeMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Transfer interrupted", e);
        }
    }

    /**
     * Logs node creation details in a visually appealing format.
     */
    private void logNodeCreation() {
        log.info("╔════════════════════════════════════════════╗");
        log.info("║  Node Created: {}                    ║", String.format("%-20s", nodeId));
        log.info("╠════════════════════════════════════════════╣");
        log.info("║  IP Address:  {}:{}         ║", ipAddress, port);
        log.info("║  Storage:     {} GB                    ║", totalStorageBytes / (1024 * 1024 * 1024));
        log.info("║  RAM:         {} GB                     ║", totalRamBytes / (1024 * 1024 * 1024));
        log.info("║  CPU Cores:   {}                        ║", cpuCores);
        log.info("║  Bandwidth:   {} Mbps                ║", bandwidthBitsPerSecond / 1_000_000);
        log.info("╚════════════════════════════════════════════╝");
    }

    // Getters
    public String getNodeId() {
        return nodeId;
    }

    public int getPort() {
        return port;
    }

    /**
     * Builder Pattern for clean object construction.
     * Prevents telescoping constructor anti-pattern.
     */
    public static class Builder {
        private String nodeId;
        private String ipAddress = "127.0.0.1";
        private int port;
        private int storageGB = 100;
        private int ramGB = 8;
        private int cpuCores = 4;
        private int bandwidthMbps = 1000;

        public Builder nodeId(String nodeId) {
            this.nodeId = nodeId;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder port(int port) {
            this.port = port;
            return this;
        }

        public Builder storageGB(int storageGB) {
            this.storageGB = storageGB;
            return this;
        }

        public Builder ramGB(int ramGB) {
            this.ramGB = ramGB;
            return this;
        }

        public Builder cpuCores(int cpuCores) {
            this.cpuCores = cpuCores;
            return this;
        }

        public Builder bandwidthMbps(int bandwidthMbps) {
            this.bandwidthMbps = bandwidthMbps;
            return this;
        }

        public StorageNode build() {
            if (nodeId == null || nodeId.isEmpty()) {
                throw new IllegalStateException("Node ID is required");
            }
            if (port <= 0 || port > 65535) {
                throw new IllegalArgumentException("Invalid port number: " + port);
            }

            return new StorageNode(this);
        }
    }
    /**
     * Main method to run node as separate process.
     *
     * Usage: java StorageNode <node-id> <port> [storage-gb] [ram-gb]
     */
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: java StorageNode <node-id> <port> [storage-gb] [ram-gb]");
            System.exit(1);
        }

        try {
            StorageNode node = new StorageNode.Builder()
                    .nodeId(args[0])
                    .port(Integer.parseInt(args[1]))
                    .storageGB(args.length > 2 ? Integer.parseInt(args[2]) : 100)
                    .ramGB(args.length > 3 ? Integer.parseInt(args[3]) : 8)
                    .build();

            node.start();

        } catch (Exception e) {
            log.error("Failed to start node", e);
            System.exit(1);
        }
    }
}


