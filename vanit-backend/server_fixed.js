const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const http = require('http');
const socketIo = require('socket.io');
const redisClient = require('./config/redis');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const routesRouter = require('./routes/routesRouter');
const locationRoutes = require('./routes/locationRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const captainAuthRoutes = require('./routes/captainAuthRoutes');
const captainRoutes = require('./routes/captainRoutes');
const studentRoutes = require('./routes/studentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const busTrackingRoutes = require('./routes/busTrackingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const captainComplaintRoutes = require('./routes/captainComplaintRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminStudentCaptainRoutes = require('./routes/adminStudentCaptainRoutes');
const statsRoutes = require('./routes/statsRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const studentNotificationRoutes = require('./routes/studentNotificationRoutes');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:3000", 
            "http://localhost:5173", 
            "http://localhost:4173", 
            "http://localhost:5174",
            "https://ec2-54-91-218-214.compute-1.amazonaws.com",
            "http://ec2-54-91-218-214.compute-1.amazonaws.com"
        ],
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

// Connect to Redis
redisClient.connect().catch(console.error);

// Middleware
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:4173", 
        "http://localhost:5174",
        "https://ec2-54-91-218-214.compute-1.amazonaws.com",
        "http://ec2-54-91-218-214.compute-1.amazonaws.com"
    ],
    credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Make io available to routes
app.set('socketio', io);

// Route Handlers
app.use('/api', statsRoutes);
app.use('/api', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminStudentCaptainRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', routesRouter);
app.use('/api', locationRoutes);
app.use('/api', emergencyRoutes);
app.use('/api/captain-auth', captainAuthRoutes);
app.use('/api/captain', captainRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', busTrackingRoutes);
app.use('/api/captain', captainComplaintRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', studentNotificationRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('📱 New client connected:', socket.id);

    // Join route-specific room
    socket.on('join-route', (routeName) => {
        socket.join(routeName);
        console.log(`📍 Socket ${socket.id} joined route: ${routeName}`);
    });

    // Leave route room
    socket.on('leave-route', (routeName) => {
        socket.leave(routeName);
        console.log(`🚪 Socket ${socket.id} left route: ${routeName}`);
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (alertData) => {
        console.log('🚨 Emergency alert received:', alertData);
        io.emit('emergency-alert', alertData);
    });

    // Handle location updates
    socket.on('location-update', (locationData) => {
        console.log('📍 Location update:', locationData);
        socket.to(locationData.routeName).emit('location-update', locationData);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
    });
});

// Redis pub/sub for notifications
redisClient.subscribe('emergency_alerts', 'location_updates', (err, count) => {
    if (err) {
        console.error('❌ Failed to subscribe to Redis channels:', err);
    } else {
        console.log('✅ Redis subscriptions set up successfully');
    }
});

redisClient.on('message', (channel, message) => {
    try {
        const data = JSON.parse(message);
        io.emit(channel, data);
    } catch (error) {
        console.error('❌ Error parsing Redis message:', error);
    }
});

// Invoice Scheduler
const cron = require('node-cron');

console.log('⏰ Invoice scheduler started successfully');

// Schedule overdue invoice checking (runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running scheduled invoice overdue check...');
    try {
        const db = require('./config/db');
        const result = await db.query(`
            UPDATE invoices 
            SET status = 'overdue' 
            WHERE status = 'unpaid' 
            AND due_date < CURDATE()
        `);
        
        console.log(`✅ Marked ${result.affectedRows} invoices as overdue`);
        console.log('✅ Overdue check completed:', { 
            success: true, 
            message: `Marked ${result.affectedRows} invoices as overdue` 
        });
    } catch (error) {
        console.error('❌ Error in overdue check:', error);
    }
});

console.log('Invoice scheduler initialized successfully');

// Start server
server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

module.exports = { app, server, io };
