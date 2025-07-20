import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaArrowLeft, FaUserTie, FaPhone } from 'react-icons/fa';
import axios from 'axios';

const CaptainLogin = () => {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendOTP = async () => {
    if (!formData.phone) {
      setMessage('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/captains/send-otp', {
        phone: formData.phone
      });
      setOtpSent(true);
      setMessage('OTP sent to your phone number');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let response;
      
      if (loginMethod === 'password') {
        response = await axios.post('http://localhost:5000/api/auth/captains/login', {
          phone: formData.phone,
          password: formData.password
        });
      } else {
        response = await axios.post('http://localhost:5000/api/auth/captains/verify-otp', {
          phone: formData.phone,
          otp: formData.otp
        });
        
        if (response.status === 200) {
          localStorage.setItem('otpLogin', 'true');
        }
      }

      if (response.status === 200) {
        localStorage.setItem('captainToken', response.data.token);
        localStorage.setItem('captainPhone', formData.phone);
        navigate('/captain/home');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ phone: '', password: '', otp: '' });
    setOtpSent(false);
    setMessage('');
  };

  return (
    <div className="student-view">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: 'var(--color-warning)', 
                color: 'var(--color-text-inverse)' 
              }}
            >
              <FaUserTie className="text-2xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-heading)' }}>
            Captain Login
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Access your captain dashboard
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="card mb-6">
          <div className="card-content p-6">
            <div className="flex rounded-lg p-1 mb-6" style={{ backgroundColor: 'var(--color-bg-admin)' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  resetForm();
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  loginMethod === 'password' 
                    ? 'shadow-sm' 
                    : ''
                }`}
                style={{
                  backgroundColor: loginMethod === 'password' ? 'var(--color-surface-primary)' : 'transparent',
                  color: loginMethod === 'password' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)'
                }}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  resetForm();
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  loginMethod === 'otp' 
                    ? 'shadow-sm' 
                    : ''
                }`}
                style={{
                  backgroundColor: loginMethod === 'otp' ? 'var(--color-surface-primary)' : 'transparent',
                  color: loginMethod === 'otp' ? 'var(--color-text-heading)' : 'var(--color-text-secondary)'
                }}
              >
                OTP Login
              </button>
            </div>

            {message && (
              <div 
                className="p-3 rounded-lg mb-4 text-sm"
                style={{
                  backgroundColor: message.includes('sent') || message.includes('success') 
                    ? 'var(--color-success)' 
                    : 'var(--color-danger)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              {loginMethod === 'password' ? (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
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
              ) : (
                <div>
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={loading || !formData.phone}
                      className="w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      style={{ 
                        backgroundColor: 'var(--color-primary-action)', 
                        color: 'var(--color-text-inverse)' 
                      }}
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-body)' }}>
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        className="input"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        required
                      />
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={loading}
                        className="mt-2 text-sm hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--color-text-link)' }}
                      >
                        Resend OTP
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(loginMethod === 'password' || otpSent) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--color-warning)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/landing-page')}
            className="flex items-center justify-center mx-auto font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-link)' }}
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptainLogin;
