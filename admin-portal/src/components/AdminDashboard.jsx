import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaUserTie, 
  FaMapMarkedAlt, 
  FaHeadset, 
  FaMapPin, 
  FaUserCircle, 
  FaExclamationTriangle,
  FaSatellite,
  FaQrcode,
  FaSignOutAlt,
  FaUser,
  FaChartBar,
  FaCog,
  FaCommentDots,
  FaMoneyBill,
  FaCheckCircle
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";
import UnifiedNavbar from "./UnifiedNavbar";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalBuses: 0,
    totalCaptains: 0,
    totalRoutes: 0,
    activeBuses: 0,
    activeCaptains: 0,
    activeRoutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);


  // Set page title
  useEffect(() => {
    document.title = "Dashboard – Admin Panel";
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join admin room for real-time updates
    newSocket.emit('join_admin_room');

    // Listen for emergency alerts
    newSocket.on('emergency_alert', (alert) => {
      console.log('🚨 Emergency alert received:', alert);
      setEmergencyAlerts(prev => [alert, ...prev.slice(0, 4)]);
    });

    // Listen for system updates
    newSocket.on('system_update', (update) => {
      console.log('📊 System update received:', update);
      fetchDashboardStats();
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
    fetchEmergencyAlerts();
    
    // Set up periodic refresh
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel for better performance
      const [busesRes, captainsRes, routesRes, activeCaptainsRes, activeSessionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/buses/count'),
        axios.get('http://localhost:5000/api/admin/captains'),
        axios.get('http://localhost:5000/api/admin/routes/all'),
        axios.get('http://localhost:5000/api/admin/captains/active'),
        axios.get('http://localhost:5000/api/attendance/active-sessions')
      ]);

      // Calculate active routes from active sessions
      const activeSessions = activeSessionsRes.data.success ? activeSessionsRes.data.data : [];
      const activeRoutes = [...new Set(activeSessions.map(session => session.route_name))].length;

      const stats = {
        totalBuses: busesRes.data.count || 0,
        totalCaptains: captainsRes.data.data ? captainsRes.data.data.length : 0,
        totalRoutes: Array.isArray(routesRes.data) ? routesRes.data.length : 0,
        activeBuses: activeSessions.length, // Active buses = active sessions
        activeCaptains: activeCaptainsRes.data.data ? activeCaptainsRes.data.data.length : 0,
        activeRoutes: activeRoutes
      };

      setDashboardStats(stats);
      
      console.log('📊 Dashboard stats updated:', stats);
      
    } catch (error) {
      console.error("❌ Error fetching dashboard stats:", error);
      // Set fallback values
      setDashboardStats({
        totalBuses: 0,
        totalCaptains: 0,
        totalRoutes: 0,
        activeBuses: 0,
        activeCaptains: 0,
        activeRoutes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Emergency Alerts from Backend
  const fetchEmergencyAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/emergency-alerts');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Get latest 5 alerts and sort by timestamp (newest first)
        const sortedAlerts = response.data.data
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setEmergencyAlerts(sortedAlerts);
        console.log('🚨 Emergency alerts loaded:', sortedAlerts.length);
      }
    } catch (error) {
      console.error('❌ Error fetching emergency alerts:', error);
      setEmergencyAlerts([]);
    }
  };



  const getAlertTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getAlertIcon = (status) => {
    switch (status) {
      case 'pending': return <FaExclamationTriangle className="icon-alert" />;
      case 'acknowledged': return <FaUserCircle className="icon-ui" />;
      case 'resolved': return <FaCheckCircle className="text-green-600" />;
      default: return <FaExclamationTriangle className="icon-alert" />;
    }
  };

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* 🚨 Emergency Alerts Popup */}
      {emergencyAlerts.length > 0 && (
        <div className="fixed top-10 right-10 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <h2 className="text-lg font-bold flex items-center mb-3">
            <FaExclamationTriangle className="mr-2" /> Emergency Alerts ({emergencyAlerts.length})
          </h2>
          {emergencyAlerts.slice(0, 3).map((alert, index) => (
            <div key={index} className="mt-2 p-2 bg-red-500 rounded">
              <p><strong>Name:</strong> {alert.first_name} {alert.last_name}</p>
              <p><strong>Type:</strong> {alert.user_type}</p>
              <p><strong>Route:</strong> {alert.route_name}</p>
              <p><strong>Priority:</strong> {alert.priority_level?.toUpperCase()}</p>
              <button 
                className="bg-gray-800 text-white px-2 py-1 rounded mt-2 mr-2 hover:bg-gray-700 transition-colors"
                onClick={() => removeAlert(index)}
              >
                Dismiss
              </button>
            </div>
          ))}
          {emergencyAlerts.length > 3 && (
            <p className="text-sm text-red-200 mt-2">... and {emergencyAlerts.length - 3} more alerts</p>
          )}
          <div className="mt-3 pt-3 border-t border-red-400">
            <Link 
              to="/emergency-management"
              className="block w-full text-center bg-white text-red-600 px-3 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
            >
              Manage All Alerts
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-heading)' }}>System Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* Total Buses */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Buses</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
                      {loading ? '...' : dashboardStats.totalBuses}
                    </p>
                  </div>
                  <FaBus className="text-xl icon-ui" />
                </div>
              </div>

              {/* Total Captains */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Captains</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
                      {loading ? '...' : dashboardStats.totalCaptains}
                    </p>
                  </div>
                  <FaUserTie className="text-xl icon-ui" />
                </div>
              </div>

              {/* Total Routes */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Routes</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
                      {loading ? '...' : dashboardStats.totalRoutes}
                    </p>
                  </div>
                  <FaMapMarkedAlt className="text-xl icon-ui" />
                </div>
              </div>

              {/* Active Buses */}
              <div className="card-info p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active Buses</p>
                    <p className="text-2xl font-bold card-value">
                      {loading ? '...' : dashboardStats.activeBuses}
                    </p>
                  </div>
                  <FaBus className="text-xl icon-inverse" />
                </div>
              </div>

              {/* Active Captains */}
              <div className="card-emphasis p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active Captains</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : dashboardStats.activeCaptains}
                    </p>
                  </div>
                  <FaUserTie className="text-xl icon-inverse" />
                </div>
              </div>

              {/* Active Routes */}
              <div className="card-danger p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active Routes</p>
                    <p className="text-2xl font-bold">
                      {loading ? '...' : dashboardStats.activeRoutes}
                    </p>
                  </div>
                  <FaMapPin className="text-xl icon-inverse" />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Features Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-heading)' }}>Management Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Routes Management */}
              <Link to="/routes" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaMapMarkedAlt className="text-2xl icon-emphasis" />
                  <FaMapPin className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>🚌 Routes Management</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Add, edit, and delete bus routes and stops</p>
              </Link>

              {/* Route Monitor */}
              <Link to="/route-monitor" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaSatellite className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                  <FaMapMarkedAlt className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Route Monitor</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Real-time GPS tracking and route management</p>
              </Link>

              {/* Student Feedbacks */}
              <Link to="/feedback-management" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaHeadset className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                  <FaCommentDots className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Feedback Management</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>View and manage student and captain feedback</p>
              </Link>

              {/* Attendance / QR */}
              <Link to="/attendance-management" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaQrcode className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                  <FaChartBar className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Attendance / QR</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>QR codes and attendance reports</p>
              </Link>

              {/* Emergency Management */}
              <Link to="/emergency-management" className="card-danger p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaExclamationTriangle className="text-2xl icon-inverse" />
                  <FaCog className="text-lg icon-inverse" />
                </div>
                <h3 className="text-lg font-semibold mb-2">🚨 Emergency Management</h3>
                <p className="text-sm">Monitor and respond to SOS alerts</p>
              </Link>

              {/* Captain Management */}
              <Link to="/captain-list" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaUserTie className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                  <FaUser className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Captain Management</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage captain accounts and assignments</p>
              </Link>

              {/* Student Management */}
              <Link to="/student-list" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaUser className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                  <FaUserCircle className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Student Management</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage student accounts and routes</p>
              </Link>

              {/* Invoice Management */}
              <Link to="/invoice-management" className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <FaMoneyBill className="text-2xl icon-emphasis" />
                  <FaChartBar className="text-lg icon-ui" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Invoice Management</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage route fees, invoices, and payments</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
