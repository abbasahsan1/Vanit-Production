const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require("../config/db");

const adminUsername = "admin";
const adminPassword = "password123"; // Change this in production

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUsername && password === adminPassword) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
});

router.get('/routes/all', async (req, res) => {
  try {
    const [routes] = await pool.query('SELECT id, route_name FROM routes');
    res.status(200).json(routes);
  } catch (error) {
    console.error("❌ Error fetching all routes:", error);
    res.status(500).json({ message: 'Error fetching routes' });
  }
});

// PUT: Assign route to a captain using phone
router.put('/assign-route', async (req, res) => {
  const { phone, routeName } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE captains SET route_name = ? WHERE phone = ?',
      [routeName, phone]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Captain not found" });
    }

    res.status(200).json({ message: "Route assigned successfully" });
  } catch (err) {
    console.error("❌ Error assigning route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * ---------------------------
 * ✅ ADMIN DASHBOARD ENDPOINTS
 * ---------------------------
 */

// Get total buses count
router.get('/buses/count', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as count FROM buses');
    res.status(200).json({ count: result[0].count || 0 });
  } catch (error) {
    console.error('❌ Error fetching buses count:', error);
    res.status(500).json({ count: 0, error: 'Failed to fetch buses count' });
  }
});

// Get all captains
router.get('/captains', async (req, res) => {
  try {
    const [captains] = await pool.query(`
      SELECT id, first_name, last_name, phone, route_name, is_active 
      FROM captains 
      ORDER BY first_name, last_name
    `);
    res.status(200).json({ 
      success: true, 
      data: captains,
      count: captains.length 
    });
  } catch (error) {
    console.error('❌ Error fetching captains:', error);
    res.status(500).json({ 
      success: false, 
      data: [], 
      error: 'Failed to fetch captains' 
    });
  }
});

// Get active captains only
router.get('/captains/active', async (req, res) => {
  try {
    const [activeCaptains] = await pool.query(`
      SELECT id, first_name, last_name, phone, route_name, is_active 
      FROM captains 
      WHERE is_active = 1
      ORDER BY first_name, last_name
    `);
    res.status(200).json({ 
      success: true, 
      data: activeCaptains,
      count: activeCaptains.length 
    });
  } catch (error) {
    console.error('❌ Error fetching active captains:', error);
    res.status(500).json({ 
      success: false, 
      data: [], 
      error: 'Failed to fetch active captains' 
    });
  }
});

/**
 * ---------------------------
 * ✅ ADMIN STUDENT MANAGEMENT ENDPOINTS
 * ---------------------------
 */

// Get all students (admin view)
router.get('/students', async (req, res) => {
  try {
    const query = `
      SELECT id, first_name, last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address 
      FROM students
      ORDER BY first_name, last_name
    `;
    const [students] = await pool.query(query);
    
    console.log(`📊 Admin fetched ${students.length} students with IDs`);
    
    res.status(200).json(students);
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    });
  }
});

/**
 * ---------------------------
 * ✅ ADMIN STUDENT ATTENDANCE ENDPOINTS
 * ---------------------------
 */

