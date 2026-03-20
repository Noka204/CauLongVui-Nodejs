const VnPayLibrary = require('../../utils/vnpay.lib');
const vnpayConfig = require('../../config/vnpay');

/**
 * Create VNPay payment URL
 * @param {Object} params
 * @param {string} params.orderId - Internal order/booking ID used as vnp_TxnRef
 * @param {number} params.amount - Amount in VND (not x100)
 * @param {string} params.orderDescription - Payment description
 * @param {string} params.ipAddress - Client IP address
 * @param {string} [params.bankCode] - Optional bank code
 * @param {string} [params.locale] - Optional locale (default: vn)
 * @returns {string} VNPay payment URL
 */
const createPaymentUrl = ({ orderId, amount, orderDescription, ipAddress, bankCode, locale }) => {
  const now = new Date();
  const createDate = formatDate(now);

  const pay = new VnPayLibrary();

  pay.addRequestData('vnp_Version', vnpayConfig.VERSION);
  pay.addRequestData('vnp_Command', vnpayConfig.COMMAND);
  pay.addRequestData('vnp_TmnCode', vnpayConfig.TMN_CODE);
  pay.addRequestData('vnp_Amount', String(Math.round(amount * 100)));
  pay.addRequestData('vnp_CreateDate', createDate);
  pay.addRequestData('vnp_CurrCode', vnpayConfig.CURR_CODE);
  pay.addRequestData('vnp_IpAddr', ipAddress || '127.0.0.1');
  pay.addRequestData('vnp_Locale', locale || vnpayConfig.LOCALE);
  pay.addRequestData('vnp_OrderInfo', orderDescription || `Thanh toan don hang ${orderId}`);
  pay.addRequestData('vnp_OrderType', 'other');
  pay.addRequestData('vnp_ReturnUrl', vnpayConfig.RETURN_URL);
  pay.addRequestData('vnp_TxnRef', orderId);

  if (bankCode) {
    pay.addRequestData('vnp_BankCode', bankCode);
  }

  const url = pay.createRequestUrl(vnpayConfig.BASE_URL, vnpayConfig.HASH_SECRET);
  return url;
};

/**
 * Verify VNPay return/IPN callback query params
 * @param {Object} query - Express req.query
 * @returns {{ isSuccess: boolean, orderId: string, amount: number|null, transactionId: string, responseCode: string, orderDescription: string }}
 */
const verifyReturnUrl = (query) => {
  const pay = new VnPayLibrary();
  const result = pay.getFullResponseData(query, vnpayConfig.HASH_SECRET);

  const isValidSignature = result.success;
  const isSuccessCode = result.vnPayResponseCode === '00';

  // Parse amount (VNPay sends amount x100)
  let amount = null;
  if (query.vnp_Amount) {
    const rawAmount = parseInt(query.vnp_Amount, 10);
    if (!isNaN(rawAmount)) {
      amount = rawAmount / 100;
    }
  }

  return {
    isSuccess: isValidSignature && isSuccessCode,
    orderId: result.orderId,
    amount,
    transactionId: result.transactionId,
    responseCode: result.vnPayResponseCode,
    orderDescription: result.orderDescription,
  };
};

/**
 * Format date to VNPay format: yyyyMMddHHmmss
 * @param {Date} date
 * @returns {string}
 * @private
 */
const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
};

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
};
