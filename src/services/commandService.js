const chrono = require('chrono-node');
const Meeting = require('../models/Meeting');
const Group = require('../models/Group');
const googleCalendarService = require('./googleCalendarService');
const whatsappService = require('./whatsappService');
const { scheduleReminder } = require('./reminderService');

class CommandService {
  /**
   * Process a message to check if it contains a meeting command
   * @param {Object} messageData - The parsed message data
   * @returns {Promise<Object|null>} - The result or null if not a command
   */
  async processMessage(messageData) {
    const { messageText, sender, groupId } = messageData;
    
    if (!messageText || !groupId) {
      return null;
    }
    
    // Check if message is a set-meeting command
    if (messageText.startsWith('/set-meeting') || messageText.startsWith('@set-meeting')) {
      return this.processMeetingCommand(messageText, sender, groupId);
    }
    
    // Check if message is a list-meetings command
    if (messageText.startsWith('/list-meetings') || messageText.startsWith('@list-meetings')) {
      return this.listMeetingsCommand(groupId);
    }
    
    // Check if message is a cancel-meeting command
    if (messageText.startsWith('/cancel-meeting') || messageText.startsWith('@cancel-meeting')) {
      return this.cancelMeetingCommand(messageText, sender, groupId);
    }
    
    return null;
  }
  
