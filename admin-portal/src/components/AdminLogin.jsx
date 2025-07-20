import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaShieldAlt } from 'react-icons/fa';
import LoginNavbar from './LoginNavbar';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Hardcoded admin credentials (Replace with backend API call)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123';

    // Simulate API call delay
    setTimeout(() => {
      if (formData.username === ADMIN_USERNAME && formData.password === ADMIN_PASSWORD) {
        localStorage.setItem('adminToken', 'secure_admin_token');
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="admin-view">
      {/* Login Navigation Bar */}
      <LoginNavbar />
      <div className="flex items-center justify-center px-4">
        <div className="card w-full max-w-md">
          <div className="card-content p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'var(--color-primary-brand)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  <FaShieldAlt className="text-2xl" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>Admin Login</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Access the administration panel</p>
            </div>

            {error && (
              <div 
                className="p-3 rounded-lg mb-4 text-sm"
                style={{ 
                  backgroundColor: 'var(--color-danger)', 
                  color: 'var(--color-text-inverse)' 
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Username
                </label>
                <div className="relative">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                  Password
                </label>
                <div className="relative">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3 font-semibold disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Secure admin access to VanIt system
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
