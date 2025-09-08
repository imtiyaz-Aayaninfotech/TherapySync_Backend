const User = require('../models/user.model');
const Category = require('../models/category.model');
const TherapySchedule = require('../models/therapySchedule.model');
const Payment = require('../models/Payment.model');
const mongoose = require('mongoose');

// Helper function for date ranges
const getDateRange = (period) => {
  const now = new Date();
  let start, end;
  if (period === 'week') {
    start = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
    end = new Date(now.setDate(start.getDate() + 6)); // Saturday
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1); // first day month
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day month
  }
  return { start, end };
};

module.exports = {

  // 1. Client Statistics API
  async getClientStats(req, res) {
    try {
      const totalClients = await User.countDocuments();

      const { start: weekStart, end: weekEnd } = getDateRange('week');
      const newClientsWeek = await User.countDocuments({
        createdAt: { $gte: weekStart, $lte: weekEnd },
      });

      const { start: monthStart, end: monthEnd } = getDateRange('month');
      const newClientsMonth = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd },
      });

      // Define active clients as those with at least 1 scheduled or completed therapy in last 30 days
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const activeClients = await TherapySchedule.distinct('user', {
        status: { $in: ['scheduled', 'completed'] },
        updatedAt: { $gte: last30Days },
      });

      res.json({
        totalClients,
        newClientsWeek,
        newClientsMonth,
        activeClientsCount: activeClients.length,
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching client stats' });
    }
  },

  // 2. Session Types API
  async getSessionTypes(req, res) {
    try {
      // Count therapy schedules by Category type
      // Join TherapySchedule with Category to get type/category

      const sessionCounts = await TherapySchedule.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.category',
            count: { $sum: 1 },
          },
        },
      ]);

      // Format results with label and count
      const counts = {
        'Individual Therapy': 0,
        'Couples Therapy': 0,
        'Executive Coaching': 0,
      };
      sessionCounts.forEach((item) => {
        counts[item._id] = item.count;
      });

      res.json(counts);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching session types' });
    }
  },

  // 3. Session Trends API (weekly counts of sessions)
  async getSessionTrends(req, res) {
    try {
      // Get date 4 weeks ago
      const now = new Date();
      const weeksAgo = new Date(now);
      weeksAgo.setDate(now.getDate() - 28);

      // Get sessions scheduled in last 4 weeks grouped by week number
      const sessions = await TherapySchedule.aggregate([
        { $match: { createdAt: { $gte: weeksAgo } } },
        {
          $project: {
            week: {
              $isoWeek: '$createdAt',
            },
          },
        },
        {
          $group: {
            _id: '$week',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Format to an array for frontend
      const result = sessions.map((item, idx) => ({
        week: `Week ${idx + 1}`,
        sessions: item.count,
      }));

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching session trends' });
    }
  },

  // 4. Finance Summary API
  async getFinanceSummary(req, res) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Total revenue (paid payments this month)
      const revenueAggregation = await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
          },
        },
      ]);
      const totalRevenue = revenueAggregation.length ? revenueAggregation[0].totalRevenue : 0;

      // Pending payments count and sum
      const pendingAggregation = await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'pending',
          },
        },
        {
          $group: {
            _id: null,
            totalPending: { $sum: '$price' },
            count: { $sum: 1 },
          },
        },
      ]);
      const pendingPayments = pendingAggregation.length ? pendingAggregation[0].totalPending : 0;

      // Common payment methods used in paid payments this month
      const methodsAggregation = await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
      const commonMethods = methodsAggregation.map((item) => item._id);

      res.json({
        totalRevenue,
        pendingPayments,
        commonPaymentMethods: commonMethods.join(', ') || 'None',
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching finance summary' });
    }
  },

  // 5. Finance Trends API (weekly revenue)
  async getFinanceTrends(req, res) {
    try {
      // Last 4 weeks
      const now = new Date();
      const last4Weeks = new Date(now);
      last4Weeks.setDate(now.getDate() - 28);

      // Aggregate revenue by week number (isoWeek)
      const revenues = await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: last4Weeks },
          },
        },
        {
          $project: {
            week: { $isoWeek: '$createdAt' },
            price: 1,
          },
        },
        {
          $group: {
            _id: '$week',
            revenue: { $sum: '$price' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Format data for frontend bar chart
      const data = revenues.map((item, idx) => ({
        name: `Week ${idx + 1}`,
        revenue: item.revenue,
      }));

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching finance trends' });
    }
  },
};
