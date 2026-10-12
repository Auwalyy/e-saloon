/**
 * SMS gateway abstraction ("SMS-ready" architecture).
 *
 * The rest of the application only calls sendSms(). To go live with a real
 * gateway (Termii, Twilio, Africa's Talking ...) register a provider below
 * that implements `send({ to, message })` and set SMS_PROVIDER in the environment.
 */
const env = require('../config/env');

const providers = {
  /** Default provider: writes the message to the server log. */
  console: {
    async send({ to, message }) {
      console.log(`[sms:console] to=${to} message="${message}"`);
      return { delivered: false, provider: 'console' };
    },
  },
};

const registerProvider = (name, provider) => {
  providers[name] = provider;
};

/** Sends an SMS. Never throws: a failed text must not break the request that triggered it. */
const sendSms = async ({ to, message }) => {
  if (!to || !message) return { delivered: false };
  const provider = providers[env.sms.provider] || providers.console;
  try {
    return await provider.send({ to, message });
  } catch (error) {
    console.error('[sms] delivery failed:', error.message);
    return { delivered: false, error: error.message };
  }
};

module.exports = { sendSms, registerProvider };
