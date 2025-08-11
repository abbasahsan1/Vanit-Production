const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAllInvoices() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('🔗 Connected to database');

        const invoiceTables = [
            'invoice_payment_submissions',
            'invoice_notifications', 
            'student_invoices',
            'invoices'
        ];

        let totalDeleted = 0;

        for (const table of invoiceTables) {
            try {
                console.log(`🔍 Checking table: ${table}`);
                const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                const count = countResult[0].count;
                console.log(`📊 ${table}: ${count} records`);

                if (count > 0) {
                    const [result] = await connection.execute(`DELETE FROM ${table}`);
                    console.log(`✅ Deleted ${result.affectedRows} records from ${table}`);
                    totalDeleted += result.affectedRows;
                    
                    // Reset auto increment
                    await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
                }
            } catch (error) {
                console.log(`⚠️  Error with table ${table}:`, error.message);
            }
        }

        console.log(`🎉 Total invoice records deleted: ${totalDeleted}`);
        console.log('✅ All invoice tables cleared!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Database connection closed');
        }
    }
}

clearAllInvoices();
