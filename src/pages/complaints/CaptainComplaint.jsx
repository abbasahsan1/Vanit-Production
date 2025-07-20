import React, { useState } from "react";
import axios from "axios";

const CaptainComplaint = () => {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const captainID = localStorage.getItem("captainID"); // Make sure this is stored after login

    if (!captainID) {
      alert("Captain ID not found. Please login again.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/captains/complaint", {
        captainID,
        message,
      });
      setSuccess(true);
      setMessage("");
    } catch (err) {
      console.error("❌ Error submitting complaint:", err);
      alert("Failed to submit complaint");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Submit a Complaint</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        <textarea
          className="w-full border p-4 rounded mb-4"
          placeholder="Describe your complaint..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
        {success && <p className="text-green-600 mt-4">Complaint submitted successfully!</p>}
      </form>
    </div>
  );
};

export default CaptainComplaint;
