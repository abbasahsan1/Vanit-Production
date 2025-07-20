const pool = require('../config/db');

async function createStudentNotificationsTable() {
    try {
        console.log('🗄️ Creating student_notifications table...');
        
        // Create the student_notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                distance DECIMAL(5,2) NULL COMMENT 'Distance in kilometers',
                estimated_time INT NULL COMMENT 'Estimated time in minutes',
                captain_id INT NULL,
                route_name VARCHAR(255) NULL,
                stop_name VARCHAR(100) NULL,
                location_lat DECIMAL(10,7) NULL COMMENT 'Captain location when notification sent',
                location_lng DECIMAL(10,7) NULL COMMENT 'Captain location when notification sent',
                read_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_student_created (student_id, created_at),
                INDEX idx_type_priority (type, priority),
                INDEX idx_route_created (route_name, created_at),
                INDEX idx_unread (student_id, read_at),
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE SET NULL
            ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ student_notifications table created successfully');
        
        // Create notification preferences table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_notification_preferences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL UNIQUE,
                enable_location_notifications BOOLEAN DEFAULT TRUE,
                notification_radius_km DECIMAL(3,1) DEFAULT 2.0 COMMENT 'Notification radius in kilometers',
                notification_time_threshold_minutes INT DEFAULT 5 COMMENT 'Time threshold in minutes',
                enable_sound BOOLEAN DEFAULT TRUE,
                enable_vibration BOOLEAN DEFAULT TRUE,
                notification_frequency ENUM('immediate', 'consolidated') DEFAULT 'immediate',
                quiet_hours_start TIME NULL COMMENT 'Start of quiet hours (no notifications)',
                quiet_hours_end TIME NULL COMMENT 'End of quiet hours',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ student_notification_preferences table created successfully');
        
        // Create student location tracking table for better distance calculations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                latitude DECIMAL(10,7) NOT NULL,
                longitude DECIMAL(10,7) NOT NULL,
                accuracy DECIMAL(8,2) NULL COMMENT 'GPS accuracy in meters',
                address TEXT NULL COMMENT 'Reverse geocoded address',
                location_type ENUM('home', 'current', 'stop', 'other') DEFAULT 'current',
                is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this is the current active location',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_student_active (student_id, is_active),
                INDEX idx_student_created (student_id, created_at),
                INDEX idx_location_type (student_id, location_type),
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ student_locations table created successfully');
        
        // Create notification analytics table for tracking effectiveness
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notification_analytics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                notification_id INT NULL,
                route_name VARCHAR(255) NOT NULL,
                captain_id INT NULL,
                event_type ENUM('sent', 'delivered', 'read', 'clicked', 'dismissed') NOT NULL,
                distance_at_event DECIMAL(5,2) NULL,
                time_to_stop_minutes INT NULL,
                response_time_seconds INT NULL COMMENT 'Time taken for student to respond',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_student_event (student_id, event_type),
                INDEX idx_route_event (route_name, event_type),
                INDEX idx_notification_tracking (notification_id, event_type),
                INDEX idx_analytics_date (created_at),
                
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (notification_id) REFERENCES student_notifications(id) ON DELETE SET NULL,
                FOREIGN KEY (captain_id) REFERENCES captains(id) ON DELETE SET NULL
            ) ENGINE=InnoDB CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ notification_analytics table created successfully');
        
        // Insert default preferences for existing students
        await pool.query(`
            INSERT IGNORE INTO student_notification_preferences (student_id)
            SELECT id FROM students
        `);
        
        console.log('✅ Default notification preferences created for existing students');
        
        // Create some sample data for testing
        await createSampleNotificationData();
        
        console.log('🎉 All notification tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating notification tables:', error);
        throw error;
    }
}

async function createSampleNotificationData() {
    try {
        console.log('📝 Creating sample notification data...');
        
        // Get a sample student
        const [students] = await pool.query('SELECT id FROM students LIMIT 1');
        
        if (students.length > 0) {
            const studentId = students[0].id;
            
            // Create sample notifications for testing
            await pool.query(`
                INSERT IGNORE INTO student_notifications 
                (student_id, type, message, priority, distance, estimated_time, route_name, stop_name)
                VALUES 
                (?, 'bus_approaching', '🚍 Your bus is 1.8 km away from your stop. Get ready!', 'high', 1.8, 4, 'Sample Route', 'Sample Stop'),
                (?, 'bus_nearby', '🚍 Your bus is 2.5 km away. Start heading to your stop!', 'medium', 2.5, 7, 'Sample Route', 'Sample Stop'),
                (?, 'route_started', '🚌 Your bus captain has started the route. Track your bus live!', 'medium', NULL, NULL, 'Sample Route', NULL)
            `, [studentId, studentId, studentId]);
            
            console.log(`✅ Sample notifications created for student ${studentId}`);
        }
        
    } catch (error) {
        console.log('⚠️ Note: Could not create sample data, but tables are ready');
    }
}

// Run the migration
if (require.main === module) {
    createStudentNotificationsTable()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createStudentNotificationsTable };
