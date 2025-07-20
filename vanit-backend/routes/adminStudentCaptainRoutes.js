const express = require('express');
const multer = require("multer");
const pool = require('../config/db'); // Ensure this uses mysql2/promise
const router = express.Router();

// ✅ Setup Multer for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Ensure "uploads" folder exists
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage: storage });

/**
 * ---------------------------
 * Fetch All Students (GET)
 * ---------------------------
 */
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
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * Update Student by First Name (PUT)
 * ---------------------------
 */
router.put('/students/update/:first_name', async (req, res) => {
    const { first_name } = req.params;
    const { last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address } = req.body;

    try {
        // ✅ Check if student exists before updating
        const [existingStudent] = await pool.query("SELECT * FROM students WHERE first_name = ?", [first_name]);
        
        if (existingStudent.length === 0) {
            return res.status(404).json({ error: "❌ Student not found!" });
        }

        // ✅ Update Student Data in Database
        const query = `
            UPDATE students 
            SET last_name = ?, registration_number = ?, semester = ?, route_name = ?, stop_name = ?, phone = ?, emergency_contact = ?, address = ?
            WHERE first_name = ?
        `;
        
        const [result] = await pool.query(query, [
            last_name, registration_number, semester, route_name, stop_name, phone, emergency_contact, address, first_name
        ]);

        res.status(200).json({ message: "✅ Student updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating student:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});

/**
 * ---------------------------
 * Delete Student by First Name (DELETE)
 * ---------------------------
 */
router.delete('/students/delete/:first_name', async (req, res) => {
    const { first_name } = req.params;

    try {
        // ✅ Check if student exists
        const [existingStudent] = await pool.query("SELECT * FROM students WHERE first_name = ?", [first_name]);

        if (existingStudent.length === 0) {
            return res.status(404).json({ error: "❌ Student not found!" });
        }

        // ✅ Delete the student
        const query = "DELETE FROM students WHERE first_name = ?";
        await pool.query(query, [first_name]);

        res.status(200).json({ message: "✅ Student deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting student:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});


/**
 * ---------------------------
 * Fetch All Captains (GET)
 * ---------------------------
 */
router.get('/captains', async (req, res) => {
    try {
        const query = `
            SELECT id, first_name, last_name, email, phone, route_name, bus_no
            FROM captains
            ORDER BY first_name, last_name
        `;
        const [captains] = await pool.query(query);

        res.status(200).json(captains);
    } catch (error) {
        console.error("❌ Error fetching captains:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * Add a New Captain (POST)
 * ---------------------------
 */
// ✅ Add Captain Route (POST)
router.post("/captains", 
    upload.fields([
      { name: "cnic_picture", maxCount: 1 },
      { name: "driving_license_picture", maxCount: 1 }
    ]), 
    async (req, res) => {
      console.log('📝 Add Captain Request received');
      console.log('📋 Request body:', req.body);
      console.log('📁 Request files:', req.files);
      
      const {
        first_name, last_name, dob, cnic, driving_license, phone,
        alternate_phone, email, address, route, bus_no // ✅ Added bus_no
      } = req.body;
      
      console.log('🔍 Extracted fields:', {
        first_name, last_name, dob, cnic, driving_license, phone,
        alternate_phone, email, address, route, bus_no
      });
  
      // ✅ Validate Required Fields
      const missingFields = [];
      if (!first_name) missingFields.push('first_name');
      if (!last_name) missingFields.push('last_name');
      if (!dob) missingFields.push('dob');
      if (!cnic) missingFields.push('cnic');
      if (!driving_license) missingFields.push('driving_license');
      if (!phone) missingFields.push('phone');
      if (!email) missingFields.push('email');
      if (!route) missingFields.push('route');
      if (!bus_no) missingFields.push('bus_no');
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        return res.status(400).json({ 
          error: "❌ Missing required fields!", 
          missingFields: missingFields 
        });
      }
  
      try {
        // ✅ Check if files were uploaded safely
        const cnicPicturePath = req.files && req.files["cnic_picture"] ? req.files["cnic_picture"][0].filename : null;
        const drivingLicensePath = req.files && req.files["driving_license_picture"] ? req.files["driving_license_picture"][0].filename : null;
        
        console.log('📁 File paths:', { cnicPicturePath, drivingLicensePath });
        
        // ✅ Verify route exists
        const [routeCheck] = await pool.query('SELECT route_name FROM routes WHERE route_name = ?', [route]);
        if (routeCheck.length === 0) {
          console.log(`❌ Route not found: ${route}`);
          return res.status(400).json({ error: `❌ Route "${route}" does not exist!` });
        }
        
        console.log(`✅ Route verified: ${route}`);
  
        // ✅ Insert into MySQL Database
        const query = `
          INSERT INTO captains (first_name, last_name, dob, cnic, cnic_picture,
            driving_license, driving_license_picture, phone, alternate_phone, email, address, route_name, bus_no)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        console.log('📝 Executing query with values:', [
          first_name, last_name, dob, cnic, cnicPicturePath,
          driving_license, drivingLicensePath, phone, alternate_phone, email, address, route, bus_no
        ]);
  
        const [result] = await pool.query(query, [
          first_name, last_name, dob, cnic, cnicPicturePath,
          driving_license, drivingLicensePath, phone, alternate_phone, email, address, route, bus_no
        ]);
        
        console.log('✅ Captain inserted successfully with ID:', result.insertId);

        // ✅ Send welcome WhatsApp message to the new captain
        try {
          const whatsappService = require('../services/whatsappService');
          const captainName = `${first_name} ${last_name}`;
          await whatsappService.sendWelcomeMessage(phone, captainName);
          console.log(`✅ Welcome WhatsApp message sent to ${captainName}`);
        } catch (whatsappError) {
          console.error('❌ Failed to send welcome WhatsApp message:', whatsappError);
          // Don't fail the registration if WhatsApp fails
        }
  
        res.status(201).json({ 
          message: "✅ Captain added successfully!",
          captainId: result.insertId 
        });
      } catch (error) {
        console.error("❌ Error adding captain:", error);
        
        // Provide specific error messages for common issues
        if (error.code === 'ER_DUP_ENTRY') {
          if (error.message.includes('cnic')) {
            return res.status(400).json({ error: "❌ CNIC already exists in the system!" });
          } else if (error.message.includes('driving_license')) {
            return res.status(400).json({ error: "❌ Driving license already exists in the system!" });
          } else if (error.message.includes('email')) {
            return res.status(400).json({ error: "❌ Email address already exists in the system!" });
          }
        }
        
        res.status(500).json({ 
          error: "❌ Internal Server Error",
          details: error.message 
        });
      }
  });

/**
 * ---------------------------
 * Update Captain by ID (PUT)
 * ---------------------------
 */
router.put('/captains/update/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, email, route_name, bus_number } = req.body;

    try {
        // ✅ Check if captain exists before updating
        const [existingCaptain] = await pool.query("SELECT * FROM captains WHERE id = ?", [id]);
        
        if (existingCaptain.length === 0) {
            return res.status(404).json({ error: "❌ Captain not found!" });
        }

        // ✅ Update Captain Data in Database
        const query = `
            UPDATE captains 
            SET first_name = ?, last_name = ?, phone = ?, email = ?, route_name = ?, bus_no = ?
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [
            first_name, last_name, phone, email, route_name, bus_number, id
        ]);

        console.log(`✅ Captain ID ${id} updated successfully`);
        res.status(200).json({ 
            message: "✅ Captain updated successfully!",
            updatedData: { id, first_name, last_name, phone, email, route_name, bus_number }
        });
    } catch (error) {
        console.error("❌ Error updating captain:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});

/**
 * ---------------------------
 * Delete Captain by ID (DELETE)
 * ---------------------------
 */
router.delete('/captains/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ Check if captain exists
        const [existingCaptain] = await pool.query("SELECT * FROM captains WHERE id = ?", [id]);

        if (existingCaptain.length === 0) {
            return res.status(404).json({ error: "❌ Captain not found!" });
        }

        // ✅ Delete the captain
        const query = "DELETE FROM captains WHERE id = ?";
        await pool.query(query, [id]);

        console.log(`✅ Captain ID ${id} deleted successfully`);
        res.status(200).json({ message: "✅ Captain deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting captain:", error);
        res.status(500).json({ error: "❌ Internal Server Error" });
    }
});

  // Assign route to captain
router.post('/assign-route-to-captain', async (req, res) => {
  const { captainId, routeName } = req.body;

  try {
    await pool.query('UPDATE captains SET route_name = ? WHERE id = ?', [routeName, captainId]);
    res.status(200).json({ message: 'Route assigned to captain successfully!' });
  } catch (err) {
    console.error('Error assigning route:', err);
    res.status(500).json({ message: 'Failed to assign route' });
  }
});

  
  module.exports = router;



