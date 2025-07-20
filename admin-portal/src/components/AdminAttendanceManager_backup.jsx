import React, { useState, useEffect } from 'react';
import { FaQrcode, FaUsers, FaChartBar, FaDownload, FaRedo, FaPlay, FaStop, FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAttendanceManager = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [qrCodes, setQrCodes] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({
    totalStudents: 0,
    todayScans: 0
  });
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setPageLoading(true);
        setError(null);
        await Promise.all([
          fetchRoutes(),
          fetchActiveSessions(),
          fetchAttendanceStats()
        ]);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setPageLoading(false);
      }
    };

    initializeData();
  }, []);

  // ✅ Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      setRoutes(response.data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/active-sessions');
      setActiveSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      setActiveSessions([]);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/statistics');
      setAttendanceStats(response.data || {
        totalStudents: 0,
        todayScans: 0
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      setAttendanceStats({
        totalStudents: 0,
        todayScans: 0
      });
    }
  };

  const generateQRCode = async (routeName) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/attendance/generate-qr', {
        routeName,
        adminGenerated: true
      });
      
      setQrCodes(prev => ({
        ...prev,
        [routeName]: {
          code: response.data.qrCode,
          expiresAt: response.data.expiresAt,
          generatedAt: new Date().toISOString()
        }
      }));
      
      alert(`QR Code generated for route: ${routeName}`);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (routeName) => {
    const qrData = qrCodes[routeName];
    if (!qrData) return;

    // Create a downloadable QR code (this is a simplified version)
    const qrText = `VanIt Route: ${routeName}\nQR Code: ${qrData.code}\nGenerated: ${new Date(qrData.generatedAt).toLocaleString()}`;
    
    const element = document.createElement('a');
    const file = new Blob([qrText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `QR_Code_${routeName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadAttendanceReport = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/export', {
        params: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          routeName: selectedRoute || undefined
        }
      });
      
      const csvContent = response.data;
      const element = document.createElement('a');
      const file = new Blob([csvContent], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download attendance report');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <FaQrcode className="mr-3 text-blue-600" />
          Attendance Management
        </h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaUsers className="text-2xl text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceStats.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaPlay className="text-2xl text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeSessions.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaChartBar className="text-2xl text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Today's Scans</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceStats.todayScans || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FaQrcode className="text-2xl text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Generated QRs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(qrCodes).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Generation */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">QR Code Generation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.route_name}>
                    {route.route_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => selectedRoute && generateQRCode(selectedRoute)}
                disabled={!selectedRoute || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <FaQrcode className="mr-2" />
                {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={downloadAttendanceReport}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Generated QR Codes */}
        {Object.keys(qrCodes).length > 0 && (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated QR Codes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(qrCodes).map(([routeName, qrData]) => (
                <div key={routeName} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{routeName}</h3>
                  
                  <div className="bg-gray-100 p-4 rounded-lg text-center mb-3">
                    <FaQrcode className="text-4xl text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">QR Code Ready</p>
                    <p className="text-xs text-gray-500">
                      Generated: {formatTime(qrData.generatedAt)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => downloadQRCode(routeName)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                    >
                      <FaDownload className="mr-2" />
                      Download
                    </button>
                    
                    <button
                      onClick={() => generateQRCode(routeName)}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center"
                    >
                      <FaRedo className="mr-2" />
                      Regenerate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Boarding Sessions</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
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
                      Students Boarded
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
