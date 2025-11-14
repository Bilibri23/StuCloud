package org.distributed.stumatchdistributed.web.controller;

import org.distributed.stumatchdistributed.network.NetworkController;
import org.distributed.stumatchdistributed.service.StorageMetricsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for network operations.
 *
 * Design Pattern: Controller Pattern (MVC)
 * - Handles HTTP requests
 * - Delegates business logic to services
 * - Returns DTOs instead of domain models
 *
 * RESTful Design:
 * - GET for retrieving data
 * - POST for creating/triggering operations
 * - Proper HTTP status codes
 * - JSON responses
 *
 * @author Your Name
 * @version 1.0
 */
@RestController
@RequestMapping("/api/network")
@CrossOrigin(origins = "*") // Allow frontend access
public class NetworkRestController {
    private static final Logger log = LoggerFactory.getLogger(NetworkRestController.class);

    private final NetworkController networkController;
    private final StorageMetricsService metricsService;

    /**
     * Constructor injection for better testability.
     */
    @Autowired
    public NetworkRestController(NetworkController networkController,
                                 StorageMetricsService metricsService) {
        this.networkController = networkController;
        this.metricsService = metricsService;
    }

    /**
     * GET /api/network/nodes
     * Returns list of registered nodes.
     *
     * Example response:
     * [
     *   {"nodeId": "node1", "address": "localhost:50051"},
     *   {"nodeId": "node2", "address": "localhost:50052"}
     * ]
     */
    @GetMapping("/nodes")
    public ResponseEntity<List<Map<String, String>>> getNodes() {
        log.info("API request: GET /api/network/nodes");

        Set<String> nodeIds = networkController.getRegisteredNodes();
        List<Map<String, String>> nodes = new ArrayList<>();

        for (String nodeId : nodeIds) {
            Map<String, String> nodeInfo = new HashMap<>();
            nodeInfo.put("nodeId", nodeId);
            // You could add more info here if needed
            nodes.add(nodeInfo);
        }

        return ResponseEntity.ok(nodes);
    }

    /**
     * GET /api/network/status
     * Returns aggregated network statistics.
     *
     * Example response:
     * {
     *   "totalNodes": 3,
     *   "totalStorageBytes": 322122547200,
     *   "usedStorageBytes": 5242880,
     *   "utilizationPercent": 0.0016,
     *   "totalChunks": 5
     * }
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getNetworkStatus() {
        log.info("API request: GET /api/network/status");

        Map<String, Object> stats = networkController.getNetworkStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/network/nodes/register
     * Registers a new node in the network.
     *
     * Request body:
     * {
     *   "nodeId": "node1",
     *   "host": "localhost",
     *   "port": 50051
     * }
     */
    @PostMapping("/nodes/register")
    public ResponseEntity<?> registerNode(@RequestBody Map<String, Object> request) {
        try {
            String nodeId = (String) request.get("nodeId");
            String host = (String) request.get("host");
            Integer port = (Integer) request.get("port");

            log.info("API request: POST /api/network/nodes/register - nodeId={}", nodeId);

            // Validate input
            if (nodeId == null || host == null || port == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields: nodeId, host, port"));
            }

            // Register node
            networkController.registerNode(nodeId, host, port);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Node registered successfully",
                    "nodeId", nodeId
            ));

        } catch (Exception e) {
            log.error("Failed to register node", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
