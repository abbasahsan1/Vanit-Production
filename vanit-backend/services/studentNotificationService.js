const pool = require('../config/db');
const redisClient = require('../config/redis');

class StudentNotificationService {
    constructor() {
        this.studentNotificationCooldowns = new Map(); // studentId -> last notification time
        this.proximityThresholdKm = parseFloat(process.env.NOTIFY_DISTANCE_KM) || 2.0; // Exactly 2km as requested
        this.timeThresholdMinutes = parseInt(process.env.NOTIFY_TIME_MINUTES) || 5; // Exactly 5 minutes as requested
        this.cooldownMs = parseInt(process.env.NOTIFICATION_COOLDOWN_MS) || 600000; // 10 minutes cooldown (reduced for better UX)
        this.averageSpeedKmh = parseFloat(process.env.AVERAGE_BUS_SPEED_KMH) || 20; // More realistic bus speed in urban areas
        this.emergencyThresholdKm = 0.5; // Critical distance threshold for urgent notifications
        this.emergencyTimeMinutes = 2; // Critical time threshold for urgent notifications
        
        console.log(`🔔 Student Notification Service initialized:`);
        console.log(`   📏 Distance threshold: ${this.proximityThresholdKm} km`);
        console.log(`   ⏰ Time threshold: ${this.timeThresholdMinutes} minutes`);
        console.log(`   🚌 Average speed: ${this.averageSpeedKmh} km/h`);
        console.log(`   ⏳ Cooldown: ${this.cooldownMs / 1000} seconds`);
    }

    // Enhanced distance calculation with higher precision
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371.0; // Earth's radius in kilometers (more precise value)
        const lat1Rad = this.toRadians(lat1);
        const lat2Rad = this.toRadians(lat2);
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Round to 3 decimal places for better precision
        return Math.round(distance * 1000) / 1000;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    // Enhanced time calculation with traffic and route considerations
    calculateEstimatedTime(distanceKm, isUrgent = false) {
        // Adjust speed based on distance (closer = slower due to stops/traffic)
        let adjustedSpeed = this.averageSpeedKmh;
        
        if (distanceKm <= 1) {
            adjustedSpeed = this.averageSpeedKmh * 0.6; // 60% speed for very close distances
        } else if (distanceKm <= 3) {
            adjustedSpeed = this.averageSpeedKmh * 0.8; // 80% speed for nearby distances
        }
        
        const timeHours = distanceKm / adjustedSpeed;
        const timeMinutes = timeHours * 60;
        
        // Add buffer time for stops and traffic
        const bufferMinutes = Math.min(3, distanceKm * 0.5); // Max 3 minutes buffer
        const totalTime = timeMinutes + bufferMinutes;
        
        return Math.round(totalTime);
    }

