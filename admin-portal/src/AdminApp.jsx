import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PrivateAdminRoute from "./components/PrivateAdminRoute";
import RoutesPage from "./components/RoutesPage";
import CreateRoute from "./components/CreateRoute";  // ✅ Ensure this is properly named
import DeleteRoute from "./components/DeleteRoute";  // ✅ Add Delete Route
import EditRoute from "./components/EditRoute";      // ✅ Add Edit Route
import StudentList from "./components/StudentList";
import CaptainList from "./components/CaptainList";
import AddCaptain from "./components/AddCaptain";
import EditStudent from "./components/EditStudent"; 
import DeleteStudent from "./components/DeleteStudent";
import EditCaptain from "./components/EditCaptain";
import DeleteCaptain from "./components/DeleteCaptain";
import RouteMonitor from "./components/RouteMonitor";  // GPS Route Monitor
import AdminAttendanceManager from "./components/AdminAttendanceManager";
import EmergencyManager from "./components/EmergencyManager";  // Emergency Alert Management
import FeedbackManagement from "./components/FeedbackManagement";  // Feedback Management
import InvoiceManagement from "./components/InvoiceManagement";

function AdminApp() {
  return (
    <Router basename="/admin">
      <Routes>
        {/* Admin Login Route */}
        <Route path="/" element={<AdminLogin />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          }
        />

        {/* Protected Routes Page */}
        <Route
          path="/routes"
          element={
            <PrivateAdminRoute>
              <RoutesPage />
            </PrivateAdminRoute>
          }
        />

        {/* ✅ Add Route Page */}
        <Route
          path="/create-route"
          element={
            <PrivateAdminRoute>
              <CreateRoute />
            </PrivateAdminRoute>
          }
        />

        {/* ✅ Delete Route Page */}
        <Route
          path="/delete-route"
          element={
            <PrivateAdminRoute>
              <DeleteRoute />
            </PrivateAdminRoute>
          }
        />

        {/* ✅ Edit Route Page */}
        <Route
          path="/edit-route"
          element={
            <PrivateAdminRoute>
              <EditRoute />
            </PrivateAdminRoute>
          }
        />

        {/* GPS Route Monitor */}
        <Route
          path="/route-monitor"
          element={
            <PrivateAdminRoute>
              <RouteMonitor />
            </PrivateAdminRoute>
          }
        />

        {/* ✅ Student List Page */}
        <Route
          path="/student-list"
          element={
            <PrivateAdminRoute>
              <StudentList />
            </PrivateAdminRoute>
          }
        />

        <Route
          path="/add-captain"
          element={
            <PrivateAdminRoute>
              <AddCaptain />
            </PrivateAdminRoute>
          }
        />
     
        {/* ✅ Add Captain List Route */}
        <Route
          path="/captain-list"
          element={
            <PrivateAdminRoute>
              <CaptainList />
            </PrivateAdminRoute>
          }
        />

        <Route
          path="/edit-captain"
          element={
            <PrivateAdminRoute>
              <EditCaptain />
            </PrivateAdminRoute>
          }
        />

        <Route
          path="/delete-captain"
          element={
            <PrivateAdminRoute>
              <DeleteCaptain />
            </PrivateAdminRoute>
          }
        />

        <Route
          path="/edit-student"
          element={
            <PrivateAdminRoute>
              <EditStudent/>
            </PrivateAdminRoute>
          }
        />

        <Route
          path="/delete-student"
          element={
            <PrivateAdminRoute>
              <DeleteStudent/>
            </PrivateAdminRoute>
          }
        />

        {/* Attendance Management Route */}
        <Route
          path="/attendance-management"
          element={
            <PrivateAdminRoute>
              <AdminAttendanceManager />
            </PrivateAdminRoute>
          }
        />

        {/* Emergency Alert Management Route */}
        <Route
          path="/emergency-management"
          element={
            <PrivateAdminRoute>
              <EmergencyManager />
            </PrivateAdminRoute>
          }
        />

        {/* Feedback Management Route */}
        <Route
          path="/feedback-management"
          element={
            <PrivateAdminRoute>
              <FeedbackManagement />
            </PrivateAdminRoute>
          }
        />

        {/* Invoice Management Route */}
        <Route
          path="/invoice-management"
          element={
            <PrivateAdminRoute>
              <InvoiceManagement />
            </PrivateAdminRoute>
          }
        />
      </Routes>

    </Router>
  );
}

export default AdminApp;
