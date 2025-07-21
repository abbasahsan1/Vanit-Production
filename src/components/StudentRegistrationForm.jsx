import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaTimes, FaIdCard, FaMapMarkerAlt, FaRoute, FaPhone, FaHome, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    registration_number: '',
    semester: '',
    phone: '',
    emergency_contact: '',
    emergency_contact_relation: '',
    address: '',
    route_name: '',
    stop_name: ''
  });
  
  const [routes, setRoutes] = useState([]);
  const [routeStops, setRouteStops] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      console.log('✅ Routes API Response:', response.data);
      
      // Handle different API response formats
      if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
        // Format: { routes: [{ route_id, route_name, stops: [...] }] }
        const formattedRoutes = response.data.routes.map(route => ({
          id: route.route_id || route.id,
          name: route.route_name,
          route_name: route.route_name,
          stops: route.stops || []
        }));
        console.log('✅ Formatted routes (array format):', formattedRoutes);
        setRoutes(formattedRoutes);
      } else if (response.data && typeof response.data === 'object' && response.data !== null) {
        // Fallback format: { "Route Name": [stops], ... }
        const formattedRoutes = Object.keys(response.data).map((routeName, index) => ({
          id: index + 1,
          name: routeName,
          route_name: routeName,
          stops: Array.isArray(response.data[routeName]) ? response.data[routeName] : []
        }));
        console.log('✅ Formatted routes (object format):', formattedRoutes);
        setRoutes(formattedRoutes);
      } else {
        console.log('⚠️ No routes data found');
        setRoutes([]);
      }
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const handleRouteChange = async (routeName) => {
    setFormData(prev => ({ ...prev, route_name: routeName, stop_name: '' }));
    
    if (routeName) {
      try {
        console.log('🔍 Fetching stops for route:', routeName);
        // Find the selected route object to get its stops
        const selectedRoute = routes.find(r => (r.name === routeName || r.route_name === routeName));
        
        if (selectedRoute && selectedRoute.stops && selectedRoute.stops.length > 0) {
          // If the route object already has stops, use them directly
          console.log('✅ Using stops from route object:', selectedRoute.stops);
          
          // Handle different stop formats
          let formattedStops = [];
          if (Array.isArray(selectedRoute.stops)) {
            formattedStops = selectedRoute.stops.map(stop => {
              if (typeof stop === 'string') {
                return stop;
              } else if (stop.stop_name) {
                return stop.stop_name;
              } else if (stop.name) {
                return stop.name;
              }
              return stop;
            });
          }
          
          setRouteStops(formattedStops);
        } else {
          // Otherwise fetch stops from API
          console.log('📡 Fetching stops from API...');
          const response = await axios.get(`http://localhost:5000/api/student/routes`);
          console.log('API response for all routes:', response.data);
          
          if (response.data && response.data[routeName]) {
            const stops = Array.isArray(response.data[routeName]) ? response.data[routeName] : [];
            const formattedStops = stops.map(stop => 
              typeof stop === 'string' ? stop : (stop.stop_name || stop.name || stop)
            );
            console.log('✅ Extracted stops from API:', formattedStops);
            setRouteStops(formattedStops);
          } else {
            console.log('⚠️ No stops found for route');
            setRouteStops([]);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching route stops:', error);
        setRouteStops([]);
      }
    } else {
      setRouteStops([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'route_name') {
      handleRouteChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Client-side validation
    const requiredFields = [
      'first_name', 'last_name', 'email', 'registration_number', 
      'semester', 'phone', 'emergency_contact', 'emergency_contact_relation', 
      'address', 'route_name', 'stop_name'
    ];

    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      setMessage(`❌ Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    // Registration Number validation
    const regNumberRegex = /^(BCS|BBT|BBS|BSP|BSE|BBA)\d{6}$/i;
    if (!regNumberRegex.test(formData.registration_number)) {
      setMessage('❌ Registration Number must start with BCS, BBT, BBS, BSP, BSE, or BBA followed by 6 digits (e.g., BCS123456)');
      setLoading(false);
      return;
    }

    // Phone Number validation (local format starting with 03)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
      setMessage('❌ Phone Number must be in local format starting with 03 followed by 9 digits (e.g., 03001234567)');
      setLoading(false);
      return;
    }

    // Emergency Contact validation (same format as phone)
    if (!phoneRegex.test(formData.emergency_contact.replace(/\s+/g, ''))) {
      setMessage('❌ Emergency Contact must be in local format starting with 03 followed by 9 digits (e.g., 03001234567)');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('❌ Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Submitting registration data:', formData);
      const response = await axios.post('http://localhost:5000/api/student-registration', formData);
      
      if (response.status === 201 || response.status === 200) {
        console.log('✅ Registration successful:', response.data);
        setMessage('✅ Registration complete! Now sign up on the login page to set your password and access your account.');
        setTimeout(() => {
          navigate('/landing-page');
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        errorMsg = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        errorMsg = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMsg = error.message || 'Unexpected error occurred';
      }
      
      console.error('❌ Detailed error info:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
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
                  <FaUserPlus className="text-xl" />
                </div>
                <div>
                  <h1 className="text-display font-bold" style={{ color: 'var(--color-text-heading)' }}>
                    Student Registration
                  </h1>
                  <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                    Register for VanIt transportation services
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/landing-page')} 
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-text-placeholder)' }}
                title="Close"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="card">
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Information */}
              <div>
                <h3 className="text-heading font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaIdCard className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      required
                      className="input"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-heading font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaIdCard className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleChange}
                      placeholder="BCS123456"
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Semester *
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-heading font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaUserPlus className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      required
                      className="input"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      📧 You'll use this email to sign up after registration
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Next Step:</strong> After registration, you'll need to sign up on the login page to set your password before you can access your account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-heading font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaPhone className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="03001234567"
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Emergency Contact *
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      placeholder="03001234567"
                      required
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Emergency Contact Relation *
                    </label>
                    <select
                      name="emergency_contact_relation"
                      value={formData.emergency_contact_relation}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Home Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your complete home address"
                      required
                      rows="3"
                      className="input resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transportation Information */}
              <div>
                <h3 className="text-heading font-semibold mb-4 flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaRoute className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  Transportation Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Select Route *
                    </label>
                    <select
                      name="route_name"
                      value={formData.route_name}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="">Choose your route</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.name || route.route_name}>
                          {route.name || route.route_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Select Stop *
                    </label>
                    <select
                      name="stop_name"
                      value={formData.stop_name}
                      onChange={handleChange}
                      required
                      disabled={!formData.route_name}
                      className="input"
                    >
                      <option value="">Choose your stop</option>
                      {routeStops.map((stop, index) => (
                        <option key={index} value={stop}>
                          {stop}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col space-y-4">
                {message && (
                  <div 
                    className="p-4 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: message.includes('successful') ? 'var(--color-success)' : 'var(--color-danger)',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    {message}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--color-success)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/landing-page')}
                  className="w-full py-3 px-6 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: 'var(--color-surface-inactive)', 
                    color: 'var(--color-text-secondary)' 
                  }}
                >
                  Back to Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;
