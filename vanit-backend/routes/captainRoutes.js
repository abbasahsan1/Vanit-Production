// Add this at the top if not already imported
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Complaint submission route
router.post('/complaint', async (req, res) => {
  const { captainID, message } = req.body;

  if (!captainID || !message) {
    return res.status(400).json({ error: 'captainID and message are required' });
  }

  try {
    await pool.query(
      'INSERT INTO captain_complaints (captainID, message, status) VALUES (?, ?, ?)',
      [captainID, message, 'pending']
    );
    res.status(200).json({ message: '✅ Complaint submitted successfully' });
  } catch (err) {
    console.error('❌ Error inserting complaint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
