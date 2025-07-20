import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaMapMarkerAlt, FaMedkit, FaShieldAlt, FaWrench, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';

const SOSButton = ({ 
  userType = 'student', 
  userId, 
  userData = {}, 
  onAlertSent = () => {},
  disabled = false 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('general');
  const [customMessage, setCustomMessage] = useState('');
  const [priorityLevel, setPriorityLevel] = useState('high');

  // Emergency type options
  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency', icon: FaMedkit, color: 'var(--color-danger)', description: 'Medical help needed' },
    { value: 'security', label: 'Security Issue', icon: FaShieldAlt, color: 'var(--color-warning)', description: 'Safety or security concern' },
    { value: 'mechanical', label: 'Vehicle Issue', icon: FaWrench, color: 'var(--color-primary-action)', description: 'Bus breakdown or mechanical problem' },
    { value: 'general', label: 'General Emergency', icon: FaExclamationCircle, color: 'var(--color-text-secondary)', description: 'Other emergency situation' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'critical', label: 'CRITICAL', color: { backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }, description: 'Life-threatening emergency' },
    { value: 'high', label: 'HIGH', color: { backgroundColor: 'var(--color-warning)', color: 'var(--color-text-inverse)' }, description: 'Urgent attention required' },
    { value: 'medium', label: 'MEDIUM', color: { backgroundColor: '#F59E0B', color: 'var(--color-text-inverse)' }, description: 'Important but not urgent' },
    { value: 'low', label: 'LOW', color: { backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }, description: 'Non-urgent assistance' }
  ];

  // Get current GPS location
  useEffect(() => {
    if (showModal) {
      getLocation();
    }
  }, [showModal]);

  const getLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError('Unable to get your location. You can still send the alert without location data.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSendAlert = async () => {
    setIsLoading(true);

    try {
      // ✅ Enhanced data validation and mapping
      const alertData = {
        user_type: userType,
        user_id: userId,
        first_name: userData.first_name || userData.name?.split(' ')[0] || 'Unknown',
        last_name: userData.last_name || userData.name?.split(' ')[1] || 'User',
        registration_number: userData.registration_number || userData.reg_no || null,
        phone: userData.phone || 'Not provided',
        route_name: userData.route_name || 'Unknown',
        stop_name: userData.stop_name || null,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        emergency_type: selectedEmergencyType,
        message: customMessage || `${selectedEmergencyType} emergency reported`,
        priority_level: priorityLevel
      };

      // ✅ Validate critical fields before sending
      const requiredFields = ['user_type', 'user_id', 'first_name', 'last_name', 'phone', 'route_name'];
      const missingFields = requiredFields.filter(field => !alertData[field] || alertData[field] === 'Unknown' || alertData[field] === 'Not provided');
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required SOS fields:', missingFields);
        console.error('❌ Current alert data:', alertData);
        console.error('❌ Original user data:', userData);
        
        alert(`❌ Unable to send SOS alert. Missing information: ${missingFields.join(', ')}. Please ensure you are properly logged in and try again.`);
        return;
      }

      console.log('🚨 Sending SOS alert:', alertData);

      const response = await axios.post('http://localhost:5000/api/emergency/send-alert', alertData);

      if (response.data.success) {
        alert('🚨 Emergency alert sent successfully! Help is on the way.');
        setShowModal(false);
        setSelectedEmergencyType('general');
        setCustomMessage('');
        setPriorityLevel('high');
        onAlertSent(response.data);
      } else {
        throw new Error(response.data.error || 'Failed to send alert');
      }
    } catch (error) {
      console.error('❌ Error sending SOS alert:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to send SOS alert';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (disabled) {
      alert('⚠️ SOS feature is currently disabled');
      return;
    }
    setShowModal(true);
  };

  const selectedType = emergencyTypes.find(type => type.value === selectedEmergencyType);
  const selectedPriority = priorityLevels.find(priority => priority.value === priorityLevel);

  return (
    <>
      {/* SOS Button */}
      <button
        onClick={handleOpenModal}
        disabled={disabled}
        className={`
          relative inline-flex items-center justify-center
          w-12 h-12 rounded-full transition-all duration-200 group
          ${disabled 
            ? 'cursor-not-allowed' 
            : 'hover:scale-105 active:scale-95 cursor-pointer'
          }
          shadow-lg hover:shadow-xl
        `}
        style={{
          backgroundColor: disabled ? 'var(--color-surface-inactive)' : 'var(--color-danger)',
        }}
        title="Emergency SOS - Click for immediate help"
      >
        <FaExclamationTriangle className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
        
        {/* Pulsing ring animation - only on hover */}
        {!disabled && (
          <div className="absolute inset-0 rounded-full opacity-20 group-hover:animate-ping" style={{ backgroundColor: 'var(--color-danger)' }}></div>
        )}
      </button>

      {/* SOS Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card w-full max-w-lg max-h-screen overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-6 rounded-t-xl" style={{ background: 'linear-gradient(to right, var(--color-danger), #DC2626)', color: 'var(--color-text-inverse)' }}>
              <div className="flex items-center justify-between">
              <div className="flex items-center">
                  <FaExclamationTriangle className="text-2xl mr-4" />
                  <h2 className="text-2xl font-bold">Emergency SOS</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="transition-colors text-xl hover:opacity-80"
                style={{ color: 'var(--color-text-inverse)' }}
              >
                <FaTimes />
              </button>
              </div>
              <p className="mt-3 font-medium opacity-90">
                Send an emergency alert to get immediate assistance
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Emergency Type Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Emergency Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {emergencyTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedEmergencyType(type.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedEmergencyType === type.value
                            ? 'shadow-md'
                            : 'hover:shadow-sm'
                        }`}
                        style={{
                          borderColor: selectedEmergencyType === type.value ? 'var(--color-danger)' : 'var(--color-border-standard)',
                          backgroundColor: selectedEmergencyType === type.value ? '#FEE2E2' : 'var(--color-surface-primary)'
                        }}
                      >
                        <div className="flex items-center">
                          <Icon className="text-xl mr-3" style={{ color: type.color }} />
                          <div className="text-left">
                            <p className="font-semibold" style={{ color: 'var(--color-text-body)' }}>{type.label}</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Level */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Priority Level</h3>
                <div className="space-y-3">
                  {priorityLevels.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setPriorityLevel(priority.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        priorityLevel === priority.value
                          ? 'shadow-md'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        borderColor: priorityLevel === priority.value ? 'var(--color-danger)' : 'var(--color-border-standard)',
                        backgroundColor: priorityLevel === priority.value ? '#FEE2E2' : 'var(--color-surface-primary)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-semibold" style={{ color: 'var(--color-text-body)' }}>{priority.label}</p>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{priority.description}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs font-bold" style={priority.color}>
                          {priority.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Additional Details</h3>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Describe the emergency situation (optional)"
                  className="input w-full resize-none font-medium"
                  rows="3"
                />
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>Location Information</h3>
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                  <div className="flex items-center mb-2">
                    <FaMapMarkerAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                    <span className="font-semibold" style={{ color: 'var(--color-text-body)' }}>GPS Location</span>
                  </div>
                  {currentLocation ? (
                    <div className="text-sm space-y-1">
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        Latitude: {currentLocation.latitude.toFixed(6)}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        Longitude: {currentLocation.longitude.toFixed(6)}
                      </p>
                      <p style={{ color: 'var(--color-success)' }}>✓ Location detected</p>
                    </div>
                  ) : locationError ? (
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-warning)' }}>{locationError}</p>
                      <button
                        onClick={getLocation}
                        className="mt-2 btn btn-ghost text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Getting your location...</p>
                  )}
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendAlert}
                disabled={isLoading}
                className="btn w-full text-lg font-bold py-4"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--color-text-inverse)',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Sending Alert...' : 'Send Emergency Alert'}
              </button>

              {/* Warning */}
              <div className="border rounded-xl p-4" style={{ backgroundColor: '#FEF3C7', borderColor: 'var(--color-warning)' }}>
                <div className="flex items-center">
                  <FaExclamationTriangle style={{ color: 'var(--color-warning)' }} className="mr-3" />
                  <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>Emergency Use Only</span>
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-warning)' }}>
                  Only use this for genuine emergencies. False alerts may result in penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSButton;