  /**
   * Process a set-meeting command
   * @param {string} messageText - The message text
   * @param {string} sender - The sender's phone number
   * @param {string} groupId - The group ID
   * @returns {Promise<Object>} - The result
   */
  async processMeetingCommand(messageText, sender, groupId) {
    try {
      // Get or create group
      let group = await Group.findOne({ whatsappId: groupId });
      
      if (!group) {
        group = new Group({
          whatsappId: groupId,
          name: `Group ${groupId.substring(0, 6)}...`, // Temporary name
          members: [{ phoneNumber: sender, isAdmin: true }]
        });
        await group.save();
      }
      
      // Extract command parts: /set-meeting <datetime> [title]
      const commandParts = messageText.split(' ');
      commandParts.shift(); // Remove the command itself
      
      // Parse the date and time using chrono-node
      const dateTimeText = commandParts.join(' ');
      const parsedDate = chrono.id.parse(dateTimeText);
      
      if (!parsedDate || parsedDate.length === 0) {
        return {
          success: false,
          message: 'Format tanggal dan waktu tidak valid. Gunakan format seperti "/set-meeting 5 januari 19:00 Diskusi Project"'
        };
      }
      
      const startTime = parsedDate[0].start.date();
      
      // Extract title from the remaining text
      let title = '';
      if (parsedDate[0].text !== dateTimeText) {
        title = dateTimeText.replace(parsedDate[0].text, '').trim();
      }
      
      if (!title) {
        title = 'Pertemuan';
      }
      
      // Set end time to 1 hour after start time by default
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      // Create meeting in database
      const meeting = new Meeting({
        title,
        startTime,
        endTime,
        createdBy: sender,
        groupId
      });
      
      // Create event in Google Calendar
      try {
        const calendarEvent = await googleCalendarService.createEvent({
          title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          description: `Pertemuan yang dibuat oleh ${sender} di grup WhatsApp`
        }, group.calendarId);
        
        meeting.googleCalendarEventId = calendarEvent.id;
      } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        // Continue even if Google Calendar fails
      }
      
      await meeting.save();
      
      // Schedule reminder
      await scheduleReminder(meeting, group);
      
      // Send confirmation to the group
      await whatsappService.sendMeetingConfirmation(groupId, meeting);
      
      return {
        success: true,
        meeting,
        message: 'Pertemuan berhasil dijadwalkan'
      };
    } catch (error) {
      console.error('Error processing meeting command:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat menjadwalkan pertemuan. Silakan coba lagi.'
      };
    }
  }
  
  /**
   * Process a list-meetings command
   * @param {string} groupId - The group ID
   * @returns {Promise<Object>} - The result
   */
  async listMeetingsCommand(groupId) {
    try {
      // Find upcoming meetings for the group
      const meetings = await Meeting.find({
        groupId,
        startTime: { $gte: new Date() }
      }).sort({ startTime: 1 }).limit(5);
      
      if (meetings.length === 0) {
        return {
          success: true,
          message: 'Tidak ada pertemuan yang akan datang.'
        };
      }
      
      // Format meetings list
      let messageText = '*DAFTAR PERTEMUAN MENDATANG*\n\n';
      
      meetings.forEach((meeting, index) => {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        const formattedDate = new Date(meeting.startTime).toLocaleDateString('id-ID', dateOptions);
        const formattedTime = new Date(meeting.startTime).toLocaleTimeString('id-ID', timeOptions);
        
        messageText += `${index + 1}. *${meeting.title}*\n`;
        messageText += `   📅 ${formattedDate}\n`;
        messageText += `   ⏰ ${formattedTime}\n\n`;
      });
      
      // Send the list to the group
      await whatsappService.sendTextMessage(groupId, messageText);
      
      return {
        success: true,
        meetings,
        message: 'Daftar pertemuan berhasil dikirim'
      };
    } catch (error) {
      console.error('Error processing list-meetings command:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat mengambil daftar pertemuan. Silakan coba lagi.'
      };
    }
  }
  
  /**
   * Process a cancel-meeting command
   * @param {string} messageText - The message text
   * @param {string} sender - The sender's phone number
   * @param {string} groupId - The group ID
   * @returns {Promise<Object>} - The result
   */
  async cancelMeetingCommand(messageText, sender, groupId) {
    try {
      // Extract meeting index or title
      const commandParts = messageText.split(' ');
      commandParts.shift(); // Remove the command itself
      
      if (commandParts.length === 0) {
        return {
          success: false,
          message: 'Silakan tentukan pertemuan yang akan dibatalkan. Contoh: "/cancel-meeting 1" atau "/cancel-meeting Diskusi Project"'
        };
      }
      
      // Check if the first part is a number (index)
      const meetingIndex = parseInt(commandParts[0]);
      let meeting;
      
      if (!isNaN(meetingIndex)) {
        // Find by index
        const meetings = await Meeting.find({
          groupId,
          startTime: { $gte: new Date() }
        }).sort({ startTime: 1 }).limit(10);
        
        if (meetingIndex < 1 || meetingIndex > meetings.length) {
          return {
            success: false,
            message: `Indeks pertemuan tidak valid. Tersedia ${meetings.length} pertemuan mendatang.`
          };
        }
        
        meeting = meetings[meetingIndex - 1];
      } else {
        // Find by title
        const searchTitle = commandParts.join(' ');
        meeting = await Meeting.findOne({
          groupId,
          title: { $regex: searchTitle, $options: 'i' },
          startTime: { $gte: new Date() }
        }).sort({ startTime: 1 });
        
        if (!meeting) {
          return {
            success: false,
            message: `Tidak dapat menemukan pertemuan dengan judul "${searchTitle}".`
          };
        }
      }
      
      // Check if user is the creator or an admin
      const group = await Group.findOne({ whatsappId: groupId });
      const isAdmin = group?.members.some(member => member.phoneNumber === sender && member.isAdmin);
      
      if (meeting.createdBy !== sender && !isAdmin) {
        return {
          success: false,
          message: 'Anda tidak memiliki izin untuk membatalkan pertemuan ini. Hanya pembuat pertemuan atau admin grup yang dapat membatalkannya.'
        };
      }
      
      // Delete from Google Calendar if event ID exists
      if (meeting.googleCalendarEventId) {
        try {
          await googleCalendarService.deleteEvent(meeting.googleCalendarEventId, group?.calendarId || 'primary');
        } catch (error) {
          console.error('Error deleting Google Calendar event:', error);
          // Continue even if Google Calendar fails
        }
      }
      
      // Delete meeting from database
      await meeting.deleteOne();
      
      // Send confirmation to the group
      const message = `❌ *PERTEMUAN DIBATALKAN* ❌\n\n*${meeting.title}* yang dijadwalkan pada ${new Date(meeting.startTime).toLocaleString('id-ID')} telah dibatalkan oleh ${sender}.`;
      await whatsappService.sendTextMessage(groupId, message);
      
      return {
        success: true,
        message: 'Pertemuan berhasil dibatalkan'
      };
    } catch (error) {
      console.error('Error processing cancel-meeting command:', error);
      return {
        success: false,
        message: 'Terjadi kesalahan saat membatalkan pertemuan. Silakan coba lagi.'
      };
    }
  }
}

module.exports = new CommandService();