import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveMap = ({ 
  center = [33.6844, 73.0479], // Default to Islamabad, Pakistan
  zoom = 13,
  locations = [],
  height = '400px',
  userType = 'student', // 'student' or 'captain'
  enableRealTimeUpdates = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      // Validate center coordinates
      const validCenter = Array.isArray(center) && 
                         center.length === 2 && 
                         !isNaN(center[0]) && 
                         !isNaN(center[1]) &&
                         center[0] >= -90 && center[0] <= 90 &&
                         center[1] >= -180 && center[1] <= 180
                         ? center 
                         : [33.6844, 73.0479]; // Default to Islamabad

      console.log('🗺️ Initializing map with center:', validCenter, 'zoom:', zoom);

      // Initialize map with better default settings
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      }).setView(validCenter, zoom);

      // Add tile layer with better attribution and fallbacks
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | VanIt GPS Tracking',
        maxZoom: 19,
        minZoom: 10,
        crossOrigin: true,
        // Add error handling
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      });

      tileLayer.on('tileerror', (error) => {
        console.warn('Tile loading error:', error);
        // Try fallback tile server
        const fallbackLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors | VanIt GPS Tracking',
          maxZoom: 19,
          minZoom: 10,
          crossOrigin: true
        });
        mapInstanceRef.current.removeLayer(tileLayer);
        fallbackLayer.addTo(mapInstanceRef.current);
      });

      tileLayer.addTo(mapInstanceRef.current);

      // Add scale control
      L.control.scale({
        position: 'bottomleft'
      }).addTo(mapInstanceRef.current);

      console.log('✅ Map initialized successfully');
      
      // Invalidate size after a small delay to ensure proper rendering
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          console.log('🔄 Map size invalidated for proper rendering');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Map initialization error:', error);
    }

    // Cleanup function
    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch (error) {
        console.error('❌ Map cleanup error:', error);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !Array.isArray(locations)) return;

    try {
      // Clear existing markers safely
      markersRef.current.forEach(marker => {
        try {
          if (mapInstanceRef.current && marker) {
            mapInstanceRef.current.removeLayer(marker);
          }
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      markersRef.current = [];

      // Add new markers with validation
      locations.forEach((location, index) => {
        try {
          if (!location || 
              typeof location.latitude !== 'number' || 
              typeof location.longitude !== 'number' ||
              isNaN(location.latitude) || 
              isNaN(location.longitude)) {
            console.warn(`Invalid location data at index ${index}:`, location);
            return;
          }

          // Validate coordinate ranges
          if (location.latitude < -90 || location.latitude > 90 || 
              location.longitude < -180 || location.longitude > 180) {
            console.warn(`Coordinates out of range at index ${index}:`, location);
            return;
          }

          // Create custom icon based on location type
          let iconOptions = {
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
          };

          // Different colors for different types
          if (location.type === 'captain') {
            iconOptions.iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
            iconOptions.iconSize = [30, 48]; // Larger for captain
          } else if (location.type === 'bus') {
            iconOptions.iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
            iconOptions.iconSize = [30, 48]; // Larger for bus
          } else if (location.type === 'stop') {
            iconOptions.iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png';
          } else {
            iconOptions.iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
          }

          const customIcon = L.icon(iconOptions);

          const marker = L.marker([location.latitude, location.longitude], { 
            icon: customIcon 
          }).addTo(mapInstanceRef.current);

          // Enhanced popup with more information
          let popupContent = `
            <div style="text-align: center; min-width: 200px;">
              <strong style="font-size: 14px; color: #2563eb;">${location.name || 'Location'}</strong><br/>
              <div style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px;">
                <small><strong>Coordinates:</strong><br/>
                Lat: ${location.latitude.toFixed(6)}<br/>
                Lng: ${location.longitude.toFixed(6)}</small>
              </div>
          `;

          if (location.timestamp) {
            const updateTime = new Date(location.timestamp).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              month: 'short',
              day: 'numeric'
            });
            popupContent += `<div style="color: #059669;"><small><strong>Last Update:</strong><br/>${updateTime}</small></div>`;
          }

          if (location.accuracy) {
            const accuracyClass = location.accuracy < 50 ? '#10b981' : location.accuracy < 100 ? '#f59e0b' : '#ef4444';
            popupContent += `<div style="color: ${accuracyClass};"><small><strong>Accuracy:</strong> ±${Math.round(location.accuracy)}m</small></div>`;
          }

          if (location.type === 'captain' && userType === 'student') {
            popupContent += `<div style="margin-top: 8px; padding: 4px; background: #dbeafe; border-radius: 4px;"><small style="color: #1d4ed8;"><strong>🚌 Your Bus Captain</strong></small></div>`;
          }

          popupContent += '</div>';

          marker.bindPopup(popupContent, {
            maxWidth: 250,
            minWidth: 200
          });

          // Add click event for detailed view
          marker.on('click', () => {
            console.log('Marker clicked:', location);
            setLastUpdate(new Date().toISOString());
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.error(`Error adding marker at index ${index}:`, error);
        }
      });

      // Auto-fit map to show all markers if there are any
      if (markersRef.current.length > 0) {
        try {
          const group = new L.featureGroup(markersRef.current);
          const bounds = group.getBounds();
          
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, {
              padding: [20, 20],
              maxZoom: 16
            });
          }
        } catch (error) {
          console.warn('Error fitting map bounds:', error);
        }
      }

      // Update last update time
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Error updating map markers:', error);
    }
  }, [locations, userType]);

  useEffect(() => {
    if (mapInstanceRef.current && center) {
      // Validate center coordinates before setting view
      const validCenter = Array.isArray(center) && 
                         center.length === 2 && 
                         !isNaN(center[0]) && 
                         !isNaN(center[1]) &&
                         center[0] >= -90 && center[0] <= 90 &&
                         center[1] >= -180 && center[1] <= 180
                         ? center 
                         : [33.6844, 73.0479]; // Default fallback

      console.log('🗺️ Updating map center to:', validCenter);
      mapInstanceRef.current.setView(validCenter, zoom);
    }
  }, [center, zoom]);

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    return new Date(lastUpdate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      try {
        // Clear markers safely
        if (markersRef.current) {
          markersRef.current.forEach(marker => {
            try {
              if (mapInstanceRef.current && marker) {
                mapInstanceRef.current.removeLayer(marker);
              }
            } catch (error) {
              console.warn('Error removing marker during cleanup:', error);
            }
          });
          markersRef.current = [];
        }

        // Remove map instance safely
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          } catch (error) {
            console.warn('Error removing map during cleanup:', error);
          }
        }
      } catch (error) {
        console.error('Error during LiveMap cleanup:', error);
      }
    };
  }, []);

  return (
    <div className="w-full relative">
      <div 
        ref={mapRef} 
        style={{ 
          height: height, 
          width: '100%', 
          minHeight: '300px',
          position: 'relative',
          zIndex: 1
        }}
        className="rounded-lg border-2 border-gray-300 shadow-lg"
      />
      
      {/* Enhanced Map Legend */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg text-xs border">
        <div className="space-y-2">
          <div className="font-semibold text-gray-800 border-b pb-1">Map Legend</div>
          {userType === 'student' && (
            <>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span>Captain Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                <span>Bus Stops</span>
              </div>
            </>
          )}
          {userType === 'captain' && (
            <>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                <span>Route Stops</span>
              </div>
            </>
          )}
          {enableRealTimeUpdates && (
            <div className="pt-1 border-t text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Live Updates</span>
              </div>
              <div className="text-xs mt-1">Last: {formatLastUpdate()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-lg shadow-lg">
        <div className="flex space-x-1 p-2">
          <button 
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            title="Zoom Out"
          >
            -
          </button>
          {markersRef.current.length > 0 && (
            <button 
              onClick={() => {
                const group = new L.featureGroup(markersRef.current);
                const bounds = group.getBounds();
                if (bounds.isValid()) {
                  mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
                }
              }}
              className="w-8 h-8 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
              title="Fit All Markers"
            >
              ⌂
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map data...</p>
            <p className="text-gray-500 text-xs mt-1">
              {userType === 'student' ? 'Waiting for captain location...' : 'Start tracking to see your location'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