// Get attendance history for a specific student (admin view)
router.get('/students/:studentId/attendance', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { dateFrom, dateTo, limit = 50 } = req.query;

    console.log(`📊 Admin fetching attendance for student ID: ${studentId}`);
    console.log(`📊 Filters - dateFrom: ${dateFrom}, dateTo: ${dateTo}, limit: ${limit}`);

    // Validate studentId
    if (!studentId || isNaN(parseInt(studentId))) {
      console.error(`❌ Invalid student ID: ${studentId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid student ID provided'
      });
    }

    // First check if student exists
    const [studentCheck] = await pool.query(
      'SELECT id, first_name, last_name, registration_number FROM students WHERE id = ?',
      [parseInt(studentId)]
    );

    if (studentCheck.length === 0) {
      console.error(`❌ Student not found with ID: ${studentId}`);
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    console.log(`✅ Student found: ${studentCheck[0].first_name} ${studentCheck[0].last_name} (${studentCheck[0].registration_number})`);

    // Use the exact same logic as the student endpoint
    const attendanceService = require('../services/attendanceService');
    
    const filters = {
      studentId: parseInt(studentId),
      dateFrom: dateFrom,
      dateTo: dateTo,
      limit: limit ? parseInt(limit) : 50
    };

    console.log(`📊 Calling attendanceService.getAttendanceLogs with filters:`, filters);

    // Use the exact same service call as the student endpoint
    const logs = await attendanceService.getAttendanceLogs(filters);

    console.log(`📊 Raw attendance logs from service:`, logs.length);
    if (logs.length > 0) {
      console.log(`📊 Sample record:`, logs[0]);
    }

    console.log(`✅ Successfully retrieved ${logs.length} attendance records for student ${studentId}`);

    // Return the exact same format as the student endpoint
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      studentId: studentId,
      studentInfo: studentCheck[0]
    });

  } catch (error) {
    console.error('❌ Detailed error fetching student attendance:', {
      message: error.message,
      stack: error.stack,
      studentId: req.params.studentId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student attendance history',
      details: error.message
    });
  }
});

// Delete a specific attendance record (admin only)
router.delete('/attendance/:attendanceId', async (req, res) => {
  try {
    const { attendanceId } = req.params;

    console.log(`🗑️ Admin deleting attendance record ${attendanceId}`);

    // First, get the record details for logging
    const [recordDetails] = await pool.query(
      `SELECT al.*, s.first_name, s.last_name, s.registration_number 
       FROM attendance_logs al 
       JOIN students s ON al.student_id = s.id 
       WHERE al.id = ?`,
      [attendanceId]
    );

    if (recordDetails.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    const record = recordDetails[0];

    // Delete the attendance record
    const [deleteResult] = await pool.query(
      'DELETE FROM attendance_logs WHERE id = ?',
      [attendanceId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found or already deleted'
      });
    }

    console.log(`✅ Admin deleted attendance record: ${record.first_name} ${record.last_name} (${record.registration_number}) - ${record.scan_timestamp}`);

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
      deletedRecord: {
        id: attendanceId,
        studentName: `${record.first_name} ${record.last_name}`,
        registrationNumber: record.registration_number,
        scanTimestamp: record.scan_timestamp,
        routeName: record.route_name
      }
    });

  } catch (error) {
    console.error('❌ Error deleting attendance record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete attendance record',
      details: error.message
    });
  }
});

/**
 * ---------------------------
 * ✅ ADMIN ATTENDANCE ENDPOINTS
 * ---------------------------
 */

// Get attendance statistics for admin dashboard
router.get('/attendance/stats', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get total attendance for today
    const [attendanceToday] = await pool.query(`
      SELECT COUNT(*) as totalAttended 
      FROM attendance_logs 
      WHERE DATE(scan_timestamp) = ? AND scan_success = 1
    `, [todayStr]);

    // Get total registered students
    const [totalStudents] = await pool.query(`
      SELECT COUNT(*) as totalRegistered FROM students
    `);

    // Get active sessions count
    const [activeSessions] = await pool.query(`
      SELECT COUNT(DISTINCT captain_id) as activeSessions 
      FROM boarding_sessions 
      WHERE session_end IS NULL
    `);

    // Calculate attendance rate
    const totalAttended = attendanceToday[0].totalAttended || 0;
    const totalRegistered = totalStudents[0].totalRegistered || 1;
    const attendanceRate = Math.round((totalAttended / totalRegistered) * 100);

    res.status(200).json({
      totalAttended,
      totalRegistered,
      activeSessions: activeSessions[0].activeSessions || 0,
      attendanceRate
    });

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics' });
  }
});

// Get active boarding sessions for admin
router.get('/attendance/active-sessions', async (req, res) => {
  try {
    console.log('🔍 Admin requesting active sessions...');
    
    const [sessions] = await pool.query(`
      SELECT 
        bs.session_id,
        bs.captain_id,
        bs.route_name,
        bs.session_start,
        bs.students_onboard,
        bs.is_active,
        c.first_name as captain_first_name,
        c.last_name as captain_last_name,
        c.phone as captain_phone
      FROM boarding_sessions bs
      JOIN captains c ON bs.captain_id = c.id
      WHERE bs.is_active = 1
      ORDER BY bs.session_start DESC
    `);

    console.log(`📊 Found ${sessions.length} active sessions in database`);
    
    res.status(200).json({
      success: true,
      data: sessions,
      message: `Found ${sessions.length} active boarding sessions`
    });

  } catch (error) {
    console.error('❌ Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions',
      details: error.message
    });
  }
});

// Generate QR code for specific route (admin only)
router.post('/attendance/generate-qr', async (req, res) => {
  try {
    const { routeName } = req.body;
    
    if (!routeName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Route name is required' 
      });
    }

    // Verify route exists
    const [routeData] = await pool.query(
      'SELECT route_name FROM routes WHERE route_name = ?',
      [routeName]
    );

    if (routeData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Use proper QR code service to generate secure QR code
    const qrCodeService = require('../services/qrCodeService');
    const qrResult = await qrCodeService.generateRouteQRCode(routeName);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: qrResult.qrData,
      qrImage: qrResult.qrImage,
      qrBuffer: qrResult.qrBuffer,
      routeName: routeName,
      generatedAt: new Date(qrResult.generatedAt).toISOString(),
      expiresAt: new Date(qrResult.expiresAt).toISOString()
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

module.exports = router;

