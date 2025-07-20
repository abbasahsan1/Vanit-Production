import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaEdit, 
  FaPlus, 
  FaTrash, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaUser, 
  FaArrowLeft,
  FaRoute,
  FaSave
} from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const EditRoute = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ✅ Fetch Routes from API
  useEffect(() => {
    const fetchRoutes = async () => {
        try {
            setLoading(true);
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
                    route_id: routeName,
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
        } finally {
            setLoading(false);
        }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    document.title = "Edit Route – Admin Panel";
  }, []);


  // ✅ Handle Selecting a Route to Edit
  const handleSelectRoute = (route) => {
    console.log("✅ Selected Route:", route);
    
    if (!route || !route.route_name) {
        alert("❌ Invalid Route Selection.");
        return;
    }

    setSelectedRoute(route.route_name);
    setRouteName(route.route_name); 
    setStops(route.stops.map((stop) => typeof stop === 'object' ? stop.stop_name : stop)); 
  };

  // ✅ Add new stop field
  const addStopField = () => {
    setStops([...stops, ""]);
  };

  // ✅ Remove stop field
  const removeStopField = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };



  // ✅ Handle Updating Stops
  const handleStopChange = (index, value) => {
    const updatedStops = [...stops];
    updatedStops[index] = value;
    setStops(updatedStops);
  };

  // ✅ Handle Submitting the Updated Route
  const handleUpdateRoute = async () => {
    if (!selectedRoute || !routeName.trim()) {
        alert("❌ Please select a route and enter a valid name.");
        return;
    }

    // Validate stops
    const validStops = stops.filter(stop => stop.trim() !== "");
    if (validStops.length === 0) {
        alert("❌ Please add at least one stop.");
        return;
    }

    try {
        console.log(`🚀 Updating Route: ${selectedRoute} → ${routeName}`);
        console.log("🔹 Stops:", validStops);

        // ✅ Ensure `route_name` matches the backend
        const formattedStops = validStops.map(stop => ({ stop_name: stop }));

        const response = await axios.put(`http://localhost:5000/api/routes/${encodeURIComponent(selectedRoute)}`, {
            new_route_name: routeName.trim(), // ✅ Change `route_name` to `new_route_name`
            stops: formattedStops,
        });

        console.log("✅ API Response:", response.data);
        alert(`✅ Route "${selectedRoute}" updated successfully to "${routeName}" with ${validStops.length} stops!`);
        
        // Reset form
        setSelectedRoute(null);
        setRouteName("");
        setStops([]);
        
        navigate("/routes"); 
    } catch (error) {
        console.error("❌ Error updating route:", error.response?.data || error);
        if (error.response?.data?.error) {
            alert(`❌ Failed to update route: ${error.response.data.error}`);
        } else {
            alert("❌ Failed to update route! Please try again.");
        }
    }
};



  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mr-4">
                <FaRoute className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Route</h1>
                <p className="text-gray-600">Update route information and stops</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading routes...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select Route */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Route to Edit
                  </label>
                  <select 
                    onChange={(e) => handleSelectRoute(routes.find(route => route.route_id == e.target.value))} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a route to edit</option>
                    {routes.map((route) => (
                      <option key={route.route_id} value={route.route_id}>
                        {route.route_name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoute && (
                  <>
                    {/* Route Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Route Name
                      </label>
                      <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Enter route name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Stops */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Route Stops
                        </label>
                        <button
                          type="button"
                          onClick={addStopField}
                          className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FaPlus className="mr-2" /> Add Stop
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {stops.map((stop, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              value={stop}
                              onChange={(e) => handleStopChange(index, e.target.value)}
                              placeholder={`Stop ${index + 1} name`}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {stops.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStopField(index)}
                                className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Update Button */}
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={handleUpdateRoute}
                        disabled={!routeName.trim() || stops.filter(s => s.trim()).length === 0}
                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaSave className="mr-2" />
                        Update Route
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoute;
