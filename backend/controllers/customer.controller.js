const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

exports.getCustomers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search } = req.query;
    let conditions = ["u.role = 'customer'"];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) FROM users u ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
             c.total_visits, c.total_spent, c.gender,
             COUNT(DISTINCT a.id) as appointment_count
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      LEFT JOIN appointments a ON a.customer_id = u.id
      ${where}
      GROUP BY u.id, c.total_visits, c.total_spent, c.gender
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total: parseInt(countRes.rows[0].count), pages: Math.ceil(countRes.rows[0].count / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar, u.is_active, u.created_at,
             c.total_visits, c.total_spent, c.gender, c.date_of_birth, c.address, c.notes
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      WHERE u.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Customer not found' });

    const appointments = await query(`
      SELECT a.*, s.name as service_name, eu.name as stylist_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      WHERE a.customer_id = $1
      ORDER BY a.appointment_date DESC LIMIT 10
    `, [req.params.id]);

    res.json({ success: true, data: { ...result.rows[0], recent_appointments: appointments.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleCustomerStatus = async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
