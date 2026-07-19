const { query } = require('../config/database');
const pdfService = require('../services/pdf.service');
const XLSX = require('xlsx');

const getDateRange = (type) => {
  const now = new Date();
  let start;
  if (type === 'daily') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (type === 'weekly') start = new Date(now - 7 * 86400000);
  else if (type === 'monthly') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else start = new Date(now.getFullYear(), 0, 1);
  return { start: start.toISOString(), end: now.toISOString() };
};

exports.getReport = async (req, res) => {
  try {
    const { type = 'monthly' } = req.query;
    const { start, end } = getDateRange(type);

    const [revenue, appointments, topServices, topCustomers] = await Promise.all([
      query(`
        SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count,
               method, DATE(created_at) as date
        FROM payments WHERE status='success' AND created_at BETWEEN $1 AND $2
        GROUP BY method, DATE(created_at) ORDER BY date
      `, [start, end]),
      query(`
        SELECT status, COUNT(*) as count FROM appointments
        WHERE created_at BETWEEN $1 AND $2 GROUP BY status
      `, [start, end]),
      query(`
        SELECT s.name, COUNT(a.id) as bookings, COALESCE(SUM(p.amount),0) as revenue
        FROM services s
        LEFT JOIN appointments a ON a.service_id = s.id AND a.created_at BETWEEN $1 AND $2
        LEFT JOIN payments p ON p.appointment_id = a.id AND p.status='success'
        GROUP BY s.id, s.name ORDER BY bookings DESC LIMIT 10
      `, [start, end]),
      query(`
        SELECT u.name, u.email, COUNT(a.id) as visits, COALESCE(SUM(p.amount),0) as spent
        FROM users u
        LEFT JOIN appointments a ON a.customer_id = u.id AND a.created_at BETWEEN $1 AND $2
        LEFT JOIN payments p ON p.appointment_id = a.id AND p.status='success'
        WHERE u.role='customer'
        GROUP BY u.id, u.name, u.email ORDER BY spent DESC LIMIT 10
      `, [start, end]),
    ]);

    res.json({
      success: true,
      data: {
        period: { type, start, end },
        revenue: revenue.rows,
        appointments: appointments.rows,
        top_services: topServices.rows,
        top_customers: topCustomers.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { type = 'monthly' } = req.query;
    const { start, end } = getDateRange(type);

    const result = await query(`
      SELECT p.reference, u.name as customer, s.name as service,
             p.amount, p.method, p.status, p.created_at
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE p.created_at BETWEEN $1 AND $2
      ORDER BY p.created_at DESC
    `, [start, end]);

    const pdf = await pdfService.generateReport(
      `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      result.rows.map(r => ({
        ...r,
        amount: `₦${Number(r.amount).toLocaleString()}`,
        created_at: new Date(r.created_at).toLocaleDateString(),
      })),
      [
        { header: 'Reference', key: 'reference' },
        { header: 'Customer', key: 'customer' },
        { header: 'Service', key: 'service' },
        { header: 'Amount', key: 'amount' },
        { header: 'Method', key: 'method' },
        { header: 'Status', key: 'status' },
        { header: 'Date', key: 'created_at' },
      ]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { type = 'monthly' } = req.query;
    const { start, end } = getDateRange(type);

    const result = await query(`
      SELECT p.reference, u.name as customer, u.email, s.name as service,
             p.amount, p.method, p.status, p.created_at
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE p.created_at BETWEEN $1 AND $2
      ORDER BY p.created_at DESC
    `, [start, end]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows.map(r => ({
      Reference: r.reference,
      Customer: r.customer,
      Email: r.email,
      Service: r.service,
      Amount: r.amount,
      Method: r.method,
      Status: r.status,
      Date: new Date(r.created_at).toLocaleDateString(),
    })));
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
