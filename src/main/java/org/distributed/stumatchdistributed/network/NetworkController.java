package org.distributed.stumatchdistributed.network;

import jakarta.annotation.PreDestroy;
import org.distributed.stumatchdistributed.model.ChunkDistribution;
import org.distributed.stumatchdistributed.model.FileChunk;
import org.distributed.stumatchdistributed.service.FileDecompositionService;
import org.distributed.stumatchdistributed.service.LoadBalancingService;
import org.distributed.stumatchdistributed.service.StorageMetricsService;
import com.google.protobuf.ByteString;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Coordinates the distributed storage network.
 *
 * Design Principles:
 * - Facade Pattern: Simplifies interaction with distributed system
 * - Dependency Injection: Uses Spring for service dependencies
 * - Separation of Concerns: Delegates to specialized services
 *
 * Responsibilities:
 * 1. Maintains registry of available nodes
 * 2. Coordinates file distribution
 * 3. Aggregates network statistics
 * 4. Manages node connections
 *
 * @author Your Name
 * @version 1.0
 */
@Component
public class NetworkController {
    private static final Logger log = LoggerFactory.getLogger(NetworkController.class);

    // Registry of connected nodes (thread-safe)
    private final Map<String, NodeConnection> nodes = new HashMap<>();

    // Injected services (dependency injection)
    private final FileDecompositionService decompositionService;
    private final LoadBalancingService loadBalancingService;
    private final StorageMetricsService metricsService;

    /**
     * Constructor with dependency injection.
     * Spring automatically injects required services.
     */
    @Autowired
    public NetworkController(FileDecompositionService decompositionService,
                             LoadBalancingService loadBalancingService,
                             StorageMetricsService metricsService) {
        this.decompositionService = decompositionService;
        this.loadBalancingService = loadBalancingService;
        this.metricsService = metricsService;

        log.info("Network Controller initialized");
    }

    /**
     * Registers a node in the network.
     * Creates gRPC connection to the node.
     *
     * @param nodeId Unique node identifier
     * @param host Node hostname
     * @param port Node gRPC port
     * @throws IllegalArgumentException if node already registered
     */
    public void registerNode(String nodeId, String host, int port) {
        if (nodes.containsKey(nodeId)) {
            throw new IllegalArgumentException("Node already registered: " + nodeId);
        }

        log.info("Registering node: {} at {}:{}", nodeId, host, port);

        // Create gRPC channel
        ManagedChannel channel = ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext() // No TLS for local development
                .build();

        // Create blocking stub for synchronous calls
        org.distributed.stumatchdistributed.grpc.NodeServiceGrpc.NodeServiceBlockingStub stub =
                org.distributed.stumatchdistributed.grpc.NodeServiceGrpc.newBlockingStub(channel);

        // Store connection
        NodeConnection connection = new NodeConnection(nodeId, host, port, channel, stub);
        nodes.put(nodeId, connection);

        log.info("✅ Node registered: {}", nodeId);

        // Fetch initial status
        updateNodeStatus(nodeId);
    }

    /**
     * Distributes a file across the network.
     *
     * Process:
     * 1. Decompose file into chunks
     * 2. Select nodes using load balancing
     * 3. Transfer chunks via gRPC
     * 4. Track distribution
     *
     * @param filePath Path to file to distribute
     * @param chunkSizeMB Size of each chunk in MB
     * @return Distribution map showing which chunks went where
     * @throws Exception if distribution fails
     */
    public ChunkDistribution distributeFile(Path filePath, int chunkSizeMB) throws Exception {
        log.info("═══════════════════════════════════════════════════════");
        log.info("Starting file distribution: {}", filePath.getFileName());
        log.info("═══════════════════════════════════════════════════════");

        // Step 1: Decompose file (delegation to service)
        List<FileChunk> chunks = decompositionService.decomposeFile(filePath, chunkSizeMB);
        log.info("File decomposed into {} chunks", chunks.size());

        // Step 2: Create distribution tracker
        ChunkDistribution distribution = new ChunkDistribution(
                filePath.getFileName().toString(),
                chunks.size()
        );

        // Step 3: Get available nodes
        List<String> availableNodes = new ArrayList<>(nodes.keySet());
        if (availableNodes.isEmpty()) {
            throw new IllegalStateException("No nodes available for storage");
        }

        log.info("Distributing across {} nodes", availableNodes.size());
        log.info("───────────────────────────────────────────────────────");

        // Step 4: Distribute each chunk
        long totalTransferTime = 0;

        for (int i = 0; i < chunks.size(); i++) {
            FileChunk chunk = chunks.get(i);

            // Select target node (delegation to load balancing service)
            String targetNodeId = loadBalancingService.selectNodeForChunk(availableNodes);
            NodeConnection targetNode = nodes.get(targetNodeId);

            log.info("Chunk {}/{}: {} → {}",
                    i + 1, chunks.size(), chunk.getChunkId(), targetNodeId);

            // Transfer chunk via gRPC
            long transferTime = transferChunk(targetNode, chunk);
            totalTransferTime += transferTime;

            // Record distribution
            distribution.addChunkToNode(targetNodeId, chunk.getChunkId());

            log.info("  ✓ Transferred in {} ms", transferTime);
        }

        // Step 5: Update all node statuses
        updateAllNodeStatuses();

        log.info("═══════════════════════════════════════════════════════");
        log.info("Distribution completed in {} ms", totalTransferTime);
        log.info("═══════════════════════════════════════════════════════");

        return distribution;
    }

