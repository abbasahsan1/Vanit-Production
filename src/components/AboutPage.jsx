import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBus, 
  FaUsers, 
  FaCheckCircle, 
  FaMapMarkedAlt, 
  FaClock, 
  FaShieldAlt, 
  FaHome, 
  FaInfoCircle, 
  FaEnvelope,
  FaStar,
  FaRocket,
  FaHeart,
  FaGraduationCap
} from 'react-icons/fa';

const AboutPage = () => {
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
                  backgroundColor: 'var(--color-primary-action)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                <FaBus className="text-2xl" />
              </div>
            </div>
            <h1 className="text-display font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
              About VanIt!
            </h1>
            <p className="text-heading max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Revolutionizing university transportation with real-time tracking, enhanced safety, and seamless user experiences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Our Mission */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaRocket className="mr-3" style={{ color: 'var(--color-primary-action)' }} />
                Our Mission
              </h2>
            </div>
            <div className="card-content">
              <p className="text-body mb-4" style={{ color: 'var(--color-text-body)' }}>
                VanIt! was founded to revolutionize university transportation services by addressing
                the inefficiencies of traditional systems. Our goal is to create a seamless experience for students,
                captains, and administrators by providing real-time tracking, emergency notifications, and
                operational efficiency.
              </p>
              <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                We believe that every student deserves safe, reliable, and efficient transportation to and from campus.
                Our platform bridges the gap between traditional bus services and modern technology, ensuring
                transparency, safety, and convenience for all users.
              </p>
            </div>
          </div>

          {/* Why Choose VanIt */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
                <FaStar className="mr-3" style={{ color: 'var(--color-warning)' }} />
                Why Choose VanIt!
              </h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-3 mt-1"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success)',
                      color: 'var(--color-text-inverse)',
                      fontSize: '10px'
                    }}
                  >
                    <FaMapMarkedAlt />
                  </div>
                  <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                    Real-time GPS tracking of university buses
                  </p>
                </div>
                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-3 mt-1"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-warning)',
                      color: 'var(--color-text-inverse)',
                      fontSize: '10px'
                    }}
                  >
                    <FaClock />
                  </div>
                  <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                    Automated notifications for arrivals, delays, and emergencies
                  </p>
                </div>
                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-3 mt-1"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary-action)',
                      color: 'var(--color-text-inverse)',
                      fontSize: '10px'
                    }}
                  >
                    <FaUsers />
                  </div>
                  <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                    User-friendly portals for students, captains, and admins
                  </p>
                </div>
                <div className="flex items-start">
                  <div 
                    className="flex items-center justify-center mr-3 mt-1"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-danger)',
                      color: 'var(--color-text-inverse)',
                      fontSize: '10px'
                    }}
                  >
                    <FaShieldAlt />
                  </div>
                  <p className="text-body" style={{ color: 'var(--color-text-body)' }}>
                    Enhanced student safety with SOS and attendance tracking
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
              <FaCheckCircle className="mr-3" style={{ color: 'var(--color-success)' }} />
              Key Features
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-info)' }}
                >
                  <FaBus className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Real-time Tracking</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Track your bus location in real-time with accurate GPS data
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-warning)' }}
                >
                  <FaShieldAlt className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Safety First</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Emergency SOS system and comprehensive safety features
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <FaUsers className="text-lg icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Multi-User Platform</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Separate portals for students, captains, and administrators
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* University Partnership */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
              <FaGraduationCap className="mr-3" style={{ color: 'var(--color-primary-action)' }} />
              University Partnership
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-subheading font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
                  Capital University of Science and Technology
                </h3>
                <p className="text-body mb-4" style={{ color: 'var(--color-text-body)' }}>
                  We are proud to partner with Capital University of Science and Technology to provide 
                  state-of-the-art transportation management solutions. Our collaboration ensures that 
                  students have access to reliable, safe, and efficient transportation services.
                </p>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  This partnership represents our commitment to supporting educational institutions 
                  in providing comprehensive services that enhance the student experience.
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: 'var(--color-bg-admin)' }}
                >
                  <FaGraduationCap className="text-4xl" style={{ color: 'var(--color-primary-action)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Values */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-heading font-bold flex items-center" style={{ color: 'var(--color-text-heading)' }}>
              <FaHeart className="mr-3" style={{ color: 'var(--color-danger)' }} />
              Our Values
            </h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <FaShieldAlt className="text-xl icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Safety</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Student safety is our top priority in every feature we build
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--color-primary-action)' }}
                >
                  <FaRocket className="text-xl icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Innovation</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Continuously improving with cutting-edge technology solutions
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--color-warning)' }}
                >
                  <FaUsers className="text-xl icon-inverse" />
                </div>
                <h3 className="text-subheading font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Community</h3>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Building stronger connections within the university community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
