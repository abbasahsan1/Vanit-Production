import React, { useState, useEffect } from 'react';
import { 
  FaComments, 
  FaPaperPlane, 
  FaHistory, 
  FaCheck, 
  FaClock, 
  FaReply,
  FaExclamationCircle,
  FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';

const StudentFeedback = () => {
  const [formData, setFormData] = useState({
    message: '',
    route_name: '',
    stop_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [activeTab, setActiveTab] = useState('submit'); // submit, history
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    // Get student info from localStorage using email like StudentPortal does
    const email = localStorage.getItem('studentEmail');
    if (email) {
      fetchStudentInfo(email);
    }
    
    fetchRoutes();
  }, []);

  const fetchStudentInfo = async (email) => {
    try {
      console.log('🔍 Fetching student info for email:', email);
      const response = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
      if (response.status === 200 && response.data) {
        const student = response.data;
        const studentData = {
          first_name: student.first_name || '',
          last_name: student.last_name || '',
          email: student.email || email,
          reg_no: student.registration_number || '',
          route_name: student.route_name || '',
          stop_name: student.stop_name || ''
        };
        console.log('✅ Student data loaded:', studentData);
        setStudentInfo(studentData);
        
        // Now fetch feedback history with reg_no
        if (studentData.reg_no) {
          fetchFeedbackHistory(studentData.reg_no);
        } else {
          console.warn('⚠️ No registration number found for student');
        }
      } else {
        console.error('❌ Invalid response from student API:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching student info:', error);
      // Set fallback data to prevent crashes
      setStudentInfo({
        first_name: 'Student',
        last_name: 'User',
        email: email,
        reg_no: '',
        route_name: '',
        stop_name: ''
      });
    }
  };

  useEffect(() => {
    if (formData.route_name) {
      fetchStops(formData.route_name);
    } else {
      setStops([]);
    }
  }, [formData.route_name]);

  const fetchRoutes = async () => {
    try {
      console.log('🔍 Fetching routes for feedback form...');
      const response = await axios.get('http://localhost:5000/api/routes');
      console.log('✅ Routes API response:', response.data);
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        setRoutes(response.data);
      } else if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
        setRoutes(response.data.routes);
      } else {
        console.warn('⚠️ Unexpected routes response format:', response.data);
        setRoutes([]);
      }
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const fetchStops = async (routeName) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/routes/${routeName}/stops`);
      setStops(response.data || []);
    } catch (error) {
      console.error('Error fetching stops:', error);
      setStops([]);
    }
  };

  const fetchFeedbackHistory = async (regNo) => {
    if (!regNo) {
      console.warn('⚠️ No registration number provided for feedback history');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Fetching feedback history for reg_no:', regNo);
      const response = await axios.get(`http://localhost:5000/api/feedback/student/${regNo}`);
      console.log('✅ Feedback history response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setFeedbackHistory(response.data);
      } else {
        console.warn('⚠️ Unexpected feedback history format:', response.data);
        setFeedbackHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching feedback history:', error);
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
    
    if (!studentInfo) {
      alert('Student information not found. Please log in again.');
      return;
    }

    if (!formData.message.trim()) {
      alert('Please enter your feedback message.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Submitting feedback with data:', {
        student_email: studentInfo.email,
        name: `${studentInfo.first_name} ${studentInfo.last_name}`,
        reg_no: studentInfo.reg_no,
        route_name: formData.route_name || 'General',
        stop_name: formData.stop_name || 'N/A',
        message: formData.message.trim()
      });
      
      const feedbackData = {
        student_email: studentInfo.email,
        name: `${studentInfo.first_name} ${studentInfo.last_name}`,
        reg_no: studentInfo.reg_no,
        route_name: formData.route_name || 'General',
        stop_name: formData.stop_name || 'N/A',
        message: formData.message.trim()
      };

      const response = await axios.post('http://localhost:5000/api/feedback/submit', feedbackData);
      console.log('✅ Feedback submitted successfully:', response.data);
      
      // Reset form
      setFormData({
        message: '',
        route_name: '',
        stop_name: ''
      });
      
      // Refresh feedback history
      if (studentInfo.reg_no) {
        fetchFeedbackHistory(studentInfo.reg_no);
      }
      
      // Switch to history tab to show the submitted feedback
      setActiveTab('history');
      
      alert('✅ Feedback submitted successfully!');
      
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <FaComments className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Student Feedback</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Share your thoughts and suggestions with us</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="">Select a route (optional)</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.name}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Stop (Optional)
                </label>
                <select
                  name="stop_name"
                  value={formData.stop_name}
                  onChange={handleInputChange}
                  className="input w-full"
                  disabled={!formData.route_name}
                >
                  <option value="">Select a stop (optional)</option>
                  {stops.map((stop, index) => (
                    <option key={index} value={stop}>
                      {stop}
                    </option>
                  ))}
                </select>
              </div>
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
                placeholder="Please share your feedback, suggestions, or concerns..."
                rows="6"
                className="input w-full resize-none"
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Please be specific and constructive in your feedback.
              </p>
            </div>

            {/* Info Box */}
            <div className="flex items-start space-x-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
              <FaInfoCircle className="text-lg mt-0.5" style={{ color: 'var(--color-primary-action)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
                  Your feedback matters!
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                  We review all feedback carefully and use it to improve our transportation services. 
                  You'll be able to track the status of your feedback and see admin responses.
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
                Click on "Submit Feedback" to share your thoughts with us.
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
                          <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                            {feedback.route_name !== 'General' ? `Route: ${feedback.route_name}` : 'General Feedback'}
                          </span>
                          <span className={getStatusBadge(feedback.status)}>
                            {feedback.status === 'pending' ? 'Pending Review' : 'Resolved'}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Submitted on {formatDate(feedback.created_at)}
                          {feedback.stop_name && feedback.stop_name !== 'N/A' && ` • Stop: ${feedback.stop_name}`}
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

export default StudentFeedback;