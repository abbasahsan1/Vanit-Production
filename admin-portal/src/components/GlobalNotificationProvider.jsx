import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { FaExclamationTriangle, FaTimes, FaBell, FaCheckCircle } from 'react-icons/fa';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const GlobalNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('🔔 Global notification system connected');
      setIsConnected(true);
      newSocket.emit('subscribe_admin');
      fetchPendingAlertsCount();
    });

    newSocket.on('disconnect', () => {
      console.log('🔔 Global notification system disconnected');
      setIsConnected(false);
    });

    // Handle new emergency alerts
    newSocket.on('emergency_alert', (data) => {
      console.log('🚨 Global SOS Alert received:', data);
      
      const notification = {
        id: Date.now(),
        type: 'emergency',
        title: 'Emergency Alert',
        message: `${data.data.priority_level.toUpperCase()} priority alert from ${data.data.first_name} ${data.data.last_name}`,
        data: data.data,
        timestamp: new Date(),
        priority: data.data.priority_level,
        read: false
      };

      addNotification(notification);
      updatePendingAlertsCount(1);
    });

    // Handle alert acknowledgments
    newSocket.on('emergency_acknowledged', (data) => {
      console.log('✅ Emergency acknowledged:', data);
      
      const notification = {
        id: Date.now(),
        type: 'success',
        title: 'Alert Acknowledged',
        message: `Alert #${data.data.id} acknowledged by ${data.acknowledged_by}`,
        timestamp: new Date(),
        read: false
      };

      addNotification(notification);
    });

    // Handle alert resolutions
    newSocket.on('emergency_resolved', (data) => {
      console.log('✅ Emergency resolved:', data);
      
      const notification = {
        id: Date.now(),
        type: 'success',
        title: 'Alert Resolved',
        message: `Alert #${data.data.id} resolved by ${data.resolved_by}`,
        timestamp: new Date(),
        read: false
      };

      addNotification(notification);
      updatePendingAlertsCount(-1);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const fetchPendingAlertsCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/emergency/admin/stats');
      const data = await response.json();
      if (data.success) {
        setPendingAlerts(data.data.pending_alerts || 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending alerts count:', error);
    }
  };

  const updatePendingAlertsCount = (change) => {
    setPendingAlerts(prev => Math.max(0, prev + change));
  };

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Limit to last 50 notifications
      const updated = [notification, ...prev];
      return updated.slice(0, 50);
    });

    // Auto-remove non-emergency notifications after 5 seconds
    if (notification.type !== 'emergency') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const contextValue = {
    notifications,
    pendingAlerts,
    isConnected,
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <GlobalNotificationOverlay />
    </NotificationContext.Provider>
  );
};

// Notification overlay component that shows notifications globally
const GlobalNotificationOverlay = () => {
  const { notifications, removeNotification, markAsRead } = useNotifications();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 border-red-700';
      case 'high': return 'bg-orange-600 border-orange-700';
      case 'medium': return 'bg-yellow-600 border-yellow-700';
      case 'low': return 'bg-blue-600 border-blue-700';
      default: return 'bg-gray-600 border-gray-700';
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'emergency') {
      return <FaExclamationTriangle className="text-white" />;
    } else if (type === 'success') {
      return <FaCheckCircle className="text-white" />;
    }
    return <FaBell className="text-white" />;
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.slice(0, 5).map((notification) => (
        <div
          key={notification.id}
          className={`relative rounded-lg shadow-lg border-2 p-4 text-white transition-all duration-300 transform hover:scale-105 ${
            notification.type === 'emergency' 
              ? getPriorityColor(notification.priority)
              : notification.type === 'success' 
              ? 'bg-green-600 border-green-700' 
              : 'bg-blue-600 border-blue-700'
          }`}
          style={{ 
            animation: 'slideInRight 0.3s ease-out',
            minWidth: '300px'
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type, notification.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {notification.title}
              </h3>
              <p className="text-xs opacity-90 mt-1 break-words">
                {notification.message}
              </p>
              <p className="text-xs opacity-70 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {notification.type === 'emergency' && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <button
                onClick={() => {
                  window.open('/admin/emergency-management', '_blank');
                  markAsRead(notification.id);
                }}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                View Details
              </button>
            </div>
          )}

          {/* Pulse animation for emergency alerts */}
          {notification.type === 'emergency' && (
            <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-pulse pointer-events-none" />
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalNotificationProvider;
