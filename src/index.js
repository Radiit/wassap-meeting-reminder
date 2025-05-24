require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { setupCronJobs } = require('./services/reminderService');
const whatsappRoutes = require('./routes/whatsappRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Setup reminder cron jobs after database connection
    setupCronJobs();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/webhook', whatsappRoutes);
app.use('/auth', authRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('WhatsApp Meeting Reminder Bot is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  process.exit(0);
});