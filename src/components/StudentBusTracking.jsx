import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import VanItLogo from './VanItLogo';
import { 
  FaMapMarkedAlt, 
  FaBus, 
  FaClock, 
  FaMapPin, 
  FaRoute,
  FaBell,
  FaExclamationTriangle,
  FaUserCircle,
  FaArrowLeft,
  FaUser,
  FaCog
} from 'react-icons/fa';
import LiveMap from './LiveMap';

// Error Boundary for the LiveMap component
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold text-lg mb-2">Map Failed to Load</p>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'An error occurred while loading the map'}
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }} 
              className="btn btn-primary flex items-center font-medium"
            >
              Reload Map
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const StudentBusTracking = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({});
  const [captainLocation, setCaptainLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    enableLocationNotifications: true,
    notificationRadius: 2.0,
    notificationTimeThreshold: 5,
    enableSound: true,
    enableVibration: true
  });
  const [notificationStats, setNotificationStats] = useState({
    total: 0,
    unread: 0,
    today_total: 0,
    today_unread: 0
  });
  const [error, setError] = useState(null);
  const [rideEnded, setRideEnded] = useState(false);
  const [rideEndMessage, setRideEndMessage] = useState('');
  const [mapLocations, setMapLocations] = useState([]);
  const [studentLocation, setStudentLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('location_update', (data) => {
      console.log('🚌 Received captain location update:', data);
      
      // Validate location data before processing
      if (!data || 
          typeof data.latitude === 'undefined' || 
          typeof data.longitude === 'undefined' ||
          isNaN(parseFloat(data.latitude)) || 
          isNaN(parseFloat(data.longitude))) {
        console.warn('Invalid location data received:', data);
        return;
      }
      
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      
      // Check for reasonable coordinate ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('Location coordinates out of valid range:', { lat, lng });
        return;
      }
      
      const locationData = {
        captainId: data.captainId,
        latitude: lat,
        longitude: lng,
        timestamp: data.timestamp,
        captainName: data.captainName,
        routeName: data.routeName
      };
      
      setCaptainLocation(locationData);
      
      // Update map locations safely
      setMapLocations([{
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        name: `Captain: ${locationData.captainName || 'Unknown'}`,
        type: 'captain',
        timestamp: locationData.timestamp
      }]);
    });

    // Enhanced notification handling
    newSocket.on('notification', (data) => {
      console.log('🔔 Received notification:', data);
      handleNotification(data);
    });

    // Enhanced student-specific notifications with tracking
    newSocket.on('student_notification', (notification) => {
      console.log('📱 Received enhanced student notification:', notification);
      handleNotification(notification);
      
      // Track delivery
      if (notification.data?.notificationId) {
        trackNotificationInteraction(notification.data.notificationId, 'delivered');
      }
    });

    // Handle critical notifications differently
    newSocket.on('critical_notification', (notification) => {
      console.log('🚨 Received CRITICAL notification:', notification);
      notification.data = { ...notification.data, urgency: 'critical' };
      handleNotification(notification);
    });

    newSocket.on('ride_started', (data) => {
      console.log('🚌 Received ride start notification:', data);
      setRideEnded(false);
      setRideEndMessage('');
      
      // Show notification
      handleNotification({
        title: 'Ride Started!',
        message: data.message || `Your bus captain ${data.captainName} has started the ride.`,
        type: 'ride_start'
      });
    });

    newSocket.on('ride_ended', (data) => {
      console.log('🛑 Received ride end notification:', data);
      setRideEnded(true);
      setRideEndMessage(data.message || 'The ride has ended.');
      setCaptainLocation(null); // Clear location when ride ends
      setMapLocations([]); // Clear map
      setLastNotification(null); // Clear notifications
      
      // Show a more prominent notification
      alert(`🛑 ${data.message || 'The ride has ended.'}`);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('Connection error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Enhanced notification handler with better tracking and analytics
  const handleNotification = (notification) => {
    const notificationData = {
      id: notification.data?.notificationId || Date.now(),
      title: notification.data?.title || notification.title || 'Bus Update',
      message: notification.data?.message || notification.message || 'Your bus status has been updated',
      type: notification.type || 'info',
      priority: notification.data?.priority || 'medium',
      urgency: notification.data?.urgency || 'medium',
      distance: notification.data?.distance,
      estimatedTime: notification.data?.estimatedTime,
      action: notification.data?.action,
      timestamp: new Date(),
      metadata: notification.data?.metadata || {},
      ...notification
    };

    setLastNotification(notificationData);
    setShowNotification(true);
    setLastNotificationTime(new Date());
    
    // Add to history (keep last 20)
    setNotificationHistory(prev => [notificationData, ...prev.slice(0, 19)]);

    // Enhanced browser notification with priority handling
    if (Notification.permission === 'granted' && notificationPreferences.enableSound) {
      const browserNotification = new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/2.png',
        tag: `bus-${notificationData.id}`,
        requireInteraction: notificationData.urgency === 'critical',
        silent: !notificationPreferences.enableSound
      });

      // Auto-close based on priority
      const closeTimeout = notificationData.urgency === 'critical' ? 20000 : 10000;
      setTimeout(() => {
        browserNotification.close();
      }, closeTimeout);

      // Track notification delivery
      browserNotification.onshow = () => {
        trackNotificationInteraction(notificationData.id, 'delivered');
      };

      browserNotification.onclick = () => {
        trackNotificationInteraction(notificationData.id, 'clicked');
        window.focus();
        browserNotification.close();
      };
    }

    // Vibration for mobile devices
    if (notificationPreferences.enableVibration && 'vibrate' in navigator) {
      const vibrationPattern = notificationData.urgency === 'critical' ? [200, 100, 200, 100, 200] : [200, 100, 200];
      navigator.vibrate(vibrationPattern);
    }

    // Auto-dismiss based on urgency
    const dismissTime = notificationData.urgency === 'critical' ? 20000 : 
                      notificationData.urgency === 'high' ? 15000 : 10000;
    setTimeout(() => {
      if (showNotification) {
        setShowNotification(false);
      }
    }, dismissTime);

    console.log(`🔔 ${notificationData.urgency.toUpperCase()} notification handled:`, notificationData);
  };

  // Track notification interactions for analytics
  const trackNotificationInteraction = async (notificationId, eventType, responseTime = null) => {
    try {
      if (!studentData.id || !notificationId) return;

      await axios.post(`http://localhost:5000/api/notifications/student/${studentData.id}/notifications/${notificationId}/track`, {
        eventType,
        responseTimeSeconds: responseTime
      });

      console.log(`📊 Tracked ${eventType} for notification ${notificationId}`);
    } catch (error) {
      console.log('Note: Could not track notification interaction (non-critical)');
    }
  };

  // Load student notification preferences
  const loadNotificationPreferences = async () => {
    try {
      if (!studentData.id) return;

      setIsLoadingPreferences(true);
      const response = await axios.get(`http://localhost:5000/api/notifications/student/${studentData.id}/location-preferences`);
      
      if (response.status === 200 && response.data.success) {
        setNotificationPreferences(prev => ({
          ...prev,
          ...response.data.preferences,
          enableLocationNotifications: response.data.preferences.enable_location_notifications,
          notificationRadius: response.data.preferences.notification_radius_km,
          notificationTimeThreshold: response.data.preferences.notification_time_threshold_minutes,
          enableSound: response.data.preferences.enable_sound,
          enableVibration: response.data.preferences.enable_vibration
        }));
        console.log('✅ Loaded notification preferences:', response.data.preferences);
      }
    } catch (error) {
      console.log('Note: Using default notification preferences');
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Load notification statistics
  const loadNotificationStats = async () => {
    try {
      if (!studentData.id) return;

      const response = await axios.get(`http://localhost:5000/api/notifications/student/${studentData.id}/notifications/stats`);
      
      if (response.status === 200 && response.data.success) {
        setNotificationStats(response.data.stats);
        console.log('📊 Loaded notification stats:', response.data.stats);
      }
    } catch (error) {
      console.log('Note: Could not load notification statistics');
    }
  };

  // Update student location to backend for better distance calculations
  const updateStudentLocationToBackend = async (location) => {
    try {
      if (!studentData.id) return;

      await axios.post(`http://localhost:5000/api/notifications/student/${studentData.id}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        locationType: 'current'
      });

      console.log('📍 Updated student location to backend');
    } catch (error) {
      console.log('Note: Could not update location to backend (non-critical)');
    }
  };

  // Request notification permission and load preferences
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
    
    // Load preferences and stats when component mounts
    if (studentData.id) {
      loadNotificationPreferences();
      loadNotificationStats();
    }
  }, [studentData.id]);

  // Enhanced geolocation tracking with backend updates
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setStudentLocation(location);
          setIsLocationEnabled(true);
          
          // Update backend with student location for better notifications
          updateStudentLocationToBackend(location);
          
          console.log('📍 Student location updated:', location);
        },
        (error) => {
          console.warn('📍 Failed to get student location:', error);
          setIsLocationEnabled(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [studentData.id]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const email = localStorage.getItem('studentEmail');
        if (!email) {
          navigate('/student-login');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
        if (response.status === 200) {
          const student = response.data;
          setStudentData(student);

          if (student.route_name && socket) {
            console.log(`🔗 Subscribing to route: "${student.route_name}"`);
            socket.emit('subscribe_route', student.route_name);
            
            // Subscribe to student-specific notifications
            socket.emit('subscribe_student_notifications', student.id);
            console.log(`✅ Subscription sent for route: ${student.route_name} and student: ${student.id}`);
            
            // Add a small delay and check server response
            setTimeout(() => {
              console.log(`🔍 Checking subscription status for route: ${student.route_name}`);
            }, 1000);
            
            // Immediately check for any existing captain location on this route
            try {
              console.log(`📍 Checking for existing locations on route: ${student.route_name}`);
              const locationResponse = await axios.get(`http://localhost:5000/api/location/route/${encodeURIComponent(student.route_name)}/locations`);
              console.log(`📍 Location API response:`, locationResponse.data);
              if (locationResponse.status === 200 && locationResponse.data.length > 0) {
                const activeLocation = locationResponse.data[0];
                console.log('Found existing captain location:', activeLocation);
                setCaptainLocation(activeLocation);
                
                // Update map locations
                setMapLocations([{
                  latitude: activeLocation.latitude,
                  longitude: activeLocation.longitude,
                  name: `Captain: ${activeLocation.captainName || 'Unknown'}`,
                  type: 'captain',
                  timestamp: activeLocation.timestamp
                }]);
              }
            } catch (locationError) {
              console.log('No existing locations found or error:', locationError);
            }

            // Check for recent notifications
            try {
              const notificationResponse = await axios.get(`http://localhost:5000/api/notifications/student/${student.id}/last-notification`);
              if (notificationResponse.status === 200) {
                const notification = notificationResponse.data.notification;
                console.log('Found recent notification:', notification);
                handleNotification(notification);
              }
            } catch (notificationError) {
              console.log('No recent notifications found');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load student data');
      }
    };

    fetchStudentData();
  }, [socket, navigate]);

  // Update estimated arrival time every 30 seconds for freshness
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update getEstimatedArrival function
      if (lastNotification?.estimatedTime && lastNotificationTime) {
        const timeDiff = (new Date() - lastNotificationTime) / 1000 / 60; // minutes
        if (timeDiff >= 10) {
          // Clear old notification data if it's too old
          setLastNotification(null);
          setLastNotificationTime(null);
        }
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastNotification, lastNotificationTime]);

  const getEstimatedArrival = () => {
    // Priority 1: Use notification data if available and recent
    if (lastNotification?.estimatedTime && lastNotificationTime) {
      const timeDiff = (new Date() - lastNotificationTime) / 1000 / 60; // minutes
      if (timeDiff < 10) { // Use notification data if less than 10 minutes old
        return `${lastNotification.estimatedTime} minutes`;
      }
    }
    
    // Priority 2: Use captain location if available
    if (captainLocation) {
      // If we have captain location but no recent notification, show a generic estimate
      return '5-10 minutes';
    }
    
    // Priority 3: Show error if no data available
    return 'Data unavailable';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString();
  };

  const dismissNotification = () => {
    setShowNotification(false);
    
    // Track dismissal
    if (lastNotification?.id) {
      trackNotificationInteraction(lastNotification.id, 'dismissed');
    }
    
    setLastNotification(null);
  };

  const handleNotificationClick = () => {
    if (lastNotification?.id) {
      trackNotificationInteraction(lastNotification.id, 'clicked');
    }
    
    // Handle action based on notification type
    if (lastNotification?.action === 'head_to_stop_now') {
      // Could show map directions or other urgent actions
      console.log('🚨 User clicked critical notification - should head to stop now!');
    }
    
    dismissNotification();
  };

  if (error) {
    return (
      <div className="student-view p-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8">
            <div className="text-center">
              <FaExclamationTriangle className="text-4xl mx-auto mb-4 icon-alert" />
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>Connection Error</h1>
              <p className="mb-6" style={{ color: 'var(--color-text-body)' }}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary px-6 py-3 font-medium"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (rideEnded) {
    return (
      <div className="student-view p-8">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8">
            <div className="text-center">
              <FaBus className="text-4xl mx-auto mb-4 icon-ui" />
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>Ride Ended</h1>
              <p className="mb-6" style={{ color: 'var(--color-text-body)' }}>{rideEndMessage}</p>
              <button 
                onClick={() => navigate('/student/home')} 
                className="btn btn-primary px-6 py-3 font-medium"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-view">
      {/* Header */}
      <nav className="global-header px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <VanItLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold nav-link">
              Capital University of Science and Technology - Bus Tracking
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/student/home')}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Back to Home
            </button>
            
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
              ></div>
              <span 
                className="text-sm font-medium"
                style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Optimized Student Info Section */}
          <div className="card p-6 mb-6" style={{ background: 'linear-gradient(135deg, var(--color-surface-active) 0%, var(--color-surface-inactive) 100%)', border: '1px solid var(--color-primary-action)' }}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Your Bus Journey</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Our Route */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: 'var(--color-info)', color: 'var(--color-text-inverse)' }}>
                  <FaRoute className="text-lg" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>Route</h3>
                <p className="text-base font-medium" style={{ color: 'var(--color-primary-action)' }}>
                  {studentData.route_name || 'Not assigned'}
                </p>
              </div>

              {/* Your Stop */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-text-inverse)' }}>
                  <FaMapPin className="text-lg" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>Stop</h3>
                <p className="text-base font-medium" style={{ color: 'var(--color-primary-action)' }}>
                  {studentData.stop_name || 'Not assigned'}
                </p>
              </div>

              {/* Estimated Arrival */}
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-active)', border: '1px solid var(--color-border)' }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
                  <FaClock className="text-lg" />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>Arrival Time</h3>
                <p className="text-base font-bold" style={{ 
                  color: getEstimatedArrival() === 'Data unavailable' ? 'var(--color-danger)' : 'var(--color-success)' 
                }}>
                  {getEstimatedArrival()}
                </p>
                {lastNotificationTime && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Updated: {formatTime(lastNotificationTime)}
                  </p>
                )}
              </div>
            </div>

            {/* Live Update Indicator */}
            {isConnected && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
                  <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: 'var(--color-text-inverse)' }}></div>
                  <span className="text-sm font-medium">Live Tracking Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Map Section */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
              <FaMapMarkedAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} /> Live Bus Location
            </h2>
            
            {captainLocation ? (
              <div className="space-y-6">
                <MapErrorBoundary>
                  <LiveMap 
                    locations={mapLocations}
                    center={captainLocation ? [captainLocation.latitude, captainLocation.longitude] : [33.6844, 73.0479]}
                    zoom={15}
                    height="400px"
                    userType="student"
                  />
                </MapErrorBoundary>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Captain Information Card */}
                  <div className="card p-6" style={{ backgroundColor: 'var(--color-info)', color: 'var(--color-text-inverse)' }}>
                    <div className="flex items-center mb-4">
                      <FaUserCircle className="text-2xl mr-3" />
                      <h4 className="font-bold text-lg">Captain Info</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <FaUser className="mr-2 text-sm" />
                        <span className="font-medium">{captainLocation.captainName || 'Unknown Captain'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaRoute className="mr-2 text-sm" />
                        <span>{captainLocation.routeName || studentData.route_name || 'Unknown Route'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Details Card */}
                  <div className="card p-6" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
                    <div className="flex items-center mb-4">
                      <FaMapPin className="text-2xl mr-3" />
                      <h4 className="font-bold text-lg">Live Location</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="opacity-80">Lat:</span> <span className="font-mono font-medium">{captainLocation.latitude?.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="opacity-80">Lng:</span> <span className="font-mono font-medium">{captainLocation.longitude?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className="card p-6" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-text-inverse)' }}>
                    <div className="flex items-center mb-4">
                      <FaClock className="text-2xl mr-3" />
                      <h4 className="font-bold text-lg">Status</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm font-medium">Live Tracking</span>
                      </div>
                      <div className="text-sm">
                        <span className="opacity-80">Updated:</span>
                        <br />
                        <span className="font-medium">{formatTime(captainLocation.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaBus className="text-4xl mx-auto mb-4 icon-ui" />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>No Active Bus</h3>
                <p style={{ color: 'var(--color-text-body)' }}>Your bus is not currently active or tracking is unavailable.</p>
              </div>
            )}
          </div>

          {/* Enhanced Notifications */}
          {showNotification && lastNotification && (
            <div 
              className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-sm z-50 cursor-pointer transform transition-all duration-300 ${
                lastNotification.urgency === 'critical' ? 'animate-pulse' : ''
              }`} 
              style={{ 
                backgroundColor: lastNotification.urgency === 'critical' ? 'var(--color-danger)' : 
                               lastNotification.urgency === 'high' ? 'var(--color-warning)' :
                               'var(--color-primary-action)', 
                color: 'var(--color-text-inverse)',
                border: lastNotification.urgency === 'critical' ? '2px solid #ff4444' : 'none'
              }}
              onClick={handleNotificationClick}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {lastNotification.urgency === 'critical' ? (
                    <span className="text-2xl mr-2 animate-bounce">🚨</span>
                  ) : (
                    <FaBell className="text-lg mr-2" />
                  )}
                  {lastNotification.urgency === 'critical' && (
                    <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded uppercase">
                      URGENT
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification();
                  }}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-inverse)' }}
                >
                  ×
                </button>
              </div>
              <h4 className="font-semibold mb-1 text-sm">{lastNotification.title}</h4>
              <p className="text-sm mb-2">{lastNotification.message}</p>
              
              {/* Distance and time info */}
              {(lastNotification.distance || lastNotification.estimatedTime) && (
                <div className="text-xs opacity-90 border-t border-white border-opacity-30 pt-2 mt-2">
                  {lastNotification.distance && (
                    <span className="mr-3">📏 {lastNotification.distance}km away</span>
                  )}
                  {lastNotification.estimatedTime && (
                    <span>⏱️ ~{lastNotification.estimatedTime} min</span>
                  )}
                </div>
              )}
              
              {/* Action button for critical notifications */}
              {lastNotification.urgency === 'critical' && (
                <div className="mt-3">
                  <button 
                    className="w-full bg-white text-red-600 py-2 px-4 rounded font-bold text-sm hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick();
                    }}
                  >
                    {lastNotification.action === 'head_to_stop_now' ? 'GET TO STOP NOW!' : 'ACKNOWLEDGED'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notification Statistics Card */}
          {notificationStats.total > 0 && (
            <div className="card p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaBell className="mr-2" /> Notification Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-action)' }}>
                    {notificationStats.today_total}
                  </div>
                  <div style={{ color: 'var(--color-text-body)' }}>Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
                    {notificationStats.today_unread}
                  </div>
                  <div style={{ color: 'var(--color-text-body)' }}>Unread</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                    {notificationStats.read_rate || 0}%
                  </div>
                  <div style={{ color: 'var(--color-text-body)' }}>Read Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-info)' }}>
                    {notificationStats.total}
                  </div>
                  <div style={{ color: 'var(--color-text-body)' }}>Total (7d)</div>
                </div>
              </div>
              
              {lastNotificationTime && (
                <div className="mt-3 text-xs text-center" style={{ color: 'var(--color-text-body)' }}>
                  Last notification: {lastNotificationTime.toLocaleString()}
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default StudentBusTracking; 