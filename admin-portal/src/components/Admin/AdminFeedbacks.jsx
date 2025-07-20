import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("http://localhost:5000/api/feedback/all");
      setFeedbacks(res.data);
    };
    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">All Student Feedbacks</h1>
      {feedbacks.map((fb, idx) => (
        <div key={idx} className="mb-4 bg-white p-4 rounded shadow">
          <p><strong>Name:</strong> {fb.name}</p>
          <p><strong>Reg No:</strong> {fb.reg_no}</p>
          <p><strong>Route:</strong> {fb.route_name}</p>
          <p><strong>Stop:</strong> {fb.stop_name}</p>
          <p className="text-gray-600 mt-2">{fb.message}</p>
          <hr className="mt-3" />
        </div>
      ))}
    </div>
  );
};

export default AdminFeedbacks;
