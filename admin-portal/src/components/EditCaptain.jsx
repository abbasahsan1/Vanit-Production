import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBus, FaUser, FaUsers, FaEdit, FaSignOutAlt, FaSave, FaUserCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const EditCaptain = () => {
  const [captains, setCaptains] = useState([]);
  const [editingCaptain, setEditingCaptain] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
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

  // ✅ Open Edit Form
  const handleEditClick = (captain) => {
    if (!captain.id) {
      console.error("❌ Captain ID is missing!");
      return;
    }
    setEditingCaptain(captain);
    setUpdatedData(captain); // Fill form with selected captain data
  };

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setUpdatedData({ ...updatedData, [e.target.name]: e.target.value });
  };

  // ✅ Submit Updated Data
  const handleUpdate = async () => {
    if (!editingCaptain || !editingCaptain.id) {
      console.error("❌ Captain ID is missing!");
      return;
    }

    try {
      // Ensure the data being sent matches the backend expectations
      const dataToSend = {
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        phone: updatedData.phone,
        email: updatedData.email,
        route_name: updatedData.route_name,
        bus_number: updatedData.bus_number || updatedData.bus_no
      };

      console.log("🔄 Sending captain update:", dataToSend);

      const response = await axios.put(
        `http://localhost:5000/api/admin/student-management/captains/update/${editingCaptain.id}`,
        dataToSend
      );

      console.log("✅ Captain Updated:", response.data);
      alert("Captain updated successfully!");

      // Update Captain List Without Reloading
      setCaptains((prevCaptains) =>
        prevCaptains.map((captain) =>
          captain.id === editingCaptain.id ? { ...captain, ...updatedData } : captain
        )
      );

      setEditingCaptain(null); // Close the edit form
    } catch (error) {
      console.error("❌ Error updating captain:", error);
      alert("Error updating captain. Please try again.");
    }
  };

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaUser className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Edit Captain</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Update captain information and assignments</p>
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
                <p style={{ color: 'var(--color-text-secondary)' }}>No captains available for editing</p>
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
                    {captains.map((captain) => (
                      <tr key={captain.id || captain.first_name} className="transition-colors" onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-surface-inactive)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
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
                          {captain.bus_number || captain.bus_no || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(captain)}
                            className="btn btn-primary flex items-center"
                          >
                            <FaEdit className="mr-2" />
                            Edit
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

      {/* Edit Captain Modal */}
      {editingCaptain && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--color-overlay-dark)' }}>
          <div className="p-8 rounded-xl w-full max-w-md mx-4 card" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Edit Captain</h2>
              <button
                onClick={() => setEditingCaptain(null)}
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
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={updatedData.phone || ''}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Phone Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={updatedData.email || ''}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Email Address"
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
                  placeholder="Assigned Route"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>Bus Number</label>
                <input
                  type="text"
                  name="bus_number"
                  value={updatedData.bus_number || updatedData.bus_no || ''}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Bus Number"
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
                  onClick={() => setEditingCaptain(null)}
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

export default EditCaptain;
