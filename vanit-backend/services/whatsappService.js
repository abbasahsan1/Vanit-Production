const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    // Initialize Twilio client with sandbox credentials
    // These should be moved to environment variables in production
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'your_twilio_account_sid';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token';
    this.sandboxNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default Twilio sandbox number
    
    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} phone - Captain's phone number (in international format)
   * @param {string} otp - 6-digit OTP code
   * @returns {object} - Result of the send operation
   */
  async sendOTP(phone, otp) {
    try {
      // Format phone number for WhatsApp (must include country code)
      const formattedPhone = this.formatPhoneNumber(phone);
      
      // Create OTP message
      const message = `🚌 VanIt Captain Login\n\nYour OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`;

      console.log(`📱 Sending WhatsApp OTP to: ${formattedPhone}`);
      console.log(`📝 Message: ${message}`);

      const result = await this.client.messages.create({
        from: this.sandboxNumber,
        to: formattedPhone,
        body: message
      });

      console.log(`✅ WhatsApp OTP sent successfully! SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        to: formattedPhone
      };

    } catch (error) {
      console.error('❌ Error sending WhatsApp OTP:', error);
      
      // Handle specific Twilio errors
      if (error.code === 20003) {
        return {
          success: false,
          error: 'Invalid phone number format. Please use international format (+1234567890)',
          code: 'INVALID_PHONE'
        };
      } else if (error.code === 21211) {
        return {
          success: false,
          error: 'Phone number is not verified in Twilio sandbox. Please join the sandbox first.',
          code: 'UNVERIFIED_NUMBER'
        };
      } else if (error.code === 20429) {
        return {
          success: false,
          error: 'Too many requests. Please wait before sending another OTP.',
          code: 'RATE_LIMIT'
        };
      }

      return {
        success: false,
        error: 'Failed to send WhatsApp message. Please try again.',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Format phone number for WhatsApp
   * @param {string} phone - Raw phone number
   * @returns {string} - Formatted WhatsApp phone number
   */
  formatPhoneNumber(phone) {
    console.log(`🔍 Original phone number: ${phone}`);
    
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    console.log(`🧹 Cleaned phone number: ${cleaned}`);
    
    // Handle Pakistani phone numbers specifically
    if (cleaned.startsWith('0')) {
      // Remove leading 0 and add country code 92
      cleaned = '92' + cleaned.substring(1);
      console.log(`🇵🇰 Converted Pakistani number: ${cleaned}`);
    } else if (!cleaned.startsWith('92') && cleaned.length >= 10 && cleaned.length <= 11) {
      // If it's 10-11 digits without country code, assume it's Pakistani
      cleaned = '92' + cleaned;
      console.log(`🇵🇰 Added country code: ${cleaned}`);
    }
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    console.log(`✅ Final formatted number: whatsapp:${cleaned}`);
    
    // Return in WhatsApp format
    return `whatsapp:${cleaned}`;
  }

  /**
   * Send welcome message to new captain
   * @param {string} phone - Captain's phone number
   * @param {string} captainName - Captain's name
   * @returns {object} - Result of the send operation
   */
  async sendWelcomeMessage(phone, captainName) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const message = `🚌 Welcome to VanIt, ${captainName}!\n\nYou have been successfully registered as a captain.\n\nYou can now log in to the captain portal using your phone number and set up your password.\n\nThank you for joining our team!`;

      const result = await this.client.messages.create({
        from: this.sandboxNumber,
        to: formattedPhone,
        body: message
      });

      console.log(`✅ Welcome message sent to ${captainName}! SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid
      };

    } catch (error) {
      console.error('❌ Error sending welcome message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate Twilio configuration
   * @returns {boolean} - Whether Twilio is properly configured
   */
  isConfigured() {
    return this.accountSid && 
           this.authToken && 
           this.accountSid !== 'your_twilio_account_sid' && 
           this.authToken !== 'your_twilio_auth_token';
  }
}

module.exports = new WhatsAppService(); 