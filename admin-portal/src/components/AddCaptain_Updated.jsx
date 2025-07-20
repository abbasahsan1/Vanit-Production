import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaHome,
  FaBus,
  FaUsers,
  FaPlus,
  FaEdit,
} from "react-icons/fa";
import UnifiedNavbar from "./UnifiedNavbar";

const AddCaptain = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    cnic: "",
    cnic_picture: null,
    driving_license: "",
    driving_license_picture: null,
    phone: "",
    alternate_phone: "",
    email: "",
    address: "",
    route: "",
    bus_no: "",
  });

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/routes")
      .then((response) => {
        console.log("✅ Routes API Response:", response.data);
        
        // Handle the correct API response format: { routes: [...] }
        if (response.data && response.data.routes && Array.isArray(response.data.routes)) {
          const routeNames = response.data.routes.map(route => route.route_name);
          setRoutes(routeNames);
          console.log("✅ Extracted route names:", routeNames);
        } else if (typeof response.data === "object" && response.data !== null) {
          // Fallback: Convert object data into array format
          const routeNames = Object.keys(response.data);
          setRoutes(routeNames);
          console.log("✅ Fallback route names:", routeNames);
        } else {
          console.log("⚠️ Unexpected API response format");
          setRoutes([]);
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching routes:", error);
        setRoutes([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create FormData for file uploads
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post("http://localhost:5000/api/admin/captains/add", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Captain Added:", response.data);
      alert("Captain added successfully!");
      navigate("/captain-list");
    } catch (error) {
      console.error("❌ Error adding captain:", error.response?.data || error.message);
      alert(`Error adding captain: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="admin-view">
      <UnifiedNavbar />
      
      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaPlus className="text-2xl" style={{ color: 'var(--color-primary-action)' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Add New Captain</h1>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Create a new captain account in the system</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card p-8" encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--color-text-heading)', borderColor: 'var(--color-border-standard)' }}>
                  Personal Information
                </h3>
              </div>

              {/* First Name */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="Enter last name"
                />
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                />
              </div>

              {/* CNIC */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  CNIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="12345-1234567-1"
                />
              </div>

              {/* Contact Information Section */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--color-text-heading)', borderColor: 'var(--color-border-standard)' }}>
                  Contact Information
                </h3>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="03xx1234567"
                />
              </div>

              {/* Alternate Phone */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  name="alternate_phone"
                  value={formData.alternate_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="03xx1234567"
                />
              </div>

              {/* Email */}
              <div className="form-group md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="captain@example.com"
                />
              </div>

              {/* Address */}
              <div className="form-group md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-h-20"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>

              {/* License Information Section */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--color-text-heading)', borderColor: 'var(--color-border-standard)' }}>
                  License & Documentation
                </h3>
              </div>

              {/* Driving License */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Driving License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="driving_license"
                  value={formData.driving_license}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="License number"
                />
              </div>

              {/* Route Assignment Section */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b" style={{ color: 'var(--color-text-heading)', borderColor: 'var(--color-border-standard)' }}>
                  Route Assignment
                </h3>
              </div>

              {/* Route */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Assigned Route
                </label>
                <select
                  name="route"
                  value={formData.route}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                >
                  <option value="">Select a route</option>
                  {routes.map((route, index) => (
                    <option key={index} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bus Number */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Bus Number
                </label>
                <input
                  type="text"
                  name="bus_no"
                  value={formData.bus_no}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                  placeholder="e.g., VAN-001"
                />
              </div>

              {/* File Uploads */}
              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  CNIC Picture
                </label>
                <input
                  type="file"
                  name="cnic_picture"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Driving License Picture
                </label>
                <input
                  type="file"
                  name="driving_license_picture"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: 'var(--color-border-standard)', 
                    backgroundColor: 'var(--color-surface-primary)',
                    color: 'var(--color-text-body)'
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border-standard)' }}>
              <button
                type="button"
                onClick={() => navigate('/captain-list')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <FaPlus className="mr-2" />
                Add Captain
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCaptain;
