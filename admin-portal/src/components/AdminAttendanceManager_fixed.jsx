import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaQrcode, FaRedo, FaPlay, FaExclamationTriangle, FaUsers, FaArrowLeft, FaUser, FaSignOutAlt } from 'react-icons/fa';
import UnifiedNavbar from './UnifiedNavbar';
import axios from 'axios';
import { io } from 'socket.io-client';

const AdminAttendanceManager = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState([]);
  const [socket, setSocket] = useState(null);
  const [stats, setStats] = useState({
    totalAttended: 0,
    totalRegistered: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    initializeData();
    setupSocket();
    
    return () => {
      // Cleanup socket connection
    };
  }, []);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Admin connected to WebSocket');
      newSocket.emit('subscribe_admin');
    });

    newSocket.on('boarding_update', (data) => {
      console.log('Received boarding update:', data);
      fetchStats(); // Refresh stats
    });

    newSocket.on('student_onboarded', (data) => {
      console.log('Received student onboarded:', data);
      fetchStats();
    });

    newSocket.on('session_ended', (data) => {
      console.log('Session ended:', data);
      fetchStats();
    });

    setSocket(newSocket);
    
    return () => newSocket.disconnect();
  };

  const initializeData = async () => {
    try {
      setPageLoading(true);
      setError(null);

      // Check authentication first
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch initial data in parallel
      await Promise.all([
        fetchRoutes(),
        fetchStats()
      ]);

    } catch (err) {
      console.error('Error initializing attendance manager:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/routes/all');
      setRoutes(response.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/attendance/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({
        totalAttended: 0,
        totalRegistered: 0,
        attendanceRate: 0
      });
    }
  };

  const generateQRCode = async () => {
    if (!selectedRoute) {
      alert('Please select a route first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/admin/attendance/generate-qr', {
        routeName: selectedRoute
      });

      if (response.data.success) {
        setQrCodeData(response.data.qrCode);
        alert('QR Code generated successfully!');
      }
    } catch (err) {
      console.error('Error generating QR code:', err);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    // Create QR code as data URL and trigger download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    // Simple QR code representation (you might want to use a proper QR library)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(qrCodeData, 10, 150);

    const link = document.createElement('a');
    link.download = `qr-code-${selectedRoute}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const retryLoad = () => {
    initializeData();
  };

  return (
    <div className="admin-view">
      {/* Universal Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaUsers className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Attendance Management</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Manage student attendance and QR code generation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {pageLoading && (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Loading attendance data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !pageLoading && (
            <div className="card p-8 text-center">
              <FaExclamationTriangle className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Error Loading Data</h3>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
              <button
                onClick={retryLoad}
                className="btn btn-primary"
              >
                <FaRedo className="mr-2" />
                Retry
              </button>
            </div>
          )}

          {/* Main Content */}
          {!pageLoading && !error && (
            <div>
              {/* Statistics Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-heading)' }}>Attendance Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Attended Today</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--color-primary-action)' }}>{stats.totalAttended}</p>
                      </div>
                      <FaUsers className="text-xl" style={{ color: 'var(--color-primary-action)' }} />
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Registered</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>{stats.totalRegistered}</p>
                      </div>
                      <FaUser className="text-xl" style={{ color: 'var(--color-text-heading)' }} />
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Attendance Rate</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.attendanceRate}%</p>
                      </div>
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ 
                          backgroundColor: 'var(--color-success)', 
                          color: 'var(--color-text-inverse)' 
                        }}
                      >
                        {stats.attendanceRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Generation Section */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Generate QR Code</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Select Route
                    </label>
                    <select 
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      className="input w-full max-w-md"
                    >
                      <option value="">Choose a route...</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.route_name}>
                          {route.route_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={generateQRCode}
                      disabled={!selectedRoute || loading}
                      className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaQrcode className="mr-2" />
                      {loading ? 'Generating...' : 'Generate QR Code'}
                    </button>

                    {qrCodeData && (
                      <button
                        onClick={downloadQRCode}
                        className="btn btn-success text-sm font-medium"
                      >
                        Download QR Code
                      </button>
                    )}
                  </div>
                </div>

                {qrCodeData && (
                  <div className="mt-8 p-6 rounded-lg border text-center" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Generated QR Code</h3>
                    <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                      <p className="text-sm font-mono p-4 border-2 border-gray-300" style={{ minHeight: '100px', width: '200px' }}>
                        {qrCodeData}
                      </p>
                    </div>
                    <p className="text-sm mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                      QR Code for Route: <strong>{selectedRoute}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendanceManager;
