const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active',
  },
  stage: {
    type: String,
    enum: ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won'],
    default: 'Lead',
  },
  value: {
    type: Number,
    required: [true, 'Please add a customer value'],
    min: [0, 'Value must be at least 0'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Customer', CustomerSchema);