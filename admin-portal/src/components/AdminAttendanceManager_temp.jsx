import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaQrcode, FaRedo, FaPlay, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const AdminAttendanceManager = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [stats, setStats] = useState({
    totalAttended: 0,
    totalRegistered: 0,
    activeSessions: 0,
    attendanceRate: 0
  });
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setPageLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Initialize all data with Promise.all for better error handling
      const [statsResponse, sessionsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/attendance/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ error: 'Failed to load stats' })),
        
        axios.get('http://localhost:5000/api/admin/attendance/active-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ error: 'Failed to load sessions' }))
      ]);

      // Handle stats
      if (statsResponse.error) {
        console.warn('Stats loading failed:', statsResponse.error);
      } else if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Handle sessions
      if (sessionsResponse.error) {
        console.warn('Sessions loading failed:', sessionsResponse.error);
      } else if (sessionsResponse.data) {
        setActiveSessions(sessionsResponse.data);
      }

      setPageLoading(false);
    } catch (error) {
      console.error('Error initializing data:', error);
      setError('Failed to load attendance data. Please refresh the page.');
      setPageLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post(
        'http://localhost:5000/api/admin/attendance/generate-qr',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setQrCode(response.data.qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#B3D9FF] flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src="/2.png" alt="Logo" className="w-12 h-12 mr-3" />
          <h1 className="text-2xl font-bold text-orange-500">VAN<span className="text-blue-700">it!</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard" 
            className="text-blue-700 hover:text-blue-900 font-medium"
          >
            Dashboard
          </Link>
          <div className="relative group">
            <FaUserCircle className="text-3xl text-blue-700 cursor-pointer" />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {pageLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700 text-lg">Loading attendance data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !pageLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!pageLoading && !error && (
        <div className="p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Attended Today</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAttended}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Registered</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalRegistered}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Sessions</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.activeSessions}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibent text-gray-700 mb-2">Attendance Rate</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.attendanceRate}%</p>
            </div>
          </div>

          {/* QR Code Generation */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Generate QR Code</h2>
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaQrcode className="mr-2" />
                    Generate QR
                  </>
                )}
              </button>
            </div>
            
            {qrCode && (
              <div className="text-center">
                <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />
                <p className="text-gray-600">Scan this QR code to mark attendance</p>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Active Boarding Sessions</h2>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaRedo className="text-lg" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Captain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.route_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.captain_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(session.started_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.students_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaPlay className="mr-1" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceManager;
