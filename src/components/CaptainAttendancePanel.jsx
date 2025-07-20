import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaClock, FaMapMarkedAlt, FaRoute } from 'react-icons/fa';
import axios from 'axios';
import { io } from 'socket.io-client';

const CaptainAttendancePanel = ({ captainId, routeName }) => {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [socket, setSocket] = useState(null);
  const [rideActive, setRideActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAttendanceTracking();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [captainId, routeName]);

  const initializeAttendanceTracking = async () => {
    try {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Join captain room for real-time updates
      if (captainId) {
        newSocket.emit('subscribe_captain', captainId);
        console.log(`📡 Subscribed to captain room: captain:${captainId}`);
      }

      // Listen for attendance updates
      newSocket.on('attendance_update', (data) => {
        console.log('📡 Received attendance update:', data);
        if (data.data && data.data.routeName === routeName) {
          setRecentScans(prev => [{
            student_name: data.data.studentName,
            registration_number: data.data.registrationNumber,
            stop_name: data.data.stopName,
            scan_time: data.data.scanTimestamp
          }, ...prev.slice(0, 4)]); // Keep last 5 scans
          setAttendanceCount(data.data.studentsOnboard);
          
          // Show notification
          showNotification(`${data.data.studentName} marked attendance`, 'success');
        }
      });

      // Listen for ride status updates
      newSocket.on('ride_status_update', (data) => {
        if (data.captainId === captainId) {
          setRideActive(data.isActive);
          if (!data.isActive) {
            // Ride ended - reset attendance count but keep history
            setAttendanceCount(0);
          }
        }
      });

      // Load current ride status and attendance
      await loadCurrentData();
      
      // Set up interval for auto-refresh every 15 seconds
      const dataRefreshInterval = setInterval(loadCurrentData, 15000);
      
      setLoading(false);

      // Return cleanup function that includes interval
      return () => {
        clearInterval(dataRefreshInterval);
      };

    } catch (error) {
      console.error('Error initializing attendance tracking:', error);
      setLoading(false);
    }
  };

  const loadCurrentData = async () => {
    try {
      // Check if captain has active ride
      const phone = localStorage.getItem('captainPhone');
      if (!phone) return;

      const captainResponse = await axios.post("http://localhost:5000/api/auth/captains/check-phone", { phone });
      const isRideActive = captainResponse.data.isActive;
      setRideActive(isRideActive);

      // If ride is active, get current attendance count
      if (isRideActive && captainId) {
        try {
          const attendanceResponse = await axios.get(`http://localhost:5000/api/attendance/captain/${captainId}/current-attendance`);
          if (attendanceResponse.data.success) {
            setAttendanceCount(attendanceResponse.data.count || 0);
            setRecentScans(attendanceResponse.data.recentScans || []);
            console.log(`📊 Loaded current attendance: ${attendanceResponse.data.count} students`);
          }
        } catch (error) {
          console.log('No attendance data available yet:', error);
          setAttendanceCount(0);
          setRecentScans([]);
        }
      } else {
        setAttendanceCount(0);
        setRecentScans([]);
      }
    } catch (error) {
      console.error('Error loading current data:', error);
    }
  };

  const showNotification = (message, type) => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white shadow-lg transition-all duration-300`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <FaUsers className="mr-3 text-blue-600" />
        Live Attendance Tracking
      </h2>

      {/* Ride Status */}
      <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaMapMarkedAlt className="text-xl text-blue-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Ride Status</p>
              <p className="text-sm text-gray-600">
                {rideActive ? 'Students can scan QR codes to mark attendance' : 'Start your ride to enable attendance tracking'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${rideActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className={`font-semibold text-sm ${rideActive ? 'text-green-600' : 'text-gray-600'}`}>
              {rideActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {rideActive ? (
        <>
          {/* Attendance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaUsers className="text-xl text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Students Attended</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center">
                <FaRoute className="text-xl text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Current Route</p>
                  <p className="text-lg font-semibold text-green-600">{routeName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          {recentScans.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
              <div className="space-y-3">
                {recentScans.map((scan, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaCheckCircle className="text-green-600 mr-2" />
                        <span className="font-medium text-gray-900">{scan.student_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="mr-1" />
                        {formatTime(scan.scan_time)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Registration: {scan.registration_number}</p>
                      <p>Stop: {scan.stop_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FaUsers className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Scans</h3>
              <p className="text-gray-600">Students will appear here when they scan QR codes</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <FaMapMarkedAlt className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ride Not Active</h3>
          <p className="text-gray-600">Start your ride to begin tracking attendance</p>
        </div>
      )}
    </div>
  );
};

export default CaptainAttendancePanel;
