const express = require('express');
const router = express.Router();
const db = require('../config/db');  // Database connection

// Handle form submission
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  const query = `
    INSERT INTO contact_messages (name, email, message)
    VALUES (?, ?, ?)
  `;

  db.query(query, [name, email, message], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error saving contact message' });
    }
    res.status(200).json({ message: 'Contact message saved successfully' });
  });
});

module.exports = router;
