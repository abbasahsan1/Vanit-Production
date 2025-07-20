import React, { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUser, 
  FaCheck, 
  FaTimes, 
  FaEye,
  FaMedkit,
  FaShieldAlt,
  FaWrench,
  FaExclamationCircle,
  FaSync,
  FaFilter,
  FaBell
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const AdminEmergencyAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    user_type: '',
    priority_level: '',
    emergency_type: ''
  });
  const [acknowledgeData, setAcknowledgeData] = useState({
    acknowledged_by: 'Admin',
    notes: ''
  });

  // Emergency type configurations
  const emergencyTypes = {
    medical: { icon: FaMedkit, color: 'text-red-600', label: 'Medical' },
    security: { icon: FaShieldAlt, color: 'text-orange-600', label: 'Security' },
    mechanical: { icon: FaWrench, color: 'text-blue-600', label: 'Mechanical' },
    general: { icon: FaExclamationCircle, color: 'text-gray-600', label: 'General' }
  };

  // Priority configurations
  const priorityConfigs = {
    critical: { color: 'bg-red-600 text-white', label: 'CRITICAL' },
    high: { color: 'bg-orange-500 text-white', label: 'HIGH' },
    medium: { color: 'bg-yellow-500 text-white', label: 'MEDIUM' },
    low: { color: 'bg-green-500 text-white', label: 'LOW' }
  };

  // Status configurations
  const statusConfigs = {
    pending: { color: 'bg-red-100 text-red-800', label: 'PENDING' },
    acknowledged: { color: 'bg-yellow-100 text-yellow-800', label: 'ACKNOWLEDGED' },
    resolved: { color: 'bg-green-100 text-green-800', label: 'RESOLVED' }
  };

  // Initialize component
  useEffect(() => {
    fetchAlerts();
    fetchStats();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Refetch alerts when filters change
  useEffect(() => {
    fetchAlerts();
  }, [filters]);

  // Setup WebSocket for real-time alerts
  const setupWebSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Admin Emergency Alerts WebSocket connected');
      newSocket.emit('subscribe_admin');
      newSocket.emit('subscribe_emergency');
    });

    newSocket.on('emergency_alert', (data) => {
      console.log('🚨 New emergency alert received:', data);
      
      // Add new alert to the list
      setAlerts(prevAlerts => [data.data, ...prevAlerts]);
      
      // Update stats
      fetchStats();
      
      // Show browser notification if supported
      if (Notification.permission === 'granted') {
        new Notification('🚨 Emergency Alert', {
          body: `${data.data.user_type.toUpperCase()}: ${data.data.first_name} ${data.data.last_name} - ${data.data.emergency_type}`,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('emergency_acknowledged', (data) => {
      console.log('✅ Emergency alert acknowledged:', data);
      updateAlertInList(data.data);
      fetchStats();
    });

    newSocket.on('emergency_resolved', (data) => {
      console.log('✅ Emergency alert resolved:', data);
      updateAlertInList(data.data);
      fetchStats();
    });

    setSocket(newSocket);
  };

  // Update alert in the list
  const updateAlertInList = (updatedAlert) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === updatedAlert.id ? updatedAlert : alert
      )
    );
  };

  // Fetch emergency alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `http://localhost:5000/api/emergency/admin/alerts?${params.toString()}`
      );

      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching emergency alerts:', error);
      alert('Failed to fetch emergency alerts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch emergency statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching emergency stats:', error);
    }
  };

  // Acknowledge emergency alert
  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/emergency/admin/acknowledge/${alertId}`,
        acknowledgeData
      );

      if (response.data.success) {
        updateAlertInList(response.data.data);
        setShowModal(false);
        setSelectedAlert(null);
        setAcknowledgeData({ acknowledged_by: 'Admin', notes: '' });
        fetchStats();
        alert('✅ Emergency alert acknowledged successfully');
      }
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      alert('Failed to acknowledge alert');
    }
  };

  // Resolve emergency alert
  const resolveAlert = async (alertId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/emergency/admin/resolve/${alertId}`,
        {
          resolved_by: acknowledgeData.acknowledged_by,
          resolution_notes: acknowledgeData.notes
        }
      );

      if (response.data.success) {
        updateAlertInList(response.data.data);
        setShowModal(false);
        setSelectedAlert(null);
        setAcknowledgeData({ acknowledged_by: 'Admin', notes: '' });
        fetchStats();
        alert('✅ Emergency alert resolved successfully');
      }
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      alert('Failed to resolve alert');
    }
  };

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get time elapsed
  const getTimeElapsed = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="admin-view">
      
      {/* Navigation Bar */}
      <nav className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid var(--color-border-standard)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
              Emergency Alert Management
            </h1>
          </div>
          <div className="flex space-x-8 font-semibold">
            <Link to="/dashboard" className="transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Dashboard</Link>
            <Link to="/routes" className="transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Routes</Link>
            <Link to="/route-monitor" className="transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Monitor</Link>
            <button onClick={handleLogout} className="transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>Logout</button>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
            <FaUser className="text-xl" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        </div>
      </nav>

      {/* Stats Overview */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_alerts || 0}</p>
              </div>
              <FaExclamationTriangle className="text-2xl text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending_alerts || 0}</p>
              </div>
              <FaClock className="text-2xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-800">{stats.critical_alerts || 0}</p>
              </div>
              <FaBell className="text-2xl text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 24h</p>
                <p className="text-2xl font-bold text-blue-600">{stats.alerts_last_24h || 0}</p>
              </div>
              <FaClock className="text-2xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FaFilter className="mr-2" />
              Filters
            </h3>
            <button
              onClick={() => {
                setFilters({ status: '', user_type: '', priority_level: '', emergency_type: '' });
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
            
            <select
              value={filters.user_type}
              onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              <option value="student">Students</option>
              <option value="captain">Captains</option>
            </select>
            
            <select
              value={filters.priority_level}
              onChange={(e) => setFilters(prev => ({ ...prev, priority_level: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filters.emergency_type}
              onChange={(e) => setFilters(prev => ({ ...prev, emergency_type: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="mechanical">Mechanical</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Alert List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Emergency Alerts</h2>
            <button
              onClick={fetchAlerts}
              className="flex items-center text-blue-600 hover:text-blue-800"
              disabled={loading}
            >
              <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <FaExclamationTriangle className="mx-auto text-4xl text-gray-400 mb-4" />
              <p>No emergency alerts found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => {
                const emergencyType = emergencyTypes[alert.emergency_type] || emergencyTypes.general;
                const priorityConfig = priorityConfigs[alert.priority_level] || priorityConfigs.medium;
                const statusConfig = statusConfigs[alert.status] || statusConfigs.pending;
                const EmergencyIcon = emergencyType.icon;
                
                return (
                  <div key={alert.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Emergency Icon */}
                        <div className={`p-2 rounded-full ${alert.status === 'pending' ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <EmergencyIcon className={`text-xl ${emergencyType.color}`} />
                        </div>
                        
                        {/* Alert Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {alert.first_name} {alert.last_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.color}`}>
                              {priorityConfig.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Type:</strong> {alert.user_type.charAt(0).toUpperCase() + alert.user_type.slice(1)}</p>
                            <p><strong>Emergency:</strong> {emergencyType.label}</p>
                            {alert.registration_number && (
                              <p><strong>Registration:</strong> {alert.registration_number}</p>
                            )}
                            <p><strong>Route:</strong> {alert.route_name}</p>
                            {alert.stop_name && <p><strong>Stop:</strong> {alert.stop_name}</p>}
                            <p><strong>Phone:</strong> {alert.phone}</p>
                            {alert.message && (
                              <p><strong>Message:</strong> {alert.message}</p>
                            )}
                          </div>
                          
                          {/* Location */}
                          {alert.latitude && alert.longitude && (
                            <div className="mt-2 flex items-center text-sm text-blue-600">
                              <FaMapMarkerAlt className="mr-1" />
                              <a
                                href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                View Location ({alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)})
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions and Time */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-2">
                          <div>{getTimeElapsed(alert.timestamp)}</div>
                          <div>{formatTimestamp(alert.timestamp)}</div>
                        </div>
                        
                        <div className="space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <FaEye className="inline mr-1" />
                            Details
                          </button>
                          
                          {alert.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              <FaCheck className="inline mr-1" />
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alert Detail Modal */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="bg-red-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Emergency Alert Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-red-200 text-2xl"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Alert Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {selectedAlert.first_name} {selectedAlert.last_name}</p>
                    <p><strong>Type:</strong> {selectedAlert.user_type.charAt(0).toUpperCase() + selectedAlert.user_type.slice(1)}</p>
                    {selectedAlert.registration_number && (
                      <p><strong>Registration:</strong> {selectedAlert.registration_number}</p>
                    )}
                    <p><strong>Phone:</strong> {selectedAlert.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Emergency Details</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Type:</strong> {emergencyTypes[selectedAlert.emergency_type]?.label || 'General'}</p>
                    <p><strong>Priority:</strong> {priorityConfigs[selectedAlert.priority_level]?.label || 'Medium'}</p>
                    <p><strong>Status:</strong> {statusConfigs[selectedAlert.status]?.label || 'Pending'}</p>
                    <p><strong>Time:</strong> {formatTimestamp(selectedAlert.timestamp)}</p>
                  </div>
                </div>
              </div>
              
              {/* Location */}
              {selectedAlert.latitude && selectedAlert.longitude && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Location</h3>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>Coordinates:</strong> {selectedAlert.latitude}, {selectedAlert.longitude}
                    </p>
                    <a
                      href={`https://maps.google.com/?q=${selectedAlert.latitude},${selectedAlert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}
              
              {/* Message */}
              {selectedAlert.message && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Message</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{selectedAlert.message}</p>
                  </div>
                </div>
              )}
              
              {/* Acknowledgment Form */}
              {selectedAlert.status === 'pending' && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Acknowledge Alert</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your name/ID"
                      value={acknowledgeData.acknowledged_by}
                      onChange={(e) => setAcknowledgeData(prev => ({ ...prev, acknowledged_by: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      placeholder="Response notes (optional)"
                      value={acknowledgeData.notes}
                      onChange={(e) => setAcknowledgeData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                
                {selectedAlert.status === 'pending' && (
                  <>
                    <button
                      onClick={() => acknowledgeAlert(selectedAlert.id)}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <FaCheck className="inline mr-2" />
                      Acknowledge
                    </button>
                    <button
                      onClick={() => resolveAlert(selectedAlert.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheck className="inline mr-2" />
                      Resolve
                    </button>
                  </>
                )}
                
                {selectedAlert.status === 'acknowledged' && (
                  <button
                    onClick={() => resolveAlert(selectedAlert.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCheck className="inline mr-2" />
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmergencyAlerts;
