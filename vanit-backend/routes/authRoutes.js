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
        // ✅ Check if the email already exists
        const [existingUser] = await pool.query("SELECT * FROM students WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            // 🔹 Instead of failing, update the record
            await pool.query(
                "UPDATE students SET first_name = ?, last_name = ?, password = ?, registration_number = ? WHERE email = ?",
                [first_name, last_name, await bcrypt.hash(password, 10), registration_number, email]
            );
            return res.status(200).json({ message: "✅ Student details updated successfully!" });
        }

        // 🔹 If email does not exist, insert a new student record
        await pool.query(
            "INSERT INTO students (first_name, last_name, email, password, registration_number) VALUES (?, ?, ?, ?, ?)",
            [first_name, last_name, email, await bcrypt.hash(password, 10), registration_number]
        );

        res.status(201).json({ message: "✅ Student registered successfully!" });
    } catch (error) {
        console.error("❌ Error registering student:", error);
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
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, student[0].password);

        if (isMatch) {
            const token = generateToken(student[0].id, "student");
            res.status(200).json({ message: "Login successful", token });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
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