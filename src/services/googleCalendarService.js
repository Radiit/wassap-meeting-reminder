const { google } = require('googleapis');

class GoogleCalendarService {
  constructor() {
    this.oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials if refresh token is available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
  }

  /**
   * Generate OAuth2 URL for authorization
   * @returns {string} - The authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force to get refresh token
    });
  }

  /**
   * Get tokens from authorization code
   * @param {string} code - The authorization code
   * @returns {Promise<Object>} - The tokens
   */
  async getTokens(code) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    this.oAuth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Create a new calendar event
   * @param {Object} meetingData - The meeting data
   * @param {string} calendarId - The calendar ID (default: 'primary')
   * @returns {Promise<Object>} - The created event
   */
  async createEvent(meetingData, calendarId = 'primary') {
    const { title, description, startTime, endTime, attendees = [] } = meetingData;

    // Format attendees for Google Calendar
    const formattedAttendees = attendees.map(email => ({ email }));

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour
        timeZone: 'Asia/Jakarta',
      },
      attendees: formattedAttendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ],
      },
    };

    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        sendUpdates: 'all', // Send emails to attendees
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} eventId - The event ID
   * @param {Object} meetingData - The updated meeting data
   * @param {string} calendarId - The calendar ID (default: 'primary')
   * @returns {Promise<Object>} - The updated event
   */
  async updateEvent(eventId, meetingData, calendarId = 'primary') {
    const { title, description, startTime, endTime, attendees = [] } = meetingData;

    // Format attendees for Google Calendar
    const formattedAttendees = attendees.map(email => ({ email }));

    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: startTime,
        timeZone: 'Asia/Jakarta',
      },
      end: {
        dateTime: endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Jakarta',
      },
      attendees: formattedAttendees,
    };

    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event,
        sendUpdates: 'all',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   * @param {string} eventId - The event ID
   * @param {string} calendarId - The calendar ID (default: 'primary')
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Get a calendar event
   * @param {string} eventId - The event ID
   * @param {string} calendarId - The calendar ID (default: 'primary')
   * @returns {Promise<Object>} - The event
   */
  async getEvent(eventId, calendarId = 'primary') {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * List upcoming events
   * @param {string} calendarId - The calendar ID (default: 'primary')
   * @param {number} maxResults - Maximum number of events to return (default: 10)
   * @returns {Promise<Array>} - The events
   */
  async listUpcomingEvents(calendarId = 'primary', maxResults = 10) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items;
    } catch (error) {
      console.error('Error listing Google Calendar events:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();