    // Enhanced notification logic with multiple conditions and urgency levels
    async shouldNotifyStudent(studentId, distanceKm, estimatedTimeMinutes, routeName) {
        try {
            // Get student preferences from database
            const [preferences] = await pool.query(`
                SELECT * FROM student_notification_preferences 
                WHERE student_id = ?
            `, [studentId]);
            
            const studentPrefs = preferences[0] || {
                enable_location_notifications: true,
                notification_radius_km: this.proximityThresholdKm,
                notification_time_threshold_minutes: this.timeThresholdMinutes
            };
            
            // Check if notifications are disabled
            if (!studentPrefs.enable_location_notifications) {
                return { shouldNotify: false, reason: 'notifications_disabled' };
            }
            
            // Check quiet hours if configured
            if (studentPrefs.quiet_hours_start && studentPrefs.quiet_hours_end) {
                const now = new Date();
                const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
                
                if (currentTime >= studentPrefs.quiet_hours_start && currentTime <= studentPrefs.quiet_hours_end) {
                    // Only allow critical notifications during quiet hours
                    const isCritical = distanceKm <= this.emergencyThresholdKm || estimatedTimeMinutes <= this.emergencyTimeMinutes;
                    if (!isCritical) {
                        return { shouldNotify: false, reason: 'quiet_hours' };
                    }
                }
            }
            
            // Check cooldown with dynamic adjustment based on urgency
            const lastNotification = this.studentNotificationCooldowns.get(studentId);
            const now = Date.now();
            
            let cooldownPeriod = this.cooldownMs;
            
            // Critical situations get reduced cooldown
            if (distanceKm <= this.emergencyThresholdKm || estimatedTimeMinutes <= this.emergencyTimeMinutes) {
                cooldownPeriod = this.cooldownMs * 0.3; // 70% reduction for critical notifications
            } else if (distanceKm <= 1 || estimatedTimeMinutes <= 3) {
                cooldownPeriod = this.cooldownMs * 0.6; // 40% reduction for urgent notifications
            }
            
            if (lastNotification && (now - lastNotification) < cooldownPeriod) {
                return { shouldNotify: false, reason: 'cooldown_active', timeRemaining: cooldownPeriod - (now - lastNotification) };
            }
            
            // Primary notification conditions with student preferences
            const withinDistance = distanceKm <= (studentPrefs.notification_radius_km || this.proximityThresholdKm);
            const withinTime = estimatedTimeMinutes <= (studentPrefs.notification_time_threshold_minutes || this.timeThresholdMinutes);
            
            // Additional emergency conditions
            const isCritical = distanceKm <= this.emergencyThresholdKm || estimatedTimeMinutes <= this.emergencyTimeMinutes;
            
            const shouldNotify = withinDistance || withinTime || isCritical;
            
            if (shouldNotify) {
                // Determine urgency level
                let urgency = 'medium';
                if (isCritical) {
                    urgency = 'critical';
                } else if (distanceKm <= 1 || estimatedTimeMinutes <= 3) {
                    urgency = 'high';
                } else if (withinDistance && withinTime) {
                    urgency = 'high';
                }
                
                return { 
                    shouldNotify: true, 
                    urgency,
                    reason: isCritical ? 'critical' : (withinDistance && withinTime ? 'both_conditions' : (withinDistance ? 'distance' : 'time'))
                };
            }
            
            return { shouldNotify: false, reason: 'conditions_not_met' };
            
        } catch (error) {
            console.error('❌ Error checking notification conditions:', error);
            // Fallback to basic logic
            const withinDistance = distanceKm <= this.proximityThresholdKm;
            const withinTime = estimatedTimeMinutes <= this.timeThresholdMinutes;
            return { shouldNotify: withinDistance || withinTime, urgency: 'medium', reason: 'fallback' };
        }
    }

