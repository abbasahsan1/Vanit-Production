const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearInvoices() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('🔗 Connected to database');

        // First, let's see what invoice-related tables exist
        console.log('🔍 Checking for invoice-related tables...');
        const [tables] = await connection.execute("SHOW TABLES LIKE '%invoice%'");
        console.log('📋 Invoice tables found:', tables);

        // Check what's in the main invoices table
        const [invoiceCount] = await connection.execute('SELECT COUNT(*) as count FROM invoices');
        console.log(`📊 Current invoices count: ${invoiceCount[0].count}`);

        if (invoiceCount[0].count > 0) {
            // Show some sample invoices
            const [sampleInvoices] = await connection.execute('SELECT id, student_id, amount, status, created_at FROM invoices LIMIT 5');
            console.log('📝 Sample invoices:', sampleInvoices);

            // Clear all invoices
            console.log('🗑️  Clearing all invoices...');
            const [result] = await connection.execute('DELETE FROM invoices');
            console.log(`✅ Deleted ${result.affectedRows} invoices`);

            // Reset auto increment
            await connection.execute('ALTER TABLE invoices AUTO_INCREMENT = 1');
            console.log('✅ Auto increment reset');
        } else {
            console.log('ℹ️  No invoices to clear');
        }

        // Check for invoice_items table if it exists
        try {
            const [itemCount] = await connection.execute('SELECT COUNT(*) as count FROM invoice_items');
            console.log(`📊 Invoice items count: ${itemCount[0].count}`);
            
            if (itemCount[0].count > 0) {
                const [itemResult] = await connection.execute('DELETE FROM invoice_items');
                console.log(`✅ Deleted ${itemResult.affectedRows} invoice items`);
                await connection.execute('ALTER TABLE invoice_items AUTO_INCREMENT = 1');
            }
        } catch (error) {
            console.log('ℹ️  No invoice_items table found');
        }

        console.log('🎉 Invoice cleanup completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

clearInvoices();
