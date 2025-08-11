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
const contactRoutes = require('./routes/contactRoutes');
const busTrackingRoutes = require('./routes/busTrackingRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statsRoutes = require('./routes/statsRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const captainComplaintRoutes = require('./routes/captainComplaintRoutes');
const adminStudentCaptainRoutes = require('./routes/adminStudentCaptainRoutes');
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/routes', routesRouter);
app.use('/api/location', locationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/captain-auth', captainAuthRoutes);
app.use('/api/captain', captainRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/bus-tracking', busTrackingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/captain/complaints', captainComplaintRoutes);
app.use('/api/admin-student-captain', adminStudentCaptainRoutes);
app.use('/api/student-notifications', studentNotificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        redis: redisClient.isConnected ? 'Connected' : 'Disconnected'
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);
    
    socket.on('join_bus', (busId) => {
        socket.join(`bus_${busId}`);
        console.log(`🚌 Client ${socket.id} joined bus room: bus_${busId}`);
    });
    
    socket.on('leave_bus', (busId) => {
        socket.leave(`bus_${busId}`);
        console.log(`🚌 Client ${socket.id} left bus room: bus_${busId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
    });
});

// Initialize Student Notification Service (it's already an instance)
const notificationService = require('./services/studentNotificationService');

// Invoice Scheduler
const cron = require('node-cron');

console.log('⏰ Invoice scheduler started successfully');

// Schedule overdue invoice checking (runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('🕐 Running scheduled invoice overdue check...');
    try {
        const db = require('./config/db');
        
        // Update overdue invoices (invoices that are past due date and unpaid)
        const updateQuery = `
            UPDATE invoices 
            SET status = 'overdue' 
            WHERE due_date < CURDATE() 
            AND status = 'pending'
        `;
        
        const [result] = await db.execute(updateQuery);
        console.log(`✅ Updated ${result.affectedRows} invoices to overdue status`);
        
    } catch (error) {
        console.error('❌ Error in invoice overdue check:', error);
    }
});

// Start server
server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.DB_HOST ? 'RDS' : 'Local'}`);
    console.log(`🔑 Redis: ${process.env.REDIS_URL ? 'Remote' : 'Local'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    await redisClient.disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
