import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UnifiedNavbar from "./UnifiedNavbar";
import {
  FaUser,
  FaUsers,
  FaTrash,
  FaExclamationTriangle
} from "react-icons/fa";

const DeleteCaptain = () => {
  const [captains, setCaptains] = useState([]);
  const [captainToDelete, setCaptainToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch Captains Data
  useEffect(() => {
    const fetchCaptains = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/admin/student-management/captains");
        if (response.data && response.data.data) {
          setCaptains(response.data.data);
        } else if (Array.isArray(response.data)) {
          setCaptains(response.data);
        } else {
          setCaptains([]);
        }
      } catch (error) {
        console.error("❌ Error fetching captains:", error);
        setCaptains([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCaptains();
  }, []);

  // ✅ Open Delete Confirmation Modal
  const handleDeleteClick = (captain) => {
    setCaptainToDelete(captain);
  };

  // ✅ Confirm and Delete Captain
  const confirmDelete = async () => {
    if (!captainToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/admin/student-management/captains/delete/${captainToDelete.id}`
      );

      console.log("✅ Captain Deleted:", response.data);
      alert("Captain deleted successfully!");

      // Remove captain from the list immediately
      setCaptains(captains.filter((c) => c.id !== captainToDelete.id));
      setCaptainToDelete(null); // Close modal
    } catch (error) {
      console.error("❌ Error deleting captain:", error.response?.data?.error || error.message);
      alert(`Error deleting captain: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="admin-view">
      {/* Universal Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaTrash className="text-2xl" style={{ color: 'var(--color-danger)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Delete Captain</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Remove captain accounts from the system</p>
                </div>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Total Captains: {captains.length}
              </div>
            </div>
          </div>

          {/* Captain List Table */}
          <div className="card p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                <span className="ml-3" style={{ color: 'var(--color-text-secondary)' }}>Loading captains...</span>
              </div>
            ) : captains.length === 0 ? (
              <div className="text-center py-12">
                <FaUser className="text-4xl mx-auto mb-4 icon-ui" />
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>No captains found</h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>No captains available for deletion</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border-standard)' }}>
                  <thead style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Bus No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ backgroundColor: 'var(--color-surface-primary)', borderColor: 'var(--color-border-standard)' }}>
                    {captains.map((captain, index) => (
                      <tr key={index} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                              {captain.first_name} {captain.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: 'var(--color-text-body)' }}>{captain.phone}</div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{captain.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {captain.route_name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-body)' }}>
                          {captain.bus_no || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(captain)}
                            className="btn btn-danger flex items-center"
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

      {/* Delete Confirmation Modal */}
      {captainToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--color-overlay-dark)' }}>
          <div className="p-8 rounded-xl w-full max-w-md mx-4 card" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'var(--color-danger)' }}>
                <FaExclamationTriangle className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>Confirm Deletion</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface-inactive)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-body)' }}>
                Are you sure you want to delete this captain?
              </p>
              <div className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
                {captainToDelete.first_name} {captainToDelete.last_name}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {captainToDelete.email}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="btn btn-danger flex-1 font-semibold"
              >
                <FaTrash className="mr-2" />
                Delete Captain
              </button>
              <button
                onClick={() => setCaptainToDelete(null)}
                className="btn btn-secondary flex-1 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteCaptain;
