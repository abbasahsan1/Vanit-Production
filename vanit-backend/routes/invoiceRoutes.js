const express = require('express');
const pool = require('../config/db');
const { io } = require('../server');
const router = express.Router();

/**
 * =====// Get all invoices (admin view)
router.get('/all', async (req, res) => {
  try {
    const [invoices] = await pool.query(`
      SELECT 
        si.*,
        s.first_name,
        s.last_name,
        s.registration_number,
        s.email,
        s.phone,
        CONCAT(s.first_name, ' ', s.last_name) as student_name
      FROM student_invoices si
      JOIN students s ON si.student_id = s.id
      ORDER BY si.created_at DESC
    `);=============
 * ROUTE FEES MANAGEMENT
 * =================================
 */

// Get all route fees
router.get('/route-fees', async (req, res) => {
  try {
    const [routeFees] = await pool.query(`
      SELECT * FROM route_fees ORDER BY routeName
    `);
    
    res.status(200).json({
      success: true,
      data: routeFees
    });
  } catch (error) {
    console.error('Error fetching route fees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route fees'
    });
  }
});

// Set or update route fee
router.post('/route-fees', async (req, res) => {
  try {
    const { routeName, monthlyFee } = req.body;

    if (!routeName || !monthlyFee) {
      return res.status(400).json({
        success: false,
        error: 'Route name and monthly fee are required'
      });
    }

    await pool.query(`
      INSERT INTO route_fees (routeName, monthlyFee, updated_at) 
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
      monthlyFee = VALUES(monthlyFee), 
      updated_at = NOW()
    `, [routeName, parseFloat(monthlyFee)]);

    res.status(200).json({
      success: true,
      message: 'Route fee updated successfully'
    });
  } catch (error) {
    console.error('Error setting route fee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set route fee'
    });
  }
});

/**
 * =================================
 * INVOICE GENERATION & MANAGEMENT
 * =================================
 */

