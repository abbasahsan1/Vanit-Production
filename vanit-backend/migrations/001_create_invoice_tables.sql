-- Invoice System Tables Migration
-- Run this SQL script to create the necessary tables for the invoice system

-- Create route_fees table
CREATE TABLE IF NOT EXISTS route_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL UNIQUE,
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create student_invoices table
CREATE TABLE IF NOT EXISTS student_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending', 'paid', 'overdue', 'rejected') DEFAULT 'pending',
    payment_method VARCHAR(100) NULL,
    transaction_id VARCHAR(255) NULL,
    date_paid DATE NULL,
    admin_approved_at TIMESTAMP NULL,
    admin_approved_by INT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_month_year (student_id, month, year),
    INDEX idx_route_name (route_name),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Create invoice_notifications table
CREATE TABLE IF NOT EXISTS invoice_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    invoice_id INT NOT NULL,
    type ENUM('payment_due', 'overdue_warning', 'payment_approved', 'payment_rejected', 'reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES student_invoices(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_read_status (read_status),
    INDEX idx_created_at (created_at)
);

-- Create invoice_payment_submissions table (for tracking payment form submissions)
CREATE TABLE IF NOT EXISTS invoice_payment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    student_id INT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    date_paid DATE NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES student_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_student_id (student_id)
);

-- Insert default route fees for existing routes (if any)
-- This will need to be updated based on your actual routes
INSERT IGNORE INTO route_fees (route_name, monthly_fee) 
SELECT DISTINCT route_name, 1500.00 
FROM students 
WHERE route_name IS NOT NULL AND route_name != '';

-- Add indexes for better performance
ALTER TABLE students ADD INDEX IF NOT EXISTS idx_route_name (route_name);
ALTER TABLE student_invoices ADD INDEX IF NOT EXISTS idx_student_route (student_id, route_name);
