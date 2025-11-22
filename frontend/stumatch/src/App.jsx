import React, { useState, useEffect } from 'react';
import { Server, HardDrive, Activity, Cpu, Network, Terminal, Power, Clock, FileText, Zap, TrendingUp, Database } from 'lucide-react';
import './App.css';

/**
 * Modern Comprehensive Virtual Machine Dashboard
 * Beautiful, professional design with all functionality
 */
export default function VMDashboard() {
    const [nodes, setNodes] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        fetchNodes();
        const interval = setInterval(fetchNodes, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchNodes = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/network/nodes');
            const data = await response.json();
            setNodes(data);
            addLog('INFO', `Refreshed ${data.length} node(s)`);
        } catch (error) {
            addLog('ERROR', 'Failed to fetch nodes');
        }
    };

    const addLog = (level, message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-50), { timestamp, level, message }]);
    };

    // Simulated node data (in production, fetch from API)
    const mockNodes = [
        {
            nodeId: 'node1',
            ipAddress: '192.168.100.10',
            macAddress: '02:00:00:00:00:0A',
            port: 50051,
            state: 'RUNNING',
            alive: true,
            uptime: 3600,
            disk: { used: 2048, total: 102400, files: 15 },
            processes: [
                { pid: 1001, name: 'StoreChunk-001', state: 'RUNNING', cpu: 25 },
                { pid: 1002, name: 'StoreChunk-002', state: 'WAITING', cpu: 0 }
            ],
            ram: 8,
            cpu: 4
        },
        {
            nodeId: 'node2',
            ipAddress: '192.168.100.11',
            macAddress: '02:00:00:00:00:0B',
            port: 50052,
            state: 'WAITING',
            alive: true,
            uptime: 3590,
            disk: { used: 4096, total: 102400, files: 22 },
            processes: [],
            ram: 8,
            cpu: 4
        },
        {
            nodeId: 'node3',
            ipAddress: '192.168.100.12',
            macAddress: '02:00:00:00:00:0C',
            port: 50053,
            state: 'RUNNING',
            alive: true,
            uptime: 3580,
            disk: { used: 1024, total: 102400, files: 8 },
            processes: [
                { pid: 3001, name: 'StoreChunk-003', state: 'RUNNING', cpu: 45 }
            ],
            ram: 8,
            cpu: 4
        },
        {
            nodeId: 'node4',
            ipAddress: '192.168.100.13',
            macAddress: '02:00:00:00:00:0D',
            port: 50054,
            state: 'READY',
            alive: true,
            uptime: 120,
            disk: { used: 0, total: 102400, files: 0 },
            processes: [],
            ram: 8,
            cpu: 4
        },
        {
            nodeId: 'node5',
            ipAddress: '192.168.100.14',
            macAddress: '02:00:00:00:00:0E',
            port: 50055,
            state: 'WAITING',
            alive: true,
            uptime: 3600,
            disk: { used: 3072, total: 102400, files: 18 },
            processes: [],
            ram: 8,
            cpu: 4
        }
    ];

    const getStateColor = (state) => {
        const colors = {
            'CREATED': '#94a3b8',
            'READY': '#60a5fa',
            'RUNNING': '#34d399',
            'WAITING': '#fbbf24',
            'STOPPED': '#fb923c',
            'DEAD': '#f87171'
        };
        return colors[state] || '#94a3b8';
    };

    const getStateBgColor = (state) => {
        const colors = {
            'CREATED': 'rgba(148, 163, 184, 0.1)',
            'READY': 'rgba(96, 165, 250, 0.1)',
            'RUNNING': 'rgba(52, 211, 153, 0.1)',
            'WAITING': 'rgba(251, 191, 36, 0.1)',
            'STOPPED': 'rgba(251, 146, 60, 0.1)',
            'DEAD': 'rgba(248, 113, 113, 0.1)'
        };
        return colors[state] || 'rgba(148, 163, 184, 0.1)';
    };

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const totalStorage = mockNodes.reduce((acc, n) => acc + n.disk.used, 0);
    const totalCapacity = mockNodes.reduce((acc, n) => acc + n.disk.total, 0);
    const activeNodes = mockNodes.filter(n => n.alive).length;

    return (
        <div className="dashboard-container">
            {/* Modern Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="logo-container">
                            <Zap className="logo-icon" />
                        </div>
                        <div>
                            <h1 className="dashboard-title">Distributed VM Monitor</h1>
                            <p className="dashboard-subtitle">Real-time System Monitoring & Management</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-card-mini">
                            <Server className="stat-icon" />
                            <div>
                                <div className="stat-value">{activeNodes}/{mockNodes.length}</div>
                                <div className="stat-label">Active Nodes</div>
                            </div>
                        </div>
                        <div className="stat-card-mini">
                            <Database className="stat-icon" />
                            <div>
                                <div className="stat-value">{(totalStorage / 1024).toFixed(1)} GB</div>
                                <div className="stat-label">Storage Used</div>
                            </div>
                        </div>
                        <div className="stat-card-mini">
                            <TrendingUp className="stat-icon" />
                            <div>
                                <div className="stat-value">{((totalStorage / totalCapacity) * 100).toFixed(1)}%</div>
                                <div className="stat-label">Capacity</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Left Sidebar - Node List */}
                <aside className="nodes-sidebar">
                    <div className="section-header">
                        <Server className="section-icon" />
                        <h2>Virtual Nodes</h2>
                        <span className="badge">{mockNodes.length}</span>
                    </div>
                    <div className="nodes-list">
                        {mockNodes.map((node) => {
                            const diskPercent = (node.disk.used / node.disk.total) * 100;
                            return (
                                <div
                                    key={node.nodeId}
                                    onClick={() => setSelectedNode(node)}
                                    className={`node-card ${selectedNode?.nodeId === node.nodeId ? 'selected' : ''}`}
                                >
                                    <div className="node-card-header">
                                        <div className="node-info">
                                            <div className="node-name">{node.nodeId.toUpperCase()}</div>
                                            <div className="node-ip">{node.ipAddress}</div>
                                        </div>
                                        <div className="node-status">
                                            <div 
                                                className={`status-dot ${node.alive ? 'alive' : 'dead'}`}
                                                style={{ backgroundColor: getStateColor(node.state) }}
                                            />
                                            <span 
                                                className="node-state"
                                                style={{ color: getStateColor(node.state) }}
                                            >
                                                {node.state}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="node-metrics">
                                        <div className="metric">
                                            <HardDrive className="metric-icon" />
                                            <div>
                                                <div className="metric-value">{diskPercent.toFixed(1)}%</div>
                                                <div className="metric-label">Disk</div>
                                            </div>
                                        </div>
                                        <div className="metric">
                                            <Cpu className="metric-icon" />
                                            <div>
                                                <div className="metric-value">{node.processes.length}</div>
                                                <div className="metric-label">Processes</div>
                                            </div>
                                        </div>
                                        <div className="metric">
                                            <Clock className="metric-icon" />
                                            <div>
                                                <div className="metric-value">{Math.floor(node.uptime / 60)}m</div>
                                                <div className="metric-label">Uptime</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="disk-bar-container">
                                        <div 
                                            className="disk-bar"
                                            style={{ 
                                                width: `${diskPercent}%`,
                                                backgroundColor: diskPercent > 80 ? '#f87171' : diskPercent > 60 ? '#fbbf24' : '#34d399'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Panel - Node Details */}
                <main className="main-panel">
                    {selectedNode ? (
                        <div className="node-details">
                            <div className="details-header">
                                <div>
                                    <h2 className="details-title">{selectedNode.nodeId.toUpperCase()}</h2>
                                    <p className="details-subtitle">Complete Node Information</p>
                                </div>
                                <div 
                                    className="state-badge-large"
                                    style={{ 
                                        backgroundColor: getStateBgColor(selectedNode.state),
                                        color: getStateColor(selectedNode.state)
                                    }}
                                >
                                    {selectedNode.state}
                                </div>
                            </div>

                            <div className="details-grid">
                                {/* Network Interface Card */}
                                <div className="detail-card">
                                    <div className="card-header">
                                        <Network className="card-icon" />
                                        <h3>Network Interface</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="info-row">
                                            <span className="info-label">IP Address</span>
                                            <span className="info-value">{selectedNode.ipAddress}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">MAC Address</span>
                                            <span className="info-value font-mono">{selectedNode.macAddress}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Port</span>
                                            <span className="info-value">{selectedNode.port}</span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Interface</span>
                                            <span className="info-value">virtual-eth0</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lifecycle Status Card */}
                                <div className="detail-card">
                                    <div className="card-header">
                                        <Power className="card-icon" />
                                        <h3>Lifecycle Status</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="info-row">
                                            <span className="info-label">State</span>
                                            <span 
                                                className="info-value"
                                                style={{ color: getStateColor(selectedNode.state) }}
                                            >
                                                {selectedNode.state}
                                            </span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Alive</span>
                                            <span className="info-value">
                                                {selectedNode.alive ? (
                                                    <span className="status-indicator success">✓ YES</span>
                                                ) : (
                                                    <span className="status-indicator error">✗ NO</span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="info-row">
                                            <span className="info-label">Uptime</span>
                                            <span className="info-value">{formatUptime(selectedNode.uptime)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Virtual Disk Card */}
                                <div className="detail-card">
                                    <div className="card-header">
                                        <HardDrive className="card-icon" />
                                        <h3>Virtual Disk</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="disk-stats">
                                            <div className="disk-stat">
                                                <div className="disk-stat-value">{(selectedNode.disk.used / 1024).toFixed(2)} GB</div>
                                                <div className="disk-stat-label">Used</div>
                                            </div>
                                            <div className="disk-stat">
                                                <div className="disk-stat-value">{(selectedNode.disk.total / 1024).toFixed(2)} GB</div>
                                                <div className="disk-stat-label">Total</div>
                                            </div>
                                            <div className="disk-stat">
                                                <div className="disk-stat-value">{selectedNode.disk.files}</div>
                                                <div className="disk-stat-label">Files</div>
                                            </div>
                                        </div>
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ 
                                                        width: `${(selectedNode.disk.used / selectedNode.disk.total) * 100}%`,
                                                        backgroundColor: (selectedNode.disk.used / selectedNode.disk.total) * 100 > 80 ? '#f87171' : '#34d399'
                                                    }}
                                                />
                                            </div>
                                            <span className="progress-text">
                                                {((selectedNode.disk.used / selectedNode.disk.total) * 100).toFixed(1)}% Used
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Processes Card */}
                                <div className="detail-card full-width">
                                    <div className="card-header">
                                        <Cpu className="card-icon" />
                                        <h3>Active Processes</h3>
                                        <span className="badge">{selectedNode.processes.length}</span>
                                    </div>
                                    <div className="card-content">
                                        {selectedNode.processes.length > 0 ? (
                                            <div className="processes-table">
                                                <div className="table-header">
                                                    <div className="table-cell">PID</div>
                                                    <div className="table-cell">Name</div>
                                                    <div className="table-cell">State</div>
                                                    <div className="table-cell">CPU %</div>
                                                </div>
                                                {selectedNode.processes.map((proc) => (
                                                    <div key={proc.pid} className="table-row">
                                                        <div className="table-cell font-mono">{proc.pid}</div>
                                                        <div className="table-cell">{proc.name}</div>
                                                        <div className="table-cell">
                                                            <span 
                                                                className="process-state"
                                                                style={{ color: getStateColor(proc.state) }}
                                                            >
                                                                {proc.state}
                                                            </span>
                                                        </div>
                                                        <div className="table-cell">
                                                            <div className="cpu-usage">
                                                                <div className="cpu-bar">
                                                                    <div 
                                                                        className="cpu-fill"
                                                                        style={{ width: `${proc.cpu}%` }}
                                                                    />
                                                                </div>
                                                                <span>{proc.cpu}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <Activity className="empty-icon" />
                                                <p>No active processes</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* System Resources Card */}
                                <div className="detail-card">
                                    <div className="card-header">
                                        <Activity className="card-icon" />
                                        <h3>System Resources</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="resource-item">
                                            <span className="resource-label">RAM</span>
                                            <span className="resource-value">{selectedNode.ram} GB</span>
                                        </div>
                                        <div className="resource-item">
                                            <span className="resource-label">CPU Cores</span>
                                            <span className="resource-value">{selectedNode.cpu}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-selection">
                            <Server className="empty-selection-icon" />
                            <h3>Select a Node</h3>
                            <p>Choose a node from the sidebar to view detailed information</p>
                        </div>
                    )}
                </main>
            </div>

            {/* System Logs Panel */}
            <div className="logs-panel">
                <div className="section-header">
                    <Terminal className="section-icon" />
                    <h2>System Log</h2>
                </div>
                <div className="logs-content">
                    <div className="log-entry">
                        <span className="log-time">[00:00:00]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">SYSTEM BOOT</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:01]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Network Interface Manager initialized</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:02]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Virtual Disk subsystem ready</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:03]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Node1 started (IP: 192.168.100.10)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:04]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Node2 started (IP: 192.168.100.11)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:05]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Node3 started (IP: 192.168.100.12)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:06]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Node4 started (IP: 192.168.100.13)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:00:07]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">Node5 started (IP: 192.168.100.14)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:01:00]</span>
                        <span className="log-level info">INFO</span>
                        <span className="log-message">File distribution initiated</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:01:01]</span>
                        <span className="log-level success">SUCCESS</span>
                        <span className="log-message">Chunk 0 → Node1 (RUNNING)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:01:02]</span>
                        <span className="log-level success">SUCCESS</span>
                        <span className="log-message">Chunk 1 → Node2 (COMPLETE)</span>
                    </div>
                    <div className="log-entry">
                        <span className="log-time">[00:01:03]</span>
                        <span className="log-level success">SUCCESS</span>
                        <span className="log-message">Chunk 2 → Node3 (RUNNING)</span>
                    </div>
                    {logs.map((log, i) => (
                        <div key={i} className="log-entry">
                            <span className="log-time">[{log.timestamp}]</span>
                            <span className={`log-level ${log.level.toLowerCase()}`}>{log.level}</span>
                            <span className="log-message">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Network Topology Panel */}
            <div className="topology-panel">
                <div className="section-header">
                    <Network className="section-icon" />
                    <h2>Network Topology</h2>
                    <span className="network-subnet">192.168.100.0/24</span>
                </div>
                <div className="topology-grid">
                    {mockNodes.map((node) => (
                        <div key={node.nodeId} className="topology-node">
                            <div className="topology-node-icon">
                                <Server className="topology-server-icon" />
                                <div 
                                    className="topology-status-dot"
                                    style={{ backgroundColor: node.alive ? '#34d399' : '#f87171' }}
                                />
                            </div>
                            <div className="topology-node-name">{node.nodeId.toUpperCase()}</div>
                            <div className="topology-node-ip">{node.ipAddress}</div>
                            <div 
                                className="topology-node-state"
                                style={{ color: getStateColor(node.state) }}
                            >
                                {node.state}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
