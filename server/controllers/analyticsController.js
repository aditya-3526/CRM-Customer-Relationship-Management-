const Customer = require('../models/Customer');
const Communication = require('../models/Communication');

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Public
exports.getSummary = async (req, res, next) => {
  try {
    // Total customers
    const totalCustomers = await Customer.countDocuments();

    // Total revenue
    const revenueResult = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$value' },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Customer status distribution
    const statusDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent customers (last 5)
    const recentCustomers = await Customer.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email value status createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalRevenue,
        statusDistribution,
        recentCustomers,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get monthly revenue
// @route   GET /api/analytics/monthly-revenue
// @access  Public
exports.getMonthlyRevenue = async (req, res, next) => {
  try {
    const monthlyRevenue = await Customer.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      success: true,
      data: monthlyRevenue,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get communication analytics
// @route   GET /api/analytics/communications
// @access  Public
exports.getCommunicationAnalytics = async (req, res, next) => {
  try {
    // Total communications
    const totalCommunications = await Communication.countDocuments();

    // Communication type distribution
    const typeDistribution = await Communication.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Communication status distribution
    const statusDistribution = await Communication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent communications (last 5)
    const recentCommunications = await Communication.find()
      .populate('customerId', 'name email')
      .sort('-date')
      .limit(5)
      .select('type status priority notes date customerId');

    res.status(200).json({
      success: true,
      data: {
        totalCommunications,
        typeDistribution,
        statusDistribution,
        recentCommunications,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get top customers
// @route   GET /api/analytics/top-customers
// @access  Public
exports.getTopCustomers = async (req, res, next) => {
  try {
    const topCustomers = await Customer.find()
      .sort('-value')
      .limit(5)
      .select('name email value status');

    res.status(200).json({
      success: true,
      data: topCustomers,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Get filtered analytics with date range
// @route   GET /api/analytics/filtered
// @access  Private
exports.getFilteredAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const dateFilter = { createdAt: { $gte: start, $lte: end } };
    const commDateFilter = { date: { $gte: start, $lte: end } };

    // Current period metrics
    const [customers, revenue, comms, monthlyRev] = await Promise.all([
      Customer.countDocuments(dateFilter),
      Customer.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      Communication.countDocuments(commDateFilter),
      Customer.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            totalRevenue: { $sum: '$value' },
            count: { $sum: 1 },
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const result = {
      customers,
      revenue: revenue[0]?.total || 0,
      communications: comms,
      monthlyRevenue: monthlyRev,
    };

    // Comparison period if provided
    if (compareStartDate && compareEndDate) {
      const compStart = new Date(compareStartDate);
      const compEnd = new Date(compareEndDate);
      compEnd.setHours(23, 59, 59, 999);

      const compDateFilter = { createdAt: { $gte: compStart, $lte: compEnd } };
      const compCommDateFilter = { date: { $gte: compStart, $lte: compEnd } };

      const [compCustomers, compRevenue, compComms] = await Promise.all([
        Customer.countDocuments(compDateFilter),
        Customer.aggregate([
          { $match: compDateFilter },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]),
        Communication.countDocuments(compCommDateFilter),
      ]);

      result.comparison = {
        customers: compCustomers,
        revenue: compRevenue[0]?.total || 0,
        communications: compComms,
      };

      // Calculate deltas
      const calcDelta = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
      result.deltas = {
        customers: calcDelta(result.customers, result.comparison.customers),
        revenue: calcDelta(result.revenue, result.comparison.revenue),
        communications: calcDelta(result.communications, result.comparison.communications),
      };
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};