    // Enhanced student notification processing with better accuracy
    async processStudentNotifications(captainId, captainLat, captainLon, routeName) {
        try {
            console.log(`🔔 Processing enhanced student notifications for route: ${routeName} at location: [${captainLat}, ${captainLon}]`);
            
            // Validate coordinates
            if (!captainLat || !captainLon || isNaN(captainLat) || isNaN(captainLon)) {
                console.error('❌ Invalid captain coordinates provided');
                return;
            }
            
            // Get captain details
            const [captainData] = await pool.query(
                'SELECT first_name, last_name, bus_no FROM captains WHERE id = ?',
                [captainId]
            );

            if (captainData.length === 0) {
                console.log(`❌ Captain ${captainId} not found`);
                return;
            }

            const captainName = `${captainData[0].first_name} ${captainData[0].last_name}`;
            const busNumber = captainData[0].bus_no || 'N/A';

            // Get all students on this route with their stop coordinates and preferences
            const [students] = await pool.query(`
                SELECT DISTINCT
                    s.id, s.first_name, s.last_name, s.registration_number, s.stop_name,
                    st.latitude as stop_latitude, st.longitude as stop_longitude,
                    r.id as route_id,
                    snp.enable_location_notifications,
                    snp.notification_radius_km,
                    snp.notification_time_threshold_minutes,
                    snp.quiet_hours_start,
                    snp.quiet_hours_end
                FROM students s
                LEFT JOIN routes r ON r.route_name = s.route_name
                LEFT JOIN stops st ON s.stop_name = st.stop_name AND st.route_id = r.id
                LEFT JOIN student_notification_preferences snp ON s.id = snp.student_id
                WHERE s.route_name = ? AND st.latitude IS NOT NULL AND st.longitude IS NOT NULL
            `, [routeName]);

            console.log(`👥 Found ${students.length} students on route ${routeName} with valid stop coordinates`);

            const notifications = [];
            const analyticsData = [];

            for (const student of students) {
                try {
                    const stopLat = parseFloat(student.stop_latitude);
                    const stopLon = parseFloat(student.stop_longitude);
                    
                    // Validate stop coordinates
                    if (isNaN(stopLat) || isNaN(stopLon)) {
                        console.warn(`⚠️ Invalid coordinates for student ${student.id} stop: ${student.stop_name}`);
                        continue;
                    }
                    
                    // Calculate distance to student's stop
                    const distanceToStop = this.calculateDistance(
                        captainLat, captainLon, stopLat, stopLon
                    );
                    
                    const estimatedTime = this.calculateEstimatedTime(distanceToStop);

                    // Enhanced notification decision logic
                    const notificationDecision = await this.shouldNotifyStudent(
                        student.id, distanceToStop, estimatedTime, routeName
                    );

                    if (notificationDecision.shouldNotify) {
                        // Create enhanced notification
                        const notification = await this.createEnhancedStudentNotification(
                            student, captainName, captainId, busNumber, distanceToStop, 
                            estimatedTime, routeName, notificationDecision.urgency, captainLat, captainLon
                        );
                        
                        notifications.push({
                            studentId: student.id,
                            notification,
                            urgency: notificationDecision.urgency,
                            reason: notificationDecision.reason
                        });

                        // Set cooldown
                        this.studentNotificationCooldowns.set(student.id, Date.now());
                        
                        // Track analytics
                        analyticsData.push({
                            student_id: student.id,
                            route_name: routeName,
                            captain_id: captainId,
                            event_type: 'sent',
                            distance_at_event: distanceToStop,
                            time_to_stop_minutes: estimatedTime
                        });
                        
                        console.log(`🔔 ${notificationDecision.urgency.toUpperCase()} notification queued for ${student.first_name} (${student.id}): ${notification.data.message}`);
                    } else {
                        console.log(`⏳ No notification for ${student.first_name} (${student.id}): ${notificationDecision.reason} (${distanceToStop}km, ${estimatedTime}min)`);
                    }
                    
                } catch (studentError) {
                    console.error(`❌ Error processing student ${student.id}:`, studentError);
                }
            }

            // Send all notifications
            if (notifications.length > 0) {
                await this.sendEnhancedNotifications(notifications, routeName);
                
                // Store analytics
                if (analyticsData.length > 0) {
                    await this.storeAnalytics(analyticsData);
                }
            }
            
            console.log(`✅ Processed ${notifications.length} notifications for route ${routeName} (${students.length} total students)`);
            
        } catch (error) {
            console.error('❌ Error processing student notifications:', error);
        }
    }

