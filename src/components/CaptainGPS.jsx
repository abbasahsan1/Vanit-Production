import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  FaPlay, 
  FaStop, 
  FaMapMarkedAlt, 
  FaLocationArrow, 
  FaClock,
  FaUsers,
  FaRoute,
  FaExclamationTriangle,
  FaArrowLeft
} from 'react-icons/fa';
import LiveMap from './LiveMap';

const CaptainGPS = () => {
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [routeName, setRouteName] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locationInterval, setLocationInterval] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);

  const locationIntervalRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Captain WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Captain WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Captain WebSocket connection error:', error);
      setError('WebSocket connection failed');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchCaptainInfo = async () => {
      try {
        const phone = localStorage.getItem('captainPhone');
        if (!phone) {
          navigate('/captain-login');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/auth/captains/check-phone', { phone });
        if (response.data.exists) {
          setCaptainId(response.data.captainId);
          setRouteName(response.data.routeName || 'Unknown Route');
          
          console.log('👤 Captain info loaded:', {
            captainId: response.data.captainId,
            routeName: response.data.routeName,
            isActive: response.data.isActive
          });

          // Check if ride is already active and update UI accordingly
          if (response.data.isActive) {
            console.log('🚀 Ride is already active, updating UI state');
            setIsTracking(true);
            setLastUpdate(new Date().toISOString());
            
            // Get current location to update map
            try {
              const location = await getCurrentLocation();
              setCurrentLocation(location);
              setMapLocations([{
                latitude: location.latitude,
                longitude: location.longitude,
                name: 'Your Location',
                type: 'captain',
                timestamp: location.timestamp
              }]);
            } catch (locationError) {
              console.warn('⚠️ Could not get current location for active ride:', locationError);
            }
          }

          // Fetch students count for this route
          try {
            const studentsResponse = await axios.get(`http://localhost:5000/api/routes/${encodeURIComponent(response.data.routeName)}/students`);
            if (studentsResponse.data.success) {
              setStudentsCount(studentsResponse.data.data.length);
              console.log(`📊 Found ${studentsResponse.data.data.length} students on route: ${response.data.routeName}`);
            }
          } catch (studentsError) {
            console.warn('⚠️ Could not fetch students count:', studentsError);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching captain info:', error);
        setError('Failed to load captain information');
      }
    };

    fetchCaptainInfo();
  }, [navigate, socket]); // Added socket dependency

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('🔍 Requesting geolocation...');

      // Check permission status first
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('Geolocation permission status:', result.state);
          if (result.state === 'denied') {
            reject(new Error('Location access denied. Please enable location permissions in your browser settings.'));
            return;
          }
        });
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('✅ Real GPS location obtained:', location);
          console.log(`📍 Accuracy: ±${Math.round(location.accuracy)}m`);
          
          // Validate that this is not a mock location
          if (location.accuracy > 10000) {
            console.warn('⚠️ Low accuracy location detected, might be mock location');
          }
          
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions and refresh the page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please ensure GPS is enabled.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unknown location error occurred.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 30000
        }
      );
    });
  };

  const sendLocationUpdate = async (location) => {
    try {
      if (!captainId || !socket) {
        console.error('❌ Cannot send location - missing captainId or socket:', { 
          captainId, 
          socketConnected: !!socket && socket.connected,
          routeName
        });
        return;
      }

      // Validate location data
      if (!location.latitude || !location.longitude) {
        console.error('❌ Invalid location data:', location);
        return;
      }

      const locationData = {
        captainId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        routeName
      };

      console.log('📤 Sending location via HTTP API:', locationData);
      
      // Send via HTTP API
      const httpResponse = await axios.post('http://localhost:5000/api/location/captain/location', locationData);
      console.log('✅ HTTP API response:', httpResponse.status);

      console.log('📡 Sending location via WebSocket:', locationData);

      // Send via WebSocket only if connected
      if (socket && socket.connected) {
        socket.emit('captain_location_update', locationData);
        console.log('✅ WebSocket location sent successfully');
      } else {
        console.error('❌ WebSocket not connected, skipping WebSocket update');
      }
      
    } catch (error) {
      console.error('❌ Error sending location:', error);
      setError(`Failed to send location: ${error.message}`);
      throw error;
    }
  };

  const startTracking = async () => {
    try {
      setError(null);
      
      console.log('🚀 Starting GPS tracking and ride...');
      
      // Start the ride FIRST - this enables attendance
      if (captainId && routeName) {
        console.log('🎯 Starting ride for captain:', captainId, 'on route:', routeName);
        const phone = localStorage.getItem('captainPhone');
        await axios.post('http://localhost:5000/api/auth/captains/start-ride', {
          phone: phone,
          routeName: routeName
        });
        console.log('✅ Ride started - attendance now enabled');
      }
      
      setIsTracking(true);
      
      // Then start GPS tracking
      console.log('📍 Starting GPS tracking...');
      
      // First, notify backend that tracking has started
      if (captainId) {
        console.log('🎯 Notifying backend - starting tracking for captain:', captainId);
        await axios.post(`http://localhost:5000/api/location/captain/${captainId}/start-tracking`);
        console.log('✅ Backend tracking started');
      }
      
      // Test location access first
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLastUpdate(new Date().toISOString());
      
      // Update map with captain location
      setMapLocations([{
        latitude: location.latitude,
        longitude: location.longitude,
        name: 'Your Location',
        type: 'captain',
        timestamp: location.timestamp,
        accuracy: location.accuracy
      }]);
      
      // Send initial location
      await sendLocationUpdate(location);
      
      console.log('✅ Initial location sent, starting interval...');

      // Clear any existing interval first
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      // Set up location tracking interval
      const interval = setInterval(async () => {
        try {
          console.log('⏰ Interval triggered - getting new location...');
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          setLastUpdate(new Date().toISOString());

          // Update map with new location
          setMapLocations([{
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            name: 'Your Location',
            type: 'captain',
            timestamp: newLocation.timestamp,
            accuracy: newLocation.accuracy
          }]);

          await sendLocationUpdate(newLocation);
          console.log('✅ Location update cycle completed successfully');
        } catch (error) {
          console.error('❌ Error in tracking interval:', error);
          setError('GPS tracking interrupted: ' + error.message);
          
          // If it's a permission error, stop tracking completely
          if (error.message.includes('denied') || error.message.includes('permission')) {
            console.error('❌ Stopping tracking due to permission error');
            clearInterval(interval);
            setIsTracking(false);
            setMapLocations([]);
          }
          // For other errors, just log and continue trying
        }
      }, 5000); // Update location every 5 seconds

      locationIntervalRef.current = interval;
      console.log('✅ Ride started and GPS tracking enabled successfully');
    } catch (error) {
      console.error('❌ Failed to start ride and tracking:', error);
      setError(`Failed to start ride and location tracking: ${error.message}`);
      setIsTracking(false);
      
      // Clear interval if it was set
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      
      // Show helpful instructions
      if (error.message.includes('denied') || error.message.includes('permission')) {
        setError(
          '📍 Location access required for GPS tracking. Please:\n' +
          '1. Click the location icon in your browser address bar\n' +
          '2. Select "Allow" for location access\n' +
          '3. Refresh the page and try again'
        );
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      setError(null);
      console.log('🔓 Testing location permission...');
      
      // Don't start full tracking, just test location access
      const location = await getCurrentLocation();
      console.log('✅ Location permission granted:', location);
      
      // Set the location temporarily for display
      setCurrentLocation(location);
      
      // Update map
      setMapLocations([{
        latitude: location.latitude,
        longitude: location.longitude,
        name: 'Your Location (Test)',
        type: 'captain',
        timestamp: location.timestamp,
        accuracy: location.accuracy
      }]);
      
      setError(null);
      
      // Show success message
      alert(`✅ Location access working!\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\n\nYou can now start ride tracking.`);
      
    } catch (error) {
      console.error('❌ Permission test failed:', error);
      setError(
        `❌ Test failed: ${error.message}\n\n` +
        'To enable location access:\n' +
        '1. Look for the location icon 📍 in your browser\'s address bar\n' +
        '2. Click it and select "Allow"\n' +
        '3. If no icon appears, go to Site Settings and enable Location\n' +
        '4. Refresh this page and try again'
      );
    }
  };

  const stopTracking = async () => {
    try {
      console.log('🛑 Stopping GPS tracking...');
      
      // Send ride end notification BEFORE clearing intervals and stopping tracking
      if (captainId && socket && socket.connected && routeName) {
        try {
          console.log('📡 Sending ride end notification to students...');
          const rideEndData = {
            captainId,
            routeName
          };
          socket.emit('captain_ride_ended', rideEndData);
          console.log('✅ Ride end notification sent via WebSocket');
        } catch (error) {
          console.error('❌ Error sending ride end notification:', error);
        }
      }
      
      // Clear interval first
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
        console.log('✅ Location interval cleared');
      }

      setIsTracking(false);
      setCurrentLocation(null);
      setLastUpdate(null);
      setMapLocations([]);

      if (captainId) {
        try {
          console.log('🎯 Notifying backend - stopping tracking for captain:', captainId);
          await axios.post(`http://localhost:5000/api/location/captain/${captainId}/stop-tracking`);
          console.log('✅ Backend tracking stopped');
          
          const phone = localStorage.getItem('captainPhone');
          await axios.post('http://localhost:5000/api/auth/captains/stop-ride', {
            phone: phone
          });
          console.log('✅ Ride stopped successfully');
          
          alert('Ride stopped successfully! Students have been notified. Redirecting to portal...');
          navigate('/captain/home');
        } catch (error) {
          console.error('❌ Error stopping tracking on backend:', error);
        }
      }

      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('❌ Error in stopTracking:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="student-view">
      {/* Header */}
      <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid var(--color-border-standard)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/captain/home')}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-heading)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>GPS Tracking</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2`} style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}>
              <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Route Information */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Route Information</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Route: {routeName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                  {isTracking ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FaUsers className="text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Students on Route</p>
                    <p className="text-lg font-semibold text-blue-600">{studentsCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FaRoute className="text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Route Status</p>
                    <p className="text-lg font-semibold text-green-600">
                      {isTracking ? 'Tracking Active' : 'Not Tracking'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FaClock className="text-gray-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Last Update</p>
                    <p className="text-lg font-semibold text-gray-600">{formatTime(lastUpdate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                  <div className="text-red-700 whitespace-pre-line mb-4">{error}</div>
                  
                  {error.includes('permission') && (
                    <div className="space-x-3">
                      <button
                        onClick={requestLocationPermission}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        🔓 Request Location Permission
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        🔄 Reload Page
                      </button>
                    </div>
                  )}
                  
                  {!error.includes('permission') && (
                    <button
                      onClick={() => {
                        setError(null);
                        setIsTracking(false);
                        if (locationIntervalRef.current) {
                          clearInterval(locationIntervalRef.current);
                          locationIntervalRef.current = null;
                        }
                        setTimeout(() => {
                          if (captainId && socket && socket.connected) {
                            startTracking();
                          }
                        }, 1000);
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      🔄 Retry GPS Tracking
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tracking Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={requestLocationPermission}
                className="flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
              >
                <FaLocationArrow className="mr-2" />
                Test Location Access
              </button>

              <div className="flex space-x-4">
                <button
                  onClick={startTracking}
                  disabled={isTracking || !isConnected}
                  className={`btn flex items-center px-6 py-3 font-semibold ${
                    isTracking || !isConnected
                      ? 'btn-disabled cursor-not-allowed'
                      : 'btn-success'
                  }`}
                >
                  <FaPlay className="mr-2" />
                  Start Ride
                </button>

                <button
                  onClick={stopTracking}
                  disabled={!isTracking}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    !isTracking
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  }`}
                  style={!isTracking 
                    ? { backgroundColor: 'var(--color-surface-inactive)', color: 'var(--color-text-secondary)' }
                    : { backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }
                  }
                  onMouseEnter={(e) => {
                    if (isTracking) e.target.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    if (isTracking) e.target.style.opacity = '1';
                  }}
                >
                  <FaStop className="mr-2" />
                  Stop Ride
                </button>
              </div>
            </div>
          </div>

          {/* Current Location Display */}
          {currentLocation && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaLocationArrow className="mr-2" style={{ color: 'var(--color-primary-action)' }} /> Current Location
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-gradient-start)' }}>
                  <h4 className="font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>Coordinates</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Latitude:</span>
                      <span className="font-mono font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                        {currentLocation.latitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Longitude:</span>
                      <span className="font-mono font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                        {currentLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Accuracy:</span>
                      <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                        ±{Math.round(currentLocation.accuracy)}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
                  <h4 className="font-semibold mb-3">Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="font-semibold">{formatTime(lastUpdate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Students on Route:</span>
                      <span className="font-semibold flex items-center">
                        <FaUsers className="mr-1" />
                        {studentsCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Route:</span>
                      <span className="font-semibold flex items-center">
                        <FaRoute className="mr-1" />
                        {routeName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Map */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Live Map</h2>
            <LiveMap
              center={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [33.6844, 73.0479]}
              zoom={15}
              locations={mapLocations}
              height="400px"
              userType="captain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainGPS; 