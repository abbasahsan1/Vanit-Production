import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBus, FaEdit, FaSave, FaTimes, FaSignOutAlt, FaArrowLeft, FaUserCircle, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';

const CaptainProfile = () => {
  const [captainData, setCaptainData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    route_name: '',
    alternate_phone: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCaptainData();
  }, []);

  const fetchCaptainData = async () => {
    try {
      const phone = localStorage.getItem('captainPhone');
      if (!phone) {
        navigate('/captain-login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/auth/captains/profile/${phone}`);
      if (response.status === 200 && response.data.success) {
        setCaptainData(response.data.data);
        setEditedData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching captain data:', error);
      setMessage('Error loading profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(captainData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(captainData);
    setMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const phone = localStorage.getItem('captainPhone');
      const response = await axios.put(`http://localhost:5000/api/auth/captains/update/${phone}`, editedData);
      
      if (response.status === 200) {
        setCaptainData(editedData);
        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('captainToken');
    localStorage.removeItem('captainPhone');
    navigate('/captain-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/captain/home" className="flex items-center space-x-2 nav-link hover:opacity-80 transition-opacity">
              <FaArrowLeft className="text-lg" />
              <span className="font-semibold">Back to Home</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 nav-link hover:opacity-80 transition-opacity"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-success)' }}>
                  <FaShieldAlt className="text-3xl icon-inverse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Captain Profile</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Manage your account information</p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="btn btn-success flex items-center space-x-2"
                >
                  <FaEdit className="text-sm" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`px-6 py-3 ${
              message.includes('Error') 
                ? 'border-l-4' 
                : 'border-l-4'
            }`} style={{ 
              backgroundColor: message.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)',
              color: 'var(--color-text-inverse)',
              borderColor: message.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)'
            }}>
              {message}
            </div>
          )}

          {/* Profile Form */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={isEditing ? editedData.first_name : captainData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={isEditing ? editedData.last_name : captainData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Email</label>
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="icon-ui" />
                    <input
                      type="email"
                      name="email"
                      value={captainData.email || ''}
                      disabled
                      className="input opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Phone Number</label>
                  <div className="flex items-center space-x-2">
                    <FaPhone className="icon-ui" />
                    <input
                      type="tel"
                      name="phone"
                      value={isEditing ? editedData.phone : captainData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternate_phone"
                    value={isEditing ? editedData.alternate_phone : captainData.alternate_phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Route Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Route Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Assigned Route</label>
                  <div className="flex items-center space-x-2">
                    <FaBus className="icon-ui" />
                    <input
                      type="text"
                      name="route_name"
                      value={isEditing ? editedData.route_name : captainData.route_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info)' }}>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-inverse)' }}>Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-inverse)' }}>Route:</span>
                      <span className="font-medium" style={{ color: 'var(--color-text-inverse)' }}>{captainData.route_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-inverse)' }}>Phone:</span>
                      <span className="font-medium" style={{ color: 'var(--color-text-inverse)' }}>{captainData.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success)' }}>
                  <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-inverse)' }}>Quick Actions</h4>
                  <div className="space-y-2">
                    <Link 
                      to="/captain/home" 
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-text-inverse)' }}
                      onClick={() => {
                        // Navigate to captain home with GPS tab
                        setTimeout(() => {
                          // This will be handled by the captain portal's GPS tab
                          console.log('Navigate to GPS tracking via captain portal');
                        }, 100);
                      }}
                    >
                      <FaMapMarkerAlt className="text-sm" />
                      <span className="text-sm">GPS Tracking</span>
                    </Link>
                    <Link 
                      to="/captain/home" 
                      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--color-text-inverse)' }}
                    >
                      <FaUser className="text-sm" />
                      <span className="text-sm">Dashboard</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                <button
                  onClick={handleSave}
                  className="btn btn-success flex items-center space-x-2 px-6 py-3"
                >
                  <FaSave className="text-sm" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary flex items-center space-x-2 px-6 py-3"
                >
                  <FaTimes className="text-sm" />
                  <span>Cancel</span>
                </button>
              </div>
            )}

            {!isEditing && (
              <div className="flex justify-center mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary flex items-center space-x-2 px-6 py-3"
                >
                  <FaEdit />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainProfile; 