/**
 * Map User model to DTO
 * @param {Object} user 
 * @returns {Object}
 */
const userDto = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    roleId: user.roleId,
    status: user.status,
    avatar: user.avatar || '/uploads/images/defaul.png',
    balance: user.balance || 0,
    createdAt: user.createdAt,
  };
};

module.exports = {
  userDto,
};
