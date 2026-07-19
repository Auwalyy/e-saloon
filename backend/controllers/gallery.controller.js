const { query } = require('../config/database');

exports.getGallery = async (req, res) => {
  try {
    const { category } = req.query;
    let conditions = [];
    let params = [];
    if (category && category !== 'all') { conditions.push(`category = $1`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM gallery ${where} ORDER BY created_at DESC`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addGalleryImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    const { title, category, is_featured } = req.body;
    const result = await query(
      'INSERT INTO gallery (title, image_url, category, is_featured) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, req.file.path, category || 'other', is_featured === 'true']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    await query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
