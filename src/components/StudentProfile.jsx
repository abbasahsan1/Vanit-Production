import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBus, FaEdit, FaSave, FaTimes, FaSignOutAlt, FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import VanItLogo from './VanItLogo';

const StudentProfile = () => {
  const [studentData, setStudentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    registration_number: '',
    phone: '',
    route_name: '',
    stop_name: '',
    semester: '',
    emergency_contact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const email = localStorage.getItem('studentEmail');
      if (!email) {
        navigate('/landing-page');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/get-student-by-email', { email });
      if (response.status === 200) {
        setStudentData(response.data);
        setEditedData(response.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setMessage('Error loading profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(studentData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(studentData);
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
      const email = localStorage.getItem('studentEmail');
      const response = await axios.put(`http://localhost:5000/api/students/update/${email}`, editedData);
      
      if (response.status === 200) {
        setStudentData(editedData);
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
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('studentData');
    navigate('/landing-page');
  };

  if (isLoading) {
    return (
      <div className="student-view flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-action)' }}></div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <VanItLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold nav-link">
              Capital University of Science and Technology - Student Profile
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/student/home" 
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Back to Home
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button className="nav-link hover:opacity-80 transition-opacity">
                <FaUserCircle className="text-xl" />
              </button>
            </div>
            
            <button
              onClick={handleLogout}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaSignOutAlt className="mr-2" /> Logout
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
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-gradient-start)' }}>
                  <FaUserCircle className="text-3xl" style={{ color: 'var(--color-primary-action)' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Student Profile</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Manage your account information</p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="btn btn-primary flex items-center space-x-2"
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
              backgroundColor: message.includes('Error') ? '#FEE2E2' : '#D1FAE5',
              color: message.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)',
              borderLeftColor: message.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)'
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
                    value={isEditing ? editedData.first_name : studentData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={isEditing ? editedData.last_name : studentData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Email</label>
                  <div className="flex items-center space-x-2">
                    <FaEnvelope style={{ color: 'var(--color-text-placeholder)' }} />
                    <input
                      type="email"
                      name="email"
                      value={studentData.email}
                      disabled
                      className="input w-full"
                      style={{ backgroundColor: 'var(--color-surface-inactive)', color: 'var(--color-text-secondary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={isEditing ? editedData.registration_number : studentData.registration_number}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Semester</label>
                  <input
                    type="text"
                    name="semester"
                    value={isEditing ? editedData.semester : studentData.semester}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Contact & Route Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Contact & Route Information</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Phone Number</label>
                  <div className="flex items-center space-x-2">
                    <FaPhone style={{ color: 'var(--color-text-placeholder)' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={isEditing ? editedData.phone : studentData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergency_contact"
                    value={isEditing ? editedData.emergency_contact : studentData.emergency_contact}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Route</label>
                  <div className="flex items-center space-x-2">
                    <FaBus style={{ color: 'var(--color-text-placeholder)' }} />
                    <input
                      type="text"
                      name="route_name"
                      value={isEditing ? editedData.route_name : studentData.route_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Stop</label>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt style={{ color: 'var(--color-text-placeholder)' }} />
                    <input
                      type="text"
                      name="stop_name"
                      value={isEditing ? editedData.stop_name : studentData.stop_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                <button
                  onClick={handleSave}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <FaSave className="text-sm" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-ghost flex items-center space-x-2"
                >
                  <FaTimes className="text-sm" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 