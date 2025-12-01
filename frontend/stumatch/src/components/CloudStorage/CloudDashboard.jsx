import React, { useState, useEffect } from 'react';
import { 
    HardDrive, Upload, Download, Trash2, Server, 
    Play, Square, RotateCw, X, Activity, File
} from 'lucide-react';
import './CloudDashboard.css';

const API_BASE = 'http://localhost:8081/api';

export default function CloudDashboard() {
    const [userDashboard, setUserDashboard] = useState(null);
    const [files, setFiles] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [runningNodes, setRunningNodes] = useState([]);
    const [networkStatus, setNetworkStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        try {
            // Fetch user dashboard
            const dashRes = await fetch(`${API_BASE}/user/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (dashRes.ok) setUserDashboard(await dashRes.json());

            // Fetch files
            const filesRes = await fetch(`${API_BASE}/user/dashboard/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (filesRes.ok) setFiles(await filesRes.json());

            // Fetch network status
            const netRes = await fetch(`${API_BASE}/network/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (netRes.ok) setNetworkStatus(await netRes.json());

            // Fetch nodes
            const nodesRes = await fetch(`${API_BASE}/network/nodes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (nodesRes.ok) setNodes(await nodesRes.json());

            // Fetch running nodes
            const runningRes = await fetch(`${API_BASE}/network/nodes/running`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (runningRes.ok) {
                const data = await runningRes.json();
                setRunningNodes(data.runningNodes || []);
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/files/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                showMessage('File uploaded successfully!', 'success');
                fetchDashboardData();
            } else {
                showMessage('Upload failed', 'error');
            }
        } catch (error) {
            showMessage('Upload failed', 'error');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDownload = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            showMessage('Download failed', 'error');
        }
    };

    const handleDelete = async (fileId, fileName) => {
        if (!window.confirm(`Delete "${fileName}"?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showMessage('File deleted', 'success');
                fetchDashboardData();
            }
        } catch (error) {
            showMessage('Delete failed', 'error');
        }
    };

    const handleStartNode = async () => {
        const nodeId = `node${Date.now()}`;
        const port = 50051 + nodes.length;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/network/nodes/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nodeId, port, storageGB: 100, ramGB: 8 })
            });

            if (response.ok) {
                showMessage('Node started successfully!', 'success');
                setTimeout(fetchDashboardData, 3000);
            } else {
                showMessage('Failed to start node', 'error');
            }
        } catch (error) {
            showMessage('Failed to start node', 'error');
        }
    };

    const handleStopNode = async (nodeId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/network/nodes/stop/${nodeId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showMessage('Node stopped', 'success');
                fetchDashboardData();
            }
        } catch (error) {
            showMessage('Failed to stop node', 'error');
        }
    };

    const handleRestartNode = async (nodeId) => {
        try {
            const token = localStorage.getItem('token');
            const port = 50051 + nodes.findIndex(n => n.nodeId === nodeId);
            const response = await fetch(`${API_BASE}/network/nodes/restart/${nodeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ port, storageGB: 100, ramGB: 8 })
            });

            if (response.ok) {
                showMessage('Node restarted', 'success');
                setTimeout(fetchDashboardData, 3000);
            }
        } catch (error) {
            showMessage('Failed to restart node', 'error');
        }
    };

    const handleDeleteNode = async (nodeId) => {
        if (!window.confirm(`Delete node ${nodeId}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/network/nodes/${nodeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showMessage('Node deleted', 'success');
                fetchDashboardData();
            }
        } catch (error) {
            showMessage('Failed to delete node', 'error');
        }
    };

    const handleDeleteAllNodes = async () => {
        if (!window.confirm('Stop ALL nodes?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/network/nodes/delete-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showMessage('All nodes stopped', 'success');
                fetchDashboardData();
            }
        } catch (error) {
            showMessage('Failed to stop nodes', 'error');
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    return (
        <div className="cloud-dashboard">
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* User Storage Overview */}
            <div className="dashboard-header">
                <h1>Welcome, {userDashboard?.userName || 'User'}!</h1>
                <p className="subtitle">Your Cloud Storage Dashboard</p>
            </div>

            <div className="storage-overview">
                <div className="storage-card">
                    <div className="storage-icon">
                        <HardDrive size={32} />
                    </div>
                    <div className="storage-details">
                        <h3>Storage Quota</h3>
                        <div className="storage-bar">
                            <div 
                                className="storage-fill" 
                                style={{width: `${userDashboard?.usagePercentage || 0}%`}}
                            />
                        </div>
                        <div className="storage-stats">
                            <span>{userDashboard?.usedGB || '0 B'} used</span>
                            <span>{userDashboard?.usagePercentage?.toFixed(1) || 0}%</span>
                            <span>{userDashboard?.availableGB || '0 B'} free</span>
                        </div>
                        <p className="storage-total">Total: {userDashboard?.quotaGB || '2 GB'}</p>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <File size={24} />
                        <div>
                            <h4>{userDashboard?.totalFiles || 0}</h4>
                            <p>Files</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Server size={24} />
                        <div>
                            <h4>{runningNodes.length}/{nodes.length}</h4>
                            <p>Nodes Active</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Activity size={24} />
                        <div>
                            <h4>{networkStatus?.totalChunks || 0}</h4>
                            <p>Chunks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Upload */}
            <div className="upload-section">
                <label className="upload-btn">
                    <Upload size={20} />
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" onChange={handleUpload} disabled={uploading} />
                </label>
            </div>

            {/* Files List */}
            <div className="files-section">
                <h2>My Files ({files.length})</h2>
                {files.length === 0 ? (
                    <p className="empty-state">No files yet. Upload your first file!</p>
                ) : (
                    <div className="files-list">
                        {files.map(file => (
                            <div key={file.id} className="file-card">
                                <div className="file-info">
                                    <File size={20} />
                                    <div>
                                        <h4>{file.fileName}</h4>
                                        <p>{formatBytes(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="file-actions">
                                    <button onClick={() => handleDownload(file.id, file.fileName)} title="Download">
                                        <Download size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(file.id, file.fileName)} title="Delete" className="danger">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Node Management */}
            <div className="nodes-section">
                <div className="section-header">
                    <h2>Node Management</h2>
                    <div className="node-controls">
                        <button onClick={handleStartNode} className="btn-start">
                            <Play size={18} /> Start New Node
                        </button>
                        <button onClick={handleDeleteAllNodes} className="btn-danger">
                            <Square size={18} /> Stop All
                        </button>
                    </div>
                </div>

                {nodes.length === 0 ? (
                    <p className="empty-state">No nodes yet. Start your first node!</p>
                ) : (
                    <div className="nodes-grid">
                        {nodes.map(node => {
                            const isRunning = runningNodes.includes(node.nodeId);
                            return (
                                <div key={node.nodeId} className={`node-card ${isRunning ? 'running' : 'offline'}`}>
                                    <div className="node-header">
                                        <div className="node-title">
                                            <Server size={20} />
                                            <h4>{node.nodeId}</h4>
                                        </div>
                                        <span className={`status-badge ${isRunning ? 'active' : 'inactive'}`}>
                                            {isRunning ? '● Running' : '○ Offline'}
                                        </span>
                                    </div>
                                    <div className="node-actions">
                                        {isRunning ? (
                                            <>
                                                <button onClick={() => handleStopNode(node.nodeId)} title="Stop">
                                                    <Square size={16} /> Stop
                                                </button>
                                                <button onClick={() => handleRestartNode(node.nodeId)} title="Restart">
                                                    <RotateCw size={16} /> Restart
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleStartNode()} title="Start">
                                                <Play size={16} /> Start
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteNode(node.nodeId)} className="btn-delete" title="Delete">
                                            <X size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
