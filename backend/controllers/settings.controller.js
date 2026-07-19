const { query } = require('../config/database');

exports.getSettings = async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(({ key, value }) => { settings[key] = value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        [key, value]
      );
    }
    if (req.file) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
        ['salon_logo', req.file.path]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
