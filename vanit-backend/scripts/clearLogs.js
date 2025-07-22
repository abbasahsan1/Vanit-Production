#!/usr/bin/env node
/**
 * Database Cleanup Script for Vanit Transportation System
 * This script clears emergency alerts and invoice-related logs from the database
 * 
 * Usage:
 * node clearLogs.js [options]
 * 
 * Options:
 * --emergency-only    Clear only emergency logs
 * --invoices-only     Clear only invoice logs
 * --older-than=days   Clear records older than specified days (default: 30)
 * --dry-run          Show what would be deleted without actually deleting
 * --confirm          Skip confirmation prompt
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vanit_fresh',
  port: process.env.DB_PORT || 3306
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  emergencyOnly: args.includes('--emergency-only'),
  invoicesOnly: args.includes('--invoices-only'),
  dryRun: args.includes('--dry-run'),
  confirm: args.includes('--confirm'),
  olderThan: 30 // default 30 days
};

// Parse older-than option
const olderThanArg = args.find(arg => arg.startsWith('--older-than='));
if (olderThanArg) {
  options.olderThan = parseInt(olderThanArg.split('=')[1]) || 30;
}

console.log('🗑️  Vanit Database Cleanup Script');
console.log('==================================');

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function getRecordCounts(connection, olderThanDate) {
  const counts = {};
  
  // Emergency alerts count
  const [emergencyResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM emergency_alerts WHERE timestamp < ?',
    [olderThanDate]
  );
  counts.emergency_alerts = emergencyResult[0].count;
  
  // Invoice related counts
  const [invoicesResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM invoices WHERE timestamp < ?',
    [olderThanDate]
  );
  counts.invoices = invoicesResult[0].count;
  
  const [studentInvoicesResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM student_invoices WHERE created_at < ?',
    [olderThanDate]
  );
  counts.student_invoices = studentInvoicesResult[0].count;
  
  const [invoiceNotificationsResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM invoice_notifications WHERE created_at < ?',
    [olderThanDate]
  );
  counts.invoice_notifications = invoiceNotificationsResult[0].count;
  
  const [paymentSubmissionsResult] = await connection.execute(
    'SELECT COUNT(*) as count FROM invoice_payment_submissions WHERE submitted_at < ?',
    [olderThanDate]
  );
  counts.invoice_payment_submissions = paymentSubmissionsResult[0].count;
  
  return counts;
}

async function clearEmergencyLogs(connection, olderThanDate, dryRun = false) {
  console.log('\\n🚨 Clearing Emergency Logs...');
  
  if (dryRun) {
    console.log('  🔍 DRY RUN - No data will be deleted');
  }
  
  try {
    const query = 'DELETE FROM emergency_alerts WHERE timestamp < ?';
    
    if (dryRun) {
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count FROM emergency_alerts WHERE timestamp < ?',
        [olderThanDate]
      );
      console.log(`  📊 Would delete ${result[0].count} emergency alert records`);
    } else {
      const [result] = await connection.execute(query, [olderThanDate]);
      console.log(`  ✅ Deleted ${result.affectedRows} emergency alert records`);
    }
  } catch (error) {
    console.error('  ❌ Error clearing emergency logs:', error.message);
  }
}

async function clearInvoiceLogs(connection, olderThanDate, dryRun = false) {
  console.log('\\n💰 Clearing Invoice Logs...');
  
  if (dryRun) {
    console.log('  🔍 DRY RUN - No data will be deleted');
  }
  
  try {
    // Clear in order due to foreign key constraints
    const tables = [
      { name: 'invoice_notifications', dateColumn: 'created_at' },
      { name: 'invoice_payment_submissions', dateColumn: 'submitted_at' },
      { name: 'student_invoices', dateColumn: 'created_at' },
      { name: 'invoices', dateColumn: 'timestamp' }
    ];
    
    for (const table of tables) {
      const query = `DELETE FROM ${table.name} WHERE ${table.dateColumn} < ?`;
      
      if (dryRun) {
        const [result] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${table.name} WHERE ${table.dateColumn} < ?`,
          [olderThanDate]
        );
        console.log(`  📊 Would delete ${result[0].count} records from ${table.name}`);
      } else {
        const [result] = await connection.execute(query, [olderThanDate]);
        console.log(`  ✅ Deleted ${result.affectedRows} records from ${table.name}`);
      }
    }
  } catch (error) {
    console.error('  ❌ Error clearing invoice logs:', error.message);
  }
}

async function getUserConfirmation(message) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(message, (answer) => {
      readline.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function main() {
  const connection = await connectToDatabase();
  
  // Calculate date threshold
  const olderThanDate = new Date();
  olderThanDate.setDate(olderThanDate.getDate() - options.olderThan);
  
  console.log(`\\n📅 Clearing records older than: ${olderThanDate.toLocaleDateString()}`);
  console.log(`📊 Options: Emergency=${!options.invoicesOnly}, Invoices=${!options.emergencyOnly}, DryRun=${options.dryRun}`);
  
  // Get record counts
  console.log('\\n🔍 Analyzing database...');
  const counts = await getRecordCounts(connection, olderThanDate);
  
  console.log('\\n📊 Records found:');
  console.log(`  Emergency Alerts: ${counts.emergency_alerts}`);
  console.log(`  Invoices: ${counts.invoices}`);
  console.log(`  Student Invoices: ${counts.student_invoices}`);
  console.log(`  Invoice Notifications: ${counts.invoice_notifications}`);
  console.log(`  Payment Submissions: ${counts.invoice_payment_submissions}`);
  
  const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  if (totalRecords === 0) {
    console.log('\\n✅ No records found to delete.');
    await connection.end();
    return;
  }
  
  // Confirmation
  if (!options.confirm && !options.dryRun) {
    const confirmed = await getUserConfirmation(
      `\\n⚠️  This will delete ${totalRecords} records. Continue? (y/N): `
    );
    
    if (!confirmed) {
      console.log('\\n❌ Operation cancelled by user.');
      await connection.end();
      return;
    }
  }
  
  // Perform cleanup
  if (!options.invoicesOnly) {
    await clearEmergencyLogs(connection, olderThanDate, options.dryRun);
  }
  
  if (!options.emergencyOnly) {
    await clearInvoiceLogs(connection, olderThanDate, options.dryRun);
  }
  
  console.log('\\n🎉 Cleanup completed successfully!');
  
  if (options.dryRun) {
    console.log('\\n💡 This was a dry run. To actually delete the records, run without --dry-run flag.');
  }
  
  await connection.end();
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
