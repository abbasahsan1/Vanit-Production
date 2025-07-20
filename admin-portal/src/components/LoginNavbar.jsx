import React from 'react';
import VanItLogo from './VanItLogo';

const LoginNavbar = () => {
  return (
    <nav className="global-header px-6 py-4">
      <div className="flex justify-center items-center">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <VanItLogo className="w-10 h-10" />
          <h1 className="text-xl font-semibold nav-link">
            Capital University of Science and Technology - Admin Portal
          </h1>
        </div>
      </div>
    </nav>
  );
};

export default LoginNavbar; 