    // Create enhanced notification with multiple urgency levels and better messaging
    async createEnhancedStudentNotification(student, captainName, captainId, busNumber, distance, estimatedTime, routeName, urgency, captainLat, captainLon) {
        const distanceRounded = Math.round(distance * 1000) / 1000; // 3 decimal places
        
        // Determine notification type, message, and priority based on urgency
        let notificationType, message, priority, title, action;
        
        switch (urgency) {
            case 'critical':
                notificationType = 'bus_arriving_now';
                title = '🚨 BUS ARRIVING NOW!';
                message = `URGENT: Bus ${busNumber} (${captainName}) is only ${distanceRounded}km away (~${estimatedTime} min). GET TO ${student.stop_name} IMMEDIATELY!`;
                priority = 'high';
                action = 'head_to_stop_now';
                break;
                
            case 'high':
                if (distance <= this.proximityThresholdKm && estimatedTime <= this.timeThresholdMinutes) {
                    notificationType = 'bus_arriving_soon';
                    title = '🚍 Bus Arriving Soon!';
                    message = `Bus ${busNumber} (${captainName}) is ${distanceRounded}km away (~${estimatedTime} min) from ${student.stop_name}. Please get ready now!`;
                    action = 'get_ready_now';
                } else if (distance <= this.proximityThresholdKm) {
                    notificationType = 'bus_nearby';
                    title = '🚍 Bus Nearby!';
                    message = `Bus ${busNumber} (${captainName}) is ${distanceRounded}km away from ${student.stop_name}. Start heading to your stop!`;
                    action = 'start_heading';
                } else {
                    notificationType = 'bus_time_approaching';
                    title = '⏰ Bus Arriving Soon!';
                    message = `Bus ${busNumber} (${captainName}) will reach ${student.stop_name} in ~${estimatedTime} minutes. Head to your stop!`;
                    action = 'head_to_stop';
                }
                priority = 'high';
                break;
                
            default: // medium
                notificationType = 'bus_approaching';
                title = '🚍 Bus Update';
                message = `Bus ${busNumber} (${captainName}) is approaching ${student.stop_name} (${distanceRounded}km away, ~${estimatedTime} min).`;
                priority = 'medium';
                action = 'be_prepared';
        }

        // Add weather consideration (could be enhanced with actual weather API)
        const hour = new Date().getHours();
        let weatherNote = '';
        if (hour >= 22 || hour <= 6) {
            weatherNote = ' It\'s late - stay safe!';
        } else if (hour >= 12 && hour <= 14) {
            weatherNote = ' Stay hydrated!';
        }

        return {
            type: notificationType,
            data: {
                studentId: student.id,
                studentName: `${student.first_name} ${student.last_name}`,
                registrationNumber: student.registration_number,
                captainId,
                captainName,
                busNumber,
                stopName: student.stop_name,
                distance: distanceRounded,
                estimatedTime,
                routeName,
                priority,
                urgency,
                title,
                message: message + weatherNote,
                action,
                timestamp: new Date().toISOString(),
                captainLocation: {
                    latitude: captainLat,
                    longitude: captainLon
                },
                // Additional metadata for frontend
                metadata: {
                    distanceThreshold: this.proximityThresholdKm,
                    timeThreshold: this.timeThresholdMinutes,
                    isCritical: urgency === 'critical',
                    isUrgent: urgency === 'high' || urgency === 'critical',
                    estimatedArrivalTime: new Date(Date.now() + (estimatedTime * 60 * 1000)).toISOString(),
                    busSpeed: this.averageSpeedKmh
                }
            }
        };
    }

