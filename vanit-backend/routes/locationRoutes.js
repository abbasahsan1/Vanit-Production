const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');
const pool = require('../config/db');

/**
 * ---------------------------
 * ✅ Update Captain Location (POST)
 * ---------------------------
 */
router.post('/captain/location', async (req, res) => {
    const { captainId, latitude, longitude, timestamp } = req.body;

    console.log(`📍 HTTP API location update received:`, { captainId, latitude, longitude, timestamp });

    if (!captainId || !latitude || !longitude) {
        return res.status(400).json({ 
            error: "Missing required fields: captainId, latitude, longitude" 
        });
    }

    try {
        // Verify captain exists and is active
        const [captainData] = await pool.query(
            'SELECT id, is_active FROM captains WHERE id = ?',
            [captainId]
        );

        if (captainData.length === 0) {
            return res.status(404).json({ error: "Captain not found" });
        }

        if (captainData[0].is_active !== 1) {
            return res.status(400).json({ error: "Captain is not active" });
        }

        const success = await locationService.updateCaptainLocation(
            captainId, 
            latitude, 
            longitude, 
            timestamp
        );

        if (success) {
            res.status(200).json({ 
                message: "Location updated successfully",
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: "Failed to update location" });
        }
    } catch (error) {
        console.error('Error updating captain location:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Get Captain Location (GET)
 * ---------------------------
 */
router.get('/captain/:captainId/location', async (req, res) => {
    const { captainId } = req.params;

    try {
        const location = await locationService.getCaptainLocation(captainId);
        
        if (location) {
            res.status(200).json(location);
        } else {
            res.status(404).json({ error: "Captain location not found" });
        }
    } catch (error) {
        console.error('Error getting captain location:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Get Route Locations (GET)
 * ---------------------------
 */
router.get('/route/:routeName/locations', async (req, res) => {
    const { routeName } = req.params;
    
    // Decode the route name in case it was URL encoded
    const decodedRouteName = decodeURIComponent(routeName);
    console.log(`📍 Getting locations for route: "${decodedRouteName}"`);

    try {
        const locations = await locationService.getRouteLocations(decodedRouteName);
        console.log(`📍 Found ${locations.length} active captains for route: "${decodedRouteName}"`);
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error getting route locations:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Start Location Tracking (POST)
 * ---------------------------
 */
router.post('/captain/:captainId/start-tracking', async (req, res) => {
    const { captainId } = req.params;

    try {
        // Verify captain exists
        const [captainData] = await pool.query(
            'SELECT id, is_active FROM captains WHERE id = ?',
            [captainId]
        );

        if (captainData.length === 0) {
            return res.status(404).json({ error: "Captain not found" });
        }

        locationService.startTracking(captainId);
        
        res.status(200).json({ 
            message: "Location tracking started",
            captainId: parseInt(captainId)
        });
    } catch (error) {
        console.error('Error starting location tracking:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Get Captain Tracking Status (GET)
 * ---------------------------
 */
router.get('/captain/:captainId/status', async (req, res) => {
    const { captainId } = req.params;

    try {
        const locationService = require('../services/locationService');
        const isTracking = locationService.isTracking(parseInt(captainId));
        const location = locationService.getCaptainLocation(parseInt(captainId));

        res.status(200).json({
            captainId: parseInt(captainId),
            isTracking: isTracking,
            location: location || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting captain tracking status:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Stop Location Tracking (POST)
 * ---------------------------
 */
router.post('/captain/:captainId/stop-tracking', async (req, res) => {
    const { captainId } = req.params;

    try {
        locationService.stopTracking(captainId);
        
        res.status(200).json({ 
            message: "Location tracking stopped",
            captainId: parseInt(captainId)
        });
    } catch (error) {
        console.error('Error stopping location tracking:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Get All Active Captains (GET)
 * ---------------------------
 */
router.get('/captains/active', async (req, res) => {
    try {
        const activeCaptains = locationService.getActiveCaptains();
        res.status(200).json(activeCaptains);
    } catch (error) {
        console.error('Error getting active captains:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Get Student's Last Notification (GET)
 * ---------------------------
 */
router.get('/student/:studentId/last-notification', async (req, res) => {
    const { studentId } = req.params;
    console.log(`🔔 Getting last notification for student: ${studentId}`);

    try {
        const redisClient = require('../config/redis');
        const notification = await redisClient.get(`student:${studentId}:last_notification`);
        
        if (notification) {
            console.log(`🔔 Found notification for student ${studentId}:`, notification);
            res.status(200).json(notification);
        } else {
            console.log(`🔔 No notifications found for student ${studentId}`);
            res.status(404).json({ error: "No recent notifications" });
        }
    } catch (error) {
        console.error('Error getting student notification:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * ---------------------------
 * ✅ Debug: Force Activate Captain (POST)
 * ---------------------------
 */
router.post('/debug/activate-captain/:captainId', async (req, res) => {
    const { captainId } = req.params;
    
    try {
        const normalizedCaptainId = parseInt(captainId);
        console.log(`🔧 DEBUG: Force activating captain ${normalizedCaptainId}`);
        
        await pool.query('UPDATE captains SET is_active = 1 WHERE id = ?', [normalizedCaptainId]);
        
        // Also add some mock location data
        const mockLocation = {
            captainId: normalizedCaptainId,
            latitude: 33.555957,
            longitude: 73.131175,
            timestamp: new Date().toISOString()
        };
        
        const locationService = require('../services/locationService');
        locationService.activeCaptains.set(normalizedCaptainId, mockLocation);
        
        res.status(200).json({ 
            message: `Captain ${normalizedCaptainId} forcefully activated`,
            location: mockLocation
        });
    } catch (error) {
        console.error('Error force activating captain:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router; 