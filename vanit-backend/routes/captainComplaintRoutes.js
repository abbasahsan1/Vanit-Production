const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST: Submit Complaint
// POST /api/captains/complaints
router.post('/complaints', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { message } = req.body;
  
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (!message) return res.status(400).json({ message: "Message is required" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const captainID = decoded.id;
  
      await pool.query(
        "INSERT INTO captain_complaints (captainID, message) VALUES (?, ?)",
        [captainID, message]
      );
  
      res.status(200).json({ message: "✅ Complaint submitted" });
    } catch (err) {
      console.error("❌ Error submitting complaint:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  

module.exports = router;
