import React, { useState, useEffect } from 'react';
import { FaHistory, FaBus, FaClock, FaCalendarAlt, FaRoute, FaUser } from 'react-icons/fa';
import axios from 'axios';

const AttendanceHistory = ({ studentId }) => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    limit: 20
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [studentId, filters]);

  const fetchAttendanceHistory = async () => {
    if (!studentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await axios.get(
        `http://localhost:5000/api/attendance/student/${studentId}/history?${params}`
      );

      if (response.data.success) {
        setAttendanceHistory(response.data.data);
      } else {
        setError('Failed to fetch attendance history');
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history');
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getStatusColor = (isValid) => {
    return isValid ? 'var(--color-success)' : 'var(--color-danger)';
  };

  const getStatusText = (isValid) => {
    return isValid ? 'Valid' : 'Invalid';
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading attendance history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaHistory className="text-2xl mr-3" style={{ color: 'var(--color-primary-action)' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Attendance History</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Track your bus ride attendance records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>Filters</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                From Date
              </label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                To Date
              </label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                Limit
              </label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="input w-full"
              >
                <option value={10}>10 records</option>
                <option value={20}>20 records</option>
                <option value={50}>50 records</option>
                <option value={100}>100 records</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Records ({attendanceHistory.length})
          </h2>
        </div>
        
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <FaHistory className="text-4xl mx-auto mb-4 icon-ui" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Error Loading Data</h3>
              <p className="mb-4" style={{ color: 'var(--color-danger)' }}>{error}</p>
              <button
                onClick={fetchAttendanceHistory}
                className="btn btn-primary font-medium"
              >
                Try Again
              </button>
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-8">
              <FaHistory className="text-4xl mx-auto mb-4 icon-ui" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>No Records Found</h3>
              <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>No attendance records found for the selected criteria</p>
              <p className="text-sm" style={{ color: 'var(--color-text-placeholder)' }}>
                Start scanning QR codes to build your attendance history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceHistory.map((record, index) => {
                const dateTime = formatDateTime(record.scan_timestamp);
                
                return (
                  <div
                    key={record.id || index}
                    className="border rounded-lg p-4 transition-shadow hover:shadow-sm"
                    style={{ borderColor: 'var(--color-border-standard)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full mr-3" style={{ backgroundColor: 'var(--color-bg-gradient-start)' }}>
                          <FaBus style={{ color: 'var(--color-primary-action)' }} />
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                            {record.route_name}
                          </h3>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Captain: {record.captain_first_name} {record.captain_last_name}
                          </p>
                        </div>
                      </div>
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: record.is_valid ? '#D1FAE5' : '#FEE2E2',
                          color: getStatusColor(record.is_valid)
                        }}
                      >
                        {getStatusText(record.is_valid)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2" style={{ color: 'var(--color-text-placeholder)' }} />
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>{dateTime.date}</p>
                          <p style={{ color: 'var(--color-text-secondary)' }}>Date</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="mr-2" style={{ color: 'var(--color-text-placeholder)' }} />
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>{dateTime.time}</p>
                          <p style={{ color: 'var(--color-text-secondary)' }}>Time</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaUser className="mr-2" style={{ color: 'var(--color-text-placeholder)' }} />
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>
                            {record.captain_first_name} {record.captain_last_name}
                          </p>
                          <p style={{ color: 'var(--color-text-secondary)' }}>Captain</p>
                        </div>
                      </div>
                    </div>

                    {record.location && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-standard)' }}>
                        <div className="flex items-center">
                          <FaRoute className="mr-2" style={{ color: 'var(--color-text-placeholder)' }} />
                          <div className="text-sm">
                            <p className="font-medium" style={{ color: 'var(--color-text-body)' }}>Location</p>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                              {record.location.latitude?.toFixed(6)}, {record.location.longitude?.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