    /**
     * Transfers a single chunk to a node via gRPC.
     *
     * @param nodeConnection Target node connection
     * @param chunk Chunk to transfer
     * @return Transfer time in milliseconds
     * @throws RuntimeException if transfer fails
     */
    private long transferChunk(NodeConnection nodeConnection, FileChunk chunk) {
        long startTime = System.currentTimeMillis();

        try {
            // Create gRPC request
            org.distributed.stumatchdistributed.grpc.StoreChunkRequest request = org.distributed.stumatchdistributed.grpc.StoreChunkRequest.newBuilder()
                    .setChunkId(chunk.getChunkId())
                    .setData(ByteString.copyFrom(chunk.getData()))
                    .setSize(chunk.getSizeBytes())
                    .build();

            // Make synchronous gRPC call
            org.distributed.stumatchdistributed.grpc.StoreChunkResponse response = nodeConnection.getStub().storeChunk(request);

            if (!response.getSuccess()) {
                throw new RuntimeException(
                        "Node " + nodeConnection.getNodeId() + " rejected chunk: " +
                                response.getMessage()
                );
            }

        } catch (Exception e) {
            log.error("Failed to transfer chunk to " + nodeConnection.getNodeId(), e);
            throw new RuntimeException("Chunk transfer failed", e);
        }

        return System.currentTimeMillis() - startTime;
    }

    /**
     * Updates cached status for a specific node.
     */
    private void updateNodeStatus(String nodeId) {
        try {
            NodeConnection connection = nodes.get(nodeId);
            if (connection == null) return;

            org.distributed.stumatchdistributed.grpc.StatusRequest request = org.distributed.stumatchdistributed.grpc.StatusRequest.newBuilder().build();
            org.distributed.stumatchdistributed.grpc.StatusResponse response = connection.getStub().getStatus(request);

            // Convert to domain model
            org.distributed.stumatchdistributed.model.NodeStatus status =
                    new org.distributed.stumatchdistributed.model.NodeStatus(
                            response.getNodeId(),
                            response.getUsedStorage(),
                            response.getTotalStorage(),
                            response.getNumChunks(),
                            response.getUtilizationPercent()
                    );

            // Update metrics service
            metricsService.updateNodeStatus(status);

        } catch (Exception e) {
            log.error("Failed to get status from node " + nodeId, e);
        }
    }

    /**
     * Updates status for all registered nodes.
     */
    public void updateAllNodeStatuses() {
        nodes.keySet().forEach(this::updateNodeStatus);
    }

    /**
     * Gets aggregated network statistics.
     */
    public Map<String, Object> getNetworkStats() {
        updateAllNodeStatuses();
        return metricsService.getNetworkMetrics();
    }

    /**
     * Gets list of registered nodes.
     */
    public Set<String> getRegisteredNodes() {
        return Collections.unmodifiableSet(nodes.keySet());
    }

    /**
     * Cleanup method called on shutdown.
     * Ensures gRPC channels are properly closed.
     */
    @PreDestroy
    public void shutdown() {
        log.info("Shutting down network controller...");

        for (NodeConnection connection : nodes.values()) {
            try {
                connection.getChannel()
                        .shutdown()
                        .awaitTermination(5, TimeUnit.SECONDS);

                log.info("Closed connection to {}", connection.getNodeId());
            } catch (InterruptedException e) {
                log.error("Error closing connection", e);
            }
        }

        log.info("Network controller shutdown complete");
    }
}
