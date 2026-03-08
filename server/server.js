require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/communications', require('./routes/communicationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});