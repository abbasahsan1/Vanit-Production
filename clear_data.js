const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearData() {
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

        // Clear invoices table
        console.log('🗑️  Clearing invoices...');
        const [invoiceResult] = await connection.execute('DELETE FROM invoices');
        console.log(`✅ Deleted ${invoiceResult.affectedRows} invoices`);

        // Clear emergency alerts table
        console.log('🗑️  Clearing emergency alerts...');
        const [emergencyResult] = await connection.execute('DELETE FROM emergency_alerts');
        console.log(`✅ Deleted ${emergencyResult.affectedRows} emergency alerts`);

        // Reset auto increment counters
        console.log('🔄 Resetting auto increment counters...');
        await connection.execute('ALTER TABLE invoices AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE emergency_alerts AUTO_INCREMENT = 1');
        console.log('✅ Auto increment counters reset');

        console.log('🎉 Data cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

// Run the script
clearData();
