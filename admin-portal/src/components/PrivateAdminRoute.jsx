import React from "react";
import { Navigate } from "react-router-dom";

const PrivateAdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem("adminToken"); // Retrieve admin token

  return adminToken ? children : <Navigate to="/" replace />;
};

export default PrivateAdminRoute;
