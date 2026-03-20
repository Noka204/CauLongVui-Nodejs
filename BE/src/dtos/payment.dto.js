/**
 * Map Payment model to DTO
 * @param {Object} payment
 * @returns {Object|null}
 */
const paymentDto = (payment) => {
  if (!payment) return null;
  return {
    id: payment._id,
    bookingId: payment.bookingId,
    userId: payment.userId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    transactionRef: payment.transactionRef,
    status: payment.status,
    paymentDate: payment.paymentDate,
  };
};

module.exports = {
  paymentDto,
};
