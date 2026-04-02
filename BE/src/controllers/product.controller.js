const productService = require('../services/product.service');
const { sendResponse } = require('../utils/response');
const { productDto } = require('../dtos/product.dto');

const getProducts = async (req, res) => {
  const data = await productService.findAll(req.query);
  const items = data.items.map(productDto);
  return sendResponse(res, 200, true, 'Get products success', { ...data, items });
};

const getProductById = async (req, res) => {
  const product = await productService.findById(req.params.id);
  return sendResponse(res, 200, true, 'Get product detail success', productDto(product));
};

const createProduct = async (req, res) => {
  const productData = req.body;
  if (req.file) {
    productData.image = `/uploads/images/${req.file.filename}`;
  }
  const product = await productService.create(productData);
  return sendResponse(res, 201, true, 'Create product success', productDto(product));
};

const updateProduct = async (req, res) => {
  const productData = req.body;
  if (req.file) {
    productData.image = `/uploads/images/${req.file.filename}`;
  }
  const product = await productService.update(req.params.id, productData);
  return sendResponse(res, 200, true, 'Update product success', productDto(product));
};

const deleteProduct = async (req, res) => {
  const product = await productService.remove(req.params.id);
  return sendResponse(res, 200, true, 'Delete product success', productDto(product));
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
