const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const whatsappService = require('../services/whatsappService');

const otpStore = new Map();

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    // Check if captain exists
    const [rows] = await pool.query('SELECT first_name, last_name FROM captains WHERE phone = ?', [phone]);
    if (rows.length === 0) return res.status(404).json({ error: 'Captain not found. Please contact admin to register.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (10 minutes)
    const otpData = {
      code: otp,
      timestamp: Date.now(),
      attempts: 0
    };
    otpStore.set(phone, otpData);

    // Send OTP via WhatsApp
    const result = await whatsappService.sendOTP(phone, otp);
    
    if (result.success) {
      console.log(`✅ OTP sent successfully to captain: ${rows[0].first_name} ${rows[0].last_name}`);
      res.status(200).json({ 
        message: 'OTP sent successfully to your WhatsApp number',
        phone: phone,
        messageSid: result.messageSid
      });
    } else {
      console.error('❌ Failed to send WhatsApp OTP:', result.error);
      
      // Provide helpful error messages based on error type
      let userMessage = 'Failed to send OTP. ';
      if (result.code === 'UNVERIFIED_NUMBER') {
        userMessage += 'Your phone number is not verified in the WhatsApp sandbox. Please contact support.';
      } else if (result.code === 'INVALID_PHONE') {
        userMessage += 'Invalid phone number format. Please use international format.';
      } else if (result.code === 'RATE_LIMIT') {
        userMessage += 'Too many requests. Please wait before requesting another OTP.';
      } else {
        userMessage += 'Please try again or contact support.';
      }
      
      res.status(400).json({ 
        error: userMessage,
        details: result.error,
        code: result.code
      });
    }
  } catch (err) {
    console.error('Error in send-otp:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP are required' });
  }

  try {
    const storedOtpData = otpStore.get(phone);
    
    if (!storedOtpData) {
      return res.status(400).json({ error: 'No OTP found for this phone number. Please request a new OTP.' });
    }

    // Check if OTP has expired (10 minutes)
    const currentTime = Date.now();
    const otpAge = currentTime - storedOtpData.timestamp;
    const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (otpAge > OTP_EXPIRY) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // Check OTP attempts (max 3 attempts)
    if (storedOtpData.attempts >= 3) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'Too many invalid attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedOtpData.code !== otp) {
      storedOtpData.attempts += 1;
      otpStore.set(phone, storedOtpData);
      return res.status(400).json({ 
        error: 'Invalid OTP', 
        attemptsRemaining: 3 - storedOtpData.attempts 
      });
    }

    // OTP is valid, clean up and proceed
    otpStore.delete(phone);

    const [captains] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
    
    if (captains.length === 0) {
      return res.status(404).json({ error: 'Captain not found' });
    }

    const captain = captains[0];
    const token = jwt.sign(
      { id: captain.id, role: 'captain', phone: captain.phone }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    console.log(`✅ OTP verified successfully for captain: ${captain.first_name} ${captain.last_name}`);

    res.json({ 
      message: 'OTP verified successfully',
      token,
      captain: {
        id: captain.id,
        name: `${captain.first_name} ${captain.last_name}`,
        phone: captain.phone,
        route: captain.route_name,
        hasPassword: !!captain.password
      }
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/set-password', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
    if (rows.length === 0) return res.status(404).json({ message: 'Captain not found' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE captains SET password = ? WHERE phone = ?', [hashedPassword, phone]);

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
  if (rows.length === 0) return res.status(404).json({ message: 'Captain not found' });

  const match = await bcrypt.compare(password, rows[0].password);
  if (!match) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET);
  res.status(200).json({ token });
});

router.post('/check-phone', async (req, res) => {
  const { phone } = req.body;
  const [rows] = await pool.query('SELECT * FROM captains WHERE phone = ?', [phone]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Captain not found' });
  }
  const hasPassword = !!rows[0].password;
  const captainId = rows[0].id;
  const routeName = rows[0].route_name;
  const isActive = rows[0].is_active === 1;
  res.status(200).json({ 
    exists: true, 
    hasPassword, 
    captainId, 
    routeName, 
    isActive 
  });
});

router.post('/check-phone-token', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.query("SELECT * FROM captains WHERE id = ?", [decoded.id]);
      if (rows.length === 0) return res.status(404).json({ message: "Captain not found" });
  
      const hasPassword = !!rows[0].password;
      const phone = rows[0].phone;
      res.status(200).json({ hasPassword, phone });
    } catch (error) {
      console.error("JWT verify failed:", error);
      res.status(500).json({ message: "Token invalid or expired" });
    }
  });

  router.post('/assigned-route', async (req, res) => {
    const { phone } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT route_name FROM captains WHERE phone = ?', [phone]);
      const routeName = cap[0]?.route_name;
  
      if (!routeName) {
        return res.status(404).json({ message: 'Captain has no route assigned' });
      }
  
      const [routeRow] = await pool.query('SELECT id FROM routes WHERE route_name = ?', [routeName]);
      const routeId = routeRow[0]?.id;
  
      if (!routeId) {
        return res.status(404).json({ message: 'Route not found' });
      }
  
      const [stops] = await pool.query('SELECT stop_name FROM stops WHERE route_id = ?', [routeId]);
  
      res.status(200).json({ routeName, stops: stops.map(s => s.stop_name) });
  
    } catch (err) {
      console.error("Error in /assigned-route:", err);
      res.status(500).json({ message: 'Error fetching route data' });
    }
  });

  router.post('/start-ride', async (req, res) => {
    const { phone, routeName } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT id, first_name, last_name, route_name FROM captains WHERE phone = ?', [phone]);
      if (cap.length === 0) {
        return res.status(404).json({ message: 'Captain not found' });
      }
  
      const captainId = cap[0].id;
      const captainName = `${cap[0].first_name} ${cap[0].last_name}`;
      const actualRouteName = cap[0].route_name;
      
      await pool.query('UPDATE captains SET is_active = 1 WHERE id = ?', [captainId]);
      
      // Broadcast ride start to all portals
      const io = req.app.get('socketio');
      if (io) {
        const rideStartData = {
          captainId: captainId,
          captainName: captainName,
          routeName: actualRouteName,
          isActive: true,
          timestamp: new Date().toISOString(),
          message: `🚌 Ride started! Captain ${captainName} is now active on route ${actualRouteName}`
        };
        
        // Broadcast to route subscribers (students)
        io.to(`route:${actualRouteName}`).emit('ride_started', rideStartData);
        
        // Broadcast to captain room
        io.to(`captain:${captainId}`).emit('ride_status_update', rideStartData);
        
        // Broadcast to admin dashboard
        io.to('admin_dashboard').emit('ride_status_update', rideStartData);
        
        console.log(`🚌 Broadcasted ride start for captain ${captainId} on route ${actualRouteName}`);
      }
      
      res.status(200).json({ message: 'Ride started successfully', captainId, routeName: actualRouteName });
  
    } catch (err) {
      console.error("Error in /start-ride:", err);
      res.status(500).json({ message: 'Error starting ride' });
    }
  });

  router.post('/stop-ride', async (req, res) => {
    const { phone } = req.body;
  
    try {
      const [cap] = await pool.query('SELECT id, first_name, last_name, route_name FROM captains WHERE phone = ?', [phone]);
      if (cap.length === 0) {
        return res.status(404).json({ message: 'Captain not found' });
      }
  
      const captainId = cap[0].id;
      const captainName = `${cap[0].first_name} ${cap[0].last_name}`;
      const routeName = cap[0].route_name;
      
      await pool.query('UPDATE captains SET is_active = 0 WHERE id = ?', [captainId]);
      
      // End any active boarding sessions
      const attendanceService = require('../services/attendanceService');
      await attendanceService.endBoardingSession(captainId, routeName);
      
      // Broadcast ride stop to all portals
      const io = req.app.get('socketio');
      if (io) {
        const rideStopData = {
          captainId: captainId,
          captainName: captainName,
          routeName: routeName,
          isActive: false,
          timestamp: new Date().toISOString(),
          message: `🛑 Ride ended! Captain ${captainName} has stopped the bus service on route ${routeName}`
        };
        
        // Broadcast to route subscribers (students)
        io.to(`route:${routeName}`).emit('ride_ended', rideStopData);
        
        // Broadcast to captain room
        io.to(`captain:${captainId}`).emit('ride_status_update', rideStopData);
        
        // Broadcast to admin dashboard
        io.to('admin_dashboard').emit('ride_status_update', rideStopData);
        
        console.log(`🛑 Broadcasted ride stop for captain ${captainId} on route ${routeName}`);
      }
      
      res.status(200).json({ message: 'Ride stopped successfully', captainId });
  
    } catch (err) {
      console.error("Error in /stop-ride:", err);
      res.status(500).json({ message: 'Error stopping ride' });
    }
  });

  // Captain profile endpoint for SOS functionality
  router.get('/profile/:phone', async (req, res) => {
    const { phone } = req.params;
  
    try {
      const [captains] = await pool.query(
        'SELECT id, first_name, last_name, phone, route_name, alternate_phone FROM captains WHERE phone = ?', 
        [phone]
      );
      
      if (captains.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Captain not found' 
        });
      }
      
      res.status(200).json({ 
        success: true, 
        data: captains[0] 
      });
      
    } catch (err) {
      console.error("Error fetching captain profile:", err);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching captain profile' 
      });
    }
  });

  /**
   * -----------------------------------
   * Update Captain Profile by Phone (PUT)
   * -----------------------------------
   */
  router.put('/update/:phone', async (req, res) => {
    const { phone } = req.params;
    const { first_name, last_name, alternate_phone, route_name } = req.body;

    try {
      // Check if captain exists
      const [existingCaptain] = await pool.query("SELECT * FROM captains WHERE phone = ?", [phone]);
      
      if (existingCaptain.length === 0) {
        return res.status(404).json({ error: "Captain not found" });
      }

      // Update captain data
      const query = `
        UPDATE captains 
        SET first_name = ?, last_name = ?, alternate_phone = ?, route_name = ?
        WHERE phone = ?
      `;
      
      await pool.query(query, [
        first_name, last_name, alternate_phone, route_name, phone
      ]);

      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating captain profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

module.exports = router;

