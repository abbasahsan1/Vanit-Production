const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Use updated MySQL2 promise-based db
require("dotenv").config();

const router = express.Router();
const saltRounds = 10;

// ✅ Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}
const secretKey = process.env.JWT_SECRET;

// ✅ Helper function to generate JWT tokens
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, secretKey, { expiresIn: "1h" });
};

/**
 * -------------------------------------------------
 * ✅ Student Signup (Only if Registered Previously)
 * -------------------------------------------------
 */
router.post("/students/signup", async (req, res) => {
    const { first_name, last_name, email, password, registration_number } = req.body;

    if (!first_name || !last_name || !email || !password || !registration_number) {
        return res.status(400).json({ error: "❌ All fields are required!" });
    }

    try {
        // ✅ Check if registration number exists in students table (must be registered first)
        const [registeredStudent] = await pool.query(
            "SELECT * FROM students WHERE registration_number = ?", 
            [registration_number]
        );

        if (registeredStudent.length === 0) {
            return res.status(400).json({ 
                message: "❌ Registration number not found! Please register first before signing up." 
            });
        }

        const student = registeredStudent[0];

        // ✅ Verify email matches the registered student
        if (student.email !== email) {
            return res.status(400).json({ 
                message: "❌ Email does not match the registered student with this registration number!" 
            });
        }

        // ✅ Check if student already has a password (already signed up)
        if (student.password) {
            return res.status(400).json({ 
                message: "❌ Account already activated! Please use the login form." 
            });
        }

        // ✅ Update student record with password and complete signup
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "UPDATE students SET password = ?, first_name = ?, last_name = ? WHERE registration_number = ?",
            [hashedPassword, first_name, last_name, registration_number]
        );

        res.status(200).json({ 
            message: "✅ Account activated successfully! You can now login with your credentials." 
        });
    } catch (error) {
        console.error("❌ Error during student signup:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



/**
 * -------------------------------------------------
 * ✅ Student Login
 * -------------------------------------------------
 */
router.post("/students/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [student] = await pool.query("SELECT * FROM students WHERE email = ?", [email]);

        if (student.length === 0) {
            return res.status(401).json({ message: "❌ Email not found. Please register first." });
        }

        // ✅ Check if student has completed signup (has password)
        if (!student[0].password) {
            return res.status(401).json({ 
                message: "❌ Account not activated. Please complete signup first to set your password." 
            });
        }

        const isMatch = await bcrypt.compare(password, student[0].password);

        if (isMatch) {
            const token = generateToken(student[0].id, "student");
            res.status(200).json({ 
                message: "✅ Login successful", 
                token,
                first_name: student[0].first_name,
                last_name: student[0].last_name,
                registration_number: student[0].registration_number,
                phone: student[0].phone,
                route_name: student[0].route_name,
                stop_name: student[0].stop_name
            });
        } else {
            res.status(401).json({ message: "❌ Invalid password" });
        }
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * -------------------------------------------------
 * ✅ Captain Login
 * -------------------------------------------------
 */
module.exports = router;