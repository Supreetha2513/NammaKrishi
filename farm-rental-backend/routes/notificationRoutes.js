// Notification routes
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get owner notifications
router.get('/', notificationController.getOwnerNotifications);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
