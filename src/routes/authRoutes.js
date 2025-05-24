const express = require('express');
const router = express.Router();
const googleCalendarService = require('../services/googleCalendarService');

/**
 * GET route to initiate Google OAuth2 flow
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).send('Error initiating authentication');
  }
});

/**
 * GET route for Google OAuth2 callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }
    
    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokens(code);
    
    // Display the refresh token to the user
    // In a production app, you would securely store this token
    res.send(`
      <h1>Authentication Successful</h1>
      <p>Your Google Calendar has been connected successfully.</p>
      <p>Please add the following refresh token to your .env file:</p>
      <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
      <p>Then restart the application.</p>
    `);
  } catch (error) {
    console.error('Error in Google auth callback:', error);
    res.status(500).send('Error completing authentication');
  }
});

/**
 * GET route to check authentication status
 */
router.get('/status', (req, res) => {
  try {
    const isAuthenticated = !!process.env.GOOGLE_REFRESH_TOKEN;
    
    res.json({
      authenticated: isAuthenticated,
      service: 'Google Calendar'
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Error checking authentication status' });
  }
});

module.exports = router;