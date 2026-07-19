const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

exports.getServices = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { category_id, search, sort = 'created_at', order = 'DESC', featured } = req.query;

    let conditions = ['s.is_active = true'];
    let params = [];
    let idx = 1;

    if (category_id) { conditions.push(`s.category_id = $${idx++}`); params.push(category_id); }
    if (search) { conditions.push(`(s.name ILIKE $${idx} OR s.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (featured === 'true') { conditions.push(`s.is_featured = true`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const validSorts = { name: 's.name', price: 's.price', duration: 's.duration', created_at: 's.created_at' };
    const sortCol = validSorts[sort] || 's.created_at';

    const countRes = await query(`SELECT COUNT(*) FROM services s ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT s.*, c.name as category_name,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON r.service_id = s.id AND r.is_approved = true
      ${where}
      GROUP BY s.id, c.name
      ORDER BY ${sortCol} ${order === 'ASC' ? 'ASC' : 'DESC'}
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

exports.getService = async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, c.name as category_name,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON r.service_id = s.id AND r.is_approved = true
      WHERE s.id = $1
      GROUP BY s.id, c.name
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, description, category_id, price, duration, is_featured } = req.body;
    const image = req.file?.path || null;
    const result = await query(`
      INSERT INTO services (name, description, category_id, price, duration, image, is_featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [name, description, category_id, price, duration, image, is_featured || false]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { name, description, category_id, price, duration, is_active, is_featured } = req.body;
    const image = req.file?.path;
    const result = await query(`
      UPDATE services SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        price = COALESCE($4, price),
        duration = COALESCE($5, duration),
        image = COALESCE($6, image),
        is_active = COALESCE($7, is_active),
        is_featured = COALESCE($8, is_featured)
      WHERE id = $9 RETURNING *
    `, [name, description, category_id, price, duration, image, is_active, is_featured, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await query('UPDATE services SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Service deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
