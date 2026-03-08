const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: true,
  },
  type: {
    type: String,
    enum: ['Email', 'Phone', 'Video Call', 'Meeting'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Completed', 'Scheduled', 'Pending'],
    default: 'Pending',
  },
  notes: {
    type: String,
    required: [true, 'Please add notes'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Communication', CommunicationSchema);