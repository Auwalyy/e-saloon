const { query } = require('../config/database');
const paymentService = require('../services/payment.service');
const emailService = require('../services/email.service');
const pdfService = require('../services/pdf.service');
const { generateReference, paginate } = require('../utils/helpers');

exports.getPayments = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status, method, search } = req.query;
    const isAdmin = req.user.role === 'admin';

    let conditions = [];
    let params = [];
    let idx = 1;

    if (!isAdmin) { conditions.push(`p.customer_id = $${idx++}`); params.push(req.user.id); }
    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (method) { conditions.push(`p.method = $${idx++}`); params.push(method); }
    if (search && isAdmin) {
      conditions.push(`(u.name ILIKE $${idx} OR p.reference ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*) FROM payments p JOIN users u ON p.customer_id = u.id ${where}`, params);
    params.push(limit, offset);

    const result = await query(`
      SELECT p.*, u.name as customer_name, u.email as customer_email,
             s.name as service_name, a.appointment_date
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      ${where}
      ORDER BY p.created_at DESC
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

exports.initializePayment = async (req, res) => {
  try {
    const { appointment_id, method } = req.body;
    const apptRes = await query(`
      SELECT a.*, s.name as service_name, s.price FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.id = $1 AND a.customer_id = $2
    `, [appointment_id, req.user.id]);

    if (!apptRes.rows[0]) return res.status(404).json({ success: false, message: 'Appointment not found' });
    const appt = apptRes.rows[0];
    const reference = generateReference();

    if (method === 'paystack') {
      const data = await paymentService.initializePaystack(req.user.email, appt.price, {
        appointment_id, reference, customer_name: req.user.name,
      });
      await query(
        'INSERT INTO payments (appointment_id, customer_id, amount, method, reference) VALUES ($1,$2,$3,$4,$5)',
        [appointment_id, req.user.id, appt.price, 'paystack', reference]
      );
      return res.json({ success: true, data: { authorization_url: data.data.authorization_url, reference } });
    }

    if (method === 'flutterwave') {
      await query(
        'INSERT INTO payments (appointment_id, customer_id, amount, method, reference) VALUES ($1,$2,$3,$4,$5)',
        [appointment_id, req.user.id, appt.price, 'flutterwave', reference]
      );
      return res.json({ success: true, data: { reference, amount: appt.price, email: req.user.email } });
    }

    res.status(400).json({ success: false, message: 'Invalid payment method' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, method, transaction_id } = req.body;

    let verified = false;
    let transId = null;

    if (method === 'paystack') {
      const data = await paymentService.verifyPaystack(reference);
      verified = data.data?.status === 'success';
      transId = data.data?.id;
    } else if (method === 'flutterwave') {
      const data = await paymentService.verifyFlutterwave(transaction_id);
      verified = data.data?.status === 'successful';
      transId = data.data?.id;
    }

    if (!verified) return res.status(400).json({ success: false, message: 'Payment verification failed' });

    const payRes = await query(`
      UPDATE payments SET status='success', transaction_id=$1 WHERE reference=$2 RETURNING *
    `, [transId, reference]);

    if (!payRes.rows[0]) return res.status(404).json({ success: false, message: 'Payment record not found' });

    await query(
      'UPDATE appointments SET payment_status=$1, status=$2 WHERE id=$3',
      ['paid', 'confirmed', payRes.rows[0].appointment_id]
    );

    // Update customer stats
    await query(`
      UPDATE customers SET total_visits = total_visits + 1, total_spent = total_spent + $1
      WHERE user_id = $2
    `, [payRes.rows[0].amount, req.user.id]);

    // Send receipt email
    const apptRes = await query(`
      SELECT a.*, s.name as service_name FROM appointments a
      JOIN services s ON a.service_id = s.id WHERE a.id = $1
    `, [payRes.rows[0].appointment_id]);

    await emailService.sendPaymentReceipt(req.user.email, req.user.name, {
      reference,
      service_name: apptRes.rows[0]?.service_name,
      amount: payRes.rows[0].amount,
      method,
      date: new Date().toLocaleDateString(),
    });

    res.json({ success: true, data: payRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadReceipt = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.name as customer_name, s.name as service_name
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (req.user.role !== 'admin' && result.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const pdf = await pdfService.generateReceipt(result.rows[0]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${result.rows[0].reference}.pdf`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
