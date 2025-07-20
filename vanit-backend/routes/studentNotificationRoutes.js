const express = require('express');
const router = express.Router();
const studentNotificationService = require('../services/studentNotificationService');
const redisClient = require('../config/redis');
const pool = require('../config/db');

/**
 * ---------------------------
 * ✅ Get Student Notifications (GET)
 * ---------------------------
 */
router.get('/student/:studentId/notifications', async (req, res) => {
    const { studentId } = req.params;
    const { limit = 10 } = req.query;
    
    try {
        const notifications = await studentNotificationService.getStudentNotifications(
            studentId, 
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Error getting student notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Student Notification Stats (GET)
 * ---------------------------
 */
router.get('/student/:studentId/notifications/stats', async (req, res) => {
    const { studentId } = req.params;
    
    try {
        const stats = await studentNotificationService.getNotificationStats(studentId);
        
        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification stats'
        });
    }
});

/**
 * ---------------------------
 * ✅ Mark Notifications as Read (POST)
 * ---------------------------
 */
router.post('/student/:studentId/notifications/mark-read', async (req, res) => {
    const { studentId } = req.params;
    const { notificationIds } = req.body; // Optional array of specific notification IDs
    
    try {
        await studentNotificationService.markNotificationsAsRead(studentId, notificationIds);
        
        res.status(200).json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notifications as read'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Last Notification (GET) - Enhanced
 * ---------------------------
 */
router.get('/student/:studentId/last-notification', async (req, res) => {
    const { studentId } = req.params;
    console.log(`🔔 Getting last notification for student: ${studentId}`);

    try {
        // Try Redis first for real-time data
        const redisNotification = await redisClient.get(`student:${studentId}:last_notification`);
        
        if (redisNotification) {
            const notification = typeof redisNotification === 'string' 
                ? JSON.parse(redisNotification) 
                : redisNotification;
                
            console.log(`🔔 Found Redis notification for student ${studentId}:`, notification);
            return res.status(200).json({
                success: true,
                notification
            });
        }

        // Fallback to database
        const recentNotifications = await studentNotificationService.getStudentNotifications(studentId, 1);
        
        if (recentNotifications.length > 0) {
            console.log(`🔔 Found DB notification for student ${studentId}:`, recentNotifications[0]);
            return res.status(200).json({
                success: true,
                notification: recentNotifications[0]
            });
        }

        console.log(`🔔 No notifications found for student ${studentId}`);
        res.status(404).json({
            success: false,
            error: "No recent notifications"
        });
        
    } catch (error) {
        console.error('Error getting student notification:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

/**
 * ---------------------------
 * ✅ Update Student Location (POST) - New Enhanced Endpoint
 * ---------------------------
 */
router.post('/student/:studentId/location', async (req, res) => {
    const { studentId } = req.params;
    const { latitude, longitude, accuracy, locationType = 'current' } = req.body;
    
    try {
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const locationId = await studentNotificationService.updateStudentLocation(
            studentId, 
            parseFloat(latitude), 
            parseFloat(longitude), 
            accuracy ? parseFloat(accuracy) : null,
            locationType
        );

        res.status(200).json({
            success: true,
            message: 'Location updated successfully',
            locationId
        });
    } catch (error) {
        console.error('Error updating student location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update location'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Student Location (GET)
 * ---------------------------
 */
router.get('/student/:studentId/location', async (req, res) => {
    const { studentId } = req.params;
    const { locationType = 'current' } = req.query;
    
    try {
        const location = await studentNotificationService.getStudentLocation(studentId, locationType);
        
        if (location) {
            res.status(200).json({
                success: true,
                location
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No location found'
            });
        }
    } catch (error) {
        console.error('Error getting student location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get location'
        });
    }
});

/**
 * ---------------------------
 * ✅ Track Notification Interaction (POST)
 * ---------------------------
 */
router.post('/student/:studentId/notifications/:notificationId/track', async (req, res) => {
    const { studentId, notificationId } = req.params;
    const { eventType, responseTimeSeconds } = req.body;
    
    try {
        if (!['delivered', 'read', 'clicked', 'dismissed'].includes(eventType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event type'
            });
        }

        await studentNotificationService.trackNotificationInteraction(
            studentId, 
            notificationId, 
            eventType,
            responseTimeSeconds ? parseInt(responseTimeSeconds) : null
        );

        // Also mark as read if event is read or clicked
        if (['read', 'clicked'].includes(eventType)) {
            await studentNotificationService.markNotificationsAsRead(studentId, [notificationId]);
        }

        res.status(200).json({
            success: true,
            message: 'Interaction tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking notification interaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track interaction'
        });
    }
});

/**
 * ---------------------------
 * ✅ Enhanced Update Student Location Preferences (POST)
 * ---------------------------
 */
router.post('/student/:studentId/location-preferences', async (req, res) => {
    const { studentId } = req.params;
    const preferences = req.body;
    
    try {
        await studentNotificationService.updateStudentPreferences(studentId, preferences);

        res.status(200).json({
            success: true,
            message: 'Location preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating location preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Student Location Preferences (GET)
 * ---------------------------
 */
router.get('/student/:studentId/location-preferences', async (req, res) => {
    const { studentId } = req.params;
    
    try {
        const preferences = await studentNotificationService.getStudentPreferences(studentId);

        res.status(200).json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error getting location preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get preferences'
        });
    }
});

/**
 * ---------------------------
 * ✅ Enhanced Test Notification (POST) - For Development & Testing
 * ---------------------------
 */
router.post('/student/:studentId/test-notification', async (req, res) => {
    const { studentId } = req.params;
    const { 
        message = "🚍 Test notification: Your bus is approaching!", 
        type = "test",
        distance = 1.5,
        estimatedTime = 4,
        urgency = "medium",
        captainName = "Test Captain"
    } = req.body;
    
    try {
        const testNotification = {
            type,
            data: {
                studentId: parseInt(studentId),
                studentName: "Test Student",
                captainId: 999,
                captainName,
                busNumber: "TEST-001",
                stopName: "Test Stop",
                distance: parseFloat(distance),
                estimatedTime: parseInt(estimatedTime),
                routeName: "Test Route",
                priority: urgency === 'critical' ? 'high' : urgency,
                urgency,
                title: urgency === 'critical' ? '🚨 BUS ARRIVING NOW!' : '🚍 Bus Update',
                message,
                action: urgency === 'critical' ? 'head_to_stop_now' : 'get_ready',
                timestamp: new Date().toISOString(),
                captainLocation: {
                    latitude: 33.6844,
                    longitude: 73.0479
                },
                metadata: {
                    distanceThreshold: 2.0,
                    timeThreshold: 5,
                    isCritical: urgency === 'critical',
                    isUrgent: ['high', 'critical'].includes(urgency),
                    estimatedArrivalTime: new Date(Date.now() + (parseInt(estimatedTime) * 60 * 1000)).toISOString(),
                    busSpeed: 20
                }
            }
        };

        // Store in Redis with appropriate TTL
        const ttl = urgency === 'critical' ? 300 : 600; // 5-10 minutes TTL for test
        await redisClient.set(
            `student:${studentId}:last_notification`,
            JSON.stringify(testNotification.data),
            ttl
        );

        // Store in database if requested
        if (req.body.storeInDB) {
            await studentNotificationService.storeNotificationHistory(studentId, testNotification);
        }

        // Send real-time notification if student is connected
        const io = req.app.get('socketio');
        if (io) {
            io.to(`student:${studentId}`).emit('student_notification', testNotification);
            console.log(`🔔 Real-time test notification sent to student ${studentId}`);
        }

        res.status(200).json({
            success: true,
            message: 'Test notification sent successfully',
            notification: testNotification,
            metadata: {
                ttl,
                storedInDB: !!req.body.storeInDB,
                sentRealTime: !!io
            }
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification'
        });
    }
});

/**
 * ---------------------------
 * ✅ Comprehensive Notification System Status (GET)
 * ---------------------------
 */
router.get('/system/status', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        
        // Get overall system statistics
        const [systemStats] = await pool.query(`
            SELECT 
                COUNT(DISTINCT sn.student_id) as students_with_notifications,
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN sn.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as notifications_last_hour,
                COUNT(CASE WHEN sn.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as notifications_last_24h,
                COUNT(CASE WHEN sn.priority = 'high' THEN 1 END) as high_priority_notifications,
                AVG(sn.distance) as avg_notification_distance,
                AVG(sn.estimated_time) as avg_estimated_time
            FROM student_notifications sn
            WHERE sn.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // Get route-wise statistics
        const [routeStats] = await pool.query(`
            SELECT 
                sn.route_name,
                COUNT(*) as notification_count,
                COUNT(DISTINCT sn.student_id) as unique_students,
                AVG(sn.distance) as avg_distance,
                AVG(sn.estimated_time) as avg_time,
                MAX(sn.created_at) as last_notification
            FROM student_notifications sn
            WHERE sn.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY sn.route_name
            ORDER BY notification_count DESC
        `);

        // Get notification preferences statistics
        const [prefStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_students_with_prefs,
                COUNT(CASE WHEN enable_location_notifications = 1 THEN 1 END) as notifications_enabled,
                AVG(notification_radius_km) as avg_radius,
                AVG(notification_time_threshold_minutes) as avg_time_threshold,
                COUNT(CASE WHEN quiet_hours_start IS NOT NULL THEN 1 END) as students_with_quiet_hours
            FROM student_notification_preferences
        `);

        // Get Redis connection status
        const redisStatus = redisClient.isConnected;

        // Get WebSocket connection count
        const connectedSockets = io ? io.sockets.sockets.size : 0;

        res.status(200).json({
            success: true,
            status: {
                system: {
                    redis_connected: redisStatus,
                    websocket_connected: !!io,
                    connected_sockets: connectedSockets,
                    timestamp: new Date().toISOString()
                },
                notifications: systemStats[0] || {},
                routes: routeStats || [],
                preferences: prefStats[0] || {},
                thresholds: {
                    distance_km: 2.0,
                    time_minutes: 5,
                    emergency_distance_km: 0.5,
                    emergency_time_minutes: 2
                }
            }
        });

    } catch (error) {
        console.error('Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system status'
        });
    }
});

/**
 * ---------------------------
 * ✅ Force Process Route Notifications (POST) - Admin/Debug
 * ---------------------------
 */
router.post('/admin/force-process-route/:routeName', async (req, res) => {
    const { routeName } = req.params;
    const { 
        captainId = 1, 
        latitude = 33.6844, 
        longitude = 73.0479 
    } = req.body;
    
    try {
        console.log(`🔧 Force processing notifications for route: ${routeName}`);
        
        await studentNotificationService.processStudentNotifications(
            captainId, 
            parseFloat(latitude), 
            parseFloat(longitude), 
            routeName
        );

        res.status(200).json({
            success: true,
            message: `Forced processing of notifications for route ${routeName}`,
            processed_at: new Date().toISOString(),
            captain_location: { latitude, longitude }
        });

    } catch (error) {
        console.error('Error force processing route notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to force process notifications'
        });
    }
});

module.exports = router;
