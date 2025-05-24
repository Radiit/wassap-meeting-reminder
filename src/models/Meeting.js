const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  },
  groupId: {
    type: String,
    required: true,
    trim: true
  },
  googleCalendarEventId: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  attendees: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for faster queries on upcoming meetings
meetingSchema.index({ startTime: 1, reminderSent: 1 });

// Index for group-specific queries
meetingSchema.index({ groupId: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;