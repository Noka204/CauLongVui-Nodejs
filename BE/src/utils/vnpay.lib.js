const crypto = require('crypto');
const querystring = require('qs');

/**
 * VnPay Library - Port from C# VnPayLibrary.cs
 * Handles request data building, URL creation, and response verification
 */
class VnPayLibrary {
  constructor() {
    /** @type {Map<string, string>} */
    this._requestData = new Map();
    /** @type {Map<string, string>} */
    this._responseData = new Map();
  }

  /**
   * Add a key-value pair to request data
   * @param {string} key
   * @param {string|null} value
   */
  addRequestData(key, value) {
    if (value !== null && value !== undefined && value !== '') {
      this._requestData.set(key, value);
    }
  }

  /**
   * Add a key-value pair to response data
   * @param {string} key
   * @param {string|null} value
   */
  addResponseData(key, value) {
    if (value !== null && value !== undefined && value !== '') {
      this._responseData.set(key, value);
    }
  }

  /**
   * Get a value from response data
   * @param {string} key
   * @returns {string}
   */
  getResponseData(key) {
    return this._responseData.get(key) || '';
  }

  /**
   * Build the payment request URL with HMAC-SHA512 signature
   * @param {string} baseUrl - VNPay gateway base URL
   * @param {string} hashSecret - VNPay hash secret key
   * @returns {string} Full payment URL
   */
  createRequestUrl(baseUrl, hashSecret) {
    const sortedKeys = [...this._requestData.keys()].sort();

    const encodedPairs = sortedKeys
      .filter((key) => this._requestData.get(key))
      .map((key) => {
        const value = this._requestData.get(key);
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');

    const secureHash = VnPayLibrary.hmacSha512(hashSecret, encodedPairs);
    return `${baseUrl}?${encodedPairs}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Parse VNPay callback query and verify signature
   * @param {Object} query - Express req.query object
   * @param {string} hashSecret - VNPay hash secret key
   * @returns {{ orderDescription: string, transactionId: string, orderId: string, paymentMethod: string, success: boolean, vnPayResponseCode: string }}
   */
  getFullResponseData(query, hashSecret) {
    const vnPay = new VnPayLibrary();

    for (const [key, value] of Object.entries(query)) {
      if (key && key.startsWith('vnp_')) {
        vnPay.addResponseData(key, value);
      }
    }

    const orderId = vnPay.getResponseData('vnp_TxnRef');
    const transactionId = vnPay.getResponseData('vnp_TransactionNo');
    const vnPayResponseCode = vnPay.getResponseData('vnp_ResponseCode');
    const vnpSecureHash = query.vnp_SecureHash || '';
    const orderDescription = vnPay.getResponseData('vnp_OrderInfo');

    const isValidSignature = vnPay.validateSignature(vnpSecureHash, hashSecret);

    return {
      orderDescription,
      transactionId,
      orderId,
      paymentMethod: 'VnPay',
      success: isValidSignature,
      vnPayResponseCode,
    };
  }

  /**
   * Validate the secure hash from VNPay response
   * @param {string} inputHash - The hash received from VNPay
   * @param {string} secretKey - VNPay hash secret
   * @returns {boolean}
   */
  validateSignature(inputHash, secretKey) {
    const rawData = this._getResponseDataRaw();
    const checksum = VnPayLibrary.hmacSha512(secretKey, rawData);
    return checksum.toLowerCase() === (inputHash || '').toLowerCase();
  }

  /**
   * Build raw response data string for signature verification
   * @returns {string}
   * @private
   */
  _getResponseDataRaw() {
    this._responseData.delete('vnp_SecureHashType');
    this._responseData.delete('vnp_SecureHash');

    const sortedKeys = [...this._responseData.keys()].sort();
    return sortedKeys
      .filter((key) => this._responseData.get(key))
      .map((key) => {
        const value = this._responseData.get(key);
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');
  }

  /**
   * Compute HMAC-SHA512 hash
   * @param {string} key - Secret key
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  static hmacSha512(key, data) {
    const hmac = crypto.createHmac('sha512', key);
    hmac.update(data, 'utf8');
    return hmac.digest('hex');
  }

  /**
   * Get client IP address from Express request
   * @param {import('express').Request} req
   * @returns {string}
   */
  static getIpAddress(req) {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      }
      return req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    } catch {
      return '127.0.0.1';
    }
  }
}

module.exports = VnPayLibrary;
