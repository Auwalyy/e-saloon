const axios = require('axios');

exports.verifyPaystack = async (reference) => {
  const { data } = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  return data;
};

exports.initializePaystack = async (email, amount, metadata) => {
  const { data } = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    { email, amount: amount * 100, metadata, callback_url: `${process.env.FRONTEND_URL}/payment/verify` },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  return data;
};

exports.verifyFlutterwave = async (transactionId) => {
  const { data } = await axios.get(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
  );
  return data;
};
