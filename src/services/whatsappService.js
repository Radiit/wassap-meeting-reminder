const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
  }

  /**
   * Send a text message to a WhatsApp user or group
   * @param {string} recipient - The recipient's phone number or group ID
   * @param {string} message - The message to send
   * @returns {Promise<Object>} - The API response
   */
  async sendTextMessage(recipient, message) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.apiUrl}/${this.phoneNumberId}/messages`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a meeting reminder message
   * @param {string} recipient - The recipient's phone number or group ID
   * @param {Object} meeting - The meeting object
   * @returns {Promise<Object>} - The API response
   */
  async sendMeetingReminder(recipient, meeting) {
    const { title, startTime, description } = meeting;
    
    // Format date and time for display
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const formattedDate = new Date(startTime).toLocaleDateString('id-ID', dateOptions);
    const formattedTime = new Date(startTime).toLocaleTimeString('id-ID', timeOptions);
    
    const message = `🔔 *PENGINGAT PERTEMUAN* 🔔\n\n*${title}*\n📅 ${formattedDate}\n⏰ ${formattedTime}\n\n${description ? `📝 ${description}\n\n` : ''}Jangan lupa untuk hadir tepat waktu!`;
    
    return this.sendTextMessage(recipient, message);
  }

  /**
   * Send a meeting confirmation message
   * @param {string} recipient - The recipient's phone number or group ID
   * @param {Object} meeting - The meeting object
   * @returns {Promise<Object>} - The API response
   */
  async sendMeetingConfirmation(recipient, meeting) {
    const { title, startTime, endTime, description } = meeting;
    
    // Format date and time for display
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const formattedDate = new Date(startTime).toLocaleDateString('id-ID', dateOptions);
    const formattedStartTime = new Date(startTime).toLocaleTimeString('id-ID', timeOptions);
    const formattedEndTime = new Date(endTime).toLocaleTimeString('id-ID', timeOptions);
    
    const message = `✅ *PERTEMUAN TELAH DIJADWALKAN* ✅\n\n*${title}*\n📅 ${formattedDate}\n⏰ ${formattedStartTime} - ${formattedEndTime}\n\n${description ? `📝 ${description}\n\n` : ''}Pertemuan ini telah ditambahkan ke Google Calendar. Anda akan menerima pengingat 30 menit sebelum pertemuan dimulai.`;
    
    return this.sendTextMessage(recipient, message);
  }

  /**
   * Verify webhook request from WhatsApp
   * @param {string} mode - The hub mode
   * @param {string} token - The verification token
   * @param {string} challenge - The challenge string
   * @returns {boolean|string} - True if verified, or the challenge string
   */
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    
    return false;
  }

  /**
   * Parse incoming WhatsApp message
   * @param {Object} body - The webhook request body
   * @returns {Object|null} - The parsed message or null
   */
  parseIncomingMessage(body) {
    try {
      if (!body.object || body.object !== 'whatsapp_business_account') {
        return null;
      }

      if (!body.entry || !body.entry.length) {
        return null;
      }

      const entry = body.entry[0];
      if (!entry.changes || !entry.changes.length) {
        return null;
      }

      const change = entry.changes[0];
      if (!change.value || !change.value.messages || !change.value.messages.length) {
        return null;
      }

      const message = change.value.messages[0];
      const sender = message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;
      let messageText = '';
      let messageType = message.type;

      // Extract message text based on type
      if (messageType === 'text') {
        messageText = message.text.body;
      } else if (messageType === 'interactive' && message.interactive.type === 'button_reply') {
        messageText = message.interactive.button_reply.title;
      }

      // Get group info if available
      const groupId = change.value.metadata?.group_id || null;

      return {
        sender,
        messageId,
        timestamp,
        messageText,
        messageType,
        groupId
      };
    } catch (error) {
      console.error('Error parsing WhatsApp message:', error);
      return null;
    }
  }
}

module.exports = new WhatsAppService();