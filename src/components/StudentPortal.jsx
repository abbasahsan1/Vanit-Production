import React, { useState, useEffect } from 'react';
import { FaBars, FaBell, FaUserCircle, FaSignOutAlt, FaArrowLeft, FaMapMarkedAlt, FaHistory, FaHome, FaUser, FaCommentDots, FaMoneyBill, FaQrcode, FaClipboardList } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from "axios";
import VanItLogo from './VanItLogo';

import SOSButton from './SOSButton';
import SOSTracker from './SOSTracker';
import NotificationManager from './NotificationManager';
import StudentInvoices from './Student/StudentInvoices';
import StudentFeedback from './Student/StudentFeedback';
import QRScanner from './QRScanner';
import AttendanceHistory from './AttendanceHistory';

const StudentPortal = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoiceSummary, setInvoiceSummary] = useState({ unpaid: 0, total: 0, amount: 0 });
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [studentData, setStudentData] = useState({ first_name: '', registration_number: '', id: null });

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    if (showProfileDropdown) setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    if (showSidebar) setShowSidebar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/landing-page');
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const fetchStudentData = async () => {
      const email = localStorage.getItem("studentEmail");
      if (!email) return;
  
      try {
        const res = await axios.post("http://localhost:5000/api/get-student-by-email", { email });
        if (res.status === 200) {
          const studentData = {
            id: res.data.id,
            first_name: res.data.first_name,
            last_name: res.data.last_name || '',
            registration_number: res.data.registration_number,
            route_name: res.data.route_name,
            stop_name: res.data.stop_name,
            phone: res.data.phone || '',
            emergency_contact: res.data.emergency_contact || ''
          };
          setStudentData(studentData);
          console.log('✅ Student data loaded for SOS:', studentData);
          
          // Fetch invoice summary
          fetchInvoiceSummary(studentData.id);
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      }
    };

    const fetchInvoiceSummary = async (studentId) => {
      try {
        const response = await axios.get(`http://localhost:5000/api/invoices/student/${studentId}/invoices`);
        const invoices = response.data.data || [];
        
        const unpaidInvoices = invoices.filter(inv => ['pending', 'overdue', 'rejected'].includes(inv.status) && !inv.payment_method);
        const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        
        setInvoiceSummary({
          unpaid: unpaidInvoices.length,
          total: invoices.length,
          amount: totalAmount
        });
      } catch (error) {
        console.error('Error fetching invoice summary:', error);
      }
    };
  
    fetchStudentData();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <VanItLogo className="w-10 h-10" />
            <h1 className="text-xl font-semibold nav-link">
              Capital University of Science and Technology - Student Portal
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={toggleSidebar}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaBars className="mr-2" /> Menu
            </button>
            
            <Link 
              to="/student/bus-tracking" 
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaMapMarkedAlt className="mr-2" /> Bus Tracking
            </Link>

            <button
              onClick={() => setActiveTab('invoices')}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaMoneyBill className="mr-2" /> Invoices
            </button>

            <button
              onClick={() => setActiveTab('qr-scanner')}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaQrcode className="mr-2" /> Scan QR
            </button>

            <SOSButton 
              userType="student"
              userId={studentData.id}
              userData={studentData}
              onAlertSent={(alertData) => {
                console.log('SOS Alert sent from Student Portal:', alertData);
              }}
            />

            <button
              onClick={() => setActiveTab('attendance-history')}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaClipboardList className="mr-2" /> Attendance
            </button>

            <button
              onClick={() => setShowSOSTracker(true)}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
              title="View My SOS Alerts"
            >
              <FaHistory className="mr-2" /> My Alerts
            </button>

            <button className="nav-link hover:opacity-80 transition-opacity">
              <FaBell className="text-lg" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="nav-link hover:opacity-80 transition-opacity"
              >
                <FaUserCircle className="text-xl" />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50" style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border-standard)' }}>
                  <Link
                    to="/student/profile"
                    className="flex items-center px-4 py-2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <FaUser className="mr-3 text-sm" /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity text-left"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <FaSignOutAlt className="mr-3 text-sm" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full card shadow-lg transition-transform duration-300 z-40 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="p-6" style={{ borderBottom: '1px solid var(--color-border-standard)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>Menu</h2>
            <button
            onClick={toggleSidebar}
              className="icon-ui hover:opacity-80 transition-opacity"
            >
              <FaArrowLeft className="text-lg" />
            </button>
        </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-info)' }}>
              <FaUserCircle className="text-lg icon-inverse" />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{studentData.first_name}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{studentData.registration_number}</p>
            </div>
            </div>
          </div>

        <nav className="p-6">
          <ul className="space-y-2">
            <li>
              <Link to="/student/home" className="flex items-center px-3 py-2 rounded-lg transition-colors" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--color-info)'; e.target.style.color = 'var(--color-text-inverse)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-body)'; }}>
                <FaHome className="mr-3 text-sm" /> Home
              </Link>
            </li>
            <li>
              <Link to="/student/profile" className="flex items-center px-3 py-2 rounded-lg transition-colors" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--color-info)'; e.target.style.color = 'var(--color-text-inverse)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-body)'; }}>
                <FaUser className="mr-3 text-sm" /> Profile
              </Link>
            </li>
            <li>
              <Link to="/student/bus-tracking" className="flex items-center px-3 py-2 rounded-lg transition-colors" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--color-info)'; e.target.style.color = 'var(--color-text-inverse)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-body)'; }}>
                <FaMapMarkedAlt className="mr-3 text-sm" /> Bus Tracking
              </Link>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('attendance-history')}
                className="flex items-center w-full px-3 py-2 rounded-lg transition-colors text-left" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--color-info)'; e.target.style.color = 'var(--color-text-inverse)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-body)'; }}
              >
                <FaHistory className="mr-3 text-sm" /> Attendance History
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('invoices')}
                className="flex items-center w-full px-3 py-2 rounded-lg transition-colors text-left" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--color-info)'; e.target.style.color = 'var(--color-text-inverse)'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-text-body)'; }}
              >
                <FaMoneyBill className="mr-3 text-sm" /> Invoices
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {activeTab === 'dashboard' && (
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="card p-8 mb-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>Welcome back</h1>
                <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
                  Track your bus, manage attendance, and stay connected
                </p>
          </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Your Route</h3>
                  <p style={{ color: 'var(--color-text-body)' }}>{studentData.route_name || 'Not assigned'}</p>
                </div>
                <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Your Stop</h3>
                  <p style={{ color: 'var(--color-text-body)' }}>{studentData.stop_name || 'Not assigned'}</p>
                </div>
                <div className="card-info rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FaMoneyBill className="mr-2" />
                    Invoices
                  </h3>
                  {invoiceSummary.unpaid > 0 ? (
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-danger)' }}>{invoiceSummary.unpaid} Unpaid</p>
                      <p className="font-bold" style={{ color: 'var(--color-danger)' }}>PKR {invoiceSummary.amount.toFixed(2)} Due</p>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className="mt-2 text-sm btn btn-primary px-3 py-1"
                      >
                        Pay Now
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: 'var(--color-success)' }}>All Paid</p>
                      <p style={{ color: 'var(--color-text-body)' }}>{invoiceSummary.total} Total</p>
                      <button
                        onClick={() => setActiveTab('invoices')}
                        className="mt-2 text-sm btn btn-primary px-3 py-1"
                      >
                        View All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Actions */}
              <div className="space-y-4">
              <Link 
                to="/student/bus-tracking" 
                className="btn btn-primary flex items-center justify-center w-full px-6 py-4 text-lg font-semibold"
              >
                  <FaMapMarkedAlt className="mr-3 text-xl" />
                <span>Track My Bus</span>
              </Link>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('qr-scanner')}
                  className="btn btn-ghost flex items-center justify-center px-6 py-4"
                >
                  <FaQrcode className="mr-3 text-xl" />
                  <span className="text-lg font-semibold">Scan QR Code</span>
                </button>

                <button
                  onClick={() => setActiveTab('attendance-history')}
                  className="btn btn-ghost flex items-center justify-center px-6 py-4"
                >
                  <FaHistory className="mr-3 text-xl" />
                  <span className="text-lg font-semibold">Attendance History</span>
                </button>

                <button
                  onClick={() => setActiveTab('feedback')}
                  className="btn btn-ghost flex items-center justify-center px-6 py-4"
                >
                    <FaCommentDots className="mr-3 text-xl" />
                  <span className="text-lg font-semibold">Feedback</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="btn btn-ghost flex items-center justify-center px-6 py-4"
                >
                    <FaMoneyBill className="mr-3 text-xl" />
                  <span className="text-lg font-semibold">Invoices</span>
                </button>
                </div>
            </div>
          </div>
        </div>
        )}
        


        {/* QR Scanner */}
        {activeTab === 'qr-scanner' && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center font-medium transition-colors"
                style={{ color: 'var(--color-text-link)' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <QRScanner 
              studentId={studentData.id} 
              onClose={() => setActiveTab('dashboard')}
              onScanSuccess={(data) => {
                console.log('QR scan successful:', data);
              }}
            />
          </div>
        )}

        {/* Attendance History */}
        {activeTab === 'attendance-history' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center font-medium transition-colors"
                style={{ color: 'var(--color-text-link)' }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <AttendanceHistory studentId={studentData.id} />
          </div>
        )}

        {/* Student Invoices */}
        {activeTab === 'invoices' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <StudentInvoices studentId={studentData.id} />
          </div>
        )}

        {/* Student Feedback */}
        {activeTab === 'feedback' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </button>
            </div>
            <StudentFeedback />
          </div>
        )}
      </div>

      {/* Enhanced Notification Manager */}
      <NotificationManager 
        socket={socket}
        userType="student"
        userId={studentData.id}
      />

      {/* SOS Tracker Modal */}
      {showSOSTracker && (
        <SOSTracker 
          userType="student"
          userId={studentData.id}
          onClose={() => setShowSOSTracker(false)}
        />
      )}
    </div>
  );
};

export default StudentPortal;