// Generate invoices for all students
router.post('/generate-bulk', async (req, res) => {
  try {
    const { month, year, dueDate } = req.body;

    if (!month || !year || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Month, year, and due date are required'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get all active students with route assignments
      const [students] = await connection.query(`
        SELECT s.id, s.first_name, s.last_name, s.registration_number, s.email, 
               s.route_name, s.stop_name, rf.monthlyFee
        FROM students s
        LEFT JOIN route_fees rf ON s.route_name = rf.routeName
        WHERE s.route_name IS NOT NULL AND s.route_name != ''
      `);

      if (students.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'No students with route assignments found'
        });
      }

      let invoicesCreated = 0;

      for (const student of students) {
        // Check for unpaid invoices to carry forward
        const [unpaidInvoices] = await connection.query(`
          SELECT SUM(amount) as carryForward 
          FROM student_invoices 
          WHERE student_id = ? AND status IN ('pending', 'overdue', 'rejected') AND payment_method IS NULL
        `, [student.id]);

        const carryForward = parseFloat(unpaidInvoices[0]?.carryForward || 0);
        const monthlyFee = parseFloat(student.monthlyFee || 0);
        const totalAmount = monthlyFee + carryForward;

        if (totalAmount > 0) {
          // Check if invoice already exists for this student/month/year
          const [existingInvoice] = await connection.query(`
            SELECT id FROM student_invoices 
            WHERE student_id = ? AND month = ? AND year = ?
          `, [student.id, month, parseInt(year)]);

          if (existingInvoice.length === 0) {
            // Generate invoice only if it doesn't exist
            await connection.query(`
              INSERT INTO student_invoices 
              (student_id, route_name, amount, month, year, due_date, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              student.id,
              student.route_name,
              totalAmount,
              month,
              parseInt(year),
              dueDate,
              'pending'
            ]);

            invoicesCreated++;
          } else {
            console.log(`📋 Invoice already exists for student ${student.id} for ${month}/${year}`);
          }
        }
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        data: {
          invoicesCreated,
          totalStudents: students.length
        },
        message: `Successfully generated ${invoicesCreated} invoices`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error generating invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoices'
    });
  }
});

// Get all invoices (admin view)
router.get('/all', async (req, res) => {
  try {
    const [invoices] = await pool.query(`
      SELECT 
        si.*,
        s.first_name,
        s.last_name,
        s.registration_number,
        s.email,
        s.phone
      FROM student_invoices si
      JOIN students s ON si.student_id = s.id
      ORDER BY si.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

/**
 * =================================
 * STUDENT INVOICE ACCESS
 * =================================
 */

// Get student's invoices
router.get('/student/:studentId/invoices', async (req, res) => {
  try {
    const { studentId } = req.params;

    const [invoices] = await pool.query(`
      SELECT * FROM student_invoices 
      WHERE student_id = ? 
      ORDER BY created_at DESC
    `, [studentId]);

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching student invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student invoices'
    });
  }
});

// Student payment submission
router.post('/student/:studentId/pay/:invoiceId', async (req, res) => {
  try {
    const { studentId, invoiceId } = req.params;
    const { paymentMethod, transactionID } = req.body;

    if (!paymentMethod || !transactionID) {
      return res.status(400).json({
        success: false,
        error: 'Payment method and transaction ID are required'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update invoice with payment details
      const [updateResult] = await connection.query(`
        UPDATE student_invoices 
        SET payment_method = ?, transaction_id = ?, date_paid = NOW(), status = 'pending'
        WHERE id = ? AND student_id = ? AND status IN ('pending', 'overdue', 'rejected') AND payment_method IS NULL
      `, [paymentMethod, transactionID, invoiceId, studentId]);

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invoice not found or cannot be paid'
        });
      }

      // Get student and invoice details for notification
      const [invoiceDetails] = await connection.query(`
        SELECT si.*, s.first_name, s.last_name, s.registration_number
        FROM student_invoices si
        JOIN students s ON si.student_id = s.id
        WHERE si.id = ?
      `, [invoiceId]);

      await connection.commit();

      // Send real-time notification to admin
      if (io) {
        io.to('admin_dashboard').emit('payment_submitted', {
          type: 'payment_submitted',
          message: `Payment submitted by ${invoiceDetails[0].first_name} ${invoiceDetails[0].last_name}`,
          invoiceId: invoiceId,
          studentName: `${invoiceDetails[0].first_name} ${invoiceDetails[0].last_name}`,
          amount: invoiceDetails[0].amount,
          paymentMethod: paymentMethod,
          transactionID: transactionID
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment submitted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit payment'
    });
  }
});

/**
 * =================================
 * ADMIN PAYMENT PROCESSING
 * =================================
 */

// Approve payment
router.post('/:invoiceId/approve', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { adminNotes } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get invoice details before approval
      const [invoiceDetails] = await connection.query(`
        SELECT si.*, s.first_name, s.last_name, s.registration_number
        FROM student_invoices si
        JOIN students s ON si.student_id = s.id
        WHERE si.id = ? AND si.status = 'pending'
      `, [invoiceId]);

      if (invoiceDetails.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invoice not found or not pending approval'
        });
      }

      const invoice = invoiceDetails[0];

      // Update invoice status to paid
      await connection.query(`
        UPDATE student_invoices 
        SET status = 'paid', 
            rejection_reason = ?,
            admin_approved_at = NOW()
        WHERE id = ?
      `, [adminNotes || 'Payment approved by admin', invoiceId]);

      await connection.commit();

      // Send real-time notification to student
      if (io) {
        io.to(`student:${invoice.student_id}`).emit('invoice_status_update', {
          type: 'payment_approved',
          message: `Your payment for invoice #${invoiceId} has been approved!`,
          invoiceId: invoiceId,
          amount: invoice.amount
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment approved successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve payment'
    });
  }
});

// Reject payment
router.post('/:invoiceId/reject', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { adminNotes } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get invoice details before rejection
      const [invoiceDetails] = await connection.query(`
        SELECT si.*, s.first_name, s.last_name, s.registration_number
        FROM student_invoices si
        JOIN students s ON si.student_id = s.id
        WHERE si.id = ? AND si.status = 'pending'
      `, [invoiceId]);

      if (invoiceDetails.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invoice not found or not pending approval'
        });
      }

      const invoice = invoiceDetails[0];

      // Update invoice status to rejected
      await connection.query(`
        UPDATE student_invoices 
        SET status = 'rejected', 
            rejection_reason = ?,
            payment_method = NULL,
            transaction_id = NULL,
            date_paid = NULL
        WHERE id = ?
      `, [adminNotes || 'Payment rejected by admin', invoiceId]);

      await connection.commit();

      // Send real-time notification to student
      if (io) {
        io.to(`student:${invoice.student_id}`).emit('invoice_status_update', {
          type: 'payment_rejected',
          message: `Your payment for invoice #${invoiceId} has been rejected. Reason: ${adminNotes}`,
          invoiceId: invoiceId,
          amount: invoice.amount,
          reason: adminNotes
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment rejected successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject payment'
    });
  }
});

/**
 * =================================
 * NOTIFICATIONS & WARNINGS
 * =================================
 */

// Send warning to student
router.post('/send-warning/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Warning message is required'
      });
    }

    // Get student details
    const [studentDetails] = await pool.query(`
      SELECT first_name, last_name, registration_number, email
      FROM students 
      WHERE id = ?
    `, [studentId]);

    if (studentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const student = studentDetails[0];

    // Store notification in database
    await pool.query(`
      INSERT INTO invoice_notifications 
      (student_id, type, title, message)
      VALUES (?, 'payment_due', 'Payment Warning', ?)
    `, [studentId, message]);

    // Send real-time notification
    if (io) {
      io.to(`student:${studentId}`).emit('invoice_warning', {
        type: 'warning',
        message: message,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `Warning sent to ${student.first_name} ${student.last_name}`
    });

  } catch (error) {
    console.error('Error sending warning:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send warning'
    });
  }
});

