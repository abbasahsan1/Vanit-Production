-- =====================================================
-- Vanit Database Cleanup Script (SQL Version)
-- =====================================================
-- This script clears emergency alerts and invoice logs
-- WARNING: This will permanently delete data!
-- =====================================================

-- Set the number of days to keep (records older than this will be deleted)
SET @days_to_keep = 30;
SET @cutoff_date = DATE_SUB(NOW(), INTERVAL @days_to_keep DAY);

-- Display what will be deleted (optional - comment out if not needed)
SELECT 'RECORDS TO BE DELETED:' as info;

SELECT 
    'Emergency Alerts' as table_name,
    COUNT(*) as records_to_delete
FROM emergency_alerts 
WHERE timestamp < @cutoff_date

UNION ALL

SELECT 
    'Invoices' as table_name,
    COUNT(*) as records_to_delete
FROM invoices 
WHERE timestamp < @cutoff_date

UNION ALL

SELECT 
    'Student Invoices' as table_name,
    COUNT(*) as records_to_delete
FROM student_invoices 
WHERE created_at < @cutoff_date

UNION ALL

SELECT 
    'Invoice Notifications' as table_name,
    COUNT(*) as records_to_delete
FROM invoice_notifications 
WHERE created_at < @cutoff_date

UNION ALL

SELECT 
    'Payment Submissions' as table_name,
    COUNT(*) as records_to_delete
FROM invoice_payment_submissions 
WHERE submitted_at < @cutoff_date;

-- =====================================================
-- EMERGENCY LOGS CLEANUP
-- =====================================================

-- Clear emergency alerts older than cutoff date
DELETE FROM emergency_alerts 
WHERE timestamp < @cutoff_date;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' emergency alert records') as result;

-- =====================================================
-- INVOICE LOGS CLEANUP
-- =====================================================

-- Clear invoice notifications (must be first due to foreign keys)
DELETE FROM invoice_notifications 
WHERE created_at < @cutoff_date;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' invoice notification records') as result;

-- Clear payment submissions
DELETE FROM invoice_payment_submissions 
WHERE submitted_at < @cutoff_date;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' payment submission records') as result;

-- Clear student invoices
DELETE FROM student_invoices 
WHERE created_at < @cutoff_date;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' student invoice records') as result;

-- Clear old invoices (legacy table)
DELETE FROM invoices 
WHERE timestamp < @cutoff_date;

SELECT CONCAT('Deleted ', ROW_COUNT(), ' legacy invoice records') as result;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show remaining record counts
SELECT 'REMAINING RECORDS AFTER CLEANUP:' as info;

SELECT 
    'Emergency Alerts' as table_name,
    COUNT(*) as remaining_records
FROM emergency_alerts

UNION ALL

SELECT 
    'Invoices' as table_name,
    COUNT(*) as remaining_records
FROM invoices

UNION ALL

SELECT 
    'Student Invoices' as table_name,
    COUNT(*) as remaining_records
FROM student_invoices

UNION ALL

SELECT 
    'Invoice Notifications' as table_name,
    COUNT(*) as remaining_records
FROM invoice_notifications

UNION ALL

SELECT 
    'Payment Submissions' as table_name,
    COUNT(*) as remaining_records
FROM invoice_payment_submissions;

-- =====================================================
-- OPTIMIZE TABLES (Optional)
-- =====================================================

OPTIMIZE TABLE emergency_alerts;
OPTIMIZE TABLE invoices;
OPTIMIZE TABLE student_invoices;
OPTIMIZE TABLE invoice_notifications;
OPTIMIZE TABLE invoice_payment_submissions;

SELECT 'Database cleanup completed successfully!' as status;
