import React, { useState, useEffect } from 'react';
import {
  FaExclamationTriangle,
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaRoute,
  FaPhone,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaFilter,
  FaDownload,
  FaSync,
  FaHome,
  FaBell,
  FaUserCircle,
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaArrowLeft,
  FaSignOutAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import UnifiedNavbar from './UnifiedNavbar';

const EmergencyManager = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Filters and search
  const [filters, setFilters] = useState({
    status: 'all',
    userType: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    initializeData();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    document.title = "Emergency Management – Admin Panel";
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [alerts, filters, searchTerm, sortConfig]);

  const setupWebSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('✅ Emergency Manager WebSocket connected');
      newSocket.emit('subscribe_admin');
    });

    newSocket.on('emergency_alert', (data) => {
      console.log('🚨 New emergency alert received:', data);
      
      // Check if alert already exists to prevent duplicates
      setAlerts(prevAlerts => {
        const exists = prevAlerts.some(alert => alert.id === data.data.id);
        if (exists) {
          console.log('⚠️ Duplicate alert detected, skipping:', data.data.id);
          return prevAlerts;
        }
        return [data.data, ...prevAlerts];
      });
      
      fetchStats(); // Refresh stats
      showNotification(`New ${data.data.priority_level} priority alert from ${data.data.first_name} ${data.data.last_name}`, 'error');
    });

    newSocket.on('emergency_acknowledged', (data) => {
      console.log('✅ Alert acknowledged:', data);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === data.data.id ? data.data : alert
        )
      );
      fetchStats();
      showNotification(`Alert #${data.data.id} acknowledged by ${data.acknowledged_by}`, 'success');
    });

    newSocket.on('emergency_resolved', (data) => {
      console.log('✅ Alert resolved:', data);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === data.data.id ? data.data : alert
        )
      );
      fetchStats();
      showNotification(`Alert #${data.data.id} resolved by ${data.resolved_by}`, 'success');
    });

    setSocket(newSocket);
  };

  const initializeData = async () => {
    setLoading(true);
    try {
    await Promise.all([fetchAlerts(), fetchStats()]);
    } catch (error) {
      console.error('Error initializing data:', error);
      showNotification('Failed to initialize emergency data', 'error');
    } finally {
    setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency/admin/alerts?limit=100');
      if (response.data.success) {
        setAlerts(response.data.data || []);
        console.log('✅ Fetched alerts:', response.data.data?.length || 0);
      } else {
        console.error('❌ Failed to fetch alerts:', response.data);
        setAlerts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      showNotification('Failed to fetch emergency alerts', 'error');
      setAlerts([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency/admin/stats');
      if (response.data.success) {
        setStats(response.data.data || {});
      } else {
        console.error('❌ Failed to fetch stats:', response.data);
        setStats({});
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setStats({});
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...alerts];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }

    // Apply user type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(alert => alert.user_type === filters.userType);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(alert => alert.priority_level === filters.priority);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(alert => new Date(alert.timestamp) >= filterDate);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.first_name?.toLowerCase().includes(term) ||
        alert.last_name?.toLowerCase().includes(term) ||
        alert.phone?.includes(term) ||
        alert.route_name?.toLowerCase().includes(term) ||
        alert.emergency_type?.toLowerCase().includes(term) ||
        (alert.registration_number && alert.registration_number.toLowerCase().includes(term)) ||
        (alert.message && alert.message.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAlerts(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAcknowledge = async (alertId) => {
    if (!alertId) {
      console.error('❌ Alert ID is required for acknowledgment');
      showNotification('Invalid alert ID', 'error');
      return;
    }

    try {
    setAcknowledging(true);
      console.log('🔄 Acknowledging alert:', alertId);
      
      const response = await axios.put(`http://localhost:5000/api/emergency/admin/acknowledge/${alertId}`, {
        acknowledged_by: 'Admin',
        notes: 'Alert acknowledged by administrator'
      });

      if (response.data.success) {
        console.log('✅ Alert acknowledged successfully');
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === alertId 
              ? { 
                  ...alert, 
                  status: 'acknowledged',
                  acknowledged_at: new Date().toISOString(),
                  acknowledged_by: 'Admin'
                } 
              : alert
          )
        );
        showNotification('Alert acknowledged successfully', 'success');
        
        // Close modal if open
        if (showDetailModal && selectedAlert && selectedAlert.id === alertId) {
        setShowDetailModal(false);
          setSelectedAlert(null);
          setResolutionNotes('');
        }
      } else {
        throw new Error(response.data.error || 'Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      showNotification(`Failed to acknowledge alert: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleResolve = async (alertId) => {
    if (!alertId) {
      console.error('❌ Alert ID is required for resolution');
      showNotification('Invalid alert ID', 'error');
      return;
    }

    try {
    setResolving(true);
      console.log('🔄 Resolving alert:', alertId);
      
      const response = await axios.put(`http://localhost:5000/api/emergency/admin/resolve/${alertId}`, {
        resolved_by: 'Admin',
        resolution_notes: resolutionNotes || 'Alert resolved by administrator'
      });

      if (response.data.success) {
        console.log('✅ Alert resolved successfully');
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert.id === alertId 
              ? { 
                  ...alert, 
                  status: 'resolved',
                  resolved_at: new Date().toISOString(),
                  resolved_by: 'Admin',
                  resolution_notes: resolutionNotes || 'Alert resolved by administrator'
                } 
              : alert
          )
        );
        showNotification('Alert resolved successfully', 'success');
        
        // Reset resolution notes
        setResolutionNotes('');
        
        // Close modal if open
        if (showDetailModal && selectedAlert && selectedAlert.id === alertId) {
        setShowDetailModal(false);
          setSelectedAlert(null);
        }
      } else {
        throw new Error(response.data.error || 'Failed to resolve alert');
      }
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      showNotification(`Failed to resolve alert: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setResolving(false);
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white shadow-lg transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Priority', 'Status', 'Route', 'Message', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredAlerts.map(alert => [
        alert.id,
        `"${alert.first_name} ${alert.last_name}"`,
        alert.user_type,
        alert.priority_level,
        alert.status,
        `"${alert.route_name}"`,
        `"${alert.message || ''}"`,
        formatDateTime(alert.timestamp)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-heading)' }}>Emergency Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-danger p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium">Total Alerts</p>
                    <p className="text-2xl font-bold">{stats.total_alerts || 0}</p>
              </div>
                  <FaExclamationTriangle className="text-xl" />
            </div>
          </div>

              <div className="card-emphasis p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending_alerts || 0}</p>
              </div>
                  <FaClock className="text-xl" />
            </div>
          </div>

              <div className="card-info p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium">Acknowledged</p>
                    <p className="text-2xl font-bold card-value">{stats.acknowledged_alerts || 0}</p>
              </div>
                  <FaCheckCircle className="text-xl icon-inverse" />
            </div>
          </div>

              <div className="card-success p-6">
            <div className="flex items-center justify-between">
              <div>
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-2xl font-bold">{stats.resolved_alerts || 0}</p>
              </div>
                  <FaTimesCircle className="text-xl" />
                </div>
            </div>
          </div>
        </div>

          {/* Filters and Search */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>Emergency Alerts</h2>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <FaSearch className="input-icon" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                  />
                </div>
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <FaDownload className="mr-2" />
                  Export CSV
                </button>
                
                <button
                  onClick={() => {
                    fetchAlerts();
                    fetchStats();
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <FaSync className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={filters.userType}
                onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="captain">Captains</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
          </div>
        </div>

        {/* Alerts Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading emergency alerts...</p>
          </div>
            ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center">
                <FaExclamationTriangle className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Found</h3>
                <p className="text-gray-600">No emergency alerts match the current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alert Details
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Info
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                    </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <FaExclamationTriangle className="text-red-600 text-sm" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {alert.emergency_type}
                              </div>
                              <div className="text-sm text-gray-500">
                                {alert.route_name}
                              </div>
                              {alert.message && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {alert.message.length > 50 ? `${alert.message.substring(0, 50)}...` : alert.message}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {alert.first_name} {alert.last_name}
                            </div>
                            <div className="text-gray-500">{alert.user_type}</div>
                            {alert.registration_number && (
                              <div className="text-xs text-gray-400">
                                {alert.registration_number}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(alert.priority_level)}`}>
                            {alert.priority_level.toUpperCase()}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(alert.timestamp)}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(alert);
                                setResolutionNotes('');
                                setShowDetailModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              title="View Details"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            
                            {alert.status === 'pending' && (
                              <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledge(alert.id);
                                }}
                                disabled={acknowledging}
                                  className="text-yellow-600 hover:text-yellow-700 transition-colors disabled:opacity-50"
                                  title="Acknowledge"
                              >
                                  <FaCheckCircle className="text-sm" />
                              </button>
                                
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAlert(alert);
                                    setResolutionNotes('');
                                    setShowDetailModal(true);
                                  }}
                                disabled={resolving}
                                  className="text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                                  title="Resolve"
                              >
                                  <FaTimesCircle className="text-sm" />
                              </button>
                              </>
                            )}
                          </div>
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

      {/* Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false);
              setSelectedAlert(null);
              setResolutionNotes('');
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Alert Details</h2>
                  <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAlert(null);
                    setResolutionNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                  <FaTimes className="text-xl" />
                  </button>
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="text-gray-900">{selectedAlert.first_name} {selectedAlert.last_name}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">User Type</h3>
                    <p className="text-gray-900">{selectedAlert.user_type}</p>
                    </div>
                      <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="text-gray-900">{selectedAlert.phone}</p>
                      </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">Route</h3>
                    <p className="text-gray-900">{selectedAlert.route_name}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">Emergency Type</h3>
                    <p className="text-gray-900">{selectedAlert.emergency_type}</p>
                    </div>
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedAlert.priority_level)}`}>
                      {selectedAlert.priority_level.toUpperCase()}
                    </span>
                    </div>
                    </div>
                
                {selectedAlert.message && (
                    <div>
                    <h3 className="text-sm font-medium text-gray-500">Message</h3>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAlert.message}</p>
                    </div>
                  )}

                {selectedAlert.latitude && selectedAlert.longitude && (
                      <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="text-gray-900">
                      {selectedAlert.latitude && selectedAlert.longitude
                        ? `${parseFloat(selectedAlert.latitude).toFixed(6)}, ${parseFloat(selectedAlert.longitude).toFixed(6)}`
                        : 'Location not available'
                      }
                    </p>
                  </div>
                )}

                    <div>
                  <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                  <p className="text-gray-900">{formatDateTime(selectedAlert.timestamp)}</p>
                    </div>

                {selectedAlert.status === 'pending' && (
                      <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Resolution Notes (Optional)</h3>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution notes..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows="3"
                    />
                      </div>
                    )}
                </div>

                  {selectedAlert.status === 'pending' && (
                <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      disabled={acknowledging}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                    {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                    </button>
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      disabled={resolving}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                    {resolving ? 'Resolving...' : 'Resolve'}
                    </button>
                </div>
              )}
                </div>
              </div>
            </div>
      )}
    </div>
  );
};

export default EmergencyManager;
