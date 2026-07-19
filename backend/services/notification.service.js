const { query } = require('../config/database');

exports.create = async (userId, title, message, type = 'info') => {
  try {
    await query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)',
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.notifyAdmins = async (title, message, type = 'info') => {
  try {
    const admins = await query("SELECT id FROM users WHERE role='admin'");
    for (const admin of admins.rows) {
      await exports.create(admin.id, title, message, type);
    }
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
};
