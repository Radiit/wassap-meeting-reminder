const whatsappService = require('../src/services/whatsappService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

// Mock environment variables
process.env.WHATSAPP_API_TOKEN = 'test_token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token';

describe('WhatsApp Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send a text message successfully', async () => {
      // Mock successful response
      const mockResponse = {
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ wa_id: '123456789' }],
          messages: [{ id: 'message_id' }]
        }
      };
      axios.mockResolvedValueOnce(mockResponse);

      const recipient = '123456789';
      const message = 'Test message';
      const result = await whatsappService.sendTextMessage(recipient, message);

      // Check if axios was called with correct parameters
      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        url: `https://graph.facebook.com/v18.0/test_phone_id/messages`,
        headers: {
          'Authorization': 'Bearer test_token',
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

      // Check if the function returns the expected result
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when sending a message', async () => {
      // Mock error response
      const errorMessage = 'API Error';
      axios.mockRejectedValueOnce(new Error(errorMessage));

      const recipient = '123456789';
      const message = 'Test message';

      // Expect the function to throw an error
      await expect(whatsappService.sendTextMessage(recipient, message))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('verifyWebhook', () => {
    it('should verify webhook with correct token', () => {
      const mode = 'subscribe';
      const token = 'test_verify_token';
      const challenge = 'challenge_string';

      const result = whatsappService.verifyWebhook(mode, token, challenge);

      expect(result).toBe(challenge);
    });

    it('should reject webhook with incorrect token', () => {
      const mode = 'subscribe';
      const token = 'wrong_token';
      const challenge = 'challenge_string';

      const result = whatsappService.verifyWebhook(mode, token, challenge);

      expect(result).toBe(false);
    });

    it('should reject webhook with incorrect mode', () => {
      const mode = 'wrong_mode';
      const token = 'test_verify_token';
      const challenge = 'challenge_string';

      const result = whatsappService.verifyWebhook(mode, token, challenge);

      expect(result).toBe(false);
    });
  });

  describe('parseIncomingMessage', () => {
    it('should parse a valid text message', () => {
      const mockBody = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '123456789',
                id: 'message_id',
                timestamp: '1609459200',
                type: 'text',
                text: {
                  body: '/set-meeting tomorrow at 3pm Meeting with team'
                }
              }],
              metadata: {
                group_id: 'group_id_123'
              }
            }
          }]
        }]
      };

      const result = whatsappService.parseIncomingMessage(mockBody);

      expect(result).toEqual({
        sender: '123456789',
        messageId: 'message_id',
        timestamp: '1609459200',
        messageText: '/set-meeting tomorrow at 3pm Meeting with team',
        messageType: 'text',
        groupId: 'group_id_123'
      });
    });

    it('should return null for invalid message format', () => {
      const mockBody = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              // Missing messages array
              metadata: {}
            }
          }]
        }]
      };

      const result = whatsappService.parseIncomingMessage(mockBody);

      expect(result).toBeNull();
    });

    it('should return null for non-whatsapp object', () => {
      const mockBody = {
        object: 'something_else',
        entry: []
      };

      const result = whatsappService.parseIncomingMessage(mockBody);

      expect(result).toBeNull();
    });
  });
});