import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTimes, FaPlus, FaTrash, FaRoute, FaMapPin, FaArrowLeft } from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const CreateRoute = () => {
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState([""]); // Array of stops
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Add a new empty stop input field
  const addStopField = () => {
    setStops([...stops, ""]);
  };

  // Remove a stop field
  const removeStopField = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Handle change in stop fields
  const handleStopChange = (index, value) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  // Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!routeName.trim()) {
      alert("❌ Please enter a route name.");
      return;
    }

    const validStops = stops.filter(stop => stop.trim() !== "");
    if (validStops.length === 0) {
      alert("❌ Please add at least one stop.");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("🚀 Creating route:", { route_name: routeName, stops: validStops });
      
      const response = await axios.post("http://localhost:5000/api/routes", {
        route_name: routeName.trim(),
        stops: validStops,
      });

      console.log("✅ Route creation response:", response.data);
      alert(`✅ Route "${routeName}" added successfully with ${validStops.length} stops!`);
      
      // Reset form
      setRouteName("");
      setStops([""]);
      
      // Redirect to Routes Page
      navigate("/routes");
    } catch (error) {
      console.error("❌ Error adding route:", error);
      if (error.response?.data?.error) {
        alert(`❌ Failed to add route: ${error.response.data.error}`);
      } else {
        alert("❌ Failed to add route. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'var(--color-primary-action)', color: 'var(--color-text-inverse)' }}>
                  <FaRoute className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>Create New Route</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Add a new bus route with multiple stops</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/routes")}
                className="btn btn-secondary flex items-center"
              >
                <FaArrowLeft className="mr-2" /> Back to Routes
              </button>
            </div>
          </div>

          {/* Route Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>Route Information</h2>
            </div>
            <div className="card-content p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Route Name Section */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Route Name *
                  </label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Enter route name (e.g., University to City Center)"
                    required
                    className="input w-full"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Choose a descriptive name that clearly identifies the route
                  </p>
                </div>

                {/* Stops Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-body)' }}>
                        Route Stops *
                      </label>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Add stops in the order they will be visited
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addStopField}
                      className="btn btn-success flex items-center"
                      disabled={isSubmitting}
                    >
                      <FaPlus className="mr-2" /> Add Stop
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {stops.map((stop, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: 'var(--color-info)', color: 'var(--color-text-inverse)' }}>
                          {index + 1}
                        </div>
                        <div className="relative flex-1">
                          <FaMapPin className="input-icon" />
                          <input
                            type="text"
                            value={stop}
                            onChange={(e) => handleStopChange(index, e.target.value)}
                            placeholder={`Stop ${index + 1} name`}
                            required
                            className="input pl-10 w-full"
                            disabled={isSubmitting}
                          />
                        </div>
                        {stops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStopField(index)}
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ 
                              backgroundColor: 'var(--color-danger)', 
                              color: 'var(--color-text-inverse)' 
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                            disabled={isSubmitting}
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Section */}
                <div className="border-t pt-6" style={{ borderColor: 'var(--color-border-standard)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-body)' }}>
                        Ready to create route?
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Route will be available for captain assignment immediately
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate("/routes")}
                        className="btn btn-secondary"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary flex items-center"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <FaRoute className="mr-2" />
                            Create Route
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Help Section */}
          <div className="card p-4 mt-6" style={{ backgroundColor: 'var(--color-bg-info)', border: '1px solid var(--color-info)' }}>
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: 'var(--color-info)', color: 'var(--color-text-inverse)' }}>
                <span className="text-xs font-bold">?</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>Tips for Creating Routes</h3>
                <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-body)' }}>
                  <li>• Use clear, recognizable landmark names for stops</li>
                  <li>• List stops in the actual order of travel</li>
                  <li>• Include both pickup and drop-off locations</li>
                  <li>• Consider traffic patterns when ordering stops</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoute;
