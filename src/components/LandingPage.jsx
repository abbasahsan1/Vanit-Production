import React, { useState } from 'react';
import { FaUser, FaLock, FaHome, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LandingPage = () => {
  const [showUserTypePopup, setShowUserTypePopup] = useState(false);
  const [userType, setUserType] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    registration_number: '',
    bus_number: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUserTypeSelection = (type) => {
    if (type === 'captain') {
      navigate('/captain-login');
    } else {
      setUserType(type);
      setShowUserTypePopup(false);
      setShowLoginForm(true);
    }
  };

  const switchForm = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin
        ? `http://localhost:5000/api/auth/${userType}s/login`
        : `http://localhost:5000/api/auth/${userType}s/signup`;

    console.log(`🚀 Sending Request to: ${endpoint}`);
    console.log("📤 Payload:", formData);

    if (!isLogin) {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.registration_number) {
            setStatusMessage("❌ All fields are required for signup!");
            return;
        }
    }

    try {
        if (!isLogin) {
            // ✅ Signup Flow: Just set password for registered student
            const signupResponse = await axios.post(endpoint, formData);
            console.log("✅ Signup Success:", signupResponse.data);
            setStatusMessage(`✅ ${signupResponse.data.message} Please login with your credentials.`);
            
            // ✅ Switch to login form after successful signup
            setTimeout(() => {
                setIsLogin(true);
                setFormData(prev => ({ 
                    ...prev, 
                    first_name: '', 
                    last_name: '', 
                    registration_number: '' 
                }));
                setStatusMessage('');
            }, 2000);
        } else {
            const response = await axios.post(endpoint, formData);
            console.log("✅ Login Success:", response.data);

            if (response.status === 200) {
                localStorage.setItem(`${userType}Token`, response.data.token);
                
                if (userType === "student") {
                  localStorage.setItem("studentEmail", formData.email);
                  localStorage.setItem("studentData", JSON.stringify({        
                      first_name: response.data.first_name,
                      last_name: response.data.last_name,
                      registration_number: response.data.registration_number,
                      phone: response.data.phone,
                      route_name: response.data.route_name,
                      stop_name: response.data.stop_name,
                  }));
              }
                const redirectPath = userType === 'student' ? '/student/home' : '/captain/home';
                window.location.href = redirectPath;
            }
        }
    } catch (error) {
        console.error("🔴 API Error:", error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "An unexpected error occurred.";
        setStatusMessage(`❌ ${errorMsg}`);
    }
};

const clearForm = () => {
    setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        registration_number: '',
        bus_number: ''
    });
    setStatusMessage('');
};

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/landing-page" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaHome className="text-lg" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/about" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaInfoCircle className="text-lg" />
              <span className="font-medium">About</span>
            </Link>
            <Link to="/contact" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaEnvelope className="text-lg" />
              <span className="font-medium">Contact</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="/1.png" alt="Logo" className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
            Welcome to Capital University of Science and Technology
          </h1>
          <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Transport Hub powered by VANit
          </p>
          
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => setShowUserTypePopup(true)}
              className="px-8 py-4 font-semibold text-lg rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{ 
                backgroundColor: 'var(--color-primary-action)', 
                color: 'var(--color-text-inverse)' 
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-primary-brand)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-primary-action)'}
            >
              Login
            </button>

            <button
              onClick={() => navigate('/student-registration')}
              className="px-8 py-4 font-semibold text-lg rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{ 
                backgroundColor: 'var(--color-success)', 
                color: 'var(--color-text-inverse)' 
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-success)'}
            >
              Student Registration
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info)' }}>
              <FaUser className="text-2xl icon-inverse" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>Student Portal</h3>
            <p style={{ color: 'var(--color-text-body)' }}>
              Track your bus, scan QR codes, and manage your transportation efficiently.
            </p>
          </div>

          <div className="card text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-warning)' }}>
              <FaUser className="text-2xl icon-inverse" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>Captain Portal</h3>
            <p style={{ color: 'var(--color-text-body)' }}>
              Manage routes, track students, and provide safe transportation services.
            </p>
          </div>

          <div className="card text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-danger)' }}>
              <FaUser className="text-2xl icon-inverse" />
            </div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>Admin Portal</h3>
            <p style={{ color: 'var(--color-text-body)' }}>
              Complete system management with real-time monitoring and analytics.
            </p>
          </div>
        </div>
      </div>

      {/* User Type Selection Modal */}
      {showUserTypePopup && (
        <div className="modal-overlay">
          <div className="card max-w-md w-full mx-4">
            <div className="card-content p-8">
              <h3 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--color-text-heading)' }}>Login as</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleUserTypeSelection('student')}
                  className="w-full px-6 py-4 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-primary-action)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  Student Login
                </button>
                <button
                  onClick={() => navigate('/captain-login')}
                  className="w-full px-6 py-4 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-success)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  Captain Login
                </button>
              </div>
              <button
                onClick={() => setShowUserTypePopup(false)}
                className="w-full mt-4 font-medium hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Form Modal */}
      {showLoginForm && (
        <div className="modal-overlay">
          <div className="card max-w-md w-full mx-4">
            <div className="card-content p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
                  {isLogin ? 'Student Login' : 'Student Signup'}
                </h3>
                <button
                  onClick={() => setShowLoginForm(false)}
                  className="text-2xl hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-placeholder)' }}
                >
                  ×
                </button>
              </div>

              {!isLogin && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Signup Step:</strong> You must be registered first. Enter your registration number to set your password and activate your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {statusMessage && (
                <div className={`p-3 rounded-lg mb-4 ${
                  statusMessage.includes('❌') || statusMessage.includes('⚠️') 
                    ? 'text-white' 
                    : 'text-white'
                }`} style={{
                  backgroundColor: statusMessage.includes('❌') || statusMessage.includes('⚠️') 
                    ? 'var(--color-danger)' 
                    : 'var(--color-success)'
                }}>
                  {statusMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                    Email
                  </label>
                  <div className="relative">
                    <FaUser className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                      Registration Number
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      className="input"
                      placeholder="Enter your registration number"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-primary-action)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  {isLogin ? 'Login' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    switchForm();
                    clearForm();
                  }}
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-link)' }}
                >
                  {isLogin ? "Need to activate your account? Sign up" : "Already activated your account? Login"}
                </button>
                
                {isLogin && (
                  <div className="mt-3">
                    <Link 
                      to="/student-registration" 
                      className="text-sm hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      Don't have an account? Register first →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

