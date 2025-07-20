const express = require("express");
const pool = require("../config/db");
const router = express.Router();

/**
 * ✅ Receive SOS/Emergency Alert (POST)
 * API: `/api/emergency/send-alert`
 * Supports both students and captains
 */
router.post("/send-alert", async (req, res) => {
    const { 
        user_type, 
        user_id, 
        first_name, 
        last_name, 
        registration_number, 
        phone, 
        route_name, 
        stop_name, 
        latitude, 
        longitude, 
        emergency_type = 'general', 
        message,
        priority_level = 'high'
    } = req.body;

    // 🔹 Validate required fields
    if (!user_type || !user_id || !first_name || !last_name || !phone || !route_name) {
        return res.status(400).json({ 
            success: false,
            error: "❌ Missing required fields: user_type, user_id, first_name, last_name, phone, route_name" 
        });
    }

    // 🔹 Validate user_type
    if (!['student', 'captain'].includes(user_type)) {
        return res.status(400).json({
            success: false,
            error: "❌ Invalid user_type. Must be 'student' or 'captain'"
        });
    }

    try {
        // 🔹 Insert emergency alert
        const query = `
            INSERT INTO emergency_alerts (
                user_type, user_id, first_name, last_name, registration_number, 
                phone, route_name, stop_name, latitude, longitude, 
                emergency_type, message, priority_level, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const [result] = await pool.query(query, [
            user_type, user_id, first_name, last_name, registration_number,
            phone, route_name, stop_name, latitude, longitude,
            emergency_type, message, priority_level
        ]);

        const alertId = result.insertId;

        // 🔹 Fetch the complete alert data for broadcasting
        const [alertData] = await pool.query(
            'SELECT * FROM emergency_alerts WHERE id = ?', 
            [alertId]
        );

        const alert = alertData[0];

        // 🔹 Real-time broadcast to admin dashboard
        const io = req.app.get('socketio');
        if (io) {
            console.log('🚨 Broadcasting SOS alert to admin dashboard:', alert);
            
            // Broadcast to admin dashboard
            io.to('admin_dashboard').emit('emergency_alert', {
                type: 'new_emergency',
                data: alert,
                timestamp: new Date().toISOString()
            });

            // Also broadcast to route subscribers for visibility
            io.to(`route:${route_name}`).emit('emergency_alert', {
                type: 'route_emergency',
                data: alert,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🚨 ${user_type.toUpperCase()} SOS Alert received:`, {
            id: alertId,
            user: `${first_name} ${last_name}`,
            type: emergency_type,
            location: latitude && longitude ? `${latitude}, ${longitude}` : 'Unknown',
            route: route_name
        });

        res.status(201).json({ 
            success: true,
            message: "✅ SOS Alert sent successfully! Emergency services have been notified.",
            alert_id: alertId,
            data: alert
        });

    } catch (error) {
        console.error("❌ Error storing SOS alert:", error);
        res.status(500).json({ 
            success: false,
            error: "❌ Failed to send SOS alert. Please try again.",
            details: error.message
        });
    }
});

/**
 * ✅ Fetch All Emergency Alerts for Admin (GET)
 * API: `/api/emergency/admin/alerts`
 */
router.get("/admin/alerts", async (req, res) => {
    try {
        const { status, user_type, priority_level, limit = 50 } = req.query;
        
        let query = `
            SELECT * FROM emergency_alerts 
            WHERE 1=1
        `;
        const params = [];

        // 🔹 Filter by status
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        // 🔹 Filter by user type
        if (user_type) {
            query += ` AND user_type = ?`;
            params.push(user_type);
        }

        // 🔹 Filter by priority level
        if (priority_level) {
            query += ` AND priority_level = ?`;
            params.push(priority_level);
        }

        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [alerts] = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            data: alerts,
            count: alerts.length
        });

    } catch (error) {
        console.error("❌ Error fetching emergency alerts:", error);
        res.status(500).json({ 
            success: false,
            error: "❌ Failed to fetch alerts",
            details: error.message
        });
    }
});

/**
 * ✅ Acknowledge Emergency Alert (PUT)
 * API: `/api/emergency/admin/acknowledge/:alertId`
 */
