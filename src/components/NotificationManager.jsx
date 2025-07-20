import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimes, FaExclamationTriangle, FaBus, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const NotificationManager = ({ socket, userType, userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket || !userId) return;

    // Listen for SOS status updates
    socket.on('sos_status_update', (data) => {
      console.log('📲 Received SOS status update:', data);
      
      // Create notification
      const notification = {
        id: Date.now(),
        type: 'sos_update',
        title: '🚨 SOS Alert Update',
        message: `Your emergency alert #${data.alertId} has been ${data.status}`,
        status: data.status,
        timestamp: new Date(),
        alertId: data.alertId,
        priority: 'high'
      };

      setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: `sos-${data.alertId}` // Prevent duplicate notifications
        });
      }

      // Auto-dismiss after 15 seconds for high priority
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 15000);
    });

    // Listen for student-specific notifications (bus updates)
    socket.on('student_notification', (data) => {
      console.log('📱 Received student notification:', data);
      
      const notification = {
        id: Date.now(),
        type: data.type || 'bus_update',
        title: getNotificationTitle(data.type),
        message: data.data?.message || data.message || 'Bus update received',
        priority: data.data?.priority || 'medium',
        timestamp: new Date(),
        distance: data.data?.distance,
        estimatedTime: data.data?.estimatedTime,
        stopName: data.data?.stopName
      };

      setNotifications(prev => [notification, ...prev.slice(0, 4)]);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/2.png',
          tag: `bus-${notification.id}`
        });
      }

      // Auto-dismiss based on priority
      const dismissTime = notification.priority === 'high' ? 20000 : 12000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, dismissTime);
    });

    // Listen for general notifications
    socket.on('notification', (data) => {
      console.log('🔔 Received general notification:', data);
      
      const notification = {
        id: Date.now(),
        type: data.type || 'general',
        title: data.title || 'Notification',
        message: data.message || data.data?.message || 'You have a new notification',
        priority: data.data?.priority || data.priority || 'medium',
        timestamp: new Date()
      };

      setNotifications(prev => [notification, ...prev.slice(0, 4)]);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/2.png'
        });
      }

      // Auto-dismiss
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 10000);
    });

    return () => {
      if (socket) {
        socket.off('sos_status_update');
        socket.off('student_notification');
        socket.off('notification');
      }
    };
  }, [socket, userId]);

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'bus_arriving_soon':
        return '🚍 Bus Arriving Soon!';
      case 'bus_nearby':
        return '🚍 Bus Nearby';
      case 'bus_time_approaching':
        return '⏰ Bus Approaching';
      case 'bus_approaching':
        return '🚍 Bus Update';
      case 'ride_started':
        return '🚌 Ride Started';
      case 'ride_ended':
        return '🛑 Ride Ended';
      default:
        return '🔔 Notification';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStatusColor = (type, priority) => {
    if (type === 'sos_update') {
      return 'var(--color-danger)';
    }
    
    switch (priority) {
      case 'high': return 'var(--color-danger)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-info)';
      default: return 'var(--color-primary-action)';
    }
  };

  const getStatusIcon = (type, priority) => {
    if (type === 'sos_update') {
      return <FaExclamationTriangle />;
    }
    
    if (type.includes('bus') || type.includes('ride')) {
      return <FaBus />;
    }
    
    switch (priority) {
      case 'high': return <FaExclamationTriangle />;
      default: return <FaCheckCircle />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`card p-4 animate-slide-in ${notification.priority === 'high' ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: getStatusColor(notification.type, notification.priority),
            color: 'var(--color-text-inverse)',
            border: notification.priority === 'high' ? '2px solid rgba(255,255,255,0.3)' : 'none'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="mr-3 mt-1 flex-shrink-0">
                {getStatusIcon(notification.type, notification.priority)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
                
                {/* Additional info for bus notifications */}
                {(notification.distance || notification.estimatedTime) && (
                  <div className="flex items-center mt-2 text-xs opacity-75 space-x-3">
                    {notification.distance && (
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>{notification.distance} km</span>
                      </div>
                    )}
                    {notification.estimatedTime && (
                      <div className="flex items-center">
                        <FaClock className="mr-1" />
                        <span>~{notification.estimatedTime} min</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs opacity-75 mt-2">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-2 flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-inverse)' }}
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
