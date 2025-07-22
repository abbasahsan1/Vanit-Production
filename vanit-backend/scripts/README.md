# Database Cleanup Scripts

This directory contains scripts to clean up emergency alerts and invoice logs from the Vanit database.

## Scripts Available

### 1. Node.js Script (`clearLogs.js`)
Interactive script with safety features and detailed logging.

### 2. SQL Script (`clearLogs.sql`)
Direct SQL commands for database administrators.

## Usage

### Node.js Script Options

```bash
# Basic cleanup (interactive confirmation)
npm run cleanup:logs

# Dry run (see what would be deleted without deleting)
npm run cleanup:dry-run

# Clear only emergency logs
npm run cleanup:emergency

# Clear only invoice logs
npm run cleanup:invoices

# Advanced options
node scripts/clearLogs.js --older-than=60 --confirm
node scripts/clearLogs.js --dry-run --older-than=7
```

### Command Line Options

- `--emergency-only`: Clear only emergency alert logs
- `--invoices-only`: Clear only invoice-related logs
- `--older-than=days`: Clear records older than specified days (default: 30)
- `--dry-run`: Show what would be deleted without actually deleting
- `--confirm`: Skip confirmation prompt (use with caution)

### SQL Script Usage

1. Open your MySQL client
2. Connect to the vanit database
3. Run the script: `source scripts/clearLogs.sql`

Or execute directly:
```bash
mysql -u username -p vanit_fresh < scripts/clearLogs.sql
```

## What Gets Cleaned

### Emergency Logs
- `emergency_alerts` table - All emergency alert records

### Invoice Logs
- `invoice_notifications` - Invoice notification messages
- `invoice_payment_submissions` - Payment form submissions
- `student_invoices` - Student invoice records
- `invoices` - Legacy invoice records

## Safety Features

### Node.js Script
- ✅ Interactive confirmation prompts
- ✅ Dry run mode to preview deletions
- ✅ Detailed logging of operations
- ✅ Error handling and rollback
- ✅ Record counting before deletion
- ✅ Respects foreign key constraints

### SQL Script
- ⚠️ **No safety features** - use with extreme caution
- ✅ Shows record counts before deletion
- ✅ Optimizes tables after cleanup
- ✅ Provides feedback on operations

## Configuration

The scripts use environment variables from your `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vanit_fresh
DB_PORT=3306
```

## Examples

### Safe cleanup with preview
```bash
# See what would be deleted
npm run cleanup:dry-run

# If satisfied, run actual cleanup
npm run cleanup:logs
```

### Clear old records (90+ days)
```bash
node scripts/clearLogs.js --older-than=90 --confirm
```

### Emergency cleanup only
```bash
npm run cleanup:emergency
```

### Clear very old invoice logs
```bash
node scripts/clearLogs.js --invoices-only --older-than=180
```

## Important Notes

1. **Backup First**: Always backup your database before running cleanup scripts
2. **Test in Development**: Test scripts in development environment first
3. **Foreign Keys**: Invoice cleanup respects foreign key constraints
4. **Performance**: Cleanup may take time for large datasets
5. **Logging**: All operations are logged for audit purposes

## Scheduling Automatic Cleanup

Add to your system's cron jobs for automatic cleanup:

```bash
# Run cleanup every month, keeping 60 days of data
0 2 1 * * cd /path/to/vanit-backend && npm run cleanup:logs -- --older-than=60 --confirm
```

## Troubleshooting

### Permission Errors
Ensure the database user has DELETE permissions on all tables.

### Foreign Key Errors
The Node.js script handles foreign key constraints automatically. If using SQL script directly, ensure you follow the deletion order provided.

### Connection Issues
Verify your database configuration in the `.env` file.

## Recovery

If you accidentally delete important data:
1. Stop the application immediately
2. Restore from your latest backup
3. Review and test your backup/recovery procedures

## Support

For issues with cleanup scripts:
1. Check the error logs
2. Verify database connectivity
3. Ensure proper permissions
4. Test with `--dry-run` first
