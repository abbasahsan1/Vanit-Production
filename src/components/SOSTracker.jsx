import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaClock, FaTimes, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { io } from 'socket.io-client';
import axios from 'axios';

const SOSTracker = ({ 
  userType = 'student', 
  userId, 
  onClose = () => {} 
}) => {
  // Get userId from localStorage if not provided
  const actualUserId = userId || localStorage.getItem(userType === 'captain' ? 'captainId' : 'studentId');
  const [sosAlerts, setSosAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Status mapping for display
  const statusConfig = {
    pending: { 
      icon: FaClock, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50', 
      borderColor: 'border-amber-200',
      label: 'Pending Response'
    },
    acknowledged: { 
      icon: FaCheckCircle, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      label: 'Acknowledged'
    },
    resolved: { 
      icon: FaCheckCircle, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50', 
      borderColor: 'border-emerald-200',
      label: 'Resolved'
    }
  };

  // Priority styling
  const priorityConfig = {
    critical: { color: 'text-red-700', label: 'CRITICAL' },
    high: { color: 'text-orange-600', label: 'HIGH' },
    medium: { color: 'text-amber-600', label: 'MEDIUM' },
    low: { color: 'text-emerald-600', label: 'LOW' }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user-specific room for real-time updates
    newSocket.emit('subscribe_user_sos', { userType, userId: actualUserId });
    console.log(`📡 SOS Tracker subscribed for ${userType} ${actualUserId}`);      // Listen for real-time SOS updates
      newSocket.on('sos_status_update', (data) => {
        console.log('📊 SOS Tracker received status update:', data);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('🚨 SOS Alert Update', {
            body: `Your emergency alert #${data.alertId} has been ${data.status}`,
            icon: '/favicon.ico'
          });
        }
        
        // Update the specific alert in the list
        setSosAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === data.alertId 
              ? { 
                  ...alert, 
                  status: data.status,
                  acknowledged_at: data.acknowledged_at || alert.acknowledged_at,
                  acknowledged_by: data.acknowledged_by || alert.acknowledged_by,
                  resolved_at: data.resolved_at || alert.resolved_at,
                  resolution_notes: data.resolution_notes || alert.resolution_notes
                }
              : alert
          )
        );
      });

    // Fetch user's SOS alerts
    fetchUserSOSAlerts();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('📲 Notification permission:', permission);
      });
    }

    return () => {
      if (newSocket) {
        newSocket.emit('unsubscribe_user_sos', { userType, userId: actualUserId });
        newSocket.disconnect();
      }
    };
  }, [userType, actualUserId]);

  const fetchUserSOSAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/emergency/user/${userType}/${actualUserId}/alerts`);
      
      if (response.data.success) {
        setSosAlerts(response.data.data || []);
        console.log(`✅ Loaded ${response.data.data.length} SOS alerts for ${userType} ${actualUserId}`);
      }
    } catch (error) {
      console.error('❌ Error fetching user SOS alerts:', error);
      setSosAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="modal-overlay">
      <div className="card w-full max-w-4xl max-h-screen overflow-hidden">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between" style={{ background: 'linear-gradient(to right, var(--color-danger), #DC2626)', color: 'var(--color-text-inverse)' }}>
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-4 text-2xl" />
            <div>
              <h2 className="text-2xl font-bold">My SOS Alerts</h2>
              <p className="text-sm font-medium opacity-90">Live tracking of your emergency alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-inverse)' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mr-4" style={{ borderColor: 'var(--color-danger)' }}></div>
              <span className="text-lg" style={{ color: 'var(--color-text-body)' }}>Loading your alerts...</span>
            </div>
          ) : sosAlerts.length === 0 ? (
            <div className="text-center py-12">
              <FaExclamationTriangle className="text-6xl mx-auto mb-6 icon-ui" />
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>No SOS Alerts</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                You haven't sent any emergency alerts yet. 
                <br />
                Use the SOS button when you need immediate assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sosAlerts.map((alert) => {
                const status = statusConfig[alert.status] || statusConfig.pending;
                const priority = priorityConfig[alert.priority_level] || priorityConfig.medium;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border-2 p-6 transition-all duration-200 ${status.borderColor}`}
                    style={{ backgroundColor: status.bgColor }}
                  >
                    {/* Alert Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-full mr-4 ${status.bgColor}`}>
                          <StatusIcon className={`text-xl ${status.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
                            Alert #{alert.id}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${status.color}`}>
                              {status.label}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${priority.color}`}>
                              {priority.label} PRIORITY
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <p className="font-medium">
                          {new Date(alert.timestamp).toLocaleDateString()}
                        </p>
                        <p>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Alert Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-body)' }}>Emergency Type</h4>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {alert.emergency_type?.replace('_', ' ').toUpperCase() || 'GENERAL EMERGENCY'}
                        </p>
                      </div>
                      
                      {alert.message && (
                        <div>
                          <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-body)' }}>Message</h4>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{alert.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    {alert.latitude && alert.longitude && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--color-text-body)' }}>
                          <FaMapMarkerAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                          Location
                        </h4>
                        <p className="text-sm font-mono p-2 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-inactive)' }}>
                          {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}

                    {/* Admin Response */}
                    {alert.admin_response && (
                      <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-gradient-start)', borderColor: 'var(--color-primary-action)' }}>
                        <h4 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--color-primary-brand)' }}>
                          <FaUser className="mr-2" />
                          Admin Response
                        </h4>
                        <p className="text-sm" style={{ color: 'var(--color-primary-brand)' }}>{alert.admin_response}</p>
                        {alert.response_timestamp && (
                          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                            Responded: {new Date(alert.response_timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSTracker;
