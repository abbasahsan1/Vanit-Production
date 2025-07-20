import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaMapMarkedAlt, FaPlus, FaTrash, FaEdit, FaHome, FaUser, FaSignOutAlt } from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]); // Default to an empty array
  const navigate = useNavigate();


  // Set page title
  useEffect(() => {
    document.title = "Route Management – Admin Panel";
  }, []);

  // Fetch routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/routes");
        console.log("✅ Routes API Response:", response.data);

        // Handle the correct API response format: { routes: [...] }
        if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
          // API returns { routes: [{ route_id, route_name, stops: [...] }] }
          console.log("✅ Using routes array format");
          setRoutes(response.data.routes);
        } else if (typeof response.data === "object" && response.data !== null) {
          // Fallback: Convert object data into array format (for student routes API)
          console.log("✅ Converting object to array format");
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || [], // ✅ Ensure stops always exist
          }));
          setRoutes(formattedRoutes);
        } else {
          console.log("⚠️ No routes data found, setting empty array");
          setRoutes([]);
        }
      } catch (error) {
        console.error("❌ Error fetching routes:", error);
        setRoutes([]);
      }
    };

    fetchRoutes();
  }, []);



  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* ✅ Routes Management Section */}
      <div className="p-10">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
              <FaMapMarkedAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} /> Routes Management
            </h1>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Link 
                to="/create-route" 
                className="btn btn-success flex items-center text-sm font-medium"
              >
                <FaPlus className="mr-2" /> Add Route
              </Link>
              <Link 
                to="/edit-route" 
                className="btn btn-primary flex items-center text-sm font-medium"
              >
                <FaEdit className="mr-2" /> Edit Route
              </Link>
              <Link 
                to="/delete-route" 
                className="px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-danger)'}
              >
                <FaTrash className="mr-2" /> Delete Route
              </Link>
            </div>
          </div>

          {/* ✅ Handle Empty Routes Case */}
          {routes.length === 0 ? (
            <div className="text-center py-8">
              <FaMapMarkedAlt className="mx-auto text-4xl mb-4 icon-ui" />
              <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>No routes added yet.</p>
              <Link 
                to="/create-route" 
                className="btn btn-primary inline-flex items-center font-medium px-6 py-3"
              >
                <FaPlus className="mr-2" /> Create Your First Route
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route, index) => (
                <div key={index} className="card-info p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>{route.route_name}</h2>
                    <div className="flex space-x-2">
                      <Link 
                        to="/edit-route" 
                        state={{ routeName: route.route_name }}
                        className="transition-colors"
                        style={{ color: 'var(--color-text-inverse)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--color-warning)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--color-text-inverse)'}
                      >
                        <FaEdit className="text-sm" />
                      </Link>
                    </div>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-inverse)' }}>
                    <strong>Stops ({route.stops.length}):</strong>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-inverse)' }}>
                    {route.stops.length > 0 
                      ? route.stops.map(stop => stop.stop_name).join(" → ") 
                      : "No stops added"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
