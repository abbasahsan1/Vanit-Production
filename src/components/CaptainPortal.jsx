import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaExclamationTriangle, FaUserCircle, FaHome, FaCommentDots, FaMapMarkedAlt, FaPlay, FaStop, FaUser, FaSignOutAlt, FaLocationArrow, FaClock, FaUsers, FaRoute, FaEye } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import VanItLogo from './VanItLogo';
import CaptainAttendancePanel from './CaptainAttendancePanel';
import SOSButton from './SOSButton';
import SOSTracker from './SOSTracker';
import NotificationManager from './NotificationManager';
import CaptainFeedback from './Captain/CaptainFeedback';
import LiveMap from './LiveMap';

const CaptainPortal = () => {
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState('');
  const [stops, setStops] = useState([]);
  const [studentsInRide, setStudentsInRide] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [isRideActive, setIsRideActive] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [routeError, setRouteError] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [captainId, setCaptainId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [captainData, setCaptainData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    route_name: ''
  });
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, feedback
  
  // GPS-related state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const locationIntervalRef = useRef(null);

  // Fetch captain data for SOS functionality
  const fetchCaptainData = async (phone) => {
    try {
      console.log('🔍 Fetching captain data for phone:', phone);
      const response = await axios.get(`http://localhost:5000/api/auth/captains/profile/${phone}`);
      if (response.data && response.data.success && response.data.data) {
        const captain = response.data.data;
        const captainData = {
          id: captain.id, // ✅ Essential for SOS functionality
          first_name: captain.first_name || '',
          last_name: captain.last_name || '',
          phone: captain.phone || phone,
          route_name: captain.route_name || routeName || ''
        };
        setCaptainData(captainData);
        console.log('✅ Captain data loaded for SOS:', captainData);
      } else {
        console.error('❌ Invalid captain API response:', response.data);
        // Set fallback data with minimal requirements
        setCaptainData({
          id: captainId, // Use the captainId if available
          first_name: 'Captain',
          last_name: 'User',
          phone: phone,
          route_name: routeName || ''
        });
      }
    } catch (error) {
      console.error("❌ Error fetching captain data:", error);
      // Set minimal data from available sources
      setCaptainData({
        id: captainId, // Use the captainId if available
        first_name: 'Captain',
        last_name: 'User',
        phone: phone,
        route_name: routeName || ''
      });
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const token = localStorage.getItem('captainToken');
    if (token) {
      const storedPhone = localStorage.getItem('captainPhone');
      if (storedPhone) {
        setCaptainPhone(storedPhone);
        
        // Fetch captain data immediately when phone is available
        fetchCaptainData(storedPhone);
        
        axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone: storedPhone })
          .then(res => {
            if (!res.data.hasPassword) {
              setShowSetPasswordModal(true);
            }
            // Set captain ID for further use
            if (res.data.captainId) {
              setCaptainId(res.data.captainId);
            }
          })
          .catch(err => console.error("Error checking password status:", err));
      }
    }

    // Clean up WebSocket on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const fetchAssignedRoute = async () => {
      const phone = localStorage.getItem("captainPhone");
      
      if (!phone) {
        setIsLoadingRoute(false);
        setRouteError('No phone number found. Please log in again.');
        return;
      }
      
      try {
        setIsLoadingRoute(true);
        setRouteError(null);
        
        const { data } = await axios.post("http://localhost:5000/api/auth/captains/assigned-route", { phone });
        setRouteName(data.routeName);
        setStops(data.stops);
        
        // Fetch students count for this route
        if (data.routeName) {
          try {
            const studentsResponse = await axios.get(`http://localhost:5000/api/routes/${encodeURIComponent(data.routeName)}/students`);
            if (studentsResponse.data.success) {
              setStudentsCount(studentsResponse.data.data.length);
              console.log(`📊 Found ${studentsResponse.data.data.length} students on route: ${data.routeName}`);
            }
          } catch (studentsError) {
            console.warn('⚠️ Could not fetch students count:', studentsError);
            setStudentsCount(0);
          }
        }
        
        const captainResponse = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
        if (captainResponse.data.isActive) {
          setIsRideActive(true);
          // If ride is active, also set GPS tracking as active
          setIsTracking(true);
          setLastUpdate(new Date().toISOString());
          
          // Try to get current location for active ride
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
        } else {
          setIsRideActive(false);
          setIsTracking(false);
        }
      } catch (err) {
        console.error("Error fetching assigned route:", err);
        setRouteError(`Failed to load route information: ${err.response?.data?.message || err.message}`);
      } finally {
        setIsLoadingRoute(false);
      }
    };
  
    fetchAssignedRoute();
  }, []);

  useEffect(() => {
    const checkIfPasswordSet = async () => {
      const phone = localStorage.getItem('captainPhone');
      if (!phone) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
        if (res.data.exists && !res.data.hasPassword) {
          setShowSetPasswordModal(true);
        }
      } catch (err) {
        console.error("Error checking password status:", err);
      }
    };
  
    checkIfPasswordSet();
  }, []);

  useEffect(() => {
    const checkIfPasswordResetNeeded = async () => {
      const phone = localStorage.getItem('captainPhone');
      const otpUsed = localStorage.getItem('otpLogin') === 'true';
  
      if (!phone || !otpUsed) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
  
        if (!res.data.hasPassword) {
          setShowSetPasswordModal(true);
        } else {
          localStorage.removeItem("otpLogin");
        }
      } catch (err) {
        console.error("Error checking password:", err);
      }
    };
  
    checkIfPasswordResetNeeded();
  }, []);
  
  useEffect(() => {
    const checkRideStatus = async () => {
      const phone = localStorage.getItem('captainPhone');
      if (!phone) return;
      
      try {
        const response = await axios.post('http://localhost:5000/api/auth/captains/check-phone', { phone });
        if (response.data.isActive) {
          setIsRideActive(true);
          setCaptainId(response.data.captainId);
          // Only set tracking if ride is actually active from backend
          setIsTracking(true);
        } else {
          setIsRideActive(false);
          setIsTracking(false);
          setStudentsInRide(0); // Reset count when no ride is active
        }
      } catch (error) {
        console.error('Error checking ride status:', error);
      }
    };

    checkRideStatus();
    
    const interval = setInterval(checkRideStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCaptainLocation = async () => {
      if (!captainId || !isRideActive) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/location/captain/${captainId}/location`);
        if (response.data) {
          setCaptainLocation(response.data);
        }
      } catch (error) {
        console.error('Error fetching captain location:', error);
      }
    };

    fetchCaptainLocation();
    
    const interval = setInterval(fetchCaptainLocation, 3000);
    return () => clearInterval(interval);
  }, [captainId, isRideActive]);

  // Fetch current attendance count and listen for real-time updates
  useEffect(() => {
    if (!captainId || !socket) return;

    // Join captain room for attendance updates
    socket.emit('subscribe_captain', captainId);
    console.log(`📡 Captain Portal subscribed to captain room: captain:${captainId}`);

    // Listen for real-time attendance updates (ride-based)
    socket.on('attendance_update', (data) => {
      console.log('📊 Captain Portal received attendance update:', data);
      if (data.data && data.data.studentsOnboard !== undefined) {
        setStudentsInRide(data.data.studentsOnboard);
        console.log(`📊 Updated students in ride count from socket: ${data.data.studentsOnboard}`);
      }
    });

    socket.on('boarding_update', (data) => {
      console.log('📊 Captain Portal received boarding update:', data);
      if (data.data && data.data.studentsOnboard !== undefined) {
        setStudentsInRide(data.data.studentsOnboard);
        console.log(`📊 Updated students in ride count from boarding update: ${data.data.studentsOnboard}`);
      }
    });

    // Listen for ride status changes
    socket.on('ride_status_update', (data) => {
      console.log('🚌 Captain Portal received ride status update:', data);
      if (data.captainId === captainId) {
        setIsRideActive(data.isActive);
        if (!data.isActive) {
          setStudentsInRide(0); // Reset count when ride ends
        }
      }
    });

    // Fetch current attendance count if ride is active
    const fetchCurrentAttendance = async () => {
      if (isRideActive && captainId) {
          try {
          const response = await axios.get(`http://localhost:5000/api/attendance/captain/${captainId}/current-attendance`);
          if (response.data && response.data.success && response.data.count !== undefined) {
            setStudentsInRide(response.data.count);
            console.log(`📊 Updated students in ride count: ${response.data.count}`);
        }
      } catch (error) {
          console.error('Error fetching current attendance count:', error);
        }
      }
    };

    // Initial fetch
    fetchCurrentAttendance();

    // Set up interval for auto-refresh every 10 seconds
    const attendanceInterval = setInterval(fetchCurrentAttendance, 10000);

    return () => {
        socket.off('attendance_update');
        socket.off('boarding_update');
        socket.off('ride_status_update');
        clearInterval(attendanceInterval);
    };
  }, [captainId, socket, isRideActive]);

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/auth/captains/set-password", {
        phone: captainPhone,
        password
      });
      alert("Password set successfully.");
        setShowSetPasswordModal(false);
        navigate("/captain-login");
    } catch (err) {
      alert("Failed to set password.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('captainToken');
    localStorage.removeItem('captainPhone');
    navigate('/captain-login');
  };

  // ===== GPS FUNCTIONALITY =====
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('🔍 Requesting geolocation...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('✅ Location acquired:', location);
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage = 'Failed to get location: ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Unknown location error.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
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
      
      const httpResponse = await axios.post('http://localhost:5000/api/location/captain/location', locationData);
      console.log('✅ HTTP API response:', httpResponse.status);

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
        setIsRideActive(true);
      }
      
      setIsTracking(true);
      
      console.log('📍 Starting GPS tracking...');
      
      if (captainId) {
        console.log('🎯 Notifying backend - starting tracking for captain:', captainId);
        await axios.post(`http://localhost:5000/api/location/captain/${captainId}/start-tracking`);
        console.log('✅ Backend tracking started');
      }
      
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLastUpdate(new Date().toISOString());
      
      setMapLocations([{
        latitude: location.latitude,
        longitude: location.longitude,
        name: 'Your Location',
        type: 'captain',
        timestamp: location.timestamp,
        accuracy: location.accuracy
      }]);
      
      await sendLocationUpdate(location);
      
      console.log('✅ Initial location sent, starting interval...');

      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      const interval = setInterval(async () => {
        try {
          console.log('⏰ Interval triggered - getting new location...');
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          setLastUpdate(new Date().toISOString());

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
          
          if (error.message.includes('denied') || error.message.includes('permission')) {
            console.error('❌ Stopping tracking due to permission error');
            clearInterval(interval);
            setIsTracking(false);
            setMapLocations([]);
          }
        }
      }, 5000);

      locationIntervalRef.current = interval;
      console.log('✅ Ride started and GPS tracking enabled successfully');
    
    } catch (error) {
      console.error('❌ Error starting tracking:', error);
      setError('Failed to start tracking: ' + error.message);
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    try {
      console.log('🛑 Stopping GPS tracking...');
      
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
          setIsRideActive(false);
          
          alert('Ride stopped successfully! Students have been notified.');
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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <VanItLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold nav-link">
              Capital University of Science and Technology - Captain Portal
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <SOSButton 
              userType="captain"
              userId={captainData.id || captainId}
              userData={captainData}
              onAlertSent={(alertData) => {
                console.log('SOS Alert sent from Captain Portal:', alertData);
              }}
            />

            <button
              onClick={() => setShowSOSTracker(true)}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
              title="View SOS Alerts"
            >
              <FaEye className="mr-2" /> SOS Alerts
            </button>

            <button className="nav-link hover:opacity-80 transition-opacity">
              <FaBell className="text-lg" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="nav-link hover:opacity-80 transition-opacity"
              >
                <FaUserCircle className="text-xl" />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50" style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border-standard)' }}>
                  <Link
                    to="/captain/profile"
                    className="flex items-center px-4 py-2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <FaUser className="mr-3 text-sm" /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity text-left"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <FaSignOutAlt className="mr-3 text-sm" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>



      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard' 
                  ? 'text-white' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: currentView === 'dashboard' 
                  ? 'var(--color-primary-action)' 
                  : 'var(--color-surface-inactive)',
                color: currentView === 'dashboard' 
                  ? 'var(--color-text-inverse)' 
                  : 'var(--color-text-body)'
              }}
            >
              <FaHome className="inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('feedback')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'feedback' 
                  ? 'text-white' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: currentView === 'feedback' 
                  ? 'var(--color-primary-action)' 
                  : 'var(--color-surface-inactive)',
                color: currentView === 'feedback' 
                  ? 'var(--color-text-inverse)' 
                  : 'var(--color-text-body)'
              }}
            >
              <FaCommentDots className="inline mr-2" />
              Feedback
            </button>
          </div>

          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
          {/* Route Information */}
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Bus Route</h1>
            {isRideActive && (
              <div className="flex items-center px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--color-text-inverse)' }}></div>
                <span className="text-sm font-semibold">Ride Active</span>
              </div>
            )}
          </div>

          {isLoadingRoute ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading route information...</span>
            </div>
          ) : routeError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{routeError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
            </div>
          ) : routeName ? (
              <div>
              <h2 className="text-xl font-bold text-blue-600 mb-4">Assigned Route: {routeName}</h2>
              {stops.length > 0 ? (
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Stops:</h3>
                    <ul className="space-y-2">
                    {stops.map((stop, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                          {idx + 1}
                        </span>
                          <span className="text-gray-600">{stop}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500">No stops assigned to this route.</p>
              )}
            </div>
          ) : (
              <div>
              <p className="text-gray-600 mb-4">
                No route has been assigned yet. Please contact the admin to get your route assignment.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> You need a route assignment to start your ride.
                </p>
              </div>
            </div>
          )}
        </div>

          {/* GPS Tracking Section */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>GPS Tracking</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Real-time location tracking for your route</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                  {isTracking ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FaUsers className="text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total Students Registered for this Route</p>
                    <p className="text-lg font-semibold text-blue-600">{studentsCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <FaRoute className="text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">GPS Status</p>
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

            {/* Error Display */}
            {error && (
              <div className="p-4 mb-4 rounded-lg" style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}>
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-3" />
                  <div>
                    <h3 className="font-semibold mb-1">GPS Error</h3>
                    <p className="text-sm whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={startTracking}
                disabled={isRideActive || isTracking || !socket || !socket.connected}
                className={`btn flex items-center px-6 py-3 font-semibold ${
                  isRideActive || isTracking || !socket || !socket.connected
                    ? 'btn-ghost cursor-not-allowed'
                    : 'btn-success'
                }`}
              >
                <FaPlay className="mr-2" />
                {isRideActive ? 'Ride Active' : 'Start Ride & GPS'}
              </button>

              <button
                onClick={stopTracking}
                disabled={!isRideActive && !isTracking}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  !isRideActive && !isTracking
                    ? 'cursor-not-allowed opacity-50'
                    : ''
                }`}
                style={!isRideActive && !isTracking 
                  ? { backgroundColor: 'var(--color-surface-inactive)', color: 'var(--color-text-secondary)' }
                  : { backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }
                }
                onMouseEnter={(e) => {
                  if (isRideActive || isTracking) e.target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  if (isRideActive || isTracking) e.target.style.opacity = '1';
                }}
              >
                <FaStop className="mr-2" />
                Stop Ride & GPS
              </button>
            </div>

            {/* Current Location Display */}
            {currentLocation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-gradient-start)' }}>
                  <h4 className="font-semibold mb-3 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                    <FaLocationArrow className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                    Current Coordinates
                  </h4>
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
                  <h4 className="font-semibold mb-3">Live Status</h4>
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
                        {routeName || 'Not Assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Map */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Live Map</h3>
              <LiveMap
                center={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [33.6844, 73.0479]}
                zoom={15}
                locations={mapLocations}
                height="400px"
                userType="captain"
              />
            </div>
          </div>

          {/* Students Count */}
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Students Currently in Ride</h2>
              <p className="text-6xl font-bold text-blue-600 mb-2">{studentsInRide}</p>
              <p className="text-sm text-gray-600">
              {isRideActive ? 'Live Count - Students who have checked in' : 'No Active Ride'}
            </p>
        </div>
      </div>

          {/* Live Location */}
      {isRideActive && captainLocation && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FaMapMarkedAlt className="mr-2" /> Live Location
            </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono font-semibold">
                    {captainLocation.latitude?.toFixed(6)}
                  </span>
                </div>
                  <div className="flex items-center justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono font-semibold">
                    {captainLocation.longitude?.toFixed(6)}
                  </span>
                </div>
              </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-semibold">
                    {new Date(captainLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                  <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Management Panel */}
      {isRideActive && captainId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <CaptainAttendancePanel 
            captainId={captainId} 
            routeName={routeName} 
          />
        </div>
      )}
            </>
          )}



          {/* Feedback View */}
          {currentView === 'feedback' && (
            <div className="card p-8">
              <CaptainFeedback />
            </div>
          )}


        </div>
      </div>

      {/* Set Password Modal */}
      {showSetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-96">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Set Your Password</h2>
            <div className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
                onClick={handleSetPassword}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Set Password
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Manager */}
      <NotificationManager 
        socket={socket}
        userType="captain"
        userId={captainData.id}
      />

      {/* SOS Tracker Modal */}
      {showSOSTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">SOS Alerts Tracker</h2>
              <button
                onClick={() => setShowSOSTracker(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <SOSTracker userType="captain" userId={captainData.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainPortal;
