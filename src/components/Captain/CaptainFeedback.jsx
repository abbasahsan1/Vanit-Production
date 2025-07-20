import React, { useState, useEffect } from 'react';
import { 
  FaComments, 
  FaPaperPlane, 
  FaHistory, 
  FaCheck, 
  FaClock, 
  FaReply,
  FaExclamationCircle,
  FaInfoCircle,
  FaTruck,
  FaRoute
} from 'react-icons/fa';
import axios from 'axios';

const CaptainFeedback = () => {
  const [formData, setFormData] = useState({
    message: '',
    route_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState('submit'); // submit, history
  const [captainInfo, setCaptainInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get captain info from localStorage using phone like CaptainPortal does
    const phone = localStorage.getItem('captainPhone');
    if (phone) {
      fetchCaptainInfo(phone);
    } else {
      setError('No captain phone found. Please login again.');
    }
    
    fetchRoutes();
  }, []);

  const fetchCaptainInfo = async (phone) => {
    try {
      console.log('🔍 Fetching captain info for phone:', phone);
      const response = await axios.get(`http://localhost:5000/api/auth/captains/profile/${phone}`);
      if (response.data && response.data.success && response.data.data) {
        const captain = response.data.data;
        const captainData = {
          id: captain.id,
          first_name: captain.first_name || '',
          last_name: captain.last_name || '',
          phone: captain.phone || phone,
          route_name: captain.route_name || ''
        };
        console.log('✅ Captain data loaded:', captainData);
        setCaptainInfo(captainData);
        
        // Now fetch feedback history with captain ID
        if (captainData.id) {
          fetchFeedbackHistory(captainData.id);
        } else {
          console.warn('⚠️ No captain ID found');
        }
      } else {
        console.error('❌ Invalid response from captain API:', response.data);
        // Set fallback data
        setCaptainInfo({
          id: null,
          first_name: 'Captain',
          last_name: 'User',
          phone: phone,
          route_name: ''
        });
      }
    } catch (error) {
      console.error('❌ Error fetching captain info:', error);
      // Set fallback data to prevent crashes
      setCaptainInfo({
        id: null,
        first_name: 'Captain',
        last_name: 'User',
        phone: phone,
        route_name: ''
      });
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      console.log('✅ Routes fetched for captain feedback:', response.data);
      
      // Handle different response formats
      if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
        setRoutes(response.data.routes);
      } else if (response.data && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else {
        console.warn('⚠️ Unexpected routes response format:', response.data);
        setRoutes([]);
      }
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const fetchFeedbackHistory = async (captainId) => {
    if (!captainId) {
      console.warn('⚠️ No captain ID provided for feedback history');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Fetching feedback history for captain ID:', captainId);
      const response = await axios.get(`http://localhost:5000/api/feedback/captain/${captainId}`);
      console.log('✅ Captain feedback history response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setFeedbackHistory(response.data);
      } else {
        console.warn('⚠️ Unexpected feedback history format:', response.data);
        setFeedbackHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching captain feedback history:', error);
      setFeedbackHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!captainInfo || !captainInfo.id) {
      alert('Captain information not found. Please log in again.');
      return;
    }

    if (!formData.message.trim()) {
      alert('Please enter your feedback message.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Submitting captain feedback with data:', {
        captain_id: captainInfo.id,
        captain_name: `${captainInfo.first_name} ${captainInfo.last_name}`,
        route_name: formData.route_name || captainInfo.route_name || 'General',
        message: formData.message.trim()
      });
      
      const feedbackData = {
        captain_id: captainInfo.id,
        captain_name: `${captainInfo.first_name} ${captainInfo.last_name}`,
        route_name: formData.route_name || captainInfo.route_name || 'General',
        message: formData.message.trim()
      };

      const response = await axios.post('http://localhost:5000/api/feedback/captain/submit', feedbackData);
      console.log('✅ Captain feedback submitted successfully:', response.data);
      
      // Reset form
      setFormData({
        message: '',
        route_name: ''
      });
      
      // Refresh feedback history
      if (captainInfo.id) {
        fetchFeedbackHistory(captainInfo.id);
      }
      
      // Switch to history tab to show the submitted feedback
      setActiveTab('history');
      
      alert('✅ Feedback submitted successfully!');
      
    } catch (error) {
      console.error('❌ Error submitting captain feedback:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit feedback';
      alert(`❌ ${errorMsg}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaExclamationCircle className="text-gray-500" />;
    }
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

  // Early return for error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card p-6 text-center">
          <FaExclamationCircle className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>
            Error Loading Feedback
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <FaTruck className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Captain Feedback</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Share your operational insights and suggestions</p>
          </div>
        </div>

        {/* Captain Info */}
        {captainInfo && (
          <div className="flex items-center space-x-4 p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
            <FaTruck className="text-lg" style={{ color: 'var(--color-primary-action)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                {captainInfo.first_name} {captainInfo.last_name}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Captain ID: {captainInfo.id}
                {captainInfo.route_name && ` • Assigned Route: ${captainInfo.route_name}`}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'submit' 
                ? 'text-white' 
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'submit' 
                ? 'var(--color-primary-action)' 
                : 'var(--color-surface-inactive)',
              color: activeTab === 'submit' 
                ? 'var(--color-text-inverse)' 
                : 'var(--color-text-body)'
            }}
          >
            <FaPaperPlane className="inline mr-2" />
            Submit Feedback
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history' 
                ? 'text-white' 
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeTab === 'history' 
                ? 'var(--color-primary-action)' 
                : 'var(--color-surface-inactive)',
              color: activeTab === 'history' 
                ? 'var(--color-text-inverse)' 
                : 'var(--color-text-body)'
            }}
          >
            <FaHistory className="inline mr-2" />
            My Feedback ({feedbackHistory.length})
          </button>
        </div>
      </div>

      {/* Submit Feedback Tab */}
      {activeTab === 'submit' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
            Submit New Feedback
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                Route (Optional)
              </label>
              <select
                name="route_name"
                value={formData.route_name}
                onChange={handleInputChange}
                className="input w-full"
              >
                <option value="">
                  {captainInfo?.route_name ? `Default: ${captainInfo.route_name}` : 'Select a route (optional)'}
                </option>
                {routes.map((route) => (
                  <option key={route.id} value={route.name}>
                    {route.name}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Leave blank to use your assigned route or for general feedback
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                Your Feedback *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Share your operational insights, route conditions, student behavior, vehicle issues, or suggestions for improvement..."
                rows="6"
                className="input w-full resize-none"
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Your field experience is valuable for improving our transportation services.
              </p>
            </div>

            {/* Info Box */}
            <div className="flex items-start space-x-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
              <FaInfoCircle className="text-lg mt-0.5" style={{ color: 'var(--color-primary-action)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
                  Your expertise matters!
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                  As a captain, your on-ground experience helps us improve routes, schedules, and overall service quality. 
                  Share any operational challenges, safety concerns, or improvement suggestions.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !formData.message.trim()}
                className="btn btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback History Tab */}
      {activeTab === 'history' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
            My Feedback History
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-action)' }}></div>
              <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading feedback history...</span>
            </div>
          ) : feedbackHistory.length === 0 ? (
            <div className="text-center py-12">
              <FaComments className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-text-placeholder)' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>No feedback submitted yet</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Click on "Submit Feedback" to share your operational insights with the administration.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackHistory.map((feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border-standard)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(feedback.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <FaRoute className="text-sm" style={{ color: 'var(--color-primary-action)' }} />
                          <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                            {feedback.route_name !== 'General' ? `Route: ${feedback.route_name}` : 'General Feedback'}
                          </span>
                          <span className={getStatusBadge(feedback.status)}>
                            {feedback.status === 'pending' ? 'Pending Review' : 'Resolved'}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Submitted on {formatDate(feedback.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                      {feedback.message}
                    </p>
                  </div>

                  {feedback.admin_response && (
                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <FaReply className="text-sm" style={{ color: 'var(--color-primary-action)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                          Admin Response
                        </span>
                        {feedback.resolved_at && (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            • {formatDate(feedback.resolved_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                        {feedback.admin_response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaptainFeedback;