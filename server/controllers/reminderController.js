const Reminder = require('../models/Reminder');
const Customer = require('../models/Customer');

// @desc    Get all reminders
// @route   GET /api/reminders
exports.getReminders = async (req, res, next) => {
    try {
        const { status, sort } = req.query;
        const filter = {};
        if (status) filter.status = status;

        // Auto-mark overdue
        await Reminder.updateMany(
            { dueDate: { $lt: new Date() }, status: 'pending' },
            { status: 'overdue' }
        );

        const reminders = await Reminder.find(filter)
            .populate('customerId', 'name email')
            .sort(sort || 'dueDate');

        res.status(200).json({ success: true, data: reminders });
    } catch (err) {
        next(err);
    }
};

// @desc    Get upcoming reminders (next 7 days)
// @route   GET /api/reminders/upcoming
exports.getUpcomingReminders = async (req, res, next) => {
    try {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Auto-mark overdue
        await Reminder.updateMany(
            { dueDate: { $lt: now }, status: 'pending' },
            { status: 'overdue' }
        );

        const reminders = await Reminder.find({
            status: { $ne: 'completed' },
            dueDate: { $lte: weekFromNow },
        })
            .populate('customerId', 'name email')
            .sort('dueDate');

        res.status(200).json({ success: true, data: reminders, count: reminders.length });
    } catch (err) {
        next(err);
    }
};

// @desc    Create reminder
// @route   POST /api/reminders
exports.createReminder = async (req, res, next) => {
    try {
        const reminder = await Reminder.create(req.body);
        const populated = await Reminder.findById(reminder._id).populate('customerId', 'name email');
        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        next(err);
    }
};

// @desc    Update reminder
// @route   PUT /api/reminders/:id
exports.updateReminder = async (req, res, next) => {
    try {
        const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('customerId', 'name email');

        if (!reminder) {
            return res.status(404).json({ success: false, error: 'Reminder not found' });
        }

        res.status(200).json({ success: true, data: reminder });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
exports.deleteReminder = async (req, res, next) => {
    try {
        const reminder = await Reminder.findByIdAndDelete(req.params.id);

        if (!reminder) {
            return res.status(404).json({ success: false, error: 'Reminder not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
