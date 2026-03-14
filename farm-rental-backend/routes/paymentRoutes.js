// Payment routes
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Get all payments for owner
router.get('/', paymentController.getOwnerPayments);

// Get payment statistics
router.get('/stats', paymentController.getPaymentStats);

// Get equipment-level payment summary from equipment collection
router.get('/equipment-summary', paymentController.getEquipmentPaymentSummary);

// Get pending payments
router.get('/pending', paymentController.getPendingPayments);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

// Verify payment
router.patch('/:id/verify', paymentController.verifyPayment);

module.exports = router;
