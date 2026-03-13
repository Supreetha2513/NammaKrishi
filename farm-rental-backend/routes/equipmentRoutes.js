// Equipment routes
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Get all equipment for logged-in owner
router.get('/', equipmentController.getMyEquipment);

// Get single equipment by ID
router.get('/:id', equipmentController.getEquipmentById);

// Get equipment analytics (maintenance, availability, bookings)
router.get('/:id/analytics', equipmentController.getEquipmentAnalytics);

// Get calendar availability for equipment
router.get('/:id/calendar', equipmentController.getCalendarAvailability);

// Add new equipment
router.post('/', equipmentController.addEquipment);

// Add maintenance log
router.post('/maintenance', equipmentController.addMaintenanceLog);

// Update dynamic pricing
router.post('/pricing', equipmentController.updateDynamicPricing);

// Set blackout dates
router.post('/blackout-dates', equipmentController.setBlackoutDates);

// Remove blackout dates
router.delete('/blackout-dates', equipmentController.removeBlackoutDates);

// Update equipment
router.put('/:id', equipmentController.updateEquipment);

// Toggle availability
router.patch('/:id/availability', equipmentController.toggleAvailability);

// Delete equipment
router.delete('/:id', equipmentController.deleteEquipment);

module.exports = router;
