// Booking routes
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all bookings for the authenticated owner
router.get('/', authMiddleware, bookingController.getOwnerBookings);

// Create a new booking (customer action)
router.post('/', authMiddleware, bookingController.createBooking);

// Accept a booking (owner action)
router.post('/:booking_id/accept', authMiddleware, bookingController.acceptBooking);

// Reject a booking (owner action)
router.post('/:booking_id/reject', authMiddleware, bookingController.rejectBooking);

// Complete a booking (owner action)
router.post('/:booking_id/complete', authMiddleware, bookingController.completeBooking);

// Check availability for specific dates
router.get('/availability', bookingController.checkAvailability);

module.exports = router;
