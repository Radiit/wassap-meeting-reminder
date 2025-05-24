const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const Group = require('../models/Group');
const whatsappService = require('./whatsappService');

/**
 * Setup cron jobs for meeting reminders
 */
const setupCronJobs = () => {
  // Check for upcoming meetings every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running reminder check...');
      await checkUpcomingMeetings();
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });

  console.log('Reminder cron jobs set up successfully');
};

/**
 * Check for upcoming meetings and send reminders
 */
const checkUpcomingMeetings = async () => {
  const now = new Date();
  
  // Find all active groups
  const groups = await Group.find({ isActive: true });
  
  for (const group of groups) {
    // For each reminder time configured for the group
    for (const reminderMinutes of group.reminderTimes) {
      // Calculate the time window for meetings that need reminders
      const reminderTime = new Date(now.getTime() + (reminderMinutes * 60 * 1000));
      const timeWindowStart = new Date(reminderTime.getTime() - (60 * 1000)); // 1 minute before
      const timeWindowEnd = new Date(reminderTime.getTime() + (60 * 1000));   // 1 minute after
      
      // Find meetings that need reminders
      const meetings = await Meeting.find({
        groupId: group.whatsappId,
        startTime: { $gte: timeWindowStart, $lte: timeWindowEnd },
        reminderSent: false
      });
      
      // Send reminders for each meeting
      for (const meeting of meetings) {
        try {
          await whatsappService.sendMeetingReminder(group.whatsappId, meeting);
          
          // Update meeting to mark reminder as sent
          meeting.reminderSent = true;
          await meeting.save();
          
          console.log(`Reminder sent for meeting: ${meeting.title} in group: ${group.name}`);
        } catch (error) {
          console.error(`Error sending reminder for meeting ${meeting._id}:`, error);
        }
      }
    }
  }
};

/**
 * Schedule a reminder for a specific meeting
 * @param {Object} meeting - The meeting object
 * @param {Object} group - The group object
 */
const scheduleReminder = async (meeting, group) => {
  try {
    // For immediate testing, check if the meeting is within the next minute
    const now = new Date();
    const meetingTime = new Date(meeting.startTime);
    const timeDiff = meetingTime.getTime() - now.getTime();
    
    // If meeting is within 1 minute, send reminder immediately
    if (timeDiff > 0 && timeDiff <= 60 * 1000) {
      await whatsappService.sendMeetingReminder(group.whatsappId, meeting);
      meeting.reminderSent = true;
      await meeting.save();
      console.log(`Immediate reminder sent for meeting: ${meeting.title}`);
    }
  } catch (error) {
    console.error(`Error scheduling reminder for meeting ${meeting._id}:`, error);
  }
};

module.exports = {
  setupCronJobs,
  checkUpcomingMeetings,
  scheduleReminder
};