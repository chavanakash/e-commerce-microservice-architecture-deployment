const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const axios = require('axios');

const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3003';

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create order (with validation from other services)
router.post('/', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Verify user exists
    try {
      await axios.get(`${USER_SERVICE}/api/users/${userId}`);
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Verify product exists and get price
    let product;
    try {
      const response = await axios.get(`${PRODUCT_SERVICE}/api/products/${productId}`);
      product = response.data.data;
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    const order = await Order.create({
      userId,
      productId,
      quantity,
      totalPrice
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;