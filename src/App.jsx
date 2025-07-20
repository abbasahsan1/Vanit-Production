import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// Import components for each page
import LandingPage from './components/LandingPage';  // Landing page component
import AboutPage from './components/AboutPage';      // About page
import ContactUs from './components/ContactUs';      // Contact page
import StudentPortal from './components/StudentPortal';  // Student portal (protected)
import CaptainPortal from './components/CaptainPortal';  // Captain portal (protected)
import PrivateRoute from './components/PrivateRoute';
import StudentRegistrationForm from './components/StudentRegistrationForm';  // Private route for authentication
import CaptainLogin from './components/CaptainLogin';
  // GPS tracking for captain
import StudentBusTracking from './components/StudentBusTracking';  // Bus tracking for student
import StudentProfile from './components/StudentProfile';  // Student profile page
import CaptainProfile from './components/CaptainProfile';  // Captain profile page

import Feedback from "./components/Student/Feedback";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/landing-page" replace />} />

        {/* Public Routes */}
        <Route path="/landing-page" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/student-registration" element={<StudentRegistrationForm />} />  {/* New route */}
        <Route path="/captain-login" element={<CaptainLogin />} />
        <Route path="/student/feedback" element={<Feedback />} />
        

        {/* Protected Route for Student Portal */}
        <Route
          path="/student/*"
          element={
            <PrivateRoute tokenKey="studentToken">
              <StudentPortal />
            </PrivateRoute>
          }
        />

        {/* Protected Route for Captain Portal */}
        <Route
          path="/captain/home"
          element={
            <PrivateRoute tokenKey="captainToken">
              <CaptainPortal />
            </PrivateRoute>
          }
        />



        <Route
          path="/student/bus-tracking"
          element={
            <PrivateRoute tokenKey="studentToken">
              <StudentBusTracking />
            </PrivateRoute>
          }
        />

        {/* Profile Routes */}
        <Route
          path="/student/profile"
          element={
            <PrivateRoute tokenKey="studentToken">
              <StudentProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/captain/profile"
          element={
            <PrivateRoute tokenKey="captainToken">
              <CaptainProfile />
            </PrivateRoute>
          }
        />

        {/* Future routes for other components */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/student-form" element={<StudentForm />} /> */}
        {/* <Route path="/" element={<SignUpForm />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
