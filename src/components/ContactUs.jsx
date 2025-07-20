import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaHome, 
  FaInfoCircle, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaUser, 
  FaPaperPlane,
  FaClock,
  FaUniversity
} from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="student-view">
      {/* Navigation Bar */}
      <nav className="global-header px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/landing-page" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaHome className="text-lg" />
              <span className="font-semibold">Home</span>
            </Link>
            <Link to="/about" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaInfoCircle className="text-lg" />
              <span className="font-medium">About</span>
            </Link>
            <Link to="/contact" className="nav-link flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <FaEnvelope className="text-lg" />
              <span className="font-medium">Contact</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container section">
        {/* Header */}
        <div className="card mb-8">
          <div className="card-header text-center">
            <div className="flex items-center justify-center mb-4">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-success)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                <FaEnvelope className="text-2xl" />
              </div>
            </div>
            <h1 className="text-display font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
              Contact Us
            </h1>
            <p className="text-heading max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Get in touch with our team for support, feedback, or any questions about VanIt
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaUniversity className="mr-3" style={{ color: 'var(--color-primary-action)' }} />
                  University Information
                </h2>
              </div>
              <div className="card-content space-y-4">
                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-4 mt-1"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-info)',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <FaMapMarkerAlt className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-subheading font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
                      Address
                    </h3>
                    <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                      Capital University of Science and Technology<br />
                      Expressway, Kahuta Road, Zone-V<br />
                      Islamabad, Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-4 mt-1"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-warning)',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <FaPhone className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-subheading font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
                      Phone
                    </h3>
                    <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                      +92 51 111 555 666<br />
                      +92 51 4486482-85
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-4 mt-1"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success)',
                      color: 'var(--color-text-inverse)'
                    }}
                  >
                    <FaEnvelope className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-subheading font-semibold mb-1" style={{ color: 'var(--color-text-heading)' }}>
                      Email
                    </h3>
                    <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                      info@cust.edu.pk<br />
                      transport@cust.edu.pk
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                  <FaClock className="mr-3" style={{ color: 'var(--color-warning)' }} />
                  Support Hours
                </h2>
              </div>
              <div className="card-content">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body" style={{ color: 'var(--color-text-body)' }}>Monday - Friday:</span>
                    <span className="text-body font-semibold" style={{ color: 'var(--color-text-heading)' }}>8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body" style={{ color: 'var(--color-text-body)' }}>Saturday:</span>
                    <span className="text-body font-semibold" style={{ color: 'var(--color-text-heading)' }}>9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body" style={{ color: 'var(--color-text-body)' }}>Sunday:</span>
                    <span className="text-body font-semibold" style={{ color: 'var(--color-danger)' }}>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaPaperPlane className="mr-3" style={{ color: 'var(--color-primary-action)' }} />
                Send us a Message
              </h2>
            </div>
            <div className="card-content">
              {submitMessage && (
                <div 
                  className="p-4 rounded-lg mb-6 text-sm"
                  style={{ 
                    backgroundColor: 'var(--color-success)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Full Name *
                  </label>
                  <div className="relative">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Email Address *
                  </label>
                  <div className="relative">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter the subject of your message"
                    required
                  />
                </div>

                <div>
                  <label className="block text-body font-medium mb-2" style={{ color: 'var(--color-text-body)' }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="input resize-none"
                    rows="5"
                    placeholder="Enter your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'var(--color-success)', 
                    color: 'var(--color-text-inverse)' 
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--color-text-inverse)' }}></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quick Help */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="text-heading font-bold" style={{ color: 'var(--color-text-heading)' }}>
              Quick Help
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-info)' }}
                >
                  <FaUser className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Student Support</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Help with account registration, bus tracking, and app usage
                </p>
              </div>

              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-warning)' }}
                >
                  <FaEnvelope className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Technical Issues</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Report bugs, app crashes, or connectivity problems
                </p>
              </div>

              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <FaPaperPlane className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Feedback</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Share suggestions for improving VanIt services
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
