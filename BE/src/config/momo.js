require('dotenv').config();

module.exports = {
  API_URL: process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
  SECRET_KEY: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO',
  REQUEST_TYPE: process.env.MOMO_REQUEST_TYPE || 'payWithATM',
  RETURN_URL: process.env.MOMO_RETURN_URL || 'http://localhost:5000/api/v1/payments/momo/callback',
  NOTIFY_URL: process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/v1/payments/momo/notify',
  QUERY_URL: process.env.MOMO_QUERY_URL || 'https://test-payment.momo.vn/v2/gateway/api/query',
};