    // Enhanced notification sending with priority handling and analytics
    async sendEnhancedNotifications(notifications, routeName) {
        try {
            // Sort notifications by urgency (critical first)
            const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            notifications.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

            for (const { studentId, notification, urgency, reason } of notifications) {
                try {
                    // Store notification in database
                    const [result] = await pool.query(`
                        INSERT INTO student_notifications 
                        (student_id, type, message, priority, distance, estimated_time, 
                         captain_id, route_name, stop_name, location_lat, location_lng)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        studentId,
                        notification.type,
                        notification.data.message,
                        notification.data.priority,
                        notification.data.distance,
                        notification.data.estimatedTime,
                        notification.data.captainId,
                        notification.data.routeName,
                        notification.data.stopName,
                        notification.data.captainLocation.latitude,
                        notification.data.captainLocation.longitude
                    ]);

                    const notificationId = result.insertId;
                    notification.data.notificationId = notificationId;

                    // Store in Redis for offline students with TTL based on urgency
                    let ttl = 3600; // 1 hour default
                    if (urgency === 'critical') ttl = 1800; // 30 minutes for critical
                    else if (urgency === 'high') ttl = 2700; // 45 minutes for high

                    await redisClient.set(
                        `student:${studentId}:last_notification`,
                        JSON.stringify(notification.data),
                        ttl
                    );

                    // Also store in a queue for batch processing
                    await redisClient.set(
                        `student:${studentId}:notification:${notificationId}`,
                        JSON.stringify({...notification.data, urgency, reason}),
                        ttl
                    );

                } catch (error) {
                    console.error(`❌ Error storing notification for student ${studentId}:`, error);
                }
            }

            // Broadcast to route subscribers with different events based on urgency
            if (notifications.length > 0) {
                const criticalNotifications = notifications.filter(n => n.urgency === 'critical');
                const highNotifications = notifications.filter(n => n.urgency === 'high');
                const normalNotifications = notifications.filter(n => ['medium', 'low'].includes(n.urgency));

                // Send critical notifications immediately
                if (criticalNotifications.length > 0) {
                    const publishData = JSON.stringify({
                        type: 'critical_student_notifications',
                        routeName,
                        urgency: 'critical',
                        notifications: criticalNotifications.map(n => n.notification),
                        timestamp: new Date().toISOString()
                    });
                    await redisClient.publish(`route:${routeName}:critical_notifications`, publishData);
                }

                // Send high priority notifications
                if (highNotifications.length > 0) {
                    const publishData = JSON.stringify({
                        type: 'high_priority_student_notifications',
                        routeName,
                        urgency: 'high',
                        notifications: highNotifications.map(n => n.notification),
                        timestamp: new Date().toISOString()
                    });
                    await redisClient.publish(`route:${routeName}:high_priority_notifications`, publishData);
                }

                // Send normal notifications
                if (normalNotifications.length > 0) {
                    const publishData = JSON.stringify({
                        type: 'student_notifications',
                        routeName,
                        urgency: 'normal',
                        notifications: normalNotifications.map(n => n.notification),
                        timestamp: new Date().toISOString()
                    });
                    await redisClient.publish(`route:${routeName}:student_notifications`, publishData);
                }

                console.log(`📡 Published notifications for route ${routeName}: ${criticalNotifications.length} critical, ${highNotifications.length} high, ${normalNotifications.length} normal`);
            }

        } catch (error) {
            console.error('❌ Error sending enhanced notifications:', error);
        }
    }

    // Store analytics data for tracking notification effectiveness
    async storeAnalytics(analyticsData) {
        try {
            if (analyticsData.length === 0) return;

            const values = analyticsData.map(data => [
                data.student_id,
                data.route_name,
                data.captain_id,
                data.event_type,
                data.distance_at_event,
                data.time_to_stop_minutes
            ]);

            const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
            const flatValues = values.flat();

            await pool.query(`
                INSERT INTO notification_analytics 
                (student_id, route_name, captain_id, event_type, distance_at_event, time_to_stop_minutes)
                VALUES ${placeholders}
            `, flatValues);

            console.log(`📊 Stored ${analyticsData.length} analytics records`);

        } catch (error) {
            console.error('❌ Error storing analytics:', error);
        }
    }

    // Store notification in database for history (legacy function - enhanced)
    async storeNotificationHistory(studentId, notification) {
        try {
            const [result] = await pool.query(`
                INSERT INTO student_notifications 
                (student_id, type, message, priority, distance, estimated_time, captain_id, route_name, stop_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                studentId,
                notification.type,
                notification.data.message,
                notification.data.priority || 'medium',
                notification.data.distance,
                notification.data.estimatedTime,
                notification.data.captainId,
                notification.data.routeName,
                notification.data.stopName
            ]);

            return result.insertId;

        } catch (error) {
            // If table doesn't exist, create it
            if (error.code === 'ER_NO_SUCH_TABLE') {
                await this.createNotificationTable();
                // Retry
                return await this.storeNotificationHistory(studentId, notification);
            } else {
                console.error('❌ Error storing notification history:', error);
                return null;
            }
        }
    }

    // Create student notifications table if it doesn't exist
    async createNotificationTable() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS student_notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    message TEXT NOT NULL,
                    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                    distance DECIMAL(5,2),
                    estimated_time INT,
                    read_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_student_created (student_id, created_at),
                    INDEX idx_type_priority (type, priority),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ Created student_notifications table');
        } catch (error) {
            console.error('❌ Error creating notification table:', error);
        }
    }

