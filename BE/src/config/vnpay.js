require('dotenv').config();

module.exports = {
  TMN_CODE: process.env.VNPAY_TMN_CODE || 'WM01V14B',
  HASH_SECRET: process.env.VNPAY_HASH_SECRET || 'QJ1SJB6QM1JQI5X2EH0OFORQOJES5OK2',
  BASE_URL: process.env.VNPAY_BASE_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  COMMAND: process.env.VNPAY_COMMAND || 'pay',
  CURR_CODE: process.env.VNPAY_CURR_CODE || 'VND',
  VERSION: process.env.VNPAY_VERSION || '2.1.0',
  LOCALE: process.env.VNPAY_LOCALE || 'vn',
  RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payments/vnpay/return',
};
