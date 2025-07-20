import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CaptainSetPassword = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const handleSetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/captains/set-password", {
        phone,
        password,
      });

      if (response.status === 200) {
        alert("✅ Password set successfully. Please login now.");
        navigate("/captain-login"); // Redirect to login form
      }
    } catch (error) {
      console.error("❌ Error setting password:", error);
      setStatusMessage("❌ Failed to set password. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-200">
      <form onSubmit={handleSetPassword} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold text-center mb-4 text-orange-500">Set Password</h2>
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border mb-4 rounded"
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border mb-4 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Set Password
        </button>
        {statusMessage && <p className="text-red-600 mt-2 text-center">{statusMessage}</p>}
      </form>
    </div>
  );
};

export default CaptainSetPassword;
