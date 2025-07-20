import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaBell, 
  FaMapMarkerAlt, 
  FaClock, 
  FaToggleOn, 
  FaToggleOff,
  FaSave,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';

const NotificationSettings = ({ studentId, onClose }) => {
  const [preferences, setPreferences] = useState({
    enableLocationNotifications: true,
    notificationRadius: 2,
    notificationTimeThreshold: 5
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, [studentId]);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/notifications/student/${studentId}/location-preferences`);
      
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await axios.post(
        `http://localhost:5000/api/notifications/student/${studentId}/location-preferences`,
        preferences
      );
      
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="card p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto mb-4" style={{ border: '2px solid var(--color-primary-action)', borderTop: '2px solid transparent' }}></div>
            <p style={{ color: 'var(--color-text-body)' }}>Loading notification settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
            <FaBell className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center" style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}>
            <FaExclamationTriangle className="mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 rounded-lg flex items-center" style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}>
            <FaCheck className="mr-2" />
            <span className="text-sm">Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
                Location Notifications
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                Get notified when your bus is approaching
              </p>
            </div>
            <button
              onClick={() => updatePreference('enableLocationNotifications', !preferences.enableLocationNotifications)}
              className="text-2xl transition-colors"
              style={{ color: preferences.enableLocationNotifications ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
            >
              {preferences.enableLocationNotifications ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>

          {preferences.enableLocationNotifications && (
            <>
              {/* Distance Threshold */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                <div className="flex items-center mb-3">
                  <FaMapMarkerAlt className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                    Distance Threshold
                  </h3>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-body)' }}>
                  Get notified when the bus is within this distance of your stop
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={preferences.notificationRadius}
                    onChange={(e) => updatePreference('notificationRadius', parseFloat(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-primary-action)' }}
                  />
                  <span className="font-semibold min-w-[3rem]" style={{ color: 'var(--color-primary-action)' }}>
                    {preferences.notificationRadius} km
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>0.5 km</span>
                  <span>10 km</span>
                </div>
              </div>

              {/* Time Threshold */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                <div className="flex items-center mb-3">
                  <FaClock className="mr-2" style={{ color: 'var(--color-primary-action)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                    Time Threshold
                  </h3>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-body)' }}>
                  Get notified when the bus is this many minutes away from your stop
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={preferences.notificationTimeThreshold}
                    onChange={(e) => updatePreference('notificationTimeThreshold', parseInt(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: 'var(--color-primary-action)' }}
                  />
                  <span className="font-semibold min-w-[3rem]" style={{ color: 'var(--color-primary-action)' }}>
                    {preferences.notificationTimeThreshold} min
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>1 min</span>
                  <span>30 min</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-info)', color: 'var(--color-text-inverse)' }}>
                <h4 className="font-semibold mb-2">📱 You will be notified when:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Bus is within {preferences.notificationRadius} km of your stop</li>
                  <li>• Bus is approximately {preferences.notificationTimeThreshold} minutes away</li>
                  <li>• Both conditions are met (high priority alert)</li>
                </ul>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex space-x-3">
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="flex-1 btn btn-primary flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 mr-2 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost px-6"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
