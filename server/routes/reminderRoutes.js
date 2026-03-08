const express = require('express');
const {
    getReminders,
    getUpcomingReminders,
    createReminder,
    updateReminder,
    deleteReminder,
} = require('../controllers/reminderController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/upcoming', getUpcomingReminders);

router.route('/')
    .get(getReminders)
    .post(createReminder);

router.route('/:id')
    .put(updateReminder)
    .delete(deleteReminder);

module.exports = router;
