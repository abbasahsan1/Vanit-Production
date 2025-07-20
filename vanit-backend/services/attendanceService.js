const pool = require('../config/db');
const qrCodeService = require('./qrCodeService');
const { v4: uuidv4 } = require('uuid');

class AttendanceService {
    constructor() {
        this.activeSessions = new Map(); // captainId -> session data
        this.recentScans = new Map(); // studentId -> timestamp (to prevent duplicate scans)
        this.duplicateScanThresholdMs = 60000; // 1 minute threshold for duplicate scans
    }

    /**
     * Process QR code scan by student
     * @param {number} studentId - Student ID
     * @param {string} qrData - QR code data
     * @param {number} captainId - Captain ID (optional, auto-detected if not provided)
     * @param {number} latitude - Scan location latitude (optional)
     * @param {number} longitude - Scan location longitude (optional)
     * @returns {object} - Scan result
     */
    async processQRScan(studentId, qrData, captainId = null, latitude = null, longitude = null) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Validate QR code
            const qrValidation = await qrCodeService.validateQRCode(qrData);
            if (!qrValidation.isValid) {
                await connection.rollback();
                return {
                    success: false,
                    error: qrValidation.error
                };
            }

            const routeName = qrValidation.routeName;

            // Get student details and verify route assignment
            const [studentData] = await connection.query(
                'SELECT id, first_name, last_name, registration_number, route_name, stop_name FROM students WHERE id = ?',
                [studentId]
            );

            if (studentData.length === 0) {
                await connection.rollback();
                return {
                    success: false,
                    error: 'Student not found'
                };
            }

            const student = studentData[0];

            // Verify student is assigned to this route
            if (student.route_name !== routeName) {
                await connection.rollback();
                return {
                    success: false,
                    error: `You are not assigned to route "${routeName}". Your assigned route is "${student.route_name}"`
                };
            }

            // Find active captain for this route and verify ride is active
            if (!captainId) {
                const [activeCaptains] = await connection.query(
                    'SELECT id FROM captains WHERE route_name = ? AND is_active = 1 LIMIT 1',
                    [routeName]
                );

                if (activeCaptains.length === 0) {
                    await connection.rollback();
                    return {
                        success: false,
                        error: 'No active ride found for this route. The captain must start the ride first.'
                    };
                }

                captainId = activeCaptains[0].id;
            } else {
                // Verify provided captain has an active ride
                const [captainCheck] = await connection.query(
                    'SELECT is_active FROM captains WHERE id = ? AND route_name = ?',
                    [captainId, routeName]
                );

                if (captainCheck.length === 0 || !captainCheck[0].is_active) {
                    await connection.rollback();
                    return {
                        success: false,
                        error: 'Captain ride is not active. Please wait for the captain to start the ride.'
                    };
                }
            }

            // Get or create active boarding session
            let sessionId = await this.getOrCreateBoardingSession(connection, captainId, routeName);

            // Check if student has already boarded this session
            const [existingLogs] = await connection.query(
                'SELECT COUNT(*) as scan_count FROM attendance_logs WHERE student_id = ? AND session_id = ?',
                [studentId, sessionId]
            );

            if (existingLogs[0].scan_count > 0) {
                await connection.rollback();
                return {
                    success: false,
                    error: "You've already boarded this bus. Multiple check-ins are not allowed per session."
                };
            }

            // Create attendance log
            const scanTimestamp = new Date();
            await connection.query(
                `INSERT INTO attendance_logs 
                (student_id, route_name, captain_id, scan_timestamp, qr_code_data, location_lat, location_lng, session_id, scan_type) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'boarding')`,
                [
                    studentId,
                    routeName,
                    captainId,
                    scanTimestamp,
                    JSON.stringify(qrValidation.qrPayload),
                    latitude,
                    longitude,
                    sessionId
                ]
            );

            // Update boarding session count
            await connection.query(
                'UPDATE boarding_sessions SET students_onboard = students_onboard + 1 WHERE session_id = ?',
                [sessionId]
            );

            // Get updated session data
            const [sessionData] = await connection.query(
                'SELECT students_onboard FROM boarding_sessions WHERE session_id = ?',
                [sessionId]
            );

            const studentsOnboard = sessionData[0].students_onboard;

            // Get captain details for broadcasting
            const [captainData] = await connection.query(
                'SELECT first_name, last_name FROM captains WHERE id = ?',
                [captainId]
            );

