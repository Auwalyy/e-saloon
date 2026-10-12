/**
 * Admin dashboard: headline numbers and chart data.
 */
const { Appointment, Payment, User, Employee, InventoryItem, Setting } = require('../models');
const { asyncHandler } = require('../utils/helpers');
const { periodRange, nowInZone, addDays, zonedToUtc } = require('../utils/time');
const reportService = require('../services/report.service');

const revenueBetween = async (start, end) => {
  const [row] = await Payment.aggregate([
    { $match: { status: 'success', paidAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row ? row.total : 0;
};

exports.getDashboard = asyncHandler(async (req, res) => {
  const { timezone } = await Setting.getMain();
  const today = nowInZone(timezone).date;
  const day = periodRange('daily', today, timezone);
  const week = periodRange('weekly', today, timezone);
  const month = periodRange('monthly', today, timezone);
  const lastMonth = periodRange('monthly', addDays(month.fromDate, -1), timezone);

  // Trailing windows for the charts.
  const last30 = { period: 'daily', fromDate: addDays(today, -29), toDate: today };
  last30.start = zonedToUtc(last30.fromDate, '00:00', timezone);
  last30.end = day.end;

  // The last 12 calendar months, oldest first (e.g. ["2025-11", ..., "2026-10"]).
  const months = [];
  let cursor = month.fromDate;
  for (let i = 0; i < 12; i += 1) {
    months.unshift(cursor.slice(0, 7));
    cursor = `${addDays(cursor, -1).slice(0, 7)}-01`;
  }
  const twelveMonthsAgo = zonedToUtc(`${months[0]}-01`, '00:00', timezone);

  const [
    todayRevenue, weekRevenue, monthRevenue, lastMonthRevenue,
    totalCustomers, totalEmployees, statusRows, todayAppointments,
    revenueSeries, popularServices, customerGrowthRows, bookingTrendRows,
    upcoming, lowStockCount, outstanding,
  ] = await Promise.all([
    revenueBetween(day.start, day.end),
    revenueBetween(week.start, week.end),
    revenueBetween(month.start, month.end),
    // Compare like with like: last month up to the same point in the month.
    revenueBetween(lastMonth.start, new Date(Math.min(lastMonth.end.getTime(), lastMonth.start.getTime() + (Date.now() - month.start.getTime())))),
    User.countDocuments({ role: 'customer' }),
    Employee.countDocuments({ isActive: true }),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.countDocuments({ date: today, status: { $in: ['pending', 'confirmed', 'completed'] } }),
    reportService.buildRevenueSeries(last30, timezone),
    reportService.topByField('service', 'services', new Date(0), new Date('2999-01-01'), 6),
    User.aggregate([
      { $match: { role: 'customer', createdAt: { $gte: twelveMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone } }, count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { startAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$startAt', timezone } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'rejected', 'no_show']] }, 1, 0] } },
        },
      },
    ]),
    Appointment.find({ status: { $in: Appointment.ACTIVE_STATUSES }, startAt: { $gte: new Date() } })
      .sort('startAt').limit(6)
      .populate('customer', 'name avatar').populate('service', 'name').populate('employee', 'name'),
    InventoryItem.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
    Payment.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const statusCount = (status) => (statusRows.find((row) => row._id === status) || { count: 0 }).count;

  const monthLabel = (key) => `${reportService.MONTHS[Number(key.slice(5)) - 1]} ${key.slice(2, 4)}`;
  const growthByMonth = new Map(customerGrowthRows.map((row) => [row._id, row.count]));
  const trendByMonth = new Map(bookingTrendRows.map((row) => [row._id, row]));

  const totalBeforeWindow = totalCustomers - customerGrowthRows.reduce((sum, row) => sum + row.count, 0);
  let runningTotal = totalBeforeWindow;

  res.json({
    success: true,
    data: {
      stats: {
        todayRevenue,
        weekRevenue,
        monthRevenue,
        monthRevenueChange: lastMonthRevenue ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null,
        outstandingPayments: outstanding[0] ? outstanding[0].total : 0,
        totalCustomers,
        totalEmployees,
        totalBookings: statusRows.reduce((sum, row) => sum + row.count, 0),
        todayAppointments,
        pendingAppointments: statusCount('pending'),
        confirmedAppointments: statusCount('confirmed'),
        completedAppointments: statusCount('completed'),
        cancelledAppointments: statusCount('cancelled') + statusCount('rejected'),
        noShowAppointments: statusCount('no_show'),
        lowStockCount,
      },
      charts: {
        revenue: revenueSeries.map((point) => ({ date: point.key, revenue: point.revenue, payments: point.count })),
        bookingStatus: [
          { status: 'Pending', count: statusCount('pending') },
          { status: 'Confirmed', count: statusCount('confirmed') },
          { status: 'Completed', count: statusCount('completed') },
          { status: 'Cancelled', count: statusCount('cancelled') + statusCount('rejected') },
          { status: 'No-show', count: statusCount('no_show') },
        ],
        bookingTrend: months.map((key) => {
          const row = trendByMonth.get(key) || { total: 0, completed: 0, cancelled: 0 };
          return { month: monthLabel(key), total: row.total, completed: row.completed, cancelled: row.cancelled };
        }),
        customerGrowth: months.map((key) => {
          const added = growthByMonth.get(key) || 0;
          runningTotal += added;
          return { month: monthLabel(key), newCustomers: added, totalCustomers: runningTotal };
        }),
        popularServices,
      },
      upcomingAppointments: upcoming,
    },
  });
});
