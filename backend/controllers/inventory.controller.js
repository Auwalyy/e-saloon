const { query } = require('../config/database');
const { paginate } = require('../utils/helpers');

exports.getInventory = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, low_stock } = req.query;
    let conditions = ['is_active = true'];
    let params = [];
    let idx = 1;

    if (search) { conditions.push(`(name ILIKE $${idx} OR supplier ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (low_stock === 'true') { conditions.push(`quantity <= reorder_level`); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countRes = await query(`SELECT COUNT(*) FROM inventory ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT * FROM inventory ${where}
      ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}
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

exports.createInventoryItem = async (req, res) => {
  try {
    const { name, description, category, quantity, unit, cost_price, selling_price, reorder_level, supplier, supplier_contact } = req.body;
    const image = req.file?.path || null;
    const result = await query(`
      INSERT INTO inventory (name, description, category, quantity, unit, cost_price, selling_price, reorder_level, supplier, supplier_contact, image)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [name, description, category, quantity || 0, unit, cost_price, selling_price, reorder_level || 5, supplier, supplier_contact, image]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { name, description, category, quantity, unit, cost_price, selling_price, reorder_level, supplier, supplier_contact } = req.body;
    const image = req.file?.path;
    const result = await query(`
      UPDATE inventory SET
        name=COALESCE($1,name), description=COALESCE($2,description), category=COALESCE($3,category),
        quantity=COALESCE($4,quantity), unit=COALESCE($5,unit), cost_price=COALESCE($6,cost_price),
        selling_price=COALESCE($7,selling_price), reorder_level=COALESCE($8,reorder_level),
        supplier=COALESCE($9,supplier), supplier_contact=COALESCE($10,supplier_contact),
        image=COALESCE($11,image)
      WHERE id=$12 RETURNING *
    `, [name, description, category, quantity, unit, cost_price, selling_price, reorder_level, supplier, supplier_contact, image, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    await query('UPDATE inventory SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { type, quantity, unit_price, notes } = req.body;
    const total_price = quantity * (unit_price || 0);

    const result = await query(`
      INSERT INTO inventory_transactions (inventory_id, type, quantity, unit_price, total_price, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.params.id, type, quantity, unit_price, total_price, notes, req.user.id]);

    const delta = ['purchase', 'return'].includes(type) ? quantity : -quantity;
    await query('UPDATE inventory SET quantity = quantity + $1 WHERE id = $2', [delta, req.params.id]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM inventory WHERE quantity <= reorder_level AND is_active = true ORDER BY quantity ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
