import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import UnifiedNavbar from "./UnifiedNavbar";
import { FaHome, FaBus, FaUser, FaSignOutAlt, FaUsers, FaEdit, FaTrash, FaHistory, FaEye } from "react-icons/fa";
import StudentAttendanceModal from './StudentAttendanceModal';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Student Management – Admin Panel";
  }, []);

  // ✅ Fetch Student Data from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get("http://localhost:5000/api/admin/students");
        console.log("✅ Students API Response:", response.data);
        setStudents(response.data);
      } catch (error) {
        console.error("❌ Error fetching students:", error);
        setError('Failed to load students. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleViewAttendance = (student) => {
    console.log(`📊 Viewing attendance for student:`, student);
    setSelectedStudent(student);
    setIsAttendanceModalOpen(true);
  };

  const handleCloseAttendanceModal = () => {
    setIsAttendanceModalOpen(false);
    setSelectedStudent(null);
  };

  // ✅ Handle Delete Student
  const handleDeleteStudent = async (student) => {
    const confirmMessage = `Are you sure you want to delete student "${student.first_name} ${student.last_name}"?\n\nRegistration: ${student.registration_number}\nRoute: ${student.route_name}\n\nThis action cannot be undone and will completely remove the student from the database.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      console.log(`🔄 Deleting student: ${student.first_name} ${student.last_name} (${student.registration_number})`);
      // ✅ Fixed: Use registration_number as unique identifier instead of first_name
      const response = await axios.delete(`http://localhost:5000/api/admin/student-management/students/delete/${encodeURIComponent(student.registration_number)}`);
      console.log("✅ Student Deleted:", response.data);
      
      alert(`Student "${student.first_name} ${student.last_name}" deleted successfully!`);

      // ✅ Remove student from list immediately
      setStudents(prev => prev.filter(s => s.registration_number !== student.registration_number));
    } catch (error) {
      console.error("❌ Error deleting student:", error);
      alert(`Error deleting student: ${error.response?.data?.error || error.response?.data?.message || error.message}`);
    }
  };

  // ✅ Logout Function
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* ✅ Student List Table */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="card p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Student Management</h1>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Total Students: {students.length}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 mr-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <span className="font-medium text-lg" style={{ color: 'var(--color-text-body)' }}>Loading students...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4" style={{ color: 'var(--color-danger)' }}>⚠️</div>
                <p className="text-lg mb-6 font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn btn-primary font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 icon-ui">📚</div>
                <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>No students registered yet.</p>
                <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>Students will appear here once they register.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b" style={{ backgroundColor: 'var(--color-surface-inactive)', borderColor: 'var(--color-border-standard)' }}>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Name</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Registration</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Semester</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Route</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Stop</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Contact</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Emergency</th>
                      <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Address</th>
                      <th className="text-center p-4 font-semibold" style={{ color: 'var(--color-text-body)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-standard)' }}>
                    {students.map((student, index) => (
                      <tr key={student.id || index} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                        <td className="p-4">
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{student.first_name} {student.last_name}</div>
                          </div>
                        </td>
                        <td className="p-4 font-medium" style={{ color: 'var(--color-text-body)' }}>{student.registration_number}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.semester}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.route_name}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.stop_name}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.phone}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.emergency_contact}</td>
                        <td className="p-4" style={{ color: 'var(--color-text-body)' }}>{student.address}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewAttendance(student)}
                              className="btn btn-primary text-sm font-semibold flex items-center"
                              title="View Attendance History"
                            >
                              <FaHistory className="mr-1" />
                              Attendance
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student)}
                              className="btn btn-danger text-sm font-semibold flex items-center"
                              title="Delete Student"
                            >
                              <FaTrash className="mr-1" />
                              Delete
                            </button>
                          </div>
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

      {/* Student Attendance Modal */}
      <StudentAttendanceModal
        student={selectedStudent}
        isOpen={isAttendanceModalOpen}
        onClose={handleCloseAttendanceModal}
      />
    </div>
  );
};

export default StudentList;
