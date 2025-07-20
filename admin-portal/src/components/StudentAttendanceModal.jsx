import React, { useState, useEffect } from 'react';
import { 
  FaHistory, 
  FaBus, 
  FaClock, 
  FaCalendarAlt, 
  FaRoute, 
  FaUser, 
  FaTimes, 
  FaTrash,
  FaExclamationTriangle,
  FaSync
} from 'react-icons/fa';
import axios from 'axios';

const StudentAttendanceModal = ({ student, isOpen, onClose }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    limit: 50
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    recordId: null,
    recordInfo: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      fetchAttendanceHistory();
    }
  }, [isOpen, student, filters]);

  const fetchAttendanceHistory = async () => {
    if (!student || !student.id) {
      console.error('❌ No student or student.id provided:', student);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `http://localhost:5000/api/admin/students/${student.id}/attendance?${params}`;
      console.log(`📊 Admin fetching attendance from URL: ${url}`);
      console.log(`📊 Student data:`, student);

      const token = localStorage.getItem('adminToken');
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 Admin attendance API response:`, response.data);

      if (response.data.success) {
        setAttendanceHistory(response.data.data);
        console.log(`✅ Successfully loaded ${response.data.data.length} attendance records for ${student.first_name} ${student.last_name}`);
      } else {
        setError('Failed to fetch attendance history: ' + (response.data.error || 'Unknown error'));
        console.error('❌ API returned success: false', response.data);
      }
    } catch (err) {
      console.error('❌ Detailed error fetching attendance history:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setError(`Failed to load attendance history: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = (record) => {
    setDeleteModal({
      isOpen: true,
      recordId: record.id,
      recordInfo: {
        date: formatDateTime(record.scan_timestamp).date,
        time: formatDateTime(record.scan_timestamp).time,
        route: record.route_name,
        captain: `${record.captain_first_name} ${record.captain_last_name}`
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.recordId) return;

    setIsDeleting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.delete(
        `http://localhost:5000/api/admin/attendance/${deleteModal.recordId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Remove the deleted record from the local state
        setAttendanceHistory(prev => 
          prev.filter(record => record.id !== deleteModal.recordId)
        );
        
        // Show success notification
        showNotification('Attendance record deleted successfully', 'success');
        
        // Close delete modal
        setDeleteModal({ isOpen: false, recordId: null, recordInfo: null });
      } else {
        showNotification('Failed to delete attendance record', 'error');
      }
    } catch (err) {
      console.error('Error deleting attendance record:', err);
      showNotification(`Failed to delete record: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isValid) => {
    return isValid ? 'Valid' : 'Invalid';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <FaHistory className="mr-3" />
                Attendance History
              </h2>
              <p className="text-blue-100 mt-1">
                {student.first_name} {student.last_name} ({student.registration_number})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit
                </label>
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={20}>20 records</option>
                  <option value={50}>50 records</option>
                  <option value={100}>100 records</option>
                  <option value={200}>200 records</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAttendanceHistory}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto max-h-96 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600">Loading attendance history...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <FaHistory className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={fetchAttendanceHistory}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <FaHistory className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No attendance records found</p>
                <p className="text-sm text-gray-500 mt-1">
                  This student hasn't scanned any QR codes yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceHistory.map((record, index) => {
                  const dateTime = formatDateTime(record.scan_timestamp);
                  
                  return (
                    <div
                      key={record.id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <FaBus className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {record.route_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Captain: {record.captain_first_name} {record.captain_last_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`text-sm font-medium ${getStatusColor(record.is_valid)}`}>
                            {getStatusText(record.is_valid)}
                          </div>
                          <button
                            onClick={() => handleDeleteClick(record)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Delete this attendance record"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>{dateTime.date}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaClock className="mr-2 text-gray-400" />
                          <span>{dateTime.time}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FaRoute className="mr-2 text-gray-400" />
                          <span>{record.scan_type || 'Boarding'}</span>
                        </div>
                        {record.session_id && (
                          <div className="flex items-center text-gray-600">
                            <FaUser className="mr-2 text-gray-400" />
                            <span>Session: {record.session_id.substring(0, 8)}...</span>
                          </div>
                        )}
                      </div>

                      {record.location_lat && record.location_lng && (
                        <div className="mt-2 text-xs text-gray-500">
                          Location: {parseFloat(record.location_lat).toFixed(4)}, {parseFloat(record.location_lng).toFixed(4)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {attendanceHistory.length > 0 && (
            <div className="border-t bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Total Records: {attendanceHistory.length}
                </span>
                <span className="text-sm text-gray-600">
                  Valid Scans: {attendanceHistory.filter(record => record.is_valid).length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-75 z-60"></div>
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Delete Attendance Record
                    </h3>
                    <p className="text-sm text-gray-600">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Student:</strong> {student.first_name} {student.last_name}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Date:</strong> {deleteModal.recordInfo?.date}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Time:</strong> {deleteModal.recordInfo?.time}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Route:</strong> {deleteModal.recordInfo?.route}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Captain:</strong> {deleteModal.recordInfo?.captain}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setDeleteModal({ isOpen: false, recordId: null, recordInfo: null })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Delete Record
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default StudentAttendanceModal;
