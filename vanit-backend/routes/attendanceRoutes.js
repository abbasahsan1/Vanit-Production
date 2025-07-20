const express = require('express');
const router = express.Router();
const attendanceService = require('../services/attendanceService');
const qrCodeService = require('../services/qrCodeService');
const pool = require('../config/db');

/**
 * ---------------------------
 * ✅ Process QR Code Scan (POST)
 * ---------------------------
 */
router.post('/qr-scan', async (req, res) => {
    const { studentId, qrData, captainId, latitude, longitude } = req.body;

    console.log(`📱 QR scan received from student ${studentId}`);

    if (!studentId || !qrData) {
        return res.status(400).json({
            success: false,
            error: 'Student ID and QR data are required'
        });
    }

    try {
        const result = await attendanceService.processQRScan(
            studentId,
            qrData,
            captainId,
            latitude,
            longitude
        );

        if (result.success) {
            // Broadcast real-time updates via WebSocket
            const io = req.app.get('socketio');
            if (io) {
                // Notify captain panel - using consistent event name
                io.to(`captain:${result.data.captainId}`).emit('attendance_update', {
                    type: 'student_boarding',
                    data: {
                        studentName: result.data.studentName,
                        registrationNumber: result.data.registrationNumber,
                        stopName: result.data.stopName,
                        studentsOnboard: result.data.studentsOnboard,
                        scanTimestamp: result.data.scanTimestamp,
                        routeName: result.data.routeName
                    }
                });

                // Notify admin panel
                io.to('admin_dashboard').emit('boarding_update', {
                    routeName: result.data.routeName,
                    studentsOnboard: result.data.studentsOnboard,
                    studentName: result.data.studentName,
                    captainName: result.data.captainName,
                    timestamp: result.data.scanTimestamp
                });

                // Notify route subscribers for map updates
                io.to(`route:${result.data.routeName}`).emit('attendance_update', {
                    type: 'student_boarding',
                    data: result.data
                });

                console.log(`📡 Broadcasted attendance update for route: ${result.data.routeName}`);
            }
        }

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error processing QR scan:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * ---------------------------
 * ✅ Generate QR Code for Route (POST)
 * ---------------------------
 */
router.post('/generate-qr/:routeName', async (req, res) => {
    const { routeName } = req.params;

    try {
        // Verify route exists
        const [routeData] = await pool.query(
            'SELECT id, route_name FROM routes WHERE route_name = ?',
            [routeName]
        );

        if (routeData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        }

        const qrResult = await qrCodeService.generateRouteQRCode(routeName);

        res.status(200).json({
            success: true,
            message: 'QR code generated successfully',
            data: {
                routeName: routeName,
                qrData: qrResult.qrData,
                qrImage: qrResult.qrImage,
                generatedAt: new Date(qrResult.generatedAt).toISOString(),
                expiresAt: new Date(qrResult.expiresAt).toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code'
        });
    }
});

/**
 * ---------------------------
 * ✅ Download QR Code as PNG (GET)
 * ---------------------------
 */
router.get('/download-qr/:routeName', async (req, res) => {
    const { routeName } = req.params;

    try {
        // Generate fresh QR code for download
        const qrResult = await qrCodeService.generateRouteQRCode(routeName);

        if (!qrResult || !qrResult.qrBuffer) {
            return res.status(404).json({
                success: false,
                error: 'Failed to generate QR code for download'
            });
        }

        // Set proper headers for PNG download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${routeName}-qr-code.png"`);
        res.setHeader('Content-Length', qrResult.qrBuffer.length);
        
        // Send the PNG buffer
        res.send(qrResult.qrBuffer);
        
        console.log(`📥 QR code downloaded for route: ${routeName}`);
    } catch (error) {
        console.error('Error downloading QR code:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download QR code'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get QR Code for Route (GET)
 * ---------------------------
 */
router.get('/qr-code/:routeName', async (req, res) => {
    const { routeName } = req.params;

    try {
        const qrResult = await qrCodeService.getRouteQRCode(routeName);

        if (!qrResult) {
            return res.status(404).json({
                success: false,
                error: 'QR code not found for this route'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                routeName: routeName,
                qrData: qrResult.qrData,
                qrImage: qrResult.qrImage,
                generatedAt: qrResult.generatedAt
            }
        });
    } catch (error) {
        console.error('Error getting QR code:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get QR code'
        });
    }
});

/**
 * ---------------------------
 * ✅ Generate All Route QR Codes (POST)
 * ---------------------------
 */
router.post('/generate-all-qr', async (req, res) => {
    try {
        const qrCodes = await qrCodeService.generateAllRouteQRCodes();

        res.status(200).json({
            success: true,
            message: 'QR codes generated for all routes',
            data: qrCodes
        });
    } catch (error) {
        console.error('Error generating all QR codes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR codes'
        });
    }
});

/**
 * ---------------------------
 * ✅ Start Boarding Session (POST)
 * ---------------------------
 */
router.post('/start-session', async (req, res) => {
    const { captainId, routeName } = req.body;

    if (!captainId || !routeName) {
        return res.status(400).json({
            success: false,
            error: 'Captain ID and route name are required'
        });
    }

    try {
        // Verify captain exists and is assigned to route
        const [captainData] = await pool.query(
            'SELECT id, first_name, last_name, route_name FROM captains WHERE id = ?',
            [captainId]
        );

        if (captainData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Captain not found'
            });
        }

        const captain = captainData[0];

        if (captain.route_name !== routeName) {
            return res.status(400).json({
                success: false,
                error: 'Captain is not assigned to this route'
            });
        }

        // Create session (this will be handled by the first QR scan)
        res.status(200).json({
            success: true,
            message: 'Captain is ready to start boarding session',
            data: {
                captainId: captainId,
                captainName: `${captain.first_name} ${captain.last_name}`,
                routeName: routeName
            }
        });
    } catch (error) {
        console.error('Error starting boarding session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start boarding session'
        });
    }
});

/**
 * ---------------------------
 * ✅ End Boarding Session (POST)
 * ---------------------------
 */
router.post('/end-session', async (req, res) => {
    const { captainId, routeName } = req.body;

    if (!captainId) {
        return res.status(400).json({
            success: false,
            error: 'Captain ID is required'
        });
    }

    try {
        const result = await attendanceService.endBoardingSession(captainId, routeName);

        if (result.success) {
            // Broadcast session end via WebSocket
            const io = req.app.get('socketio');
            if (io) {
                io.to(`captain:${captainId}`).emit('session_ended', {
                    sessionId: result.data.session_id,
                    finalCount: result.data.students_onboard,
                    routeName: result.data.route_name,
                    timestamp: new Date().toISOString()
                });

                io.to('admin_dashboard').emit('session_ended', {
                    captainId: captainId,
                    routeName: result.data.route_name,
                    studentsOnboard: result.data.students_onboard,
                    timestamp: new Date().toISOString()
                });

                console.log(`📡 Broadcasted session end for captain: ${captainId}`);
            }
        }

        res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
        console.error('Error ending boarding session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end boarding session'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Active Boarding Sessions (GET)
 * ---------------------------
 */
router.get('/active-sessions', async (req, res) => {
    const { captainId, routeName } = req.query;

    try {
        const sessions = await attendanceService.getActiveBoardingSessions(
            captainId ? parseInt(captainId) : null,
            routeName
        );

        res.status(200).json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get active sessions'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Attendance Logs (GET)
 * ---------------------------
 */
router.get('/logs', async (req, res) => {
    const filters = {
        studentId: req.query.studentId ? parseInt(req.query.studentId) : null,
        captainId: req.query.captainId ? parseInt(req.query.captainId) : null,
        routeName: req.query.routeName,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        sessionId: req.query.sessionId,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
    };

    try {
        const logs = await attendanceService.getAttendanceLogs(filters);

        res.status(200).json({
            success: true,
            data: logs,
            filters: filters
        });
    } catch (error) {
        console.error('Error getting attendance logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance logs'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Attendance Statistics (GET)
 * ---------------------------
 */
router.get('/statistics', async (req, res) => {
    const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        routeName: req.query.routeName
    };

    try {
        const stats = await attendanceService.getAttendanceStatistics(filters);

        res.status(200).json({
            success: true,
            data: stats,
            filters: filters
        });
    } catch (error) {
        console.error('Error getting attendance statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get attendance statistics'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Student Attendance History (GET)
 * ---------------------------
 */
router.get('/student/:studentId/history', async (req, res) => {
    const { studentId } = req.params;
    const { limit, dateFrom, dateTo } = req.query;

    try {
        const filters = {
            studentId: parseInt(studentId),
            dateFrom: dateFrom,
            dateTo: dateTo,
            limit: limit ? parseInt(limit) : 20
        };

        const logs = await attendanceService.getAttendanceLogs(filters);

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error getting student attendance history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get student attendance history'
        });
    }
});

/**
 * ---------------------------
 * ✅ Validate QR Code (POST)
 * ---------------------------
 */
router.post('/validate-qr', async (req, res) => {
    const { qrData } = req.body;

    if (!qrData) {
        return res.status(400).json({
            success: false,
            error: 'QR data is required'
        });
    }

    try {
        const validation = await qrCodeService.validateQRCode(qrData);

        res.status(200).json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error('Error validating QR code:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate QR code'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Current Session Status for Captain (GET)
 * ---------------------------
 */
router.get('/captain/:captainId/session-status', async (req, res) => {
    const { captainId } = req.params;

    try {
        const sessions = await attendanceService.getActiveBoardingSessions(parseInt(captainId));

        if (sessions.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    hasActiveSession: false,
                    sessionData: null
                }
            });
        }

        const activeSession = sessions[0];
        
        res.status(200).json({
            success: true,
            data: {
                hasActiveSession: true,
                sessionData: {
                    sessionId: activeSession.session_id,
                    routeName: activeSession.route_name,
                    studentsOnboard: activeSession.students_onboard,
                    sessionStart: activeSession.session_start,
                    captainName: `${activeSession.captain_first_name} ${activeSession.captain_last_name}`
                }
            }
        });
    } catch (error) {
        console.error('Error getting captain session status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session status'
        });
    }
});

/**
 * ---------------------------
 * ✅ Get Current Attendance for Captain (GET)
 * ---------------------------
 */
router.get('/captain/:captainId/current-attendance', async (req, res) => {
    const { captainId } = req.params;

    try {
        // Get active session for this captain
        const activeSessions = await attendanceService.getActiveBoardingSessions(parseInt(captainId));

        if (activeSessions.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                recentScans: [],
                message: 'No active ride session'
            });
        }

        const activeSession = activeSessions[0];
        
        // Get recent scans for this session
        const recentScans = await attendanceService.getAttendanceLogs({
            captainId: parseInt(captainId),
            sessionId: activeSession.session_id,
            limit: 5
        });

        // Format recent scans
        const formattedScans = recentScans.map(scan => ({
            student_name: `${scan.student_first_name} ${scan.student_last_name}`,
            registration_number: scan.registration_number,
            stop_name: scan.stop_name,
            scan_time: scan.scan_timestamp
        }));

        res.status(200).json({
            success: true,
            count: activeSession.students_onboard,
            recentScans: formattedScans,
            sessionId: activeSession.session_id,
            routeName: activeSession.route_name
        });
    } catch (error) {
        console.error('Error getting current attendance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get current attendance'
        });
    }
});

// CSV Export endpoint for attendance data
router.get('/export', async (req, res) => {
    try {
        const { startDate, endDate, routeName } = req.query;
        
        let query = `
            SELECT 
                al.id,
                al.scan_timestamp,
                s.registration_number,
                s.first_name,
                s.last_name,
                al.route_name,
                CONCAT(c.first_name, ' ', c.last_name) as captain_name,
                al.scan_success
            FROM attendance_logs al
            JOIN students s ON al.student_id = s.id
            JOIN captains c ON al.captain_id = c.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate) {
            query += ' AND DATE(al.scan_timestamp) >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND DATE(al.scan_timestamp) <= ?';
            params.push(endDate);
        }
        
        if (routeName) {
            query += ' AND al.route_name = ?';
            params.push(routeName);
        }
        
        query += ' ORDER BY al.scan_timestamp DESC';
        
        const [logs] = await db.execute(query, params);
        
        // Generate CSV
        const csvHeader = 'ID,Timestamp,Student ID,Student Name,Route,Captain,Status\n';
        const csvRows = logs.map(log => {
            return [
                log.id,
                new Date(log.scan_timestamp).toISOString(),
                log.registration_number,
                `"${log.first_name} ${log.last_name}"`,
                log.route_name,
                `"${log.captain_name}"`,
                log.scan_success ? 'Success' : 'Failed'
            ].join(',');
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error exporting attendance data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export attendance data'
        });
    }
});

module.exports = router;
