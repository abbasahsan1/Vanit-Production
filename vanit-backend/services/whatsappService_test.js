const twilio = require('twilio');

console.log('🔧 Starting WhatsApp Service definition...');

class WhatsAppService {
  constructor() {
    console.log('🔧 WhatsApp Service constructor called');
    
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token';
    this.sandboxNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    
    console.log(`📋 Credentials loaded: SID=${this.accountSid ? 'SET' : 'NOT SET'}`);
    
    this.client = null;
    this.isConfigured = this.checkConfiguration();
    
    if (this.isConfigured) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
        console.log('✅ Twilio client initialized successfully');
      } catch (error) {
        console.error('❌ Twilio client initialization failed:', error.message);
        this.isConfigured = false;
        this.client = null;
      }
    }
    
    console.log('🔧 Constructor completed');
  }

  checkConfiguration() {
    console.log('🔍 Checking configuration...');
    const isValid = this.accountSid && 
           this.authToken && 
           this.accountSid !== 'your_twilio_account_sid' && 
           this.authToken !== 'your_twilio_auth_token' &&
           this.accountSid.startsWith('AC') && 
           this.authToken.length > 10;
    
    console.log(`🔍 Configuration valid: ${isValid}`);
    return isValid;
  }

  async sendOTP(phone, otp) {
    console.log(`📱 SendOTP called with: ${phone}, ${otp}`);
    return { success: true, test: true, phone, otp };
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      accountSid: this.accountSid,
      sandboxNumber: this.sandboxNumber,
      clientInitialized: !!this.client
    };
  }
}

console.log('🔧 Creating instance...');
const instance = new WhatsAppService();
console.log('🔧 Instance created, exporting...');

module.exports = instance;
