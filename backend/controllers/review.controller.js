const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

exports.getReviews = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { service_id, employee_id, approved } = req.query;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (service_id) { conditions.push(`r.service_id = $${idx++}`); params.push(service_id); }
    if (employee_id) { conditions.push(`r.employee_id = $${idx++}`); params.push(employee_id); }
    if (approved !== undefined) { conditions.push(`r.is_approved = $${idx++}`); params.push(approved === 'true'); }
    else if (req.user?.role !== 'admin') { conditions.push(`r.is_approved = true`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM reviews r ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT r.*, u.name as customer_name, u.avatar as customer_avatar,
             s.name as service_name, eu.name as stylist_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      LEFT JOIN services s ON r.service_id = s.id
      LEFT JOIN employees e ON r.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      ${where}
      ORDER BY r.created_at DESC
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

exports.createReview = async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;

    const apptRes = await query(
      "SELECT * FROM appointments WHERE id=$1 AND customer_id=$2 AND status='completed'",
      [appointment_id, req.user.id]
    );
    if (!apptRes.rows[0]) {
      return res.status(400).json({ success: false, message: 'Can only review completed appointments' });
    }

    const existing = await query('SELECT id FROM reviews WHERE appointment_id=$1', [appointment_id]);
    if (existing.rows[0]) return res.status(400).json({ success: false, message: 'Already reviewed this appointment' });

    const appt = apptRes.rows[0];
    const result = await query(`
      INSERT INTO reviews (customer_id, employee_id, service_id, appointment_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.user.id, appt.employee_id, appt.service_id, appointment_id, rating, comment]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const result = await query(
      'UPDATE reviews SET is_approved = NOT is_approved WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