// Get student notifications
router.get('/student/:studentId/notifications', async (req, res) => {
  try {
    const { studentId } = req.params;

    const [notifications] = await pool.query(`
      SELECT inn.*, si.amount, si.due_date
      FROM invoice_notifications inn
      LEFT JOIN student_invoices si ON inn.invoice_id = si.id
      WHERE inn.student_id = ?
      ORDER BY inn.created_at DESC
      LIMIT 50
    `, [studentId]);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    await pool.query(`
      UPDATE invoice_notifications 
      SET read_status = 1 
      WHERE id = ?
    `, [notificationId]);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * =================================
 * AUTOMATED TASKS
 * =================================
 */

// Mark overdue invoices
router.post('/mark-overdue', async (req, res) => {
  try {
    const [result] = await pool.query(`
      UPDATE student_invoices 
      SET status = 'overdue' 
      WHERE status = 'pending' 
      AND due_date < CURDATE()
      AND payment_method IS NULL
    `);

    console.log(`✅ Marked ${result.affectedRows} invoices as overdue`);

    res.status(200).json({
      success: true,
      message: `Marked ${result.affectedRows} invoices as overdue`
    });
  } catch (error) {
    console.error('Error marking overdue invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark overdue invoices'
    });
  }
});

// Send automatic reminders
router.post('/send-reminders', async (req, res) => {
  try {
    // Get students with overdue invoices
    const [overdueInvoices] = await pool.query(`
      SELECT 
        si.id,
        si.student_id,
        si.amount,
        si.due_date,
        s.first_name,
        s.last_name,
        s.registration_number
      FROM student_invoices si
      JOIN students s ON si.student_id = s.id
      WHERE si.status IN ('pending', 'overdue')
      AND si.due_date < CURDATE()
      AND si.payment_method IS NULL
    `);

    let remindersSent = 0;

    for (const invoice of overdueInvoices) {
      const message = `Payment Reminder: Your invoice #${invoice.id} for PKR ${invoice.amount} was due on ${new Date(invoice.due_date).toLocaleDateString()}. Please pay immediately to avoid service interruption.`;

      // Store notification
      await pool.query(`
        INSERT INTO invoice_notifications 
        (student_id, type, message, invoice_id)
        VALUES (?, 'reminder', ?, ?)
      `, [invoice.student_id, message, invoice.id]);

      // Send real-time notification
      if (io) {
        io.to(`student:${invoice.student_id}`).emit('invoice_warning', {
          type: 'reminder',
          message: message,
          invoiceId: invoice.id,
          amount: invoice.amount,
          dueDate: invoice.due_date
        });
      }

      remindersSent++;
    }

    res.status(200).json({
      success: true,
      message: `Sent ${remindersSent} payment reminders`
    });

  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reminders'
    });
  }
});

/**
 * =================================
 * PAYMENT SUBMISSIONS MANAGEMENT
 * =================================
 */

// Get all payment submissions pending approval
router.get('/payment-submissions', async (req, res) => {
  try {
    const [submissions] = await pool.query(`
      SELECT 
        si.id as invoice_id,
        si.student_id,
        si.amount,
        si.payment_method,
        si.transaction_id,
        si.date_paid,
        si.month,
        si.year,
        si.route_name,
        s.first_name,
        s.last_name,
        s.registration_number,
        s.email
      FROM student_invoices si
      JOIN students s ON si.student_id = s.id
      WHERE si.status = 'pending' 
        AND si.payment_method IS NOT NULL 
        AND si.transaction_id IS NOT NULL
      ORDER BY si.date_paid DESC
    `);

    // Format the response to match frontend expectations
    const formattedSubmissions = submissions.map(sub => ({
      invoice_id: sub.invoice_id,
      student_id: sub.student_id,
      student_name: `${sub.first_name} ${sub.last_name}`,
      registration_number: sub.registration_number,
      amount: sub.amount,
      payment_method: sub.payment_method,
      transaction_id: sub.transaction_id,
      date_paid: sub.date_paid,
      month: sub.month,
      year: sub.year,
      route_name: sub.route_name
    }));

    res.status(200).json({
      success: true,
      data: formattedSubmissions
    });
  } catch (error) {
    console.error('Error fetching payment submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment submissions'
    });
  }
});

/**
 * =================================
 * STATISTICS AND REPORTING
 * =================================
 */

// Get invoice statistics
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalInvoices,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as totalRevenue,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingPayments,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdueInvoices
      FROM student_invoices
    `);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalInvoices: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        overdueInvoices: 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
