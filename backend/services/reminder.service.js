/**
 * Appointment reminders.
 * A lightweight in-process scheduler emails customers roughly 24 hours before
 * a confirmed appointment. `reminderSentAt` guarantees each reminder is sent once,
 * even if several server instances run the job at the same time.
 */
const { Appointment } = require('../models');
const emailService = require('./email.service');
const { sendSms } = require('./sms.service');

const INTERVAL_MS = 15 * 60 * 1000;
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

let timer = null;

const sendDueReminders = async () => {
  const now = new Date();
  const due = await Appointment.find({
    status: 'confirmed',
    reminderSentAt: null,
    startAt: { $gt: now, $lte: new Date(now.getTime() + LOOKAHEAD_MS) },
  }).select('_id').limit(200);

  let sent = 0;
  for (const { _id } of due) {
    // Claim the reminder atomically so it cannot be sent twice.
    const appointment = await Appointment.findOneAndUpdate(
      { _id, reminderSentAt: null },
      { reminderSentAt: new Date() },
      { new: true }
    ).populate('customer', 'name email phone notificationPreferences')
      .populate('service', 'name')
      .populate('employee', 'name');
    if (!appointment || !appointment.customer) continue;

    const { customer } = appointment;
    if (!customer.notificationPreferences || customer.notificationPreferences.email !== false) {
      await emailService.sendAppointmentReminder(customer, appointment);
    }
    if (customer.phone && customer.notificationPreferences && customer.notificationPreferences.sms) {
      await sendSms({ to: customer.phone, message: `Reminder: ${appointment.service.name} on ${appointment.date} at ${appointment.startTime}.` });
    }
    sent += 1;
  }
  return sent;
};

const startReminderScheduler = () => {
  if (timer) return;
  const run = () => sendDueReminders().catch((error) => console.error('[reminders] job failed:', error.message));
  timer = setInterval(run, INTERVAL_MS);
  timer.unref(); // never keep the process alive just for reminders
  run();
};

const stopReminderScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = { startReminderScheduler, stopReminderScheduler, sendDueReminders };
