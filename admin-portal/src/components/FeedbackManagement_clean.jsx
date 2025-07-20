import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUserCircle, 
  FaComments, 
  FaUser, 
  FaSignOutAlt, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaEye,
  FaReply,
  FaFilter,
  FaSearch,
  FaExclamationTriangle,
  FaUsers,
  FaTruck
} from 'react-icons/fa';
import UnifiedNavbar from './UnifiedNavbar';
import axios from 'axios';

const FeedbackManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, student, captain, pending, resolved
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    student: 0,
    captain: 0
  });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, activeTab, searchTerm]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        navigate('/');
        return;
      }

      // Fetch both student and captain feedbacks
      const [studentResponse, captainResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/feedbacks', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/captain-feedbacks', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Combine and format feedbacks
      const studentFeedbacks = (studentResponse.data.feedbacks || []).map(feedback => ({
        ...feedback,
        type: 'student',
        submitter_name: feedback.name,
        submitter_id: feedback.reg_no
      }));

      const captainFeedbacks = (captainResponse.data.feedbacks || []).map(feedback => ({
        ...feedback,
        type: 'captain',
        submitter_name: feedback.captain_name,
        submitter_id: feedback.captain_id
      }));

      const allFeedbacks = [...studentFeedbacks, ...captainFeedbacks].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setFeedbacks(allFeedbacks);

      // Calculate stats
      const newStats = {
        total: allFeedbacks.length,
        pending: allFeedbacks.filter(f => f.status === 'pending').length,
        resolved: allFeedbacks.filter(f => f.status === 'resolved').length,
        student: studentFeedbacks.length,
        captain: captainFeedbacks.length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let filtered = feedbacks;

    // Filter by tab
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(f => f.status === 'pending');
        break;
      case 'resolved':
        filtered = filtered.filter(f => f.status === 'resolved');
        break;
      case 'student':
        filtered = filtered.filter(f => f.type === 'student');
        break;
      case 'captain':
        filtered = filtered.filter(f => f.type === 'captain');
        break;
      default:
        // 'all' - no filtering needed
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.submitter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.submitter_id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFeedbacks(filtered);
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const feedback = feedbacks.find(f => f.id === feedbackId);
      
      if (!feedback) return;

      const endpoint = feedback.type === 'student' 
        ? `http://localhost:5000/api/feedbacks/${feedbackId}/status`
        : `http://localhost:5000/api/captain-feedbacks/${feedbackId}/status`;

      await axios.put(endpoint, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setFeedbacks(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status: newStatus } : f
      ));

      alert(`Feedback marked as ${newStatus}!`);
      
    } catch (error) {
      console.error('Error updating feedback status:', error);
      alert('Failed to update feedback status');
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.admin_response || '');
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (type) {
      case 'student':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'captain':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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
            <div className="flex items-center space-x-4">
              <FaComments className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Feedback Management</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Manage student and captain feedback submissions</p>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Feedback Statistics</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Feedback</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-primary-action)' }}>{stats.total}</p>
                  </div>
                  <FaComments className="text-lg" style={{ color: 'var(--color-primary-action)' }} />
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pending</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-warning)' }}>{stats.pending}</p>
                  </div>
                  <FaExclamationTriangle className="text-lg" style={{ color: 'var(--color-warning)' }} />
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Resolved</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.resolved}</p>
                  </div>
                  <FaCheck className="text-lg" style={{ color: 'var(--color-success)' }} />
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Students</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-info)' }}>{stats.student}</p>
                  </div>
                  <FaUsers className="text-lg" style={{ color: 'var(--color-info)' }} />
                </div>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Captain</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-secondary)' }}>{stats.captain}</p>
                  </div>
                  <FaTruck className="text-lg" style={{ color: 'var(--color-secondary)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Tab Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Feedback', count: stats.total },
                  { key: 'pending', label: 'Pending', count: stats.pending },
                  { key: 'resolved', label: 'Resolved', count: stats.resolved },
                  { key: 'student', label: 'Students', count: stats.student },
                  { key: 'captain', label: 'Captains', count: stats.captain }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.key 
                        ? 'text-white' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.key 
                        ? 'var(--color-primary-action)' 
                        : 'var(--color-surface-inactive)',
                      color: activeTab === tab.key 
                        ? 'var(--color-text-inverse)' 
                        : 'var(--color-text-body)'
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FaSearch className="input-icon" />
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Table */}
          <div className="card">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading feedback...</span>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12">
                <FaComments className="text-4xl mx-auto mb-4 icon-ui" />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>No feedback found</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'No feedback submissions yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border-standard)' }}>
                  <thead style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Submitter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)' }}>
                    {filteredFeedbacks.map((feedback) => (
                      <tr key={`${feedback.type}-${feedback.id}`} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              {feedback.submitter_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {feedback.type === 'student' ? `Reg: ${feedback.submitter_id}` : `ID: ${feedback.submitter_id}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getTypeBadge(feedback.type)}>
                            {feedback.type === 'student' ? 'Student' : 'Captain'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                            {feedback.message.length > 100 
                              ? `${feedback.message.substring(0, 100)}...` 
                              : feedback.message
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {feedback.route_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(feedback.status)}>
                            {feedback.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {formatDate(feedback.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(feedback)}
                              className="btn btn-secondary btn-sm flex items-center"
                            >
                              <FaEye className="mr-1" />
                              View
                            </button>
                            {feedback.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(feedback.id, 'resolved')}
                                className="btn btn-success btn-sm flex items-center"
                              >
                                <FaCheck className="mr-1" />
                                Resolve
                              </button>
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

      {/* Feedback Detail Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--color-overlay-dark)' }}>
          <div className="p-8 rounded-xl w-full max-w-2xl mx-4 card" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Feedback Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-text-body)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {/* Feedback Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>Submitter</label>
                  <p className="text-sm" style={{ color: 'var(--color-text-heading)' }}>{selectedFeedback.submitter_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>Type</label>
                  <span className={getTypeBadge(selectedFeedback.type)}>
                    {selectedFeedback.type === 'student' ? 'Student' : 'Captain'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>Route</label>
                  <p className="text-sm" style={{ color: 'var(--color-text-heading)' }}>{selectedFeedback.route_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>Status</label>
                  <span className={getStatusBadge(selectedFeedback.status)}>
                    {selectedFeedback.status}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Message</label>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                  <p style={{ color: 'var(--color-text-body)' }}>{selectedFeedback.message}</p>
                </div>
              </div>

              {/* Admin Response */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Admin Response</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response here..."
                  rows={4}
                  className="input w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    // Handle admin response submission
                    console.log('Admin response:', adminResponse);
                    setShowModal(false);
                  }}
                  className="btn btn-primary flex-1 font-semibold"
                >
                  <FaReply className="inline mr-2" />
                  Send Response
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1 font-semibold"
                >
                  <FaTimes className="inline mr-2" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
