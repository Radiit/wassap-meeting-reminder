const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },
  meetingTitle: {
    type: String,
    required: true,
  },
  meetingTime: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  reminderSent: {
    oneDay: {
      type: Boolean,
      default: false,
    },
    thirtyMinutes: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Reminder', reminderSchema); 