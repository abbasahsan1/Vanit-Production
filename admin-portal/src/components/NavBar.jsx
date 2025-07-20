// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';

// const NavBar = () => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem('adminToken'); // Clear token
//     navigate('/'); // Redirect to login
//   };

//   return (
//     <nav className="bg-blue-500 p-4 flex justify-between text-white">
//       <div className="text-lg font-bold">Admin Portal</div>
//       <div className="flex space-x-4">
//         <Link to="/dashboard" className="hover:underline">Home</Link>
//         <button onClick={handleLogout} className="hover:underline">Logout</button>
//       </div>
//     </nav>
//   );
// };

// export default NavBar;
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken"); // Clear token
    navigate("/"); // Redirect to login
  };

  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      {/* Left Side - Logo & Title */}
      <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
        <h1 className="text-orange-600 font-bold text-xl">
          Admin Portal | VANit!
        </h1>
      </div>

      {/* Center Navigation Links */}
      <div className="flex space-x-6 text-blue-600 font-semibold text-lg">
        <Link to="/dashboard" className="hover:text-blue-800 transition">Home</Link>
        <Link to="/routes" className="hover:text-blue-800 transition">Routes</Link>
        <Link to="/captains" className="hover:text-blue-800 transition">Captains</Link>
        <Link to="/students" className="hover:text-blue-800 transition">Students</Link>
      </div>

      {/* Right Side - Profile & Logout */}
      <div className="flex items-center space-x-4">
        <FaUserCircle className="text-gray-600 text-3xl cursor-pointer hover:text-gray-800" />
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600 transition"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
