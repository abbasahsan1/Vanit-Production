import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, 
  FaBus, 
  FaUser, 
  FaUsers, 
  FaTrash, 
  FaSignOutAlt, 
  FaArrowLeft, 
  FaExclamationTriangle,
  FaUserCircle,
  FaSearch,
  FaEdit
} from "react-icons/fa";

const DeleteStudent = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // ✅ Fetch Student Data
  useEffect(() => {
    document.title = "Delete Student – Admin Panel";
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/');
        return;
      }

      console.log('🔄 Fetching students...');
      const response = await axios.get("http://localhost:5000/api/admin/students");
      console.log("✅ Students fetched:", response.data);
      
      if (Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        console.error("❌ Unexpected response format:", response.data);
        setStudents([]);
      }
    } catch (error) {
      console.error("❌ Error fetching students:", error);
      setError(`Failed to load students: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Delete Student
  const handleDelete = async (student) => {
    const confirmMessage = `Are you sure you want to delete student "${student.first_name} ${student.last_name}"?\n\nRegistration: ${student.registration_number}\nRoute: ${student.route_name}\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      console.log(`🔄 Deleting student: ${student.first_name} ${student.last_name}`);
      const response = await axios.delete(`http://localhost:5000/api/admin/students/delete/${student.first_name}`);
      console.log("✅ Student Deleted:", response.data);
      
      alert(`Student "${student.first_name} ${student.last_name}" deleted successfully!`);

      // ✅ Remove student from list
      setStudents(prev => prev.filter(s => s.registration_number !== student.registration_number));
    } catch (error) {
      console.error("❌ Error deleting student:", error);
      alert(`Error deleting student: ${error.response?.data?.message || error.message}`);
    }
  };

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.stop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  return (
    <div className="admin-view">
      
      {/* ✅ Navigation Bar */}
      <nav className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid var(--color-border-standard)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-heading)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div className="flex items-center">
              <img src="/2.png" alt="Logo" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Capital University of Science and Technology</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaHome className="mr-2 inline" /> Dashboard
            </Link>
            <Link to="/routes" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaBus className="mr-2 inline" /> Routes
            </Link>
            <Link to="/captain-list" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaUser className="mr-2 inline" /> Captains
            </Link>
            <Link to="/student-list" className="transition-colors font-medium" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaUsers className="mr-2 inline" /> Students
            </Link>

            {/* ✅ Manage Student Dropdown */}
            <div className="relative group">
              <button className="transition-colors font-medium flex items-center" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
                <FaUsers className="mr-2" /> Manage Students
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute hidden group-hover:block rounded-xl p-2 w-48 z-50 border right-0" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
                <Link to="/edit-student" className="block p-3 rounded-lg transition-colors flex items-center" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <FaEdit className="mr-3 icon-ui" /> Edit Student
                </Link>
                <div className="block p-3 rounded-lg flex items-center" style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-surface-inactive)' }}>
                  <FaTrash className="mr-3" /> Delete Student
                </div>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={toggleProfileDropdown}
                className="transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-text-heading)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                <FaUserCircle className="text-xl" />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-50 border" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 transition-colors"
                    style={{ color: 'var(--color-text-body)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <FaSignOutAlt className="mr-3 text-sm" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-danger)' }}>
                  <FaTrash className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Delete Student</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Remove students from the system permanently</p>
                </div>
              </div>
              
              <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--color-bg-warning)', borderColor: 'var(--color-warning)' }}>
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2" style={{ color: 'var(--color-warning)' }} />
                  <span className="font-medium" style={{ color: 'var(--color-text-inverse)' }}>
                    Deletion is permanent and cannot be undone
                  </span>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                Search Students
              </label>
              <div className="relative max-w-md">
                <FaSearch className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by name, registration, route, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pl-10"
                />
              </div>
              {searchTerm && (
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} matching "{searchTerm}"
                </p>
              )}
            </div>
          </div>

          {/* Student List */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Students List ({filteredStudents.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <p style={{ color: 'var(--color-text-secondary)' }}>Loading students...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <FaExclamationTriangle className="text-6xl mx-auto mb-4 icon-alert" />
                <p className="text-lg mb-4" style={{ color: 'var(--color-danger)' }}>{error}</p>
                <button onClick={fetchStudents} className="btn btn-primary">
                  Retry
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center">
                <FaUsers className="text-6xl mx-auto mb-4 icon-ui" />
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
                  {searchTerm ? 'No students found' : 'No students available'}
                </p>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'No students are currently registered in the system'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Registration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Route & Stop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)' }}>
                    {filteredStudents.map((student, index) => (
                      <tr key={index} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-surface-primary)'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--color-text-body)' }}>
                          {student.registration_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {student.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: 'var(--color-text-body)' }}>
                            <div className="font-medium">{student.route_name || 'Not assigned'}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>{student.stop_name || 'No stop'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {student.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleDelete(student)} 
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: 'var(--color-danger)', color: 'var(--color-text-inverse)' }}
                            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.target.style.opacity = '1'}
                          >
                            <FaTrash className="mr-2" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudent;
