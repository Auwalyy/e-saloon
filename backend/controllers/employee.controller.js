const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const { paginate } = require('../utils/helpers');

exports.getEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let conditions = ['e.is_active = true'];
    let params = [];
    if (search) { conditions.push(`(u.name ILIKE $1 OR e.specialization ILIKE $1)`); params.push(`%${search}%`); }

    const result = await query(`
      SELECT e.*, u.name, u.email, u.phone, u.avatar,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count,
             COUNT(DISTINCT a.id) as total_appointments
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN reviews r ON r.employee_id = e.id AND r.is_approved = true
      LEFT JOIN appointments a ON a.employee_id = e.id AND a.status = 'completed'
      WHERE ${conditions.join(' AND ')}
      GROUP BY e.id, u.name, u.email, u.phone, u.avatar
      ORDER BY u.name
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.name, u.email, u.phone, u.avatar,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN reviews r ON r.employee_id = e.id AND r.is_approved = true
      WHERE e.id = $1
      GROUP BY e.id, u.name, u.email, u.phone, u.avatar
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Employee not found' });

    const availability = await query(
      'SELECT * FROM availability WHERE employee_id = $1 ORDER BY day_of_week',
      [req.params.id]
    );

    const services = await query(`
      SELECT s.id, s.name, s.price FROM employee_services es
      JOIN services s ON es.service_id = s.id
      WHERE es.employee_id = $1
    `, [req.params.id]);

    res.json({ success: true, data: { ...result.rows[0], availability: availability.rows, services: services.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, experience_years, bio, service_ids } = req.body;
    const avatar = req.file?.path || null;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) return res.status(400).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password || 'Employee@123', 12);
    const userRes = await query(
      'INSERT INTO users (name, email, phone, password, role, avatar) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [name, email, phone, hashed, 'employee', avatar]
    );

    const empRes = await query(
      'INSERT INTO employees (user_id, specialization, experience_years, bio) VALUES ($1,$2,$3,$4) RETURNING *',
      [userRes.rows[0].id, specialization, experience_years || 0, bio]
    );

    if (service_ids?.length) {
      for (const sid of service_ids) {
        await query('INSERT INTO employee_services (employee_id, service_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [empRes.rows[0].id, sid]);
      }
    }

    res.status(201).json({ success: true, data: empRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { name, phone, specialization, experience_years, bio, is_active, service_ids } = req.body;
    const avatar = req.file?.path;

    const empRes = await query('SELECT user_id FROM employees WHERE id = $1', [req.params.id]);
    if (!empRes.rows[0]) return res.status(404).json({ success: false, message: 'Employee not found' });

    if (name || phone || avatar) {
      await query(
        'UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), avatar=COALESCE($3,avatar) WHERE id=$4',
        [name, phone, avatar, empRes.rows[0].user_id]
      );
    }

    const result = await query(`
      UPDATE employees SET
        specialization = COALESCE($1, specialization),
        experience_years = COALESCE($2, experience_years),
        bio = COALESCE($3, bio),
        is_active = COALESCE($4, is_active)
      WHERE id = $5 RETURNING *
    `, [specialization, experience_years, bio, is_active, req.params.id]);

    if (service_ids) {
      await query('DELETE FROM employee_services WHERE employee_id = $1', [req.params.id]);
      for (const sid of service_ids) {
        await query('INSERT INTO employee_services (employee_id, service_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, sid]);
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await query('UPDATE employees SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body; // [{ day_of_week, start_time, end_time, is_available }]
    await query('DELETE FROM availability WHERE employee_id = $1', [req.params.id]);
    for (const slot of availability) {
      await query(
        'INSERT INTO availability (employee_id, day_of_week, start_time, end_time, is_available) VALUES ($1,$2,$3,$4,$5)',
        [req.params.id, slot.day_of_week, slot.start_time, slot.end_time, slot.is_available !== false]
      );
    }
    res.json({ success: true, message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployeesByService = async (req, res) => {
  try {
    const result = await query(`
      SELECT e.id, u.name, u.avatar, e.specialization, e.experience_years,
             COALESCE(AVG(r.rating), 0) as avg_rating
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN employee_services es ON es.employee_id = e.id
      LEFT JOIN reviews r ON r.employee_id = e.id AND r.is_approved = true
      WHERE es.service_id = $1 AND e.is_active = true
      GROUP BY e.id, u.name, u.avatar, e.specialization, e.experience_years
    `, [req.params.serviceId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
