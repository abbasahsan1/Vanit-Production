import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBus, FaUser, FaUsers, FaEdit, FaTrash, FaSignOutAlt, FaSave, FaTimes, FaArrowLeft } from "react-icons/fa";

const EditStudent = () => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/students");
        setStudents(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error fetching students:", error);
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleEditClick = (student) => {
    if (!student.first_name) {
      console.error("❌ Student First Name is missing in selected student!");
      return;
    }
    setEditingStudent(student);
    setUpdatedData(student);
  };

  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!editingStudent || !editingStudent.first_name) {
      console.error("❌ Student First Name is missing!");
      return;
    }
  
    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/students/update/${editingStudent.first_name}`, 
        updatedData
      );
  
      console.log("✅ Student Updated:", response.data);
      alert("Student updated successfully!");
  
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.first_name === editingStudent.first_name ? updatedData : student
        )
      );
  
      setEditingStudent(null);
    } catch (error) {
      console.error("❌ Error updating student:", error);
      alert("Error updating student.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  return (
    <div className="admin-view">
      {/* Navigation Bar */}
      <nav className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid var(--color-border-standard)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="transition-colors flex items-center space-x-2" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaHome className="text-lg" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/routes" className="transition-colors flex items-center space-x-2" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaBus className="text-lg" />
              <span className="font-medium">Routes</span>
            </Link>
            <Link to="/captain-list" className="transition-colors flex items-center space-x-2" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaUser className="text-lg" />
              <span className="font-medium">Captains</span>
            </Link>
            <Link to="/student-list" className="transition-colors flex items-center space-x-2" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
              <FaUsers className="text-lg" />
              <span className="font-medium">Students</span>
            </Link>

            {/* Manage Student Dropdown */}
            <div className="relative group">
              <button className="transition-colors flex items-center space-x-2" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}>
                <FaUsers className="text-lg" />
                <span className="font-medium">Manage Student</span>
                <span className="text-xs">▼</span>
              </button>
              <div className="absolute hidden group-hover:block rounded-lg p-2 w-48 z-50 border" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', borderColor: 'var(--color-border-standard)' }}>
                <Link to="/edit-student" className="flex items-center px-3 py-2 rounded transition-colors" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <FaEdit className="mr-2 text-sm" /> Edit Student
                </Link>
                <Link to="/delete-student" className="flex items-center px-3 py-2 rounded transition-colors" style={{ color: 'var(--color-text-body)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <FaTrash className="mr-2 text-sm" /> Delete Student
                </Link>
              </div>
            </div>
          </div>

          <div className="relative profile-dropdown">
            <button 
              onClick={toggleProfileDropdown}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-heading)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              <FaUser className="text-xl" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-50 border" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
                <Link
                  to="/admin/profile"
                  className="flex items-center px-4 py-2 transition-colors"
                  style={{ color: 'var(--color-text-body)' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaUser className="mr-3 text-sm" /> Profile
                </Link>
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
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Edit Student</h1>
            <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Manage student information and details</p>
          </div>

          <div className="card-content">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading students...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>No students available for editing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border-standard)' }}>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>First Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Last Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Reg. No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Stop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)' }}>
                    {students.map((student, index) => (
                      <tr key={index} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.first_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.last_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.registration_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.semester}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.route_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.stop_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-heading)' }}>{student.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => handleEditClick(student)} 
                            className="btn btn-primary px-3 py-1"
                          >
                            <FaEdit />
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--color-overlay-dark)' }}>
          <div className="p-8 rounded-xl w-full max-w-md mx-4 card" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Edit Student</h2>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-2xl transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--color-text-body)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                <FaTimes />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>First Name</label>
                <input 
                  type="text" 
                  name="first_name" 
                  value={updatedData.first_name || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="First Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Last Name</label>
                <input 
                  type="text" 
                  name="last_name" 
                  value={updatedData.last_name || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Last Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Registration Number</label>
                <input 
                  type="text" 
                  name="registration_number" 
                  value={updatedData.registration_number || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Registration Number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Semester</label>
                <input 
                  type="text" 
                  name="semester" 
                  value={updatedData.semester || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Semester"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Route</label>
                <input 
                  type="text" 
                  name="route_name" 
                  value={updatedData.route_name || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Route"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Stop</label>
                <input 
                  type="text" 
                  name="stop_name" 
                  value={updatedData.stop_name || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Stop"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Phone</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={updatedData.phone || ''} 
                  onChange={handleChange} 
                  className="input w-full"
                  placeholder="Phone"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="btn btn-primary flex-1 font-semibold"
                >
                  <FaSave className="inline mr-2" />
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="btn btn-secondary flex-1 font-semibold"
                >
                  <FaTimes className="inline mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStudent;
