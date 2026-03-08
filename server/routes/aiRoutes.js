const express = require('express');
const {
    generateCustomerInsights,
    naturalLanguageSearch,
} = require('../controllers/aiController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/customer-insights', generateCustomerInsights);
router.post('/natural-search', naturalLanguageSearch);

module.exports = router;
