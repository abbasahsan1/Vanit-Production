const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const http = require('http');
const socketIo = require('socket.io');
const redisClient = require('./config/redis');

// Import routes
const statsRoutes = require('./routes/statsRoutes');
const contactRoutes = require('./routes/contactRoutes'); 
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const routesRouter = require('./routes/routesRouter');
const adminStudentCaptainRoutes = require('./routes/adminStudentCaptainRoutes');
const emergencyRoutes = require("./routes/emergencyRoutes");
const busTrackingRoutes = require("./routes/busTrackingRoutes");
const captainAuthRoutes = require('./routes/captainAuthRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const captainComplaintRoutes = require('./routes/captainComplaintRoutes');
const locationRoutes = require('./routes/locationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const studentNotificationRoutes = require('./routes/studentNotificationRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

// Connect to Redis
redisClient.connect().catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Make io available to routes
app.set('socketio', io);

// Route Handlers
app.use('/api', statsRoutes);
app.use('/api', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', routesRouter);
app.use('/api/admin/student-management', adminStudentCaptainRoutes);
app.use("/api/emergency", emergencyRoutes);  // Updated emergency route path
app.use("/api/bus-tracking", busTrackingRoutes);
app.use('/api/auth/captains', captainAuthRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/captains/complaints', captainComplaintRoutes);
app.use('/api/captains', require('./routes/captainRoutes'));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use('/api/location', locationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', studentNotificationRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Route subscription for location updates
    socket.on('subscribe_route', (routeName) => {
        socket.join(`route:${routeName}`);
        console.log(`✅ Client ${socket.id} subscribed to route: ${routeName}`);
        console.log(`📊 Current route ${routeName} subscribers:`, io.sockets.adapter.rooms.get(`route:${routeName}`)?.size || 0);
    });

    socket.on('unsubscribe_route', (routeName) => {
        socket.leave(`route:${routeName}`);
        console.log(`Client ${socket.id} unsubscribed from route: ${routeName}`);
    });

    // Captain subscription for attendance updates
    socket.on('subscribe_captain', (captainId) => {
        socket.join(`captain:${captainId}`);
        console.log(`✅ Captain ${captainId} subscribed for attendance updates`);
    });

    socket.on('unsubscribe_captain', (captainId) => {
        socket.leave(`captain:${captainId}`);
        console.log(`Captain ${captainId} unsubscribed from attendance updates`);
    });

    // Admin dashboard subscription
    socket.on('subscribe_admin', () => {
        socket.join('admin_dashboard');
        console.log(`✅ Admin dashboard subscribed for real-time updates`);
    });

    socket.on('unsubscribe_admin', () => {
        socket.leave('admin_dashboard');
        console.log(`Admin dashboard unsubscribed from real-time updates`);
    });

    // SOS/Emergency alert subscription
    socket.on('subscribe_emergency', () => {
        socket.join('emergency_alerts');
        console.log(`✅ Client subscribed to emergency alerts`);
    });

    socket.on('unsubscribe_emergency', () => {
        socket.leave('emergency_alerts');
        console.log(`Client unsubscribed from emergency alerts`);
    });

    // User-specific SOS tracking subscription
    socket.on('subscribe_user_sos', (data) => {
        const { userType, userId } = data;
        const roomName = `user_sos:${userType}:${userId}`;
        socket.join(roomName);
        console.log(`✅ ${userType} ${userId} subscribed for SOS updates in room: ${roomName}`);
    });

    socket.on('unsubscribe_user_sos', (data) => {
        const { userType, userId } = data;
        const roomName = `user_sos:${userType}:${userId}`;
        socket.leave(roomName);
        console.log(`${userType} ${userId} unsubscribed from SOS updates`);
    });

    // Student notification subscription
    socket.on('subscribe_student_notifications', (studentId) => {
        const roomName = `student:${studentId}`;
        socket.join(roomName);
        console.log(`✅ Student ${studentId} subscribed for personal notifications in room: ${roomName}`);
    });

    socket.on('unsubscribe_student_notifications', (studentId) => {
        const roomName = `student:${studentId}`;
        socket.leave(roomName);
        console.log(`Student ${studentId} unsubscribed from personal notifications`);
    });

    socket.on('captain_location_update', async (data) => {
        const { captainId, latitude, longitude, timestamp, routeName } = data;
        const normalizedCaptainId = parseInt(captainId);
        console.log(`🚌 Captain ${normalizedCaptainId} location update received:`, { latitude, longitude, routeName });
        
        try {
            // Import location service
            const locationService = require('./services/locationService');
            
            // Update location through service (this handles Redis publishing and notifications)
            await locationService.updateCaptainLocation(normalizedCaptainId, latitude, longitude, timestamp);
            
            // Get captain details for enhanced data
            const pool = require('./config/db');
            const [captainData] = await pool.query(
                'SELECT first_name, last_name, route_name FROM captains WHERE id = ?',
                [normalizedCaptainId]
            );
            
            if (captainData.length > 0) {
                const captain = captainData[0];
                const enhancedData = {
                    ...data,
                    captainId: normalizedCaptainId,
                    captainName: `${captain.first_name} ${captain.last_name}`,
                    routeName: captain.route_name
                };
                
                // Broadcast to route subscribers with enhanced data
                io.to(`route:${captain.route_name}`).emit('location_update', enhancedData);
                console.log(`🚌 Location broadcasted to route: ${captain.route_name} (${io.sockets.adapter.rooms.get(`route:${captain.route_name}`)?.size || 0} subscribers)`);
                console.log(`📍 Enhanced data:`, enhancedData);
            }
        } catch (error) {
            console.error('❌ Error processing captain location update:', error);
        }
    });

    socket.on('captain_ride_ended', async (data) => {
        const { captainId, routeName } = data;
        const normalizedCaptainId = parseInt(captainId);
        console.log(`🛑 Captain ${normalizedCaptainId} ended ride for route: ${routeName}`);
        
        try {
            // Get captain details
            const pool = require('./config/db');
            const [captainData] = await pool.query(
                'SELECT first_name, last_name, route_name FROM captains WHERE id = ?',
                [normalizedCaptainId]
            );
            
            if (captainData.length > 0) {
                const captain = captainData[0];
                const rideEndData = {
                    captainId: normalizedCaptainId,
                    captainName: `${captain.first_name} ${captain.last_name}`,
                    routeName: captain.route_name,
                    timestamp: new Date().toISOString(),
                    message: `🚍 Ride ended! Captain ${captain.first_name} ${captain.last_name} has stopped the bus service.`
                };
                
                // Broadcast ride end notification to all route subscribers
                io.to(`route:${captain.route_name}`).emit('ride_ended', rideEndData);
                console.log(`🛑 Ride end notification broadcasted to route: ${captain.route_name} (${io.sockets.adapter.rooms.get(`route:${captain.route_name}`)?.size || 0} subscribers)`);
                console.log(`📍 Ride end data:`, rideEndData);

                // Also end any active boarding session
                const attendanceService = require('./services/attendanceService');
                await attendanceService.endBoardingSession(normalizedCaptainId, captain.route_name);
            }
        } catch (error) {
            console.error('❌ Error processing captain ride end:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Redis subscription for broadcasting location updates
const setupRedisSubscriptions = async () => {
    try {
        // Create a separate subscriber client for pattern subscriptions
        const { createClient } = require('redis');
        const subscriber = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await subscriber.connect();
        
        // Subscribe to location updates
        await subscriber.pSubscribe('route:*:locations', (message, channel) => {
            try {
                const routeName = channel.split(':')[1];
                const data = typeof message === 'string' ? JSON.parse(message) : message;
                console.log(`📡 Broadcasting location to route ${routeName}:`, data);
                console.log(`📊 Subscribers for route ${routeName}:`, io.sockets.adapter.rooms.get(`route:${routeName}`)?.size || 0);
                io.to(`route:${routeName}`).emit('location_update', data);
            } catch (error) {
                console.error('Error broadcasting location update:', error);
            }
        });

        // Subscribe to notifications
        await subscriber.pSubscribe('route:*:notifications', (message, channel) => {
            try {
                const routeName = channel.split(':')[1];
                const data = typeof message === 'string' ? JSON.parse(message) : message;
                console.log(`🔔 Broadcasting notification to route ${routeName}:`, data);
                console.log(`📊 Subscribers for route ${routeName}:`, io.sockets.adapter.rooms.get(`route:${routeName}`)?.size || 0);
                io.to(`route:${routeName}`).emit('notification', data);
            } catch (error) {
                console.error('Error broadcasting notification:', error);
            }
        });

        // Subscribe to student-specific notifications
        await subscriber.pSubscribe('route:*:student_notifications', (message, channel) => {
            try {
                const routeName = channel.split(':')[1];
                const data = typeof message === 'string' ? JSON.parse(message) : message;
                console.log(`🔔 Broadcasting student notifications to route ${routeName}:`, data);
                
                // Broadcast each notification individually for better handling
                if (data.notifications && Array.isArray(data.notifications)) {
                    data.notifications.forEach(notification => {
                        const studentRoom = `student:${notification.data.studentId}`;
                        io.to(studentRoom).emit('student_notification', notification);
                        console.log(`📱 Sent notification to student ${notification.data.studentId}`);
                    });
                }
                
                // Also broadcast to route for general awareness
                io.to(`route:${routeName}`).emit('student_notifications_batch', data);
            } catch (error) {
                console.error('Error broadcasting student notifications:', error);
            }
        });

        console.log('Redis subscriptions set up successfully');
    } catch (error) {
        console.error('Error setting up Redis subscriptions:', error);
    }
};

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`WebSocket server is running on ws://localhost:${port}`);
    
    await setupRedisSubscriptions();
    
    // Initialize invoice scheduler
    try {
        const invoiceScheduler = require('./services/invoiceScheduler');
        invoiceScheduler.init();
        console.log('Invoice scheduler initialized successfully');
    } catch (error) {
        console.error('Error initializing invoice scheduler:', error);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

