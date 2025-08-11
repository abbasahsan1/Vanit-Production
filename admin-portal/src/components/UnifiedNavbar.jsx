import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaList, 
  FaUser, 
  FaUsers, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUserCircle, 
  FaSignOutAlt,
  FaMapMarkedAlt,
  FaSatellite,
  FaQrcode,
  FaCommentDots,
  FaMoneyBill,
  FaExclamationTriangle
} from 'react-icons/fa';
import VanItLogo from './VanItLogo';
import NotificationBell from './NotificationBell';

const UnifiedNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCaptainDropdown, setShowCaptainDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowProfileDropdown(false);
        setShowCaptainDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to check if current route is active
  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  return (
    <nav className="global-header px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <VanItLogo className="w-10 h-10" />
          <h1 className="text-xl font-semibold nav-link">
            Capital University of Science and Technology
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          <Link 
            to="/dashboard" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/dashboard') ? 'opacity-100' : ''}`}
          >
            <FaHome className="mr-2" /> Home
          </Link>
          
          <Link 
            to="/routes" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/routes') ? 'opacity-100' : ''}`}
          >
            <FaList className="mr-2" /> Routes
          </Link>
          
          {/* Captain Management Dropdown */}
          <div className="relative dropdown-container">
            <button 
              onClick={() => setShowCaptainDropdown(!showCaptainDropdown)}
              className="nav-link hover:opacity-80 transition-opacity font-medium flex items-center"
            >
              <FaUser className="mr-2" /> Captains
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCaptainDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50" style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border-standard)' }}>
                <Link
                  to="/captain-list"
                  className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-body)' }}
                  onClick={() => setShowCaptainDropdown(false)}
                >
                  <FaUsers className="mr-3 text-sm" /> View / Assign Routes
                </Link>
                <Link
                  to="/add-captain"
                  className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-body)' }}
                  onClick={() => setShowCaptainDropdown(false)}
                >
                  <FaPlus className="mr-3 text-sm" /> Add 
                </Link>
                <Link
                  to="/edit-captain"
                  className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-body)' }}
                  onClick={() => setShowCaptainDropdown(false)}
                >
                  <FaEdit className="mr-3 text-sm" /> Edit 
                </Link>
                <Link
                  to="/delete-captain"
                  className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-body)' }}
                  onClick={() => setShowCaptainDropdown(false)}
                >
                  <FaTrash className="mr-3 text-sm" /> Delete 
                </Link>
              </div>
            )}
          </div>
          
          <Link 
            to="/student-list" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/student-list') ? 'opacity-100' : ''}`}
          >
            <FaUsers className="mr-2" /> Students
          </Link>
          
          <Link 
            to="/route-monitor" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/route-monitor') ? 'opacity-100' : ''}`}
          >
            <FaSatellite className="mr-2" /> Monitor
          </Link>
          
          <Link 
            to="/attendance-management" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/attendance-management') ? 'opacity-100' : ''}`}
          >
            <FaQrcode className="mr-2" /> Attendance
          </Link>
          
          <Link 
            to="/feedback-management" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/feedback-management') ? 'opacity-100' : ''}`}
          >
            <FaCommentDots className="mr-2" /> Feedback
          </Link>
          
          <Link 
            to="/invoice-management" 
            className={`nav-link hover:opacity-80 transition-opacity font-medium flex items-center ${isActiveRoute('/invoice-management') ? 'opacity-100' : ''}`}
          >
            <FaMoneyBill className="mr-2" /> Invoices
          </Link>
          
          <Link 
            to="/emergency-management" 
            className="nav-link hover:animate-pulse transition-all font-semibold flex items-center"
            style={{ color: 'var(--color-text-inverse)' }}
          >
            <FaExclamationTriangle className="mr-2" />  Emergency
          </Link>
          
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <div className="relative dropdown-container">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="nav-link hover:opacity-80 transition-opacity"
            >
              <FaUserCircle className="text-xl" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50" style={{ backgroundColor: 'var(--color-surface-primary)', border: '1px solid var(--color-border-standard)' }}>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 hover:opacity-80 transition-opacity"
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
  );
};

export default UnifiedNavbar; 