const pool = require('../config/db');
const redisClient = require('../config/redis');
const studentNotificationService = require('./studentNotificationService');

class LocationService {
    constructor() {
        this.activeCaptains = new Map(); // captainId -> location data
        this.notificationCooldowns = new Map(); // stopId -> last notification time
        
        // Initialize active captains from database on startup
        this.initializeActiveCaptains();
    }
    
    // Load currently active captains from database into memory
    async initializeActiveCaptains() {
        try {
            const [activeCaptains] = await pool.query(
                'SELECT id, route_name, first_name, last_name FROM captains WHERE is_active = 1'
            );
            
            console.log(`🔄 Initializing ${activeCaptains.length} active captains from database`);
            
            // Try to restore location data from Redis for each active captain
            for (const captain of activeCaptains) {
                try {
                    const redisData = await redisClient.get(`captain:${captain.id}:location`);
                    if (redisData) {
                        const locationData = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                        this.activeCaptains.set(captain.id, locationData);
                        console.log(`✅ Restored location data for captain ${captain.id}`);
                    }
                } catch (error) {
                    console.log(`❌ Could not restore location for captain ${captain.id}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error initializing active captains:', error);
        }
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    // Update captain location and broadcast to subscribers
    async updateCaptainLocation(captainId, latitude, longitude, timestamp) {
        try {
            // Ensure captainId is always an integer
            const normalizedCaptainId = parseInt(captainId);
            
            console.log(`📍 Location update received for captain ${normalizedCaptainId}: ${latitude}, ${longitude}`);
            
            // Store in memory for quick access
            const locationData = {
                captainId: normalizedCaptainId,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                timestamp: timestamp || new Date().toISOString()
            };

            this.activeCaptains.set(normalizedCaptainId, locationData);
            console.log(`💾 Stored location in memory for captain ${normalizedCaptainId}`);

            await redisClient.set(`captain:${normalizedCaptainId}:location`, JSON.stringify(locationData), 300);

            // Get captain's route information and auto-activate captain
            const [captainData] = await pool.query(
                'SELECT route_name, first_name, last_name, is_active FROM captains WHERE id = ?',
                [normalizedCaptainId]
            );

            if (captainData.length > 0) {
                const routeName = captainData[0].route_name;
                
                // Auto-activate captain if not already active
                if (captainData[0].is_active !== 1) {
                    console.log(`🚀 Auto-activating captain ${normalizedCaptainId} for route ${routeName}`);
                    await pool.query('UPDATE captains SET is_active = 1 WHERE id = ?', [normalizedCaptainId]);
                }
                const captainName = `${captainData[0].first_name} ${captainData[0].last_name}`;
                
                // Enhanced location data with captain information
                const enhancedLocationData = {
                    ...locationData,
                    captainName,
                    routeName
                };
                
                // Broadcast to route subscribers using Redis publish
                const publishData = JSON.stringify(enhancedLocationData);
                await redisClient.publish(`route:${routeName}:locations`, publishData);
                console.log(`Published location update for route ${routeName}:`, enhancedLocationData);

                // Check for nearby stops and trigger notifications
                await this.checkNearbyStops(normalizedCaptainId, latitude, longitude, routeName);
                
                // Process enhanced student notifications
                await studentNotificationService.processStudentNotifications(
                    normalizedCaptainId, 
                    parseFloat(latitude), 
                    parseFloat(longitude), 
                    routeName
                );
            }

            return true;
        } catch (error) {
            console.error('Error updating captain location:', error);
            return false;
        }
    }

    // Check if captain is near any stops and trigger notifications
    async checkNearbyStops(captainId, latitude, longitude, routeName) {
        try {
            // Get all stops for the route
            const [routeData] = await pool.query(
                'SELECT id FROM routes WHERE route_name = ?',
                [routeName]
            );

            if (routeData.length === 0) return;

            const routeId = routeData[0].id;
            const [stops] = await pool.query(
                'SELECT id, stop_name, latitude, longitude FROM stops WHERE route_id = ?',
                [routeId]
            );

            const notifyDistance = parseFloat(process.env.NOTIFY_DISTANCE_KM) || 2;
            const cooldownMs = parseInt(process.env.NOTIFICATION_COOLDOWN_MS) || 1800000; // 30 minutes

            for (const stop of stops) {
                // Use actual stop coordinates if available, otherwise use mock coordinates
                let stopLat, stopLon;
                
                if (stop.latitude && stop.longitude) {
                    stopLat = parseFloat(stop.latitude);
                    stopLon = parseFloat(stop.longitude);
                } else {
                    // Mock coordinates around Islamabad/Rawalpindi for demo
                    stopLat = 33.6844 + (Math.random() - 0.5) * 0.1;
                    stopLon = 73.0479 + (Math.random() - 0.5) * 0.1;
                    
                    // Update the stop with mock coordinates for consistency
                    await pool.query(
                        'UPDATE stops SET latitude = ?, longitude = ? WHERE id = ?',
                        [stopLat, stopLon, stop.id]
                    );
                }

                const distance = this.calculateDistance(latitude, longitude, stopLat, stopLon);

                if (distance <= notifyDistance) {
                    // Check cooldown
                    const lastNotification = this.notificationCooldowns.get(`${stop.id}`);
                    const now = Date.now();

                    if (!lastNotification || (now - lastNotification) > cooldownMs) {
                        // Trigger notification
                        await this.triggerStopNotification(captainId, stop, distance, routeName);
                        this.notificationCooldowns.set(`${stop.id}`, now);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking nearby stops:', error);
        }
    }

    // Trigger notification for students at a specific stop
    async triggerStopNotification(captainId, stop, distance, routeName) {
        try {
            // Get captain details
            const [captainData] = await pool.query(
                'SELECT first_name, last_name FROM captains WHERE id = ?',
                [captainId]
            );

            if (captainData.length === 0) return;

            const captainName = `${captainData[0].first_name} ${captainData[0].last_name}`;

            // Get all students assigned to this stop and route
            const [students] = await pool.query(
                'SELECT id, first_name, last_name, registration_number FROM students WHERE route_name = ? AND stop_name = ?',
                [routeName, stop.stop_name]
            );

            // Create notification payload
            const notification = {
                type: 'bus_approaching',
                data: {
                    captainId,
                    captainName,
                    stopId: stop.id,
                    stopName: stop.stop_name,
                    distance: Math.round(distance * 10) / 10, // Round to 1 decimal
                    routeName,
                    timestamp: new Date().toISOString(),
                    message: `🚍 Your bus (${captainName}) is ${Math.round(distance * 10) / 10} km away—be at ${stop.stop_name} soon!`
                }
            };

            // Broadcast notification to route subscribers
            const publishData = JSON.stringify(notification);
            await redisClient.publish(`route:${routeName}:notifications`, publishData);
            console.log(`Published notification for route ${routeName}:`, notification);

            // Store notification in Redis for students who might be offline
            for (const student of students) {
                await redisClient.set(
                    `student:${student.id}:last_notification`,
                    notification.data,
                    3600 // 1 hour TTL
                );
            }

            console.log(`Notification sent for stop ${stop.stop_name}: ${notification.data.message}`);
        } catch (error) {
            console.error('Error triggering stop notification:', error);
        }
    }

    // Get all active captain locations for a route
    async getRouteLocations(routeName) {
        try {
            console.log(`🔍 Looking for active captains on route: "${routeName}"`);
            
            const [captains] = await pool.query(
                'SELECT id, first_name, last_name, is_active FROM captains WHERE route_name = ? AND is_active = 1',
                [routeName]
            );
            
            console.log(`🔍 Database query found ${captains.length} active captains for route "${routeName}"`);
            if (captains.length > 0) {
                console.log('🔍 Active captains:', captains.map(c => `ID: ${c.id}, Name: ${c.first_name} ${c.last_name}`));
            }

            const locations = [];
            for (const captain of captains) {
                // Try memory first, then Redis as fallback
                let location = this.activeCaptains.get(captain.id);
                console.log(`🔍 Memory lookup for captain ${captain.id}:`, location ? 'FOUND' : 'NOT FOUND');
                
                if (!location) {
                    // Fallback to Redis - try both string and number keys
                    const redisData = await redisClient.get(`captain:${captain.id}:location`);
                    if (redisData) {
                        location = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                        console.log(`🔍 Redis lookup for captain ${captain.id}: FOUND`);
                    } else {
                        console.log(`🔍 Redis lookup for captain ${captain.id}: NOT FOUND`);
                    }
                }
                
                if (location) {
                    locations.push({
                        ...location,
                        captainId: captain.id, // Ensure captain ID is always set
                        captainName: `${captain.first_name} ${captain.last_name}`
                    });
                    console.log(`✅ Added captain ${captain.id} to locations list`);
                } else {
                    console.log(`❌ No location data found for captain ${captain.id}`);
                }
            }

            console.log(`📍 Returning ${locations.length} captain locations for route: "${routeName}"`);
            return locations;
        } catch (error) {
            console.error('Error getting route locations:', error);
            return [];
        }
    }

    // Get captain's current location
    async getCaptainLocation(captainId) {
        try {
            // Ensure captainId is always an integer
            const normalizedCaptainId = parseInt(captainId);
            
            let location = this.activeCaptains.get(normalizedCaptainId);
            
            if (!location) {
                const redisData = await redisClient.get(`captain:${normalizedCaptainId}:location`);
                if (redisData) {
                    location = typeof redisData === 'string' ? JSON.parse(redisData) : redisData;
                }
            }

            return location;
        } catch (error) {
            console.error('Error getting captain location:', error);
            return null;
        }
    }

    // Start location tracking for a captain
    startTracking(captainId) {
        console.log(`Started tracking for captain ${captainId}`);
        // In a real implementation, you might start a timer or WebSocket connection
    }

    // Stop location tracking for a captain
    stopTracking(captainId) {
        const normalizedCaptainId = parseInt(captainId);
        this.activeCaptains.delete(normalizedCaptainId);
        redisClient.del(`captain:${normalizedCaptainId}:location`);
        console.log(`Stopped tracking for captain ${normalizedCaptainId}`);
    }

    // Check if captain is currently being tracked
    isTracking(captainId) {
        const normalizedCaptainId = parseInt(captainId);
        return this.activeCaptains.has(normalizedCaptainId);
    }

    // Get all active captains
    getActiveCaptains() {
        return Array.from(this.activeCaptains.entries()).map(([captainId, location]) => ({
            captainId,
            ...location
        }));
    }
}

module.exports = new LocationService(); 