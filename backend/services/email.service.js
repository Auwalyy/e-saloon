const transporter = require('../config/email');

const from = process.env.EMAIL_FROM || "Aisha's Salon <noreply@aishasalon.com>";

const send = (to, subject, html) =>
  transporter.sendMail({ from, to, subject, html });

const baseTemplate = (content) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f8f8f8;margin:0;padding:0}
  .container{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#D4AF37,#b8960c);padding:32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:24px;letter-spacing:1px}
  .body{padding:32px}
  .footer{background:#f8f8f8;padding:20px;text-align:center;font-size:12px;color:#999}
  .btn{display:inline-block;background:#D4AF37;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0}
  .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0}
  .badge{display:inline-block;background:#D4AF37;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px}
</style></head><body>
<div class="container">
  <div class="header"><h1>✨ Aisha's Salon</h1></div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} Aisha's Salon. All rights reserved.<br>15 Victoria Island, Lagos, Nigeria</div>
</div></body></html>`;

exports.sendWelcomeEmail = (email, name) =>
  send(email, "Welcome to Aisha's Salon! 🌟", baseTemplate(`
    <h2>Welcome, ${name}! 🎉</h2>
    <p>We're thrilled to have you join the Aisha's Salon family. Experience luxury beauty services at your fingertips.</p>
    <p>You can now:</p>
    <ul>
      <li>Book appointments online 24/7</li>
      <li>Choose your preferred stylist</li>
      <li>Track your appointment history</li>
      <li>Receive exclusive offers</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/services" class="btn">Book Your First Appointment</a>
    <p>See you soon! 💛</p>
  `));

exports.sendBookingConfirmation = (email, name, appointment) =>
  send(email, "Appointment Confirmed! ✅", baseTemplate(`
    <h2>Your Appointment is Confirmed! 🎊</h2>
    <p>Hi ${name}, your booking has been confirmed. Here are your details:</p>
    <div style="background:#fffbf0;border-left:4px solid #D4AF37;padding:16px;border-radius:8px;margin:16px 0">
      <div class="info-row"><span><strong>Service:</strong></span><span>${appointment.service_name}</span></div>
      <div class="info-row"><span><strong>Stylist:</strong></span><span>${appointment.stylist_name}</span></div>
      <div class="info-row"><span><strong>Date:</strong></span><span>${appointment.date}</span></div>
      <div class="info-row"><span><strong>Time:</strong></span><span>${appointment.time}</span></div>
      <div class="info-row"><span><strong>Amount:</strong></span><span>₦${appointment.amount}</span></div>
      <div class="info-row"><span><strong>Status:</strong></span><span><span class="badge">Confirmed</span></span></div>
    </div>
    <p>Please arrive 10 minutes early. If you need to reschedule, please do so at least 24 hours in advance.</p>
    <a href="${process.env.FRONTEND_URL}/my-bookings" class="btn">View My Bookings</a>
  `));

exports.sendAppointmentReminder = (email, name, appointment) =>
  send(email, "Appointment Reminder ⏰", baseTemplate(`
    <h2>Reminder: Your Appointment is Tomorrow!</h2>
    <p>Hi ${name}, just a friendly reminder about your upcoming appointment:</p>
    <div style="background:#fffbf0;border-left:4px solid #D4AF37;padding:16px;border-radius:8px;margin:16px 0">
      <div class="info-row"><span><strong>Service:</strong></span><span>${appointment.service_name}</span></div>
      <div class="info-row"><span><strong>Date:</strong></span><span>${appointment.date}</span></div>
      <div class="info-row"><span><strong>Time:</strong></span><span>${appointment.time}</span></div>
    </div>
    <p>We look forward to seeing you! 💛</p>
  `));

exports.sendCancellationEmail = (email, name, appointment) =>
  send(email, "Appointment Cancelled", baseTemplate(`
    <h2>Appointment Cancelled</h2>
    <p>Hi ${name}, your appointment has been cancelled.</p>
    <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:16px;border-radius:8px;margin:16px 0">
      <div class="info-row"><span><strong>Service:</strong></span><span>${appointment.service_name}</span></div>
      <div class="info-row"><span><strong>Date:</strong></span><span>${appointment.date}</span></div>
    </div>
    <p>We hope to see you again soon. Book a new appointment anytime!</p>
    <a href="${process.env.FRONTEND_URL}/book" class="btn">Book Again</a>
  `));

exports.sendPasswordResetEmail = (email, name, resetUrl) =>
  send(email, "Reset Your Password 🔐", baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="color:#999;font-size:13px">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
  `));

exports.sendPaymentReceipt = (email, name, payment) =>
  send(email, "Payment Receipt 🧾", baseTemplate(`
    <h2>Payment Successful! ✅</h2>
    <p>Hi ${name}, your payment has been received. Here's your receipt:</p>
    <div style="background:#fffbf0;border-left:4px solid #D4AF37;padding:16px;border-radius:8px;margin:16px 0">
      <div class="info-row"><span><strong>Receipt #:</strong></span><span>${payment.reference}</span></div>
      <div class="info-row"><span><strong>Service:</strong></span><span>${payment.service_name}</span></div>
      <div class="info-row"><span><strong>Amount:</strong></span><span>₦${payment.amount}</span></div>
      <div class="info-row"><span><strong>Method:</strong></span><span>${payment.method}</span></div>
      <div class="info-row"><span><strong>Date:</strong></span><span>${payment.date}</span></div>
      <div class="info-row"><span><strong>Status:</strong></span><span><span class="badge">Paid</span></span></div>
    </div>
    <a href="${process.env.FRONTEND_URL}/my-bookings" class="btn">View Booking</a>
  `));
