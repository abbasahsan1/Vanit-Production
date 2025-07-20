import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaArrowLeft, FaPaperPlane, FaCheckCircle, FaSpinner } from "react-icons/fa";
import axios from "axios";

const Feedback = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    message: "",
    route_name: "",
    stop_name: ""
  });
  const [studentData, setStudentData] = useState({
    name: "",
    reg_no: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get student data from localStorage
    const email = localStorage.getItem("studentEmail");
    if (email) {
      fetchStudentData(email);
    } else {
      navigate("/landing-page");
    }
  }, [navigate]);

  const fetchStudentData = async (email) => {
    try {
      const response = await axios.post("http://localhost:5000/api/get-student-by-email", { email });
      if (response.status === 200) {
        const student = response.data;
        setStudentData({
          name: `${student.first_name} ${student.last_name}`,
          reg_no: student.registration_number,
          email: student.email
        });
        setFormData(prev => ({
          ...prev,
          route_name: student.route_name || "",
          stop_name: student.stop_name || ""
        }));
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to load student information");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const submissionData = {
        student_email: studentData.email,
        name: studentData.name,
        reg_no: studentData.reg_no,
        route_name: formData.route_name,
        stop_name: formData.stop_name,
        message: formData.message
      };

      await axios.post("http://localhost:5000/api/feedback/submit", submissionData);
      
      setSuccess(true);
      setFormData(prev => ({ ...prev, message: "" }));
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate("/student/home");
      }, 3000);
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError(error.response?.data?.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="student-view">
      <div className="container section">
        {/* Header */}
        <div className="card mb-6">
          <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-primary-action)',
                    color: 'var(--color-text-inverse)'
                  }}
                >
                  <FaCommentDots className="text-xl" />
                </div>
                <div>
                  <h1 className="text-display font-bold" style={{ color: 'var(--color-text-heading)' }}>
                    Submit Feedback
                  </h1>
                  <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                    Share your experience and suggestions
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/student/home")} 
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-text-placeholder)' }}
                title="Back to Dashboard"
              >
                <FaArrowLeft className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="card mb-6">
            <div className="card-content text-center py-8">
              <FaCheckCircle className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
              <h2 className="text-heading font-bold mb-2" style={{ color: 'var(--color-success)' }}>
                Feedback Submitted Successfully!
              </h2>
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                Thank you for your feedback. We appreciate your input and will review it shortly.
              </p>
              <p className="text-sm mt-4" style={{ color: 'var(--color-text-placeholder)' }}>
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {!success && (
          <div className="card">
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Student Information */}
                <div>
                  <h3 className="text-heading font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={studentData.name}
                        disabled
                        className="input opacity-75"
                        style={{ backgroundColor: 'var(--color-surface-inactive)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={studentData.reg_no}
                        disabled
                        className="input opacity-75"
                        style={{ backgroundColor: 'var(--color-surface-inactive)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Route Information */}
                <div>
                  <h3 className="text-heading font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
                    Route Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                        Route Name
                      </label>
                      <input
                        type="text"
                        name="route_name"
                        value={formData.route_name}
                        onChange={handleChange}
                        placeholder="Enter route name (optional)"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                        Stop Name
                      </label>
                      <input
                        type="text"
                        name="stop_name"
                        value={formData.stop_name}
                        onChange={handleChange}
                        placeholder="Enter stop name (optional)"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback Message */}
                <div>
                  <h3 className="text-heading font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
                    Your Feedback
                  </h3>
                  <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please share your feedback, suggestions, or concerns about the transportation service..."
                    required
                    rows="6"
                    className="input resize-none"
                  />
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-placeholder)' }}>
                    Please be detailed and constructive in your feedback to help us improve our services.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div 
                    className="p-4 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--color-danger)',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.message.trim()}
                    className="flex-1 py-4 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--color-success)', 
                      color: 'var(--color-text-inverse)' 
                    }}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/student/home")}
                    className="py-4 px-6 rounded-lg font-medium transition-colors"
                    style={{ 
                      backgroundColor: 'var(--color-surface-inactive)', 
                      color: 'var(--color-text-secondary)' 
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
