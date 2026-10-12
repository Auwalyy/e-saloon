/**
 * Reporting and analytics queries (used by the dashboard, the reports page
 * and the PDF / Excel exports).
 */
const ExcelJS = require('exceljs');
const { Appointment, Payment, User, StockTransaction, Setting } = require('../models');
const { periodRange, addDays } = require('../utils/time');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Revenue grouped by local day ("%Y-%m-%d") or month ("%Y-%m"). */
const revenueByBucket = async (start, end, format, timezone) => {
  const rows = await Payment.aggregate([
    { $match: { status: 'success', paidAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$paidAt', timezone } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((row) => [row._id, row]));
};

/** Continuous series (zero-filled) so charts never have gaps. */
const buildRevenueSeries = async (range, timezone) => {
  if (range.period === 'annual') {
    const buckets = await revenueByBucket(range.start, range.end, '%Y-%m', timezone);
    const year = range.fromDate.slice(0, 4);
    return MONTHS.map((label, index) => {
      const key = `${year}-${String(index + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      return { key, label: `${label} ${year}`, revenue: bucket ? bucket.revenue : 0, count: bucket ? bucket.count : 0 };
    });
  }
  const buckets = await revenueByBucket(range.start, range.end, '%Y-%m-%d', timezone);
  const series = [];
  for (let date = range.fromDate; date <= range.toDate; date = addDays(date, 1)) {
    const bucket = buckets.get(date);
    series.push({ key: date, label: date, revenue: bucket ? bucket.revenue : 0, count: bucket ? bucket.count : 0 });
  }
  return series;
};

const topByField = async (field, collection, start, end, limit = 10) =>
  Appointment.aggregate([
    { $match: { startAt: { $gte: start, $lt: end }, status: { $in: ['pending', 'confirmed', 'completed'] } } },
    { $group: { _id: `$${field}`, bookings: { $sum: 1 }, value: { $sum: '$price' } } },
    { $sort: { bookings: -1, value: -1 } },
    { $limit: limit },
    { $lookup: { from: collection, localField: '_id', foreignField: '_id', as: 'doc' } },
    { $project: { _id: 0, id: '$_id', name: { $ifNull: [{ $first: '$doc.name' }, 'Removed'] }, bookings: 1, value: 1 } },
  ]);

/** Full report for a period. Bookings are attributed by appointment date, revenue by payment date. */
const buildReport = async (period, date) => {
  const settings = await Setting.getMain();
  const range = periodRange(period, date, settings.timezone);
  const { start, end } = range;

  const [statusRows, paymentRows, newCustomers, stockRows, revenueSeries, topServices, topStylists, payments] =
    await Promise.all([
      Appointment.aggregate([
        { $match: { startAt: { $gte: start, $lt: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success', paidAt: { $gte: start, $lt: end } } },
        { $group: { _id: '$method', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
        { $sort: { amount: -1 } },
      ]),
      User.countDocuments({ role: 'customer', createdAt: { $gte: start, $lt: end } }),
      StockTransaction.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, type: { $in: ['purchase', 'sale'] } } },
        { $group: { _id: '$type', total: { $sum: '$total' } } },
      ]),
      buildRevenueSeries(range, settings.timezone),
      topByField('service', 'services', start, end),
      topByField('employee', 'employees', start, end),
      Payment.find({ status: 'success', paidAt: { $gte: start, $lt: end } })
        .sort('paidAt')
        .populate('customer', 'name email')
        .populate({ path: 'appointment', select: 'reference date startTime service', populate: { path: 'service', select: 'name' } })
        .limit(2000),
    ]);

  const statusCount = (status) => (statusRows.find((row) => row._id === status) || { count: 0 }).count;
  const stockTotal = (type) => (stockRows.find((row) => row._id === type) || { total: 0 }).total;
  const revenue = paymentRows.reduce((sum, row) => sum + row.amount, 0);
  const paymentsCount = paymentRows.reduce((sum, row) => sum + row.count, 0);

  return {
    range: { period: range.period, fromDate: range.fromDate, toDate: range.toDate },
    summary: {
      revenue,
      paymentsCount,
      averagePayment: paymentsCount ? revenue / paymentsCount : 0,
      bookings: statusRows.reduce((sum, row) => sum + row.count, 0),
      pending: statusCount('pending'),
      confirmed: statusCount('confirmed'),
      completed: statusCount('completed'),
      cancelled: statusCount('cancelled'),
      rejected: statusCount('rejected'),
      noShow: statusCount('no_show'),
      newCustomers,
      productSales: stockTotal('sale'),
      stockPurchases: stockTotal('purchase'),
    },
    revenueSeries,
    topServices,
    topStylists,
    paymentMethods: paymentRows.map((row) => ({ method: row._id, count: row.count, amount: row.amount })),
    payments,
    settings,
  };
};

/** Excel workbook version of a report. Resolves to a Buffer. */
const generateReportExcel = async (report) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = report.settings.businessName;
  workbook.created = new Date();

  const styleHeader = (sheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } };
    header.alignment = { vertical: 'middle' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  };
  const moneyFormat = '#,##0.00';
  const s = report.summary;

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [{ header: 'Metric', key: 'metric', width: 34 }, { header: 'Value', key: 'value', width: 22 }];
  summary.addRows([
    { metric: 'Report period', value: report.range.period },
    { metric: 'From', value: report.range.fromDate },
    { metric: 'To', value: report.range.toDate },
    { metric: 'Total revenue', value: s.revenue },
    { metric: 'Payments received', value: s.paymentsCount },
    { metric: 'Average payment', value: s.averagePayment },
    { metric: 'Total bookings', value: s.bookings },
    { metric: 'Completed', value: s.completed },
    { metric: 'Pending', value: s.pending },
    { metric: 'Confirmed', value: s.confirmed },
    { metric: 'Cancelled', value: s.cancelled },
    { metric: 'Rejected', value: s.rejected },
    { metric: 'No-shows', value: s.noShow },
    { metric: 'New customers', value: s.newCustomers },
    { metric: 'Retail sales', value: s.productSales },
    { metric: 'Stock purchases', value: s.stockPurchases },
  ]);
  [5, 7, 16, 17].forEach((row) => { summary.getCell(`B${row}`).numFmt = moneyFormat; });
  styleHeader(summary);

  const revenue = workbook.addWorksheet('Revenue');
  revenue.columns = [
    { header: 'Period', key: 'label', width: 18 },
    { header: 'Payments', key: 'count', width: 12 },
    { header: 'Revenue', key: 'revenue', width: 18, style: { numFmt: moneyFormat } },
  ];
  revenue.addRows(report.revenueSeries);
  styleHeader(revenue);

  const addRanking = (name, firstColumn, rows) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = [
      { header: firstColumn, key: 'name', width: 34 },
      { header: 'Bookings', key: 'bookings', width: 12 },
      { header: 'Value', key: 'value', width: 18, style: { numFmt: moneyFormat } },
    ];
    sheet.addRows(rows);
    styleHeader(sheet);
  };
  addRanking('Top Services', 'Service', report.topServices);
  addRanking('Stylists', 'Stylist', report.topStylists);

  const payments = workbook.addWorksheet('Payments');
  payments.columns = [
    { header: 'Payment ID', key: 'reference', width: 24 },
    { header: 'Receipt No.', key: 'receipt', width: 24 },
    { header: 'Paid at', key: 'paidAt', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm' } },
    { header: 'Customer', key: 'customer', width: 26 },
    { header: 'Service', key: 'service', width: 28 },
    { header: 'Appointment', key: 'appointment', width: 24 },
    { header: 'Method', key: 'method', width: 16 },
    { header: 'Amount', key: 'amount', width: 16, style: { numFmt: moneyFormat } },
  ];
  payments.addRows(report.payments.map((payment) => ({
    reference: payment.reference,
    receipt: payment.receiptNumber,
    paidAt: payment.paidAt,
    customer: payment.customer ? payment.customer.name : '-',
    service: payment.appointment && payment.appointment.service ? payment.appointment.service.name : '-',
    appointment: payment.appointment ? payment.appointment.reference : '-',
    method: payment.method,
    amount: payment.amount,
  })));
  styleHeader(payments);

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

module.exports = { buildReport, generateReportExcel, buildRevenueSeries, topByField, MONTHS };