router.put("/admin/acknowledge/:alertId", async (req, res) => {
    const { alertId } = req.params;
    const { acknowledged_by, notes } = req.body;

    if (!acknowledged_by) {
        return res.status(400).json({
            success: false,
            error: "❌ acknowledged_by field is required"
        });
    }

    try {
        // 🔹 Update alert status
        const query = `
            UPDATE emergency_alerts 
            SET status = 'acknowledged', 
                acknowledged_by = ?, 
                acknowledged_at = NOW(),
                resolution_notes = ?
            WHERE id = ? AND status = 'pending'
        `;

        const [result] = await pool.query(query, [acknowledged_by, notes, alertId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "❌ Alert not found or already acknowledged"
            });
        }

        // 🔹 Fetch updated alert data
        const [alertData] = await pool.query(
            'SELECT * FROM emergency_alerts WHERE id = ?', 
            [alertId]
        );

        // 🔹 Broadcast acknowledgment to all connected clients
        const io = req.app.get('socketio');
        if (io) {
            // Broadcast to admin dashboard
            io.to('admin_dashboard').emit('emergency_acknowledged', {
                type: 'alert_acknowledged',
                data: alertData[0],
                acknowledged_by,
                timestamp: new Date().toISOString()
            });

            // Broadcast to the specific user who sent the alert
            const userRoom = `user_sos:${alertData[0].user_type}:${alertData[0].user_id}`;
            io.to(userRoom).emit('sos_status_update', {
                alertId: alertData[0].id,
                status: 'acknowledged',
                acknowledged_at: alertData[0].acknowledged_at,
                acknowledged_by: alertData[0].acknowledged_by,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 SOS status update sent to ${userRoom}`);
        }

        console.log(`✅ Emergency alert ${alertId} acknowledged by ${acknowledged_by}`);

        res.status(200).json({
            success: true,
            message: "✅ Emergency alert acknowledged successfully",
            data: alertData[0]
        });

    } catch (error) {
        console.error("❌ Error acknowledging emergency alert:", error);
        res.status(500).json({
            success: false,
            error: "❌ Failed to acknowledge alert",
            details: error.message
        });
    }
});

/**
 * ✅ Resolve Emergency Alert (PUT)
 * API: `/api/emergency/admin/resolve/:alertId`
 */
router.put("/admin/resolve/:alertId", async (req, res) => {
    const { alertId } = req.params;
    const { resolved_by, resolution_notes } = req.body;

    if (!resolved_by) {
        return res.status(400).json({
            success: false,
            error: "❌ resolved_by field is required"
        });
    }

    try {
        // 🔹 Update alert status to resolved
        const query = `
            UPDATE emergency_alerts 
            SET status = 'resolved', 
                resolved_at = NOW(),
                resolution_notes = CONCAT(COALESCE(resolution_notes, ''), '\n\nResolved by: ', ?, '\nResolution: ', COALESCE(?, 'No additional notes'))
            WHERE id = ? AND status != 'resolved'
        `;

        const [result] = await pool.query(query, [resolved_by, resolution_notes, alertId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "❌ Alert not found or already resolved"
            });
        }

        // 🔹 Fetch updated alert data
        const [alertData] = await pool.query(
            'SELECT * FROM emergency_alerts WHERE id = ?', 
            [alertId]
        );

        // 🔹 Broadcast resolution to all connected clients
        const io = req.app.get('socketio');
        if (io) {
            // Broadcast to admin dashboard
            io.to('admin_dashboard').emit('emergency_resolved', {
                type: 'alert_resolved',
                data: alertData[0],
                resolved_by,
                timestamp: new Date().toISOString()
            });

            // Broadcast to the specific user who sent the alert
            const userRoom = `user_sos:${alertData[0].user_type}:${alertData[0].user_id}`;
            io.to(userRoom).emit('sos_status_update', {
                alertId: alertData[0].id,
                status: 'resolved',
                resolved_at: alertData[0].resolved_at,
                resolution_notes: alertData[0].resolution_notes,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 SOS resolution update sent to ${userRoom}`);
        }

        console.log(`✅ Emergency alert ${alertId} resolved by ${resolved_by}`);

        res.status(200).json({
            success: true,
            message: "✅ Emergency alert resolved successfully",
            data: alertData[0]
        });

    } catch (error) {
        console.error("❌ Error resolving emergency alert:", error);
        res.status(500).json({
            success: false,
            error: "❌ Failed to resolve alert",
            details: error.message
        });
    }
});

/**
 * ✅ Get User-specific SOS Alerts (GET)
 * API: `/api/emergency/user/:userType/:userId/alerts`
 * For live tracking by students/captains
 */
router.get("/user/:userType/:userId/alerts", async (req, res) => {
    const { userType, userId } = req.params;
    
    try {
        // Validate user type
        if (!['student', 'captain'].includes(userType)) {
            return res.status(400).json({
                success: false,
                error: "❌ Invalid user type. Must be 'student' or 'captain'"
            });
        }

        const [alerts] = await pool.query(`
            SELECT * FROM emergency_alerts 
            WHERE user_type = ? AND user_id = ?
            ORDER BY timestamp DESC
        `, [userType, parseInt(userId)]);

        res.status(200).json({
            success: true,
            data: alerts,
            count: alerts.length
        });

    } catch (error) {
        console.error("❌ Error fetching user SOS alerts:", error);
        res.status(500).json({
            success: false,
            error: "❌ Failed to fetch user alerts",
            details: error.message
        });
    }
});

/**
 * ✅ Get Emergency Statistics (GET)
 * API: `/api/emergency/admin/stats`
 */
router.get("/admin/stats", async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_alerts,
                SUM(CASE WHEN status = 'acknowledged' THEN 1 ELSE 0 END) as acknowledged_alerts,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_alerts,
                SUM(CASE WHEN user_type = 'student' THEN 1 ELSE 0 END) as student_alerts,
                SUM(CASE WHEN user_type = 'captain' THEN 1 ELSE 0 END) as captain_alerts,
                SUM(CASE WHEN priority_level = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
                SUM(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as alerts_last_24h
            FROM emergency_alerts
        `);

        res.status(200).json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error("❌ Error fetching emergency statistics:", error);
        res.status(500).json({
            success: false,
            error: "❌ Failed to fetch statistics",
            details: error.message
        });
    }
});

module.exports = router;
