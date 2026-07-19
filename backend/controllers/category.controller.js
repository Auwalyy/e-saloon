const { query } = require('../config/database');

exports.getCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(s.id) as service_count
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND s.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id ORDER BY c.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file?.path || null;
    const result = await query(
      'INSERT INTO categories (name, description, image) VALUES ($1,$2,$3) RETURNING *',
      [name, description, image]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const image = req.file?.path;
    const result = await query(`
      UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        image = COALESCE($3, image),
        is_active = COALESCE($4, is_active)
      WHERE id = $5 RETURNING *
    `, [name, description, image, is_active, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await query('UPDATE categories SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
