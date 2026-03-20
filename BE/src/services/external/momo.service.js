const crypto = require('crypto');
const momoConfig = require('../../config/momo');

/**
 * Create MoMo payment request
 * @param {Object} params
 * @param {string} params.orderId - Internal order/booking ID
 * @param {number} params.amount - Amount in VND
 * @param {string} params.orderInfo - Payment description
 * @param {string} params.fullName - Customer full name
 * @returns {Promise<{ payUrl: string|null, momoOrderId: string, requestId: string, errorCode: number, message: string }>}
 */
const createPayment = async ({ orderId, amount, orderInfo, fullName }) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }

  const requestId = Date.now().toString();
  const momoOrderId = `${orderId}-${requestId}`;
  const amountStr = String(amount);

  // Embed internal orderId in extraData (Base64 JSON) for callback extraction
  const extraObj = { internalOrderId: orderId };
  const extraData = Buffer.from(JSON.stringify(extraObj)).toString('base64');

  const formattedOrderInfo = `Khách hàng: ${fullName}. Nội dung: ${orderInfo}`;

  // Build raw signature string (alphabetical order as required by MoMo)
  const rawSignature =
    `accessKey=${momoConfig.ACCESS_KEY}` +
    `&amount=${amountStr}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${momoConfig.NOTIFY_URL}` +
    `&orderId=${momoOrderId}` +
    `&orderInfo=${formattedOrderInfo}` +
    `&partnerCode=${momoConfig.PARTNER_CODE}` +
    `&redirectUrl=${momoConfig.RETURN_URL}` +
    `&requestId=${requestId}` +
    `&requestType=${momoConfig.REQUEST_TYPE}`;

  const signature = computeHmacSha256(rawSignature, momoConfig.SECRET_KEY);

  const body = {
    partnerCode: momoConfig.PARTNER_CODE,
    accessKey: momoConfig.ACCESS_KEY,
    requestId,
    amount: amountStr,
    orderId: momoOrderId,
    orderInfo: formattedOrderInfo,
    redirectUrl: momoConfig.RETURN_URL,
    ipnUrl: momoConfig.NOTIFY_URL,
    extraData,
    requestType: momoConfig.REQUEST_TYPE,
    signature,
    lang: 'vi',
  };

  const response = await fetch(momoConfig.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    payUrl: data.payUrl || null,
    momoOrderId,
    requestId: data.requestId || requestId,
    errorCode: data.errorCode || data.resultCode || -1,
    message: data.message || data.localMessage || '',
  };
};

/**
 * Parse MoMo callback query params
 * @param {Object} query - Express req.query
 * @returns {{ momoOrderId: string, amount: string, internalOrderId: string|null }}
 */
const verifyCallback = (query) => {
  const momoOrderId = query.orderId || '';
  const amount = query.amount || '';
  const extraData = query.extraData || '';

  let internalOrderId = null;
  if (extraData) {
    try {
      const json = Buffer.from(extraData, 'base64').toString('utf8');
      const parsed = JSON.parse(json);
      internalOrderId = parsed.internalOrderId || null;
    } catch {
      // extraData parse failed, try orderId prefix
    }
  }

  // Fallback: extract from momoOrderId (format: internalId-timestamp)
  if (!internalOrderId && momoOrderId) {
    const parts = momoOrderId.split('-');
    if (parts.length >= 2) {
      internalOrderId = parts[0];
    }
  }

  return { momoOrderId, amount, internalOrderId };
};

/**
 * Verify MoMo IPN signature (HMAC-SHA256)
 * @param {Object} body - MoMo IPN request body
 * @returns {boolean}
 */
const verifyIpnSignature = (body) => {
  const s = (val) => (val !== null && val !== undefined ? String(val) : '');

  const rawData =
    `accessKey=${momoConfig.ACCESS_KEY}` +
    `&amount=${s(body.amount)}` +
    `&extraData=${s(body.extraData)}` +
    `&message=${s(body.message)}` +
    `&orderId=${s(body.orderId)}` +
    `&orderInfo=${s(body.orderInfo)}` +
    `&orderType=${s(body.orderType)}` +
    `&partnerCode=${s(body.partnerCode)}` +
    `&payType=${s(body.payType)}` +
    `&requestId=${s(body.requestId)}` +
    `&responseTime=${s(body.responseTime)}` +
    `&resultCode=${s(body.resultCode)}` +
    `&transId=${s(body.transId)}`;

  const mySig = computeHmacSha256(rawData, momoConfig.SECRET_KEY);

  return mySig.toLowerCase() === (body.signature || '').toLowerCase();
};

/**
 * Confirm order with MoMo query API
 * @param {Object} body - MoMo IPN body containing orderId and requestId
 * @returns {Promise<{ isSuccess: boolean, amount: number|null }>}
 */
const confirmOrder = async (body) => {
  const rawSignature =
    `accessKey=${momoConfig.ACCESS_KEY}` +
    `&orderId=${body.orderId}` +
    `&partnerCode=${momoConfig.PARTNER_CODE}` +
    `&requestId=${body.requestId}`;

  const signature = computeHmacSha256(rawSignature, momoConfig.SECRET_KEY);

  const requestBody = {
    partnerCode: momoConfig.PARTNER_CODE,
    accessKey: momoConfig.ACCESS_KEY,
    requestId: body.requestId,
    orderId: body.orderId,
    signature,
    lang: 'vi',
  };

  const response = await fetch(momoConfig.QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (data.resultCode !== 0) {
    return { isSuccess: false, amount: null };
  }

  const amount = data.amount ? Number(data.amount) : null;
  return { isSuccess: true, amount };
};

/**
 * Extract internal order ID from MoMo IPN body
 * @param {Object} body - MoMo IPN body
 * @returns {string|null}
 */
const extractInternalOrderId = (body) => {
  // Try extraData first (Base64 JSON with internalOrderId)
  if (body.extraData) {
    try {
      const json = Buffer.from(body.extraData, 'base64').toString('utf8');
      const parsed = JSON.parse(json);
      if (parsed.internalOrderId) {
        return String(parsed.internalOrderId);
      }
    } catch {
      // Parse failed
    }
  }

  // Fallback: extract from orderId prefix (format: internalId-timestamp)
  if (body.orderId) {
    const head = body.orderId.split('-')[0];
    if (head) return head;
  }

  return null;
};

/**
 * Compute HMAC-SHA256 hash
 * @param {string} message - Data to hash
 * @param {string} secretKey - Secret key
 * @returns {string} Hex-encoded hash
 * @private
 */
const computeHmacSha256 = (message, secretKey) => {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message, 'utf8');
  return hmac.digest('hex');
};

module.exports = {
  createPayment,
  verifyCallback,
  verifyIpnSignature,
  confirmOrder,
  extractInternalOrderId,
};
