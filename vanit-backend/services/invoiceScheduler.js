const cron = require('node-cron');
const axios = require('axios');

class InvoiceScheduler {
  constructor() {
    this.startScheduler();
  }

  startScheduler() {
    // Run every day at 12:00 AM to check for overdue invoices
    cron.schedule('0 0 * * *', async () => {
      console.log('🕐 Running scheduled invoice overdue check...');
      try {
        const response = await axios.post('http://localhost:5000/api/invoices/mark-overdue');
        console.log('✅ Overdue check completed:', response.data);
      } catch (error) {
        console.error('❌ Error in scheduled overdue check:', error.message);
      }
    });

    // Run every Monday at 9:00 AM to send weekly reminders
    cron.schedule('0 9 * * 1', async () => {
      console.log('📧 Sending weekly payment reminders...');
      try {
        const response = await axios.post('http://localhost:5000/api/invoices/send-reminders');
        console.log('✅ Weekly reminders completed:', response.data);
      } catch (error) {
        console.error('❌ Error sending weekly reminders:', error.message);
      }
    });

    // Run every day at 6:00 PM to send daily reminders for overdue invoices
    cron.schedule('0 18 * * *', async () => {
      console.log('📧 Sending daily overdue reminders...');
      try {
        const response = await axios.post('http://localhost:5000/api/invoices/send-reminders');
        console.log('✅ Daily reminders completed:', response.data);
      } catch (error) {
        console.error('❌ Error sending daily reminders:', error.message);
      }
    });

    console.log('⏰ Invoice scheduler started successfully');
  }

  // Manual trigger functions for testing
  async triggerOverdueCheck() {
    try {
      const response = await axios.post('http://localhost:5000/api/invoices/mark-overdue');
      console.log('Manual overdue check completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in manual overdue check:', error.message);
      throw error;
    }
  }

  async triggerReminders() {
    try {
      const response = await axios.post('http://localhost:5000/api/invoices/send-reminders');
      console.log('Manual reminders completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in manual reminders:', error.message);
      throw error;
    }
  }
}

module.exports = {
  init: () => new InvoiceScheduler(),
  InvoiceScheduler
};
