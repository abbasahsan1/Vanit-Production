const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Save Student Feedback
router.post('/submit', async (req, res) => {
  const { student_email, name, reg_no, route_name, stop_name, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO feedbacks (student_email, name, reg_no, route_name, stop_name, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [student_email, name, reg_no, route_name, stop_name, message, 'pending']
    );
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error('❌ Error saving feedback:', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Save Captain Feedback
router.post('/captain/submit', async (req, res) => {
  const { captain_id, captain_name, route_name, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO captain_feedbacks (captain_id, captain_name, route_name, message, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [captain_id, captain_name, route_name, message, 'pending']
    );
    res.status(200).json({ message: 'Captain feedback submitted successfully' });
  } catch (err) {
    console.error('❌ Error saving captain feedback:', err);
    res.status(500).json({ message: 'Failed to submit captain feedback' });
  }
});

// Get All Student Feedback (for admin)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        student_email,
        name,
        reg_no as registration_number,
        route_name,
        stop_name,
        message,
        status,
        admin_response,
        created_at,
        resolved_at
      FROM feedbacks 
      ORDER BY created_at DESC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching feedbacks:', err);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

// Get All Captain Feedback (for admin)
router.get('/captain/all', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        captain_id,
        captain_name,
        route_name,
        message,
        status,
        admin_response,
        created_at,
        resolved_at
      FROM captain_feedbacks 
      ORDER BY created_at DESC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching captain feedbacks:', err);
    res.status(500).json({ message: 'Failed to fetch captain feedbacks' });
  }
});

// Update Feedback Status (for admin)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, admin_response } = req.body;
  
  try {
    const resolvedAt = status === 'resolved' ? new Date() : null;
    
    await pool.query(
      'UPDATE feedbacks SET status = ?, admin_response = ?, resolved_at = ? WHERE id = ?',
      [status, admin_response, resolvedAt, id]
    );
    
    res.status(200).json({ message: 'Feedback status updated successfully' });
  } catch (err) {
    console.error('❌ Error updating feedback status:', err);
    res.status(500).json({ message: 'Failed to update feedback status' });
  }
});

// Update Captain Feedback Status (for admin)
router.put('/captain/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, admin_response } = req.body;
  
  try {
    const resolvedAt = status === 'resolved' ? new Date() : null;
    
    await pool.query(
      'UPDATE captain_feedbacks SET status = ?, admin_response = ?, resolved_at = ? WHERE id = ?',
      [status, admin_response, resolvedAt, id]
    );
    
    res.status(200).json({ message: 'Captain feedback status updated successfully' });
  } catch (err) {
    console.error('❌ Error updating captain feedback status:', err);
    res.status(500).json({ message: 'Failed to update captain feedback status' });
  }
});

// Get Student's Own Feedback
router.get('/student/:reg_no', async (req, res) => {
  const { reg_no } = req.params;
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        route_name,
        stop_name,
        message,
        status,
        admin_response,
        created_at,
        resolved_at
      FROM feedbacks 
      WHERE reg_no = ?
      ORDER BY created_at DESC
    `, [reg_no]);
    
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching student feedback:', err);
    res.status(500).json({ message: 'Failed to fetch student feedback' });
  }
});

// Get Captain's Own Feedback
router.get('/captain/:captain_id', async (req, res) => {
  const { captain_id } = req.params;
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        route_name,
        message,
        status,
        admin_response,
        created_at,
        resolved_at
      FROM captain_feedbacks 
      WHERE captain_id = ?
      ORDER BY created_at DESC
    `, [captain_id]);
    
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Error fetching captain feedback:', err);
    res.status(500).json({ message: 'Failed to fetch captain feedback' });
  }
});

// Get Feedback Statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
  try {
    const [studentStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM feedbacks
    `);
    
    const [captainStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM captain_feedbacks
    `);
    
    const stats = {
      student: studentStats[0],
      captain: captainStats[0],
      total: {
        total: studentStats[0].total + captainStats[0].total,
        pending: studentStats[0].pending + captainStats[0].pending,
        resolved: studentStats[0].resolved + captainStats[0].resolved
      }
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Error fetching feedback stats:', err);
    res.status(500).json({ message: 'Failed to fetch feedback statistics' });
  }
});

module.exports = router;
