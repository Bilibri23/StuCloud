import React, { useState, useEffect } from 'react';
import { 
    Upload, Download, Trash2, File, LogOut, User, Lock, Mail, 
    CheckCircle, XCircle, Loader, Folder, HardDrive, AlertCircle,
    Eye, EyeOff
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8081/api';

export default function CloudDriveApp() {
    const [authState, setAuthState] = useState('login'); // 'login' | 'register' | 'otp' | 'authenticated'
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [files, setFiles] = useState([]);
    const [storage, setStorage] = useState({ used: 0, total: 1073741824 }); // 1GB default
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '' });
    const [otpForm, setOtpForm] = useState({ email: '', code: '' });

    useEffect(() => {
        if (token) {
            setAuthState('authenticated');
            fetchUserData();
        }
    }, [token]);

    const fetchUserData = async () => {
        try {
            await Promise.all([fetchFiles(), fetchStorage()]);
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        }
    };

    const fetchFiles = async () => {
        try {
            const response = await fetch(`${API_BASE}/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFiles(data);
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        }
    };

    const fetchStorage = async () => {
        // Storage info would come from user endpoint, for now using mock
        // In real implementation, add GET /api/auth/me endpoint
        setStorage({ used: 0, total: 1073741824 });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerForm)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Registration successful! Check your email for OTP code.');
                setOtpForm({ ...otpForm, email: registerForm.email });
                setAuthState('otp');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('OTP sent to your email!');
                setOtpForm({ ...otpForm, email: loginForm.email });
                setAuthState('otp');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(otpForm)
            });

            const data = await response.json();

            if (response.ok && data.token) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
                setAuthState('authenticated');
                setSuccess('Login successful!');
                setTimeout(() => setSuccess(null), 3000);
                await fetchUserData();
            } else {
                setError(data.error || 'Invalid OTP code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('token');
        setAuthState('login');
        setUser(null);
        setFiles([]);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE}/files/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                setSuccess(`File "${file.name}" uploaded successfully!`);
                setTimeout(() => setSuccess(null), 3000);
                await fetchFiles();
                await fetchStorage();
            } else {
                const data = await response.json();
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setLoading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDownload = async (fileId, fileName) => {
        try {
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
            } else {
                setError('Download failed');
            }
        } catch (err) {
            setError('Download failed. Please try again.');
        }
    };

    const handleDelete = async (fileId, fileName) => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess(`File "${fileName}" deleted successfully!`);
                setTimeout(() => setSuccess(null), 3000);
                await fetchFiles();
                await fetchStorage();
            } else {
                setError('Delete failed');
            }
        } catch (err) {
            setError('Delete failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Auth Views
    if (authState === 'login') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Folder className="auth-logo" />
                        <h1>Distributed Cloud</h1>
                        <p>Your personal cloud storage</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle className="alert-icon" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Lock className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader className="spinner" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Don't have an account? <button onClick={() => setAuthState('register')} className="link">Sign up</button></p>
                    </div>
                </div>
            </div>
        );
    }

    if (authState === 'register') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Folder className="auth-logo" />
                        <h1>Create Account</h1>
                        <p>Get 1GB free storage</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle className="alert-icon" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <User className="input-icon" />
                            <input
                                type="text"
                                placeholder="Full name"
                                value={registerForm.fullName}
                                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Mail className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <Lock className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader className="spinner" /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <button onClick={() => setAuthState('login')} className="link">Sign in</button></p>
                    </div>
                </div>
            </div>
        );
    }

    if (authState === 'otp') {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Mail className="auth-logo" />
                        <h1>Verify Email</h1>
                        <p>Enter the code sent to {otpForm.email}</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle className="alert-icon" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <CheckCircle className="alert-icon" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div className="form-group otp-group">
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otpForm.code}
                                onChange={(e) => setOtpForm({ ...otpForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                maxLength={6}
                                required
                                className="otp-input"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading || otpForm.code.length !== 6}>
                            {loading ? <Loader className="spinner" /> : 'Verify Code'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Didn't receive code? <button onClick={() => setAuthState('login')} className="link">Go back</button></p>
                    </div>
                </div>
            </div>
        );
    }

    // Main App (Authenticated)
    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <Folder className="header-logo" />
                    <h1>Distributed Cloud</h1>
                </div>
                <div className="header-right">
                    <div className="storage-info">
                        <HardDrive className="storage-icon" />
                        <span>{formatBytes(storage.used)} / {formatBytes(storage.total)}</span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-icon" title="Logout">
                        <LogOut />
                    </button>
                </div>
            </header>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error alert-top">
                    <AlertCircle className="alert-icon" />
                    {error}
                    <button onClick={() => setError(null)} className="alert-close">×</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success alert-top">
                    <CheckCircle className="alert-icon" />
                    {success}
                    <button onClick={() => setSuccess(null)} className="alert-close">×</button>
                </div>
            )}

            {/* Main Content */}
            <main className="app-main">
                {/* Upload Section */}
                <div className="upload-section">
                    <div className="upload-area">
                        <input
                            type="file"
                            id="file-upload"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            disabled={loading}
                        />
                        <label htmlFor="file-upload" className="upload-label">
                            <Upload className="upload-icon" />
                            <span>Click to upload or drag and drop</span>
                            <small>Max file size: {formatBytes(storage.total - storage.used)} available</small>
                        </label>
                    </div>
                </div>

                {/* Files List */}
                <div className="files-section">
                    <div className="section-header">
                        <h2>My Files</h2>
                        <span className="file-count">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                    </div>

                    {loading && files.length === 0 ? (
                        <div className="empty-state">
                            <Loader className="spinner" />
                            <p>Loading files...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="empty-state">
                            <File className="empty-icon" />
                            <p>No files yet. Upload your first file!</p>
                        </div>
                    ) : (
                        <div className="files-grid">
                            {files.map((file) => (
                                <div key={file.id} className="file-card">
                                    <div className="file-icon">
                                        <File />
                                    </div>
                                    <div className="file-info">
                                        <h3 className="file-name" title={file.fileName}>{file.fileName}</h3>
                                        <p className="file-meta">
                                            {formatBytes(file.sizeBytes)} • {formatDate(file.createdAt)}
                                        </p>
                                    </div>
                                    <div className="file-actions">
                                        <button
                                            onClick={() => handleDownload(file.id, file.fileName)}
                                            className="btn-icon btn-download"
                                            title="Download"
                                        >
                                            <Download />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id, file.fileName)}
                                            className="btn-icon btn-delete"
                                            title="Delete"
                                        >
                                            <Trash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
