const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Booking = require('../models/booking.model');
const { NotFoundError } = require('../exceptions/NotFoundError');
const { BadRequestError } = require('../exceptions/BadRequestError');
const { ForbiddenError } = require('../exceptions/ForbiddenError');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const normalizeOrderOwnerId = (order) => {
  if (!order || !order.userId) return '';
  if (typeof order.userId === 'string') return order.userId;
  return String(order.userId._id || order.userId.id || order.userId);
};

/**
 * Find all food orders with pagination
 * @param {Object} options
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const findAll = async ({ page = 1, limit = 10, bookingId, courtId, status } = {}, user) => {
  const query = {};
  if (status) query.status = status;
  if (bookingId) query.bookingId = bookingId;
  if (courtId) query.courtId = courtId;

  if (user && user.roleName !== 'Admin') {
    query.userId = user.id;
  }

  const pageNumber = toPositiveInteger(page, 1);
  const limitNumber = toPositiveInteger(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const items = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .populate('userId', 'fullName phoneNumber')
    .populate('items.productId', 'name image')
    .populate('courtId', 'courtName')
    .populate('bookingId', 'bookingDate slotId');

  const total = await Order.countDocuments(query);

  return { items, pagination: { page: pageNumber, limit: limitNumber, total } };
};

/**
 * Find order by ID
 * @param {string} id
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const findById = async (id, user) => {
  const order = await Order.findOne({ _id: id })
    .populate('userId', 'fullName phoneNumber')
    .populate('items.productId', 'name image')
    .populate('courtId', 'courtName')
    .populate('bookingId', 'bookingDate slotId');

  if (!order) throw new NotFoundError('Food Order not found');

  if (user && user.roleName !== 'Admin' && normalizeOrderOwnerId(order) !== user.id) {
    throw new ForbiddenError('You are not authorized to access this food order');
  }

  return order;
};

/**
 * Create new food order
 * @param {Object} orderData
 * @returns {Promise<Object>}
 */
const create = async (orderData) => {
  // Transaction disabled for non-replica set MongoDB
  let totalAmount = 0;
  const validatedItems = [];

  if (orderData.bookingId) {
    const booking = await Booking.findById(orderData.bookingId);
    if (!booking) {
      throw new BadRequestError('Booking not found');
    }

    if (orderData.userId && booking.userId.toString() !== String(orderData.userId)) {
      throw new ForbiddenError('Cannot create order for another user booking');
    }

    if (!orderData.courtId) {
      orderData.courtId = booking.courtId;
    }
  }

  for (const item of orderData.items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new BadRequestError(`Product not found: ${item.productId}`);
    }
    if (product.status !== 'Active') {
      throw new BadRequestError(`Product ${product.name} is currently inactive`);
    }
    if (product.stockQuantity < item.quantity) {
      throw new BadRequestError(`Not enough stock for ${product.name}. Available: ${product.stockQuantity}`);
    }

    product.stockQuantity -= item.quantity;
    await product.save();

    totalAmount += product.price * item.quantity;

    validatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      unitPrice: product.price,
      isRent: product.type === 'Equipment',
    });
  }

  const newOrder = await Order.create({
    ...orderData,
    items: validatedItems,
    totalAmount,
  });

  return newOrder;
};

/**
 * Update food order status
 * @param {string} id
 * @param {string} status
 * @returns {Promise<Object>}
 */
const updateStatus = async (id, status) => {
  const order = await Order.findById(id);
  if (!order) throw new NotFoundError('Food Order not found');

  if (status === 'Cancelled' && order.status !== 'Cancelled') {
    // Transaction disabled for non-replica set MongoDB
    order.status = status;
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity },
      });
    }

    return order;
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
  return updatedOrder;
};

/**
 * Return equipment for a food order
 * @param {string} orderId
 * @param {Array} itemsToReturn
 * @returns {Promise<Object>}
 */
const returnEquipment = async (orderId, itemsToReturn) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new NotFoundError('Food Order not found');
    }
    if (order.status === 'Cancelled') {
      throw new BadRequestError('Cannot return equipment for a cancelled order');
    }

    for (const returnItem of itemsToReturn) {
      const orderItem = order.items.find((i) => i.productId.toString() === returnItem.productId);
      if (!orderItem) {
        throw new BadRequestError(`Item with Product ID ${returnItem.productId} not found in this order`);
      }
      if (!orderItem.isRent) {
        throw new BadRequestError(`Item ${returnItem.productId} is not a rented equipment`);
      }
      if (orderItem.returnedQuantity + returnItem.returnQuantity > orderItem.quantity) {
        throw new BadRequestError(`Cannot return ${returnItem.returnQuantity} items. Already returned ${orderItem.returnedQuantity} out of ${orderItem.quantity}`);
      }

      orderItem.returnedQuantity += returnItem.returnQuantity;

      await Product.findByIdAndUpdate(returnItem.productId, {
        $inc: { stockQuantity: returnItem.returnQuantity },
      }, { session });
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return findById(orderId);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
  returnEquipment,
};
