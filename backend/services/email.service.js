/**
 * Transactional emails.
 * Every email shares one branded layout. Sending never throws, because a mail
 * outage must not cause a booking or payment to fail.
 */
const env = require('../config/env');
const { transporter, isConfigured } = require('../config/email');
const { Setting } = require('../models');
const { formatCurrency } = require('../utils/helpers');

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

const formatDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

const layout = ({ businessName, heading, body, button }) => `<!doctype html>
<html><body style="margin:0;background:#F8F8F8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#D4AF37;padding:24px 32px;color:#ffffff;font-size:22px;font-weight:bold">${escapeHtml(businessName)}</td></tr>
  <tr><td style="padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(heading)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#444444">${body}</div>
    ${button ? `<p style="margin:28px 0 0"><a href="${button.url}" style="background:#D4AF37;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block">${escapeHtml(button.label)}</a></p>` : ''}
  </td></tr>
  <tr><td style="padding:20px 32px;background:#fafafa;color:#999999;font-size:12px">This is an automated message from ${escapeHtml(businessName)}.</td></tr>
</table></td></tr></table></body></html>`;

const detailsTable = (rows) =>
  `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;border-collapse:collapse">${rows
    .map(([label, value]) => `<tr>
      <td style="padding:8px 0;color:#888888;border-bottom:1px solid #f0f0f0;width:40%">${escapeHtml(label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:bold">${escapeHtml(value)}</td></tr>`)
    .join('')}</table>`;

/** Low level send. Returns true when the message was handed to the transport. */
const sendEmail = async ({ to, subject, heading, body, button, attachments }) => {
  if (!to) return false;
  try {
    const settings = await Setting.getMain();
    const info = await transporter.sendMail({
      from: env.email.from,
      to,
      subject: `${subject} | ${settings.businessName}`,
      html: layout({ businessName: settings.businessName, heading: heading || subject, body, button }),
      attachments,
    });
    if (!isConfigured) console.log(`[email:dev] "${subject}" -> ${to} (SMTP not configured, message not sent)`);
    return Boolean(info);
  } catch (error) {
    console.error(`[email] failed to send "${subject}" to ${to}:`, error.message);
    return false;
  }
};

const appointmentRows = (appointment) => [
  ['Reference', appointment.reference],
  ['Service', appointment.service.name],
  ['Stylist', appointment.employee.name],
  ['Date', formatDate(appointment.date)],
  ['Time', `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`],
  ['Price', formatCurrency(appointment.price)],
];

const sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome',
    heading: `Welcome, ${user.name.split(' ')[0]}!`,
    body: '<p>Your account has been created. You can now book appointments online, manage your bookings and download your receipts at any time.</p>',
    button: { label: 'Book an appointment', url: `${env.frontendUrl}/book` },
  });

const sendBookingConfirmation = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: 'Booking received',
    heading: 'Your booking has been received',
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, thank you for booking with us. Here are your appointment details:</p>${detailsTable(appointmentRows(appointment))}<p>We will notify you as soon as the salon confirms your appointment.</p>`,
    button: { label: 'View my bookings', url: `${env.frontendUrl}/my-bookings` },
  });

const STATUS_COPY = {
  confirmed: { subject: 'Appointment confirmed', text: 'Good news! Your appointment has been confirmed. We look forward to seeing you.' },
  rejected: { subject: 'Appointment declined', text: 'Unfortunately we are unable to accommodate your appointment. Please book another time.' },
  cancelled: { subject: 'Appointment cancelled', text: 'Your appointment has been cancelled.' },
  completed: { subject: 'Thank you for visiting', text: 'Thank you for visiting us. We would love to hear about your experience. Please leave a review.' },
  no_show: { subject: 'We missed you', text: 'We missed you at your appointment today. You are welcome to book again whenever you are ready.' },
};

const sendAppointmentStatusEmail = (user, appointment, reason) => {
  const copy = STATUS_COPY[appointment.status];
  if (!copy) return Promise.resolve(false);
  const reasonHtml = reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : '';
  return sendEmail({
    to: user.email,
    subject: copy.subject,
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, ${copy.text}</p>${reasonHtml}${detailsTable(appointmentRows(appointment))}`,
    button: { label: 'View my bookings', url: `${env.frontendUrl}/my-bookings` },
  });
};

const sendRescheduleEmail = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: 'Appointment rescheduled',
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, your appointment has been moved. The new details are:</p>${detailsTable(appointmentRows(appointment))}`,
    button: { label: 'View my bookings', url: `${env.frontendUrl}/my-bookings` },
  });

const sendAppointmentReminder = (user, appointment) =>
  sendEmail({
    to: user.email,
    subject: 'Appointment reminder',
    heading: 'Your appointment is coming up',
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, this is a friendly reminder of your upcoming appointment:</p>${detailsTable(appointmentRows(appointment))}<p>Please arrive 10 minutes early.</p>`,
    button: { label: 'Manage booking', url: `${env.frontendUrl}/my-bookings` },
  });

const sendPasswordResetEmail = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your password',
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, we received a request to reset your password. This link is valid for 30 minutes and can be used once.</p><p>If you did not request this, you can safely ignore this email.</p>`,
    button: { label: 'Reset password', url: resetUrl },
  });

const sendPasswordChangedEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Your password was changed',
    body: '<p>The password for your account was just changed. If this was not you, reset your password immediately and contact the salon.</p>',
  });

const sendPaymentReceipt = (user, payment, appointment, pdfBuffer) =>
  sendEmail({
    to: user.email,
    subject: 'Payment receipt',
    heading: 'Payment received. Thank you!',
    body: `<p>Hi ${escapeHtml(user.name.split(' ')[0])}, we have received your payment. Your receipt is attached.</p>${detailsTable([
      ['Receipt No.', payment.receiptNumber],
      ['Amount', formatCurrency(payment.amount, payment.currency)],
      ['Method', payment.method.replace('_', ' ')],
      ['Appointment', appointment.reference],
    ])}`,
    attachments: pdfBuffer
      ? [{ filename: `receipt-${payment.receiptNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : undefined,
  });

const sendContactNotification = (to, message) =>
  sendEmail({
    to,
    subject: 'New contact message',
    body: `${detailsTable([['Name', message.name], ['Email', message.email], ['Phone', message.phone || '-'], ['Subject', message.subject || '-']])}<p>${escapeHtml(message.message)}</p>`,
  });

module.exports = {
  sendEmail, sendWelcomeEmail, sendBookingConfirmation, sendAppointmentStatusEmail, sendRescheduleEmail,
  sendAppointmentReminder, sendPasswordResetEmail, sendPasswordChangedEmail, sendPaymentReceipt, sendContactNotification,
};
