const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Get dashboard stats
router.get('/stats', dashboardController.getDashboardStats);

// Get demand insights
router.get('/insights', dashboardController.getDemandInsights);

module.exports = router;