    // Get recent notifications for a student
    async getStudentNotifications(studentId, limit = 10) {
        try {
            const [notifications] = await pool.query(`
                SELECT * FROM student_notifications 
                WHERE student_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [studentId, limit]);

            return notifications;
        } catch (error) {
            console.error('❌ Error getting student notifications:', error);
            return [];
        }
    }

    // Mark notifications as read
    async markNotificationsAsRead(studentId, notificationIds = null) {
        try {
            if (notificationIds && notificationIds.length > 0) {
                // Mark specific notifications as read
                const placeholders = notificationIds.map(() => '?').join(',');
                await pool.query(`
                    UPDATE student_notifications 
                    SET read_at = NOW() 
                    WHERE student_id = ? AND id IN (${placeholders}) AND read_at IS NULL
                `, [studentId, ...notificationIds]);
            } else {
                // Mark all unread notifications as read
                await pool.query(`
                    UPDATE student_notifications 
                    SET read_at = NOW() 
                    WHERE student_id = ? AND read_at IS NULL
                `, [studentId]);
            }
        } catch (error) {
            console.error('❌ Error marking notifications as read:', error);
        }
    }

    // Get notification statistics for a student with enhanced metrics
    async getNotificationStats(studentId) {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
                    COUNT(CASE WHEN priority = 'high' AND read_at IS NULL THEN 1 END) as unread_high_priority,
                    COUNT(CASE WHEN type = 'bus_arriving_now' THEN 1 END) as critical_notifications,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_total,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND read_at IS NULL THEN 1 END) as today_unread,
                    MAX(created_at) as last_notification,
                    AVG(distance) as avg_distance,
                    AVG(estimated_time) as avg_estimated_time
                FROM student_notifications 
                WHERE student_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            `, [studentId]);

            // Get analytics data
            const [analytics] = await pool.query(`
                SELECT 
                    COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as notifications_sent,
                    COUNT(CASE WHEN event_type = 'read' THEN 1 END) as notifications_read,
                    COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as notifications_clicked,
                    AVG(response_time_seconds) as avg_response_time,
                    AVG(distance_at_event) as avg_distance_when_notified
                FROM notification_analytics 
                WHERE student_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            `, [studentId]);

            const baseStats = stats[0] || { 
                total: 0, unread: 0, unread_high_priority: 0, critical_notifications: 0,
                today_total: 0, today_unread: 0, last_notification: null,
                avg_distance: null, avg_estimated_time: null
            };

            const analyticsStats = analytics[0] || {
                notifications_sent: 0, notifications_read: 0, notifications_clicked: 0,
                avg_response_time: null, avg_distance_when_notified: null
            };

            return {
                ...baseStats,
                ...analyticsStats,
                read_rate: baseStats.total > 0 ? Math.round((analyticsStats.notifications_read / baseStats.total) * 100) : 0,
                click_rate: analyticsStats.notifications_read > 0 ? Math.round((analyticsStats.notifications_clicked / analyticsStats.notifications_read) * 100) : 0
            };

        } catch (error) {
            console.error('❌ Error getting notification stats:', error);
            return { 
                total: 0, unread: 0, unread_high_priority: 0, critical_notifications: 0,
                today_total: 0, today_unread: 0, last_notification: null,
                notifications_sent: 0, notifications_read: 0, read_rate: 0, click_rate: 0
            };
        }
    }

