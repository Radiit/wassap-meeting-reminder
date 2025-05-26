const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const whatsappBot = require('./whatsappBot');

class ReminderScheduler {
  constructor() {
    // Check for reminders every minute
    cron.schedule('* * * * *', async () => {
      await this.checkReminders();
    });
  }

  async checkReminders() {
    try {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      // Find reminders that need to be sent
      const reminders = await Reminder.find({
        status: 'pending',
        meetingTime: { $gt: now },
        $or: [
          {
            'reminderSent.oneDay': false,
            meetingTime: { $lte: oneDayFromNow }
          },
          {
            'reminderSent.thirtyMinutes': false,
            meetingTime: { $lte: thirtyMinutesFromNow }
          }
        ]
      });

      for (const reminder of reminders) {
        const timeUntilMeeting = reminder.meetingTime - now;
        const hoursUntilMeeting = timeUntilMeeting / (1000 * 60 * 60);

        // Send one day reminder
        if (!reminder.reminderSent.oneDay && hoursUntilMeeting <= 24) {
          await whatsappBot.sendReminder(reminder);
          reminder.reminderSent.oneDay = true;
        }

        // Send 30 minutes reminder
        if (!reminder.reminderSent.thirtyMinutes && hoursUntilMeeting <= 0.5) {
          await whatsappBot.sendReminder(reminder);
          reminder.reminderSent.thirtyMinutes = true;
        }

        // Mark as completed if both reminders are sent
        if (reminder.reminderSent.oneDay && reminder.reminderSent.thirtyMinutes) {
          reminder.status = 'completed';
        }

        await reminder.save();
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
}

module.exports = new ReminderScheduler(); 