const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const commandService = require('../services/commandService');

/**
 * GET route for WhatsApp webhook verification
 * This is required by WhatsApp to verify the webhook endpoint
 */
router.get('/', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    const result = whatsappService.verifyWebhook(mode, token, challenge);
    
    if (result) {
      return res.status(200).send(result);
    }
    
    return res.status(403).json({ error: 'Verification failed' });
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST route for WhatsApp webhook
 * This receives messages and events from WhatsApp
 */
router.post('/', async (req, res) => {
  try {
    // Acknowledge receipt immediately
    res.status(200).send('EVENT_RECEIVED');
    
    // Parse the incoming message
    const messageData = whatsappService.parseIncomingMessage(req.body);
    
    if (!messageData) {
      return; // Not a message or not relevant
    }
    
    console.log('Received message:', messageData);
    
    // Process commands if in a group
    if (messageData.groupId) {
      const result = await commandService.processMessage(messageData);
      
      if (result) {
        console.log('Command processed:', result);
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
});

module.exports = router;