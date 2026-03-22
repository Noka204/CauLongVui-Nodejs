/**
 * Định dạng số tiền sang chuẩn Việt Nam (VND)
 * @param {number} amount 
 * @returns {string}
 */
const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

module.exports = { formatMoney };
