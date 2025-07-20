import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  FaMapMarkedAlt, 
  FaUserCircle, 
  FaUser,
  FaSignOutAlt,
  FaBus, 
  FaClock,
  FaMapPin,
  FaUsers,
  FaSync,
  FaArrowLeft
} from 'react-icons/fa';
import UnifiedNavbar from './UnifiedNavbar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMonitor = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [captainLocations, setCaptainLocations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      timeout: 5000,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Route Monitor WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Route Monitor WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Route Monitor WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('location_update', (data) => {
      console.log('📍 Received location update:', data);
      updateCaptainLocation(data);
    });

    // Listen for attendance updates to get real student counts
    newSocket.on('attendance_update', (data) => {
      console.log('📊 Received attendance update:', data);
      updateStudentCount(data);
    });

    // Listen for session updates
    newSocket.on('session_ended', (data) => {
      console.log('🔚 Session ended:', data);
      fetchActiveSessions();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup map when component unmounts
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/routes');
        if (response.data && typeof response.data === 'object') {
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || []
          }));
          setRoutes(formattedRoutes);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

    fetchRoutes();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/active-sessions');
      if (response.data.success) {
        setActiveSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const handleRouteChange = async (routeName) => {
    if (selectedRoute && socket) {
      socket.emit('unsubscribe_route', selectedRoute);
    }

    setSelectedRoute(routeName);
    setLoading(true);
    
    if (routeName && socket) {
      socket.emit('subscribe_route', routeName);
      
      try {
        // Fetch captain locations
        const locResponse = await axios.get(`http://localhost:5000/api/location/route/${encodeURIComponent(routeName)}/locations`);
        setCaptainLocations(locResponse.data);
        
        // Fetch active sessions for this route
        const sessResponse = await axios.get(`http://localhost:5000/api/attendance/active-sessions?routeName=${encodeURIComponent(routeName)}`);
        if (sessResponse.data.success) {
          setActiveSessions(sessResponse.data.data);
        }
        
        initializeMap(locResponse.data);
      } catch (error) {
        console.error('Error fetching route data:', error);
      }
    }
    setLoading(false);
  };

  const updateCaptainLocation = (locationData) => {
    setCaptainLocations(prev => {
      const updated = prev.filter(loc => loc.captainId !== locationData.captainId);
      return [...updated, locationData];
    });

    // Update marker on map if it exists
    if (mapInstanceRef.current && markersRef.current[locationData.captainId]) {
      const marker = markersRef.current[locationData.captainId];
      
      // Update marker position
      marker.setLatLng([locationData.latitude, locationData.longitude]);
      
      // Update popup content with new data
      const studentCount = getStudentCountForCaptain(locationData.captainId);
      const popupContent = `
        <div style="text-align: center; min-width: 220px;">
          <strong style="font-size: 16px; color: #2563eb;">🚌 ${locationData.captainName || `Captain ${locationData.captainId}`}</strong><br/>
          <div style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px;">
            <small><strong>Route:</strong> ${selectedRoute}</small><br/>
            <small><strong>Students Onboard:</strong> ${studentCount}</small><br/>
            <small><strong>Coordinates:</strong><br/>
            Lat: ${locationData.latitude.toFixed(6)}<br/>
            Lng: ${locationData.longitude.toFixed(6)}</small>
          </div>
          <div style="color: #059669;">
            <small><strong>Last Update:</strong><br/>
            ${new Date(locationData.timestamp).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              month: 'short',
              day: 'numeric'
            })}</small>
          </div>
        </div>
      `;
      
      marker.setPopupContent(popupContent);
      
      console.log(`📍 Updated marker for captain ${locationData.captainId}`);
    } else if (mapInstanceRef.current && selectedRoute) {
      // Create new marker if it doesn't exist and we have a map
      const marker = createMapMarker(locationData);
      if (marker) {
        markersRef.current[locationData.captainId] = marker;
        console.log(`📍 Created new marker for captain ${locationData.captainId}`);
      }
    }
  };

  const updateStudentCount = (attendanceData) => {
    // Update student count for the relevant captain/route
    if (attendanceData.route_name === selectedRoute) {
      fetchActiveSessions(); // Refresh session data to get updated counts
    }
  };

  const initializeMap = (locations) => {
    try {
      // Filter out invalid locations first
      const validLocations = locations.filter(location => 
        location && 
        location.latitude && 
        location.longitude &&
        !isNaN(location.latitude) &&
        !isNaN(location.longitude) &&
        location.latitude >= -90 && location.latitude <= 90 &&
        location.longitude >= -180 && location.longitude <= 180
      );

      // Only initialize map if we have valid locations
      if (validLocations.length === 0) {
        // Clean up existing map if no valid locations
        if (mapInstanceRef.current) {
          Object.values(markersRef.current).forEach(marker => {
            if (mapInstanceRef.current && marker) {
              mapInstanceRef.current.removeLayer(marker);
            }
          });
          markersRef.current = {};
        }
        return;
      }

      // Initialize map if not already done
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([33.6844, 73.0479], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
        
        console.log('✅ Map initialized successfully');
      }

      // Clear existing markers
      Object.values(markersRef.current).forEach(marker => {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = {};

      // Add new markers for valid captain locations
      validLocations.forEach(location => {
        const marker = createMapMarker(location);
        if (marker) {
          markersRef.current[location.captainId] = marker;
        }
      });

      // Fit map to show all markers
      if (Object.keys(markersRef.current).length > 0) {
        const group = new L.featureGroup(Object.values(markersRef.current));
        if (group.getBounds().isValid()) {
          mapInstanceRef.current.fitBounds(group.getBounds(), {
            padding: [20, 20],
            maxZoom: 16
          });
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const createMapMarker = (location) => {
    try {
      // Create custom icon for captain
      const captainIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [30, 48],
        iconAnchor: [15, 48],
        popupAnchor: [1, -34],
        shadowSize: [48, 48]
      });

      const marker = L.marker([location.latitude, location.longitude], { 
        icon: captainIcon 
      }).addTo(mapInstanceRef.current);

      // Create detailed popup
      const studentCount = getStudentCountForCaptain(location.captainId);
      const popupContent = `
        <div style="text-align: center; min-width: 220px;">
          <strong style="font-size: 16px; color: #2563eb;">🚌 ${location.captainName || `Captain ${location.captainId}`}</strong><br/>
          <div style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px;">
            <small><strong>Route:</strong> ${selectedRoute}</small><br/>
            <small><strong>Students Onboard:</strong> ${studentCount}</small><br/>
            <small><strong>Coordinates:</strong><br/>
            Lat: ${location.latitude.toFixed(6)}<br/>
            Lng: ${location.longitude.toFixed(6)}</small>
          </div>
          <div style="color: #059669;">
            <small><strong>Last Update:</strong><br/>
            ${new Date(location.timestamp).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              month: 'short',
              day: 'numeric'
            })}</small>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        minWidth: 220
      });

      return marker;
    } catch (error) {
      console.error('Error creating marker:', error);
      return null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStudentCountForCaptain = (captainId) => {
    const session = activeSessions.find(s => s.captain_id === captainId);
    return session ? session.students_onboard || 0 : 0;
  };

  const refreshData = () => {
    if (selectedRoute) {
      handleRouteChange(selectedRoute);
    }
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
                <FaMapMarkedAlt className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Route Monitor</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Real-time GPS tracking and route monitoring</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
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
          </div>
          {/* Route Selection */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>Route Selection</h2>
              <button
                onClick={refreshData}
                disabled={loading}
                className="btn btn-primary flex items-center text-sm font-medium disabled:opacity-50"
              >
                <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Select Route to Monitor
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a route...</option>
                  {routes.map((route, index) => (
                    <option key={index} value={route.route_name}>
                      {route.route_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedRoute && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-bg-info)', borderLeft: '4px solid var(--color-primary-action)' }}>
                  <div className="flex items-center">
                    <FaMapMarkedAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                    <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>Monitoring: {selectedRoute}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Live Map</h2>
            
            <div 
              ref={mapRef}
              className="w-full rounded-lg border"
              style={{ height: '500px', backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}
            >
              {!selectedRoute && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkedAlt className="text-4xl mx-auto mb-4 icon-ui" />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Select a Route</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Choose a route from the dropdown above to view live tracking</p>
                  </div>
                </div>
              )}
              {selectedRoute && captainLocations.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FaBus className="text-4xl mx-auto mb-4 icon-ui" />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>No Active Captains</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>No captains are currently active on this route</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Route: {selectedRoute}</p>
                  </div>
                </div>
              )}
            </div>
            
            {selectedRoute && captainLocations.length > 0 && (
              <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                <div className="flex items-center justify-center space-x-8 text-sm" style={{ color: 'var(--color-text-inverse)' }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-text-inverse)' }}></div>
                    <span className="font-medium">📍 Captain Locations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaMapPin className="text-lg animate-pulse" style={{ color: 'var(--color-text-inverse)' }} />
                    <span className="font-medium">🔵 Live Tracking: {captainLocations.length} active</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Captains List */}
          {selectedRoute && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaBus className="mr-2" style={{ color: 'var(--color-primary-action)' }} /> Active Captains on {selectedRoute}
              </h2>
              
              {captainLocations.length === 0 ? (
                <div className="text-center py-12">
                  <FaBus className="text-4xl mx-auto mb-4 icon-ui" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>No Active Captains</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>No captains are currently active on this route</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {captainLocations
                    .filter(captain => 
                      captain && 
                      captain.captainId && 
                      captain.latitude && 
                      captain.longitude &&
                      !isNaN(captain.latitude) &&
                      !isNaN(captain.longitude) &&
                      captain.timestamp &&
                      new Date(captain.timestamp).getTime() > 0
                    )
                    .map((captain, index) => (
                    <div key={`${captain.captainId}-${index}`} className="rounded-lg p-6 border" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-action)' }}>
                            <FaUserCircle className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                              {captain.captainName || `Captain ${captain.captainId}`}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              ID: {captain.captainId}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center justify-end space-x-2" style={{ color: 'var(--color-text-secondary)' }}>
                              <FaClock style={{ color: 'var(--color-primary-action)' }} />
                              <span>Last seen: {formatTime(captain.timestamp)}</span>
                            </div>
                            <div className="flex items-center justify-end space-x-2" style={{ color: 'var(--color-text-secondary)' }}>
                              <FaMapPin style={{ color: 'var(--color-success)' }} />
                              <span>
                                {captain.latitude?.toFixed(4)}, {captain.longitude?.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex items-center justify-end space-x-2" style={{ color: 'var(--color-text-secondary)' }}>
                              <FaUsers style={{ color: 'var(--color-accent)' }} />
                              <span>{getStudentCountForCaptain(captain.captainId)} students onboard</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMonitor; 