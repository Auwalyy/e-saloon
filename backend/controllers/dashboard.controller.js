const { query } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const firstOfWeek = new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split('T')[0];

    const [
      todayRevenue, monthRevenue, weekRevenue,
      totalCustomers, totalEmployees, totalBookings,
      pending, completed, cancelled,
      revenueChart, bookingStats, popularServices, customerGrowth,
    ] = await Promise.all([
      query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success' AND DATE(created_at)=$1`, [today]),
      query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success' AND created_at >= $1`, [firstOfMonth]),
      query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success' AND created_at >= $1`, [firstOfWeek]),
      query(`SELECT COUNT(*) FROM users WHERE role='customer' AND is_active=true`),
      query(`SELECT COUNT(*) FROM employees WHERE is_active=true`),
      query(`SELECT COUNT(*) FROM appointments`),
      query(`SELECT COUNT(*) FROM appointments WHERE status='pending'`),
      query(`SELECT COUNT(*) FROM appointments WHERE status='completed'`),
      query(`SELECT COUNT(*) FROM appointments WHERE status='cancelled'`),
      // Revenue last 7 days
      query(`
        SELECT DATE(created_at) as date, COALESCE(SUM(amount),0) as revenue
        FROM payments WHERE status='success' AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `),
      // Bookings by status
      query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`),
      // Popular services
      query(`
        SELECT s.name, COUNT(a.id) as bookings, COALESCE(SUM(p.amount),0) as revenue
        FROM services s
        LEFT JOIN appointments a ON a.service_id = s.id
        LEFT JOIN payments p ON p.appointment_id = a.id AND p.status='success'
        GROUP BY s.id, s.name ORDER BY bookings DESC LIMIT 5
      `),
      // Customer growth last 6 months
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
               COUNT(*) as count
        FROM users WHERE role='customer'
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          today_revenue: parseFloat(todayRevenue.rows[0].total),
          month_revenue: parseFloat(monthRevenue.rows[0].total),
          week_revenue: parseFloat(weekRevenue.rows[0].total),
          total_customers: parseInt(totalCustomers.rows[0].count),
          total_employees: parseInt(totalEmployees.rows[0].count),
          total_bookings: parseInt(totalBookings.rows[0].count),
          pending_appointments: parseInt(pending.rows[0].count),
          completed_appointments: parseInt(completed.rows[0].count),
          cancelled_appointments: parseInt(cancelled.rows[0].count),
        },
        charts: {
          revenue: revenueChart.rows,
          bookings: bookingStats.rows,
          popular_services: popularServices.rows,
          customer_growth: customerGrowth.rows,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const appointments = await query(`
      SELECT a.id, a.status, a.appointment_date, a.start_time,
             u.name as customer_name, s.name as service_name
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC LIMIT 10
    `);

    const payments = await query(`
      SELECT p.id, p.amount, p.method, p.status, p.created_at,
             u.name as customer_name
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      ORDER BY p.created_at DESC LIMIT 10
    `);

    res.json({ success: true, data: { appointments: appointments.rows, payments: payments.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