    // Update student location for better distance calculations
    async updateStudentLocation(studentId, latitude, longitude, accuracy = null, locationType = 'current') {
        try {
            // Validate coordinates
            if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                throw new Error('Invalid coordinates provided');
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new Error('Coordinates out of valid range');
            }

            // Deactivate previous locations of the same type
            await pool.query(`
                UPDATE student_locations 
                SET is_active = FALSE 
                WHERE student_id = ? AND location_type = ?
            `, [studentId, locationType]);

            // Insert new location
            const [result] = await pool.query(`
                INSERT INTO student_locations 
                (student_id, latitude, longitude, accuracy, location_type, is_active)
                VALUES (?, ?, ?, ?, ?, TRUE)
            `, [studentId, latitude, longitude, accuracy, locationType]);

            console.log(`📍 Updated location for student ${studentId}: [${latitude}, ${longitude}] (${locationType})`);
            return result.insertId;

        } catch (error) {
            console.error('❌ Error updating student location:', error);
            throw error;
        }
    }

    // Get student's current location
    async getStudentLocation(studentId, locationType = 'current') {
        try {
            const [locations] = await pool.query(`
                SELECT * FROM student_locations 
                WHERE student_id = ? AND location_type = ? AND is_active = TRUE
                ORDER BY created_at DESC
                LIMIT 1
            `, [studentId, locationType]);

            return locations.length > 0 ? locations[0] : null;

        } catch (error) {
            console.error('❌ Error getting student location:', error);
            return null;
        }
    }

    // Update student notification preferences
    async updateStudentPreferences(studentId, preferences) {
        try {
            const {
                enable_location_notifications = true,
                notification_radius_km = this.proximityThresholdKm,
                notification_time_threshold_minutes = this.timeThresholdMinutes,
                enable_sound = true,
                enable_vibration = true,
                notification_frequency = 'immediate',
                quiet_hours_start = null,
                quiet_hours_end = null
            } = preferences;

            // Validate values
            const validatedRadius = Math.max(0.5, Math.min(10, parseFloat(notification_radius_km)));
            const validatedTime = Math.max(1, Math.min(30, parseInt(notification_time_threshold_minutes)));

            await pool.query(`
                INSERT INTO student_notification_preferences 
                (student_id, enable_location_notifications, notification_radius_km, 
                 notification_time_threshold_minutes, enable_sound, enable_vibration,
                 notification_frequency, quiet_hours_start, quiet_hours_end)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                enable_location_notifications = VALUES(enable_location_notifications),
                notification_radius_km = VALUES(notification_radius_km),
                notification_time_threshold_minutes = VALUES(notification_time_threshold_minutes),
                enable_sound = VALUES(enable_sound),
                enable_vibration = VALUES(enable_vibration),
                notification_frequency = VALUES(notification_frequency),
                quiet_hours_start = VALUES(quiet_hours_start),
                quiet_hours_end = VALUES(quiet_hours_end),
                updated_at = CURRENT_TIMESTAMP
            `, [
                studentId, enable_location_notifications, validatedRadius, validatedTime,
                enable_sound, enable_vibration, notification_frequency,
                quiet_hours_start, quiet_hours_end
            ]);

            console.log(`✅ Updated notification preferences for student ${studentId}`);
            return true;

        } catch (error) {
            console.error('❌ Error updating student preferences:', error);
            throw error;
        }
    }

    // Get student notification preferences
    async getStudentPreferences(studentId) {
        try {
            const [preferences] = await pool.query(`
                SELECT * FROM student_notification_preferences 
                WHERE student_id = ?
            `, [studentId]);

            if (preferences.length > 0) {
                return preferences[0];
            }

            // Return default preferences if not found
            const defaultPrefs = {
                student_id: studentId,
                enable_location_notifications: true,
                notification_radius_km: this.proximityThresholdKm,
                notification_time_threshold_minutes: this.timeThresholdMinutes,
                enable_sound: true,
                enable_vibration: true,
                notification_frequency: 'immediate',
                quiet_hours_start: null,
                quiet_hours_end: null
            };

            // Insert defaults
            await this.updateStudentPreferences(studentId, defaultPrefs);
            return defaultPrefs;

        } catch (error) {
            console.error('❌ Error getting student preferences:', error);
            // Return safe defaults
            return {
                enable_location_notifications: true,
                notification_radius_km: this.proximityThresholdKm,
                notification_time_threshold_minutes: this.timeThresholdMinutes,
                enable_sound: true,
                enable_vibration: true
            };
        }
    }

    // Track notification interaction for analytics
    async trackNotificationInteraction(studentId, notificationId, eventType, responseTimeSeconds = null) {
        try {
            await pool.query(`
                INSERT INTO notification_analytics 
                (student_id, notification_id, event_type, response_time_seconds)
                SELECT ?, ?, ?, ?
                FROM student_notifications sn
                WHERE sn.id = ?
            `, [studentId, notificationId, eventType, responseTimeSeconds, notificationId]);

            console.log(`📊 Tracked ${eventType} for notification ${notificationId}`);

        } catch (error) {
            console.error('❌ Error tracking notification interaction:', error);
        }
    }
}

module.exports = new StudentNotificationService();
