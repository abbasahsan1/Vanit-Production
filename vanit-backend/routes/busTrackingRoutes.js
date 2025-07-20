const express = require("express");
const pool = require("../config/db");
const router = express.Router();

/**
 * ---------------------------
 * ✅ Update Bus Location (POST)
 * ---------------------------
 */
router.post("/update-location", async (req, res) => {
    const { bus_number, latitude, longitude } = req.body;

    if (!bus_number || !latitude || !longitude) {
        return res.status(400).json({ error: "❌ Missing required fields!" });
    }

    try {
        const query = `
            INSERT INTO bus_locations (bus_number, latitude, longitude, updated_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE latitude = VALUES(latitude), longitude = VALUES(longitude), updated_at = NOW();
        `;
        await pool.query(query, [bus_number, latitude, longitude]);

        res.status(200).json({ message: "✅ Bus location updated successfully!" });
    } catch (error) {
        console.error("❌ Error updating bus location:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Fetch All Bus Locations (GET)
 * ---------------------------
 */
router.get("/locations", async (req, res) => {
    try {
        const query = `SELECT * FROM bus_locations ORDER BY updated_at DESC`;
        const [locations] = await pool.query(query);
        res.status(200).json(locations);
    } catch (error) {
        console.error("❌ Error fetching bus locations:", error);
        res.status(500).json({ error: "❌ Internal server error" });
    }
});

module.exports = router;
