import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaHome, FaPlus, FaEdit, FaUserCircle, FaMapMarkedAlt, FaExclamationTriangle } from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const DeleteRoute = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch Routes and Transform API Response
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/routes");
        console.log("✅ Routes API Response:", response.data);

        // Handle the correct API response format: { routes: [...] }
        if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
          console.log("✅ Using routes array format");
          setRoutes(response.data.routes);
        } else if (typeof response.data === "object" && response.data !== null) {
          // Fallback: Convert object data into array format
          console.log("✅ Converting object to array format");
          const formattedRoutes = Object.keys(response.data).map(routeName => ({
            route_name: routeName,
            stops: response.data[routeName] || []
          }));
          setRoutes(formattedRoutes);
        } else {
          console.error("❌ Unexpected API response format:", response.data);
          setRoutes([]);
        }
      } catch (error) {
        console.error("❌ Error fetching routes:", error);
        setRoutes([]);
      }
    };

    fetchRoutes();
  }, []);

  // ✅ Handle Route Deletion
  const handleDelete = async (route_name) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete "${route_name}"?\n\nThis action cannot be undone and will affect all students and captains assigned to this route.`)) return;

    setLoading(true);
    try {
      console.log(`🗑️ Attempting to delete route: ${route_name}`);
      const response = await axios.delete(`http://localhost:5000/api/routes/${encodeURIComponent(route_name)}`);
      console.log(`✅ Delete response:`, response.data);
      
      setRoutes(routes.filter(route => route.route_name !== route_name));
      alert(`✅ "${route_name}" deleted successfully!`);
    } catch (error) {
      console.error("❌ Error deleting route:", error);
      console.error("❌ Error details:", error.response?.data);
      alert(`❌ Failed to delete route: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Delete Routes Section */}
      <div className="p-10">
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <FaExclamationTriangle className="text-2xl mr-3" style={{ color: 'var(--color-danger)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>Delete Routes</h1>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Deleting a route will permanently remove it from the system and affect all students and captains assigned to this route.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600">Deleting route...</p>
            </div>
          )}

          {routes.length === 0 ? (
            <div className="text-center py-8">
              <FaMapMarkedAlt className="mx-auto text-gray-400 text-4xl mb-4" />
              <p className="text-gray-500 text-lg">No routes available to delete.</p>
              <Link 
                to="/create-route" 
                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center font-medium"
              >
                <FaPlus className="mr-2" /> Create a Route
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{route.route_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Stops ({route.stops.length}):</strong>
                      </p>
                      <p className="text-sm text-gray-500">
                        {route.stops.length > 0 
                          ? route.stops.map(stop => typeof stop === 'object' ? stop.stop_name : stop).join(" → ")
                          : "No stops added"}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(route.route_name)}
                    disabled={loading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <FaTrash className="mr-2" /> Delete Route
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteRoute;
