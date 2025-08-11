import React, { useState } from 'react';
import { FaBell, FaExclamationTriangle, FaEye, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNotifications } from './GlobalNotificationProvider';

const NotificationBell = () => {
  const { notifications, pendingAlerts, getUnreadCount, markAsRead, removeNotification, clearAllNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = getUnreadCount();
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === 'emergency') {
      // Open emergency management in new tab
      window.open('/admin/emergency-management', '_blank');
    }
    setShowDropdown(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type, priority) => {
    if (type === 'emergency') {
      return <FaExclamationTriangle className="text-red-500" />;
    }
    return <FaBell className="text-blue-500" />;
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        title={`${unreadCount} unread notifications, ${pendingAlerts} pending alerts`}
      >
        <FaBell className="text-xl" />
        
        {/* Emergency Alert Badge (Red, pulsing) */}
        {pendingAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {pendingAlerts > 99 ? '99+' : pendingAlerts}
          </span>
        )}
        
        {/* Regular Notification Badge (Blue) */}
        {pendingAlerts === 0 && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-4 mt-2 text-sm">
              {pendingAlerts > 0 && (
                <span className="text-red-600 font-medium">
                  {pendingAlerts} Emergency Alert{pendingAlerts !== 1 ? 's' : ''}
                </span>
              )}
              {unreadCount > 0 && (
                <span className="text-blue-600">
                  {unreadCount} Unread
                </span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FaBell className="text-3xl mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.type === 'emergency' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            {notification.priority?.toUpperCase() || 'URGENT'}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Link
                to="/emergency-management"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                View All Notifications
              </Link>
            </div>
          )}

          {pendingAlerts > 0 && (
            <div className="p-3 bg-red-50 border-t border-red-200 text-center">
              <Link
                to="/emergency-management"
                className="inline-flex items-center text-sm text-red-700 hover:text-red-800 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                <FaExclamationTriangle className="mr-2" />
                View Emergency Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
