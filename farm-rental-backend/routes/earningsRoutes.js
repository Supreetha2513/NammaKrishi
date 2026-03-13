// Earnings routes
const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');

// Get earnings summary
router.get('/summary', earningsController.getEarningsSummary);

// Get monthly earnings breakdown
router.get('/monthly', earningsController.getMonthlyEarnings);

// Get earnings by equipment
router.get('/by-equipment', earningsController.getEarningsByEquipment);

// Get specific month earnings
router.get('/month/:month', earningsController.getMonthEarnings);

module.exports = router;
