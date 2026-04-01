/**
 * Map Court model to DTO
 * @param {Object} court 
 * @returns {Object}
 */
const courtDto = (court) => {
  if (!court) return null;
  return {
    id: court._id,
    courtName: court.courtName,
    description: court.description,
    basePrice: typeof court.basePrice === 'number' ? court.basePrice : 80000,
    imageUrl: court.imageUrl || (court.images && court.images.length > 0 ? court.images[0] : '/uploads/images/defaul.png'),
    images: (court.images && court.images.length > 0) ? court.images : ['/uploads/images/defaul.png'],
    isMaintenance: court.isMaintenance,
  };
};

module.exports = {
  courtDto,
};