            const captainName = captainData.length > 0 ? 
                `${captainData[0].first_name} ${captainData[0].last_name}` : 'Unknown Captain';

            await connection.commit();

            // Prepare broadcast data
            const broadcastData = {
                studentId: student.id,
                studentName: `${student.first_name} ${student.last_name}`,
                registrationNumber: student.registration_number,
                routeName: routeName,
                captainId: captainId,
                captainName: captainName,
                sessionId: sessionId,
                studentsOnboard: studentsOnboard,
                scanTimestamp: scanTimestamp.toISOString(),
                stopName: student.stop_name
            };

            console.log(`✅ Student ${student.first_name} ${student.last_name} boarded bus for route ${routeName}`);

            return {
                success: true,
                message: `Welcome aboard! You have successfully boarded the bus for route "${routeName}"`,
                data: broadcastData
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error processing QR scan:', error);
            return {
                success: false,
                error: 'Failed to process QR scan. Please try again.'
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Get or create active boarding session for captain
     * @param {object} connection - Database connection
     * @param {number} captainId - Captain ID
     * @param {string} routeName - Route name
     * @returns {string} - Session ID
     */
    async getOrCreateBoardingSession(connection, captainId, routeName) {
        // Check for active session
        const [activeSessions] = await connection.query(
            'SELECT session_id FROM boarding_sessions WHERE captain_id = ? AND route_name = ? AND is_active = 1',
            [captainId, routeName]
        );

        if (activeSessions.length > 0) {
            return activeSessions[0].session_id;
        }

        // Create new session
        const sessionId = uuidv4();
        await connection.query(
            `INSERT INTO boarding_sessions 
            (session_id, captain_id, route_name, session_start, students_onboard, is_active) 
            VALUES (?, ?, ?, NOW(), 0, 1)`,
            [sessionId, captainId, routeName]
        );

        console.log(`🚌 Created new boarding session ${sessionId} for captain ${captainId} on route ${routeName}`);
        return sessionId;
    }

    /**
     * End boarding session for captain
     * @param {number} captainId - Captain ID
     * @param {string} routeName - Route name (optional)
     * @returns {object} - Result of session end
     */
    async endBoardingSession(captainId, routeName = null) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            let query = 'UPDATE boarding_sessions SET session_end = NOW(), is_active = 0 WHERE captain_id = ? AND is_active = 1';
            let params = [captainId];

            if (routeName) {
                query += ' AND route_name = ?';
                params.push(routeName);
            }

            const [result] = await connection.query(query, params);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return {
                    success: false,
                    error: 'No active boarding session found'
                };
            }

            // Get session details for response
            const [sessionData] = await connection.query(
                'SELECT session_id, students_onboard, route_name FROM boarding_sessions WHERE captain_id = ? AND session_end IS NOT NULL ORDER BY session_end DESC LIMIT 1',
                [captainId]
            );

            await connection.commit();

            console.log(`🛑 Ended boarding session for captain ${captainId}`);

            return {
                success: true,
                message: 'Boarding session ended successfully',
                data: sessionData[0]
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error ending boarding session:', error);
            return {
                success: false,
                error: 'Failed to end boarding session'
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Get active boarding sessions
     * @param {number} captainId - Captain ID (optional)
     * @param {string} routeName - Route name (optional)
     * @returns {array} - List of active sessions
     */
    async getActiveBoardingSessions(captainId = null, routeName = null) {
        try {
            let query = `
                SELECT bs.*, c.first_name as captain_first_name, c.last_name as captain_last_name
                FROM boarding_sessions bs
                JOIN captains c ON bs.captain_id = c.id
                WHERE bs.is_active = 1
            `;
            let params = [];

            if (captainId) {
                query += ' AND bs.captain_id = ?';
                params.push(captainId);
            }

            if (routeName) {
                query += ' AND bs.route_name = ?';
                params.push(routeName);
            }

            query += ' ORDER BY bs.session_start DESC';

            const [sessions] = await pool.query(query, params);
            return sessions;
        } catch (error) {
            console.error('Error getting active boarding sessions:', error);
            return [];
        }
    }

    /**
     * Get attendance logs with filters
     * @param {object} filters - Filter options
     * @returns {array} - Attendance logs
     */
    async getAttendanceLogs(filters = {}) {
        try {
            let query = `
                SELECT al.*, 
                       s.first_name as student_first_name, s.last_name as student_last_name, 
                       s.registration_number, s.stop_name,
                       c.first_name as captain_first_name, c.last_name as captain_last_name
                FROM attendance_logs al
                JOIN students s ON al.student_id = s.id
                JOIN captains c ON al.captain_id = c.id
                WHERE 1=1
            `;
            let params = [];

            if (filters.studentId) {
                query += ' AND al.student_id = ?';
                params.push(filters.studentId);
            }

            if (filters.captainId) {
                query += ' AND al.captain_id = ?';
                params.push(filters.captainId);
            }

            if (filters.routeName) {
                query += ' AND al.route_name = ?';
                params.push(filters.routeName);
            }

            if (filters.dateFrom) {
                query += ' AND DATE(al.scan_timestamp) >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                query += ' AND DATE(al.scan_timestamp) <= ?';
                params.push(filters.dateTo);
            }

            if (filters.sessionId) {
                query += ' AND al.session_id = ?';
                params.push(filters.sessionId);
            }

            query += ' ORDER BY al.scan_timestamp DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }

            const [logs] = await pool.query(query, params);
            return logs;
        } catch (error) {
            console.error('Error getting attendance logs:', error);
            return [];
        }
    }

    /**
     * Get attendance statistics
     * @param {object} filters - Filter options
     * @returns {object} - Statistics
     */
    async getAttendanceStatistics(filters = {}) {
        try {
            const stats = {};

            // Total scans
            let query = 'SELECT COUNT(*) as total_scans FROM attendance_logs WHERE 1=1';
            let params = [];

            if (filters.dateFrom) {
                query += ' AND DATE(scan_timestamp) >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                query += ' AND DATE(scan_timestamp) <= ?';
                params.push(filters.dateTo);
            }

            if (filters.routeName) {
                query += ' AND route_name = ?';
                params.push(filters.routeName);
            }

            const [totalResult] = await pool.query(query, params);
            stats.totalScans = totalResult[0].total_scans;

            // Total registered students (from students table, not just those who attended)
            let totalStudentsQuery = 'SELECT COUNT(*) as total_registered FROM students WHERE 1=1';
            let totalStudentsParams = [];

            if (filters.routeName) {
                totalStudentsQuery += ' AND route_name = ?';
                totalStudentsParams.push(filters.routeName);
            }

            const [totalStudentsResult] = await pool.query(totalStudentsQuery, totalStudentsParams);
            stats.uniqueStudents = totalStudentsResult[0].total_registered;

            console.log(`📊 Total registered students: ${stats.uniqueStudents} (route filter: ${filters.routeName || 'none'})`);

            // Scans by route
            query = `
                SELECT route_name, COUNT(*) as scan_count 
                FROM attendance_logs 
                WHERE 1=1
            `;
            params = [];

            if (filters.dateFrom) {
                query += ' AND DATE(scan_timestamp) >= ?';
                params.push(filters.dateFrom);
            }

            if (filters.dateTo) {
                query += ' AND DATE(scan_timestamp) <= ?';
                params.push(filters.dateTo);
            }

            query += ' GROUP BY route_name ORDER BY scan_count DESC';

            const [routeStats] = await pool.query(query, params);
            stats.scansByRoute = routeStats;

            // Currently active sessions
            const activeSessions = await this.getActiveBoardingSessions();
            stats.activeSessions = activeSessions.length;
            stats.totalStudentsOnboard = activeSessions.reduce((sum, session) => sum + session.students_onboard, 0);

            return stats;
        } catch (error) {
            console.error('Error getting attendance statistics:', error);
            return {
                totalScans: 0,
                uniqueStudents: 0,
                scansByRoute: [],
                activeSessions: 0,
                totalStudentsOnboard: 0
            };
        }
    }

    /**
     * Check if student has already scanned for current session
     * @param {number} studentId - Student ID
     * @param {string} sessionId - Session ID
     * @returns {boolean} - True if already scanned
     */
    async hasStudentScannedInSession(studentId, sessionId) {
        try {
            const [result] = await pool.query(
                'SELECT COUNT(*) as scan_count FROM attendance_logs WHERE student_id = ? AND session_id = ?',
                [studentId, sessionId]
            );

            return result[0].scan_count > 0;
        } catch (error) {
            console.error('Error checking student scan status:', error);
            return false;
        }
    }
}

module.exports = new AttendanceService();
