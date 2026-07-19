const { query } = require('../config/database');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const { generateTimeSlots, addMinutes, paginate } = require('../utils/helpers');

exports.getAppointments = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status, date, search } = req.query;
    const isAdmin = req.user.role === 'admin';

    let conditions = [];
    let params = [];
    let idx = 1;

    if (!isAdmin) {
      conditions.push(`a.customer_id = $${idx++}`);
      params.push(req.user.id);
    }
    if (status) { conditions.push(`a.status = $${idx++}`); params.push(status); }
    if (date) { conditions.push(`a.appointment_date = $${idx++}`); params.push(date); }
    if (search && isAdmin) {
      conditions.push(`(u.name ILIKE $${idx} OR s.name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM appointments a
       JOIN users u ON a.customer_id = u.id
       JOIN services s ON a.service_id = s.id
       ${where}`, params
    );

    params.push(limit, offset);
    const result = await query(`
      SELECT a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             s.name as service_name, s.price as service_price, s.duration as service_duration,
             eu.name as stylist_name, eu.avatar as stylist_avatar
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN services s ON a.service_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      ${where}
      ORDER BY a.appointment_date DESC, a.start_time DESC
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

exports.getAppointment = async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             s.name as service_name, s.price as service_price, s.duration as service_duration,
             eu.name as stylist_name, eu.avatar as stylist_avatar,
             p.reference as payment_reference, p.method as payment_method, p.status as payment_status_detail
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      JOIN services s ON a.service_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      LEFT JOIN users eu ON e.user_id = eu.id
      LEFT JOIN payments p ON p.appointment_id = a.id
      WHERE a.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (req.user.role !== 'admin' && result.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { service_id, employee_id, appointment_date, start_time, notes } = req.body;

    // Get service duration
    const svcRes = await query('SELECT * FROM services WHERE id = $1 AND is_active = true', [service_id]);
    if (!svcRes.rows[0]) return res.status(404).json({ success: false, message: 'Service not found' });
    const service = svcRes.rows[0];

    const end_time = addMinutes(start_time, service.duration);

    // Check employee availability
    const dayOfWeek = new Date(appointment_date).getDay();
    const availRes = await query(
      `SELECT * FROM availability WHERE employee_id = $1 AND day_of_week = $2 AND is_available = true
       AND start_time <= $3 AND end_time >= $4`,
      [employee_id, dayOfWeek, start_time, end_time]
    );
    if (!availRes.rows[0]) {
      return res.status(400).json({ success: false, message: 'Stylist not available at this time' });
    }

    // Check double booking
    const conflictRes = await query(`
      SELECT id FROM appointments
      WHERE employee_id = $1 AND appointment_date = $2
        AND status NOT IN ('cancelled','no_show')
        AND (start_time < $4 AND end_time > $3)
    `, [employee_id, appointment_date, start_time, end_time]);

    if (conflictRes.rows[0]) {
      return res.status(400).json({ success: false, message: 'This time slot is already booked' });
    }

    const result = await query(`
      INSERT INTO appointments (customer_id, employee_id, service_id, appointment_date, start_time, end_time, notes, total_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [req.user.id, employee_id, service_id, appointment_date, start_time, end_time, notes, service.price]);

    const appointment = result.rows[0];

    // Get names for email
    const empRes = await query('SELECT u.name FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1', [employee_id]);

    await emailService.sendBookingConfirmation(req.user.email, req.user.name, {
      service_name: service.name,
      stylist_name: empRes.rows[0]?.name || 'TBD',
      date: appointment_date,
      time: start_time,
      amount: service.price,
    });

    await notificationService.notifyAdmins(
      'New Appointment',
      `${req.user.name} booked ${service.name} on ${appointment_date} at ${start_time}`,
      'appointment'
    );

    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { status, notes, employee_id, appointment_date, start_time, cancellation_reason } = req.body;
    const apptRes = await query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    if (!apptRes.rows[0]) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const appt = apptRes.rows[0];
    if (req.user.role !== 'admin' && appt.customer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let end_time = appt.end_time;
    if (start_time) {
      const svcRes = await query('SELECT duration FROM services WHERE id = $1', [appt.service_id]);
      end_time = addMinutes(start_time, svcRes.rows[0].duration);
    }

    const result = await query(`
      UPDATE appointments SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        employee_id = COALESCE($3, employee_id),
        appointment_date = COALESCE($4, appointment_date),
        start_time = COALESCE($5, start_time),
        end_time = $6,
        cancellation_reason = COALESCE($7, cancellation_reason)
      WHERE id = $8 RETURNING *
    `, [status, notes, employee_id, appointment_date, start_time, end_time, cancellation_reason, req.params.id]);

    if (status === 'cancelled') {
      const custRes = await query('SELECT name, email FROM users WHERE id = $1', [appt.customer_id]);
      const svcRes = await query('SELECT name FROM services WHERE id = $1', [appt.service_id]);
      await emailService.sendCancellationEmail(custRes.rows[0].email, custRes.rows[0].name, {
        service_name: svcRes.rows[0].name,
        date: appt.appointment_date,
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { employee_id, service_id, date } = req.query;
    if (!employee_id || !service_id || !date) {
      return res.status(400).json({ success: false, message: 'employee_id, service_id, and date are required' });
    }

    const svcRes = await query('SELECT duration FROM services WHERE id = $1', [service_id]);
    if (!svcRes.rows[0]) return res.status(404).json({ success: false, message: 'Service not found' });

    const dayOfWeek = new Date(date).getDay();
    const availRes = await query(
      'SELECT start_time, end_time FROM availability WHERE employee_id = $1 AND day_of_week = $2 AND is_available = true',
      [employee_id, dayOfWeek]
    );

    if (!availRes.rows[0]) return res.json({ success: true, slots: [] });

    const { start_time, end_time } = availRes.rows[0];
    const duration = svcRes.rows[0].duration;
    const allSlots = generateTimeSlots(start_time, end_time, duration);

    // Get booked slots
    const bookedRes = await query(`
      SELECT start_time, end_time FROM appointments
      WHERE employee_id = $1 AND appointment_date = $2 AND status NOT IN ('cancelled','no_show')
    `, [employee_id, date]);

    const available = allSlots.filter((slot) => {
      const slotEnd = addMinutes(slot, duration);
      return !bookedRes.rows.some(
        (b) => !(slotEnd <= b.start_time.slice(0, 5) || slot >= b.end_time.slice(0, 5))
      );
    });

    res.json({ success: true, slots: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
