-- Enhanced Feedback System Tables Migration
-- Run this SQL script to create the necessary feedback tables

-- Create feedbacks table for student feedback
CREATE TABLE IF NOT EXISTS feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    reg_no VARCHAR(100) NOT NULL,
    route_name VARCHAR(255) NULL,
    stop_name VARCHAR(255) NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    admin_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    INDEX idx_student_email (student_email),
    INDEX idx_reg_no (reg_no),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create captain_feedbacks table for captain feedback
CREATE TABLE IF NOT EXISTS captain_feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    captain_id INT NOT NULL,
    captain_name VARCHAR(255) NOT NULL,
    route_name VARCHAR(255) NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    admin_response TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    INDEX idx_captain_id (captain_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Add some sample data to test the system (optional)
-- INSERT INTO feedbacks (student_email, name, reg_no, route_name, stop_name, message, status) VALUES
-- ('test@example.com', 'Test Student', 'BCS123456', 'Route A', 'Stop 1', 'This is a test feedback', 'pending');

-- INSERT INTO captain_feedbacks (captain_id, captain_name, route_name, message, status) VALUES
-- (1, 'Test Captain', 'Route A', 'This is a test captain feedback', 'pending');