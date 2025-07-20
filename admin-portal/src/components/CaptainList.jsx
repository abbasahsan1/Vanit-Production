import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UnifiedNavbar from "./UnifiedNavbar";
import {
  FaUser,
  FaHome,
  FaList,
  FaSignOutAlt,
  FaPlus,
  FaEdit,
  FaCaretDown,
} from "react-icons/fa";

const CaptainList = () => {
  const [captains, setCaptains] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Captain Management – Admin Panel";
  }, []);

  // ✅ Fetch Captains from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if admin token exists
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          console.error('❌ No admin token found');
          navigate('/');
          return;
        }

        console.log('🔄 Fetching captains and routes...');
        
        // Fetch captains
        const captainsResponse = await axios.get("http://localhost:5000/api/admin/captains");
        console.log("✅ Captains API Response:", captainsResponse.data);
        
        if (captainsResponse.data.success && Array.isArray(captainsResponse.data.data)) {
          setCaptains(captainsResponse.data.data);
        } else {
          console.error("❌ Unexpected captains response format:", captainsResponse.data);
          setCaptains([]);
        }

        // Fetch routes
        const routesResponse = await axios.get("http://localhost:5000/api/routes/all");
        console.log("✅ Routes API Response:", routesResponse.data);
        
        if (Array.isArray(routesResponse.data)) {
          setRoutes(routesResponse.data);
        } else {
          console.error("❌ Unexpected routes response format:", routesResponse.data);
          setRoutes([]);
        }
        
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setError(`Failed to load data: ${error.response?.data?.message || error.message}`);
        
        // If unauthorized, redirect to login
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('adminToken');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
  }, []);



  const handleAssignRoute = async (captainPhone, routeName) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/');
        return;
      }
      
      console.log(`🔄 Assigning route "${routeName}" to captain ${captainPhone}`);
      
      await axios.put("http://localhost:5000/api/admin/assign-route", {
        phone: captainPhone,
        routeName,
      });
      
      console.log("✅ Route assigned successfully");
      alert("✅ Route assigned successfully");
      window.location.reload();
    } catch (err) {
      console.error("❌ Error assigning route:", err);
      alert(`❌ Failed to assign route: ${err.response?.data?.message || err.message}`);
    }
  };
  
  
  

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* ✅ Captain List Table */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Captain Management</h1>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Total Captains: {captains.length}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 mr-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <span className="font-medium text-lg" style={{ color: 'var(--color-text-body)' }}>Loading captains...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4" style={{ color: 'var(--color-danger)' }}>⚠️</div>
                <p className="text-lg mb-6 font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : captains.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 icon-ui">🚌</div>
                <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>No captains found.</p>
                <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Captains will appear here once they register.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Name</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Phone</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Email</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Assigned Route</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-standard)' }}>
                    {captains.map((captain, index) => (
                      <tr key={index} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                        <td className="p-4">
                          <div className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{`${captain.first_name} ${captain.last_name}`}</div>
                        </td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{captain.phone}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{captain.email}</td>
                        <td className="p-4">
                          <select
                            value={captain.route_name || ""}
                            onChange={(e) => handleAssignRoute(captain.phone, e.target.value)}
                            className="input w-full font-medium"
                          >
                            <option value="">Assign Route</option>
                            {routes.map((route) => (
                              <option key={route.id} value={route.route_name}>
                                {route.route_name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainList;
