import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, tokenKey }) => {
  const token = localStorage.getItem(tokenKey);
  
  console.log(`PrivateRoute Debug - TokenKey: ${tokenKey}, Token: ${token}`);

  if (token) {
    console.log('Token found, rendering children');
    return children;
  } else {
    console.log('No token found, redirecting to landing page');
    return <Navigate to="/landing-page" />;
  }
};

export default PrivateRoute;
