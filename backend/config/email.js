/**
 * Nodemailer transport.
 * When SMTP credentials are not configured (local development) emails are
 * rendered to the console instead of being sent, so the app works out of the box.
 */
const nodemailer = require('nodemailer');
const env = require('./env');

const isConfigured = Boolean(env.email.host && env.email.user && env.email.pass);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: { user: env.email.user, pass: env.email.pass },
    })
  : nodemailer.createTransport({ jsonTransport: true });

module.exports = { transporter, isConfigured };
