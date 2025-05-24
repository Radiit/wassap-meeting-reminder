const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  whatsappId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  calendarId: {
    type: String,
    trim: true,
    default: 'primary' // Default to primary Google Calendar
  },
  timezone: {
    type: String,
    default: 'Asia/Jakarta' // Default timezone for Indonesia
  },
  reminderTimes: [{
    type: Number, // Minutes before meeting
    default: [30] // Default reminder 30 minutes before meeting
  }],
  members: [{
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for faster lookups
groupSchema.index({ whatsappId: 1 });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;