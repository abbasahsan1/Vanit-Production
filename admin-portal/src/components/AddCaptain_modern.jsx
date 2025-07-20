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
        if (response.data && response.data.routes) {
          setRoutes(response.data.routes);
        } else if (Array.isArray(response.data)) {
          setRoutes(response.data);
        } else {
          console.error("❌ Unexpected routes response format:", response.data);
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

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      await axios.post("http://localhost:5000/api/admin/captains", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Captain added successfully!");
      navigate("/captain-list"); // Redirect to Captain List
    } catch (error) {
      console.error("❌ Error adding captain:", error);
      alert("Error adding captain.");
    }
  };

  return (
    <div className="admin-view">
      {/* Unified Navigation Bar */}
      <UnifiedNavbar />

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="card p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-action)' }}>
                <FaPlus className="text-xl" style={{ color: 'var(--color-text-inverse)' }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-heading)' }}>Add New Captain</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Register a new captain with their details and route assignment</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="card p-8">
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Enter first name"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="captain@example.com"
                      required
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Alternate Phone
                    </label>
                    <input
                      type="text"
                      name="alternate_phone"
                      value={formData.alternate_phone}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX (Optional)"
                      className="input w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter complete address"
                      required
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Documents & Identification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      CNIC Number *
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleChange}
                      placeholder="XXXXX-XXXXXXX-X"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      name="driving_license"
                      value={formData.driving_license}
                      onChange={handleChange}
                      placeholder="Enter license number"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      CNIC Picture
                    </label>
                    <input
                      type="file"
                      name="cnic_picture"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Driving License Picture
                    </label>
                    <input
                      type="file"
                      name="driving_license_picture"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Route Assignment Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-heading)' }}>Route Assignment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Assigned Route *
                    </label>
                    <select
                      name="route"
                      value={formData.route}
                      onChange={handleChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select a route...</option>
                      {routes.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                      Bus Number *
                    </label>
                    <input
                      type="text"
                      name="bus_no"
                      value={formData.bus_no}
                      onChange={handleChange}
                      placeholder="Enter bus number"
                      required
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t" style={{ borderColor: 'var(--color-border-standard)' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary text-lg font-semibold px-8 py-3 flex items-center space-x-2"
                >
                  <FaPlus className="text-sm" />
                  <span>Add Captain</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCaptain;
