const Product = require('../models/product.model');
const { NotFoundError } = require('../exceptions/NotFoundError');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

/**
 * Find all products with pagination
 * @param {Object} options - Filtering and pagination options
 * @returns {Promise<Object>}
 */
const findAll = async ({ page = 1, limit = 10, type, status, search } = {}) => {
  const query = {};
  if (status && status !== 'All') query.status = status;
  if (type && type !== 'All') query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };

  const pageNumber = toPositiveInteger(page, 1);
  const limitNumber = toPositiveInteger(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const items = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);
  const total = await Product.countDocuments(query);

  return { items, pagination: { page: pageNumber, limit: limitNumber, total } };
};

/**
 * Find product by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const findById = async (id) => {
  const product = await Product.findOne({ _id: id });
  if (!product) throw new NotFoundError('Product not found');
  return product;
};

/**
 * Create new product
 * @param {Object} productData
 * @returns {Promise<Object>}
 */
const create = async (productData) => {
  return Product.create(productData);
};

/**
 * Update product
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const update = async (id, updateData) => {
  const product = await Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
  if (!product) throw new NotFoundError('Product not found');
  return product;
};

/**
 * Soft delete product by setting status to Inactive
 * @param {string} id
 * @returns {Promise<Object>}
 */
const remove = async (id) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: 'Inactive' },
    { returnDocument: 'after' }
  );
  if (!product) throw new NotFoundError('Product not found');
  return product;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
