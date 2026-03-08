const express = require('express');
const {
  getSummary,
  getMonthlyRevenue,
  getTopCustomers,
  getCommunicationAnalytics,
  getFilteredAnalytics,
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/top-customers', getTopCustomers);
router.get('/communications', getCommunicationAnalytics);
router.get('/filtered', getFilteredAnalytics);

module.exports = router;