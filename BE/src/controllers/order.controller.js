const orderService = require('../services/order.service');
const { sendResponse } = require('../utils/response');
const { orderDto } = require('../dtos/order.dto');

const getOrders = async (req, res) => {
  const data = await orderService.findAll(req.query, req.user);
  const items = data.items.map(orderDto);
  return sendResponse(res, 200, true, 'Get food orders success', { ...data, items });
};

const getOrderById = async (req, res) => {
  const order = await orderService.findById(req.params.id, req.user);
  return sendResponse(res, 200, true, 'Get food order detail success', orderDto(order));
};

const createOrder = async (req, res) => {
  const orderData = req.body;

  if (req.user && req.user.id) {
    orderData.userId = req.user.id;
  }

  const order = await orderService.create(orderData);
  return sendResponse(res, 201, true, 'Create food order success', orderDto(order));
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateStatus(req.params.id, status);
  return sendResponse(res, 200, true, 'Update food order status success', orderDto(order));
};

const returnEquipment = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;
  const order = await orderService.returnEquipment(id, items);
  return sendResponse(res, 200, true, 'Return equipment success', orderDto(order));
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  returnEquipment,
};
