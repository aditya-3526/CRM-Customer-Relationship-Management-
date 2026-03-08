const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Customer',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    dueDate: {
        type: Date,
        required: [true, 'Please add a due date'],
    },
    type: {
        type: String,
        enum: ['follow_up', 'meeting', 'task', 'custom'],
        default: 'follow_up',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'overdue'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Reminder', ReminderSchema);
