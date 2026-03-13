// Earnings controller for owners
const { db } = require('../config/firebase');

const earningsController = {
  // Get earnings summary
  getEarningsSummary: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      // Get all earnings records for this owner
      const earningsSnapshot = await db.collection('owner_earnings')
        .where('owner_id', '==', ownerId)
        .get();

      let totalEarnings = 0;
      let totalBookings = 0;
      let totalPaid = 0;
      let totalPending = 0;

      earningsSnapshot.docs.forEach(doc => {
        const earnings = doc.data();
        totalEarnings += earnings.total_earnings || 0;
        totalBookings += earnings.total_bookings || 0;
        totalPaid += earnings.total_paid || 0;
        totalPending += earnings.total_pending || 0;
      });

      // Get current month earnings
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthId = `${ownerId}_${currentMonth}`;
      const currentMonthDoc = await db.collection('owner_earnings').doc(currentMonthId).get();
      const currentMonthEarnings = currentMonthDoc.exists ? currentMonthDoc.data().total_earnings : 0;

      res.json({
        success: true,
        summary: {
          total_earnings: totalEarnings,
          total_bookings: totalBookings,
          total_paid: totalPaid,
          total_pending: totalPending,
          current_month_earnings: currentMonthEarnings
        }
      });
    } catch (error) {
      console.error('Get earnings summary error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get monthly earnings breakdown
  getMonthlyEarnings: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      const { months = 6 } = req.query;

      const earningsSnapshot = await db.collection('owner_earnings')
        .where('owner_id', '==', ownerId)
        .get();

      const monthlyData = earningsSnapshot.docs.map(doc => ({
        month: doc.data().month,
        total_earnings: doc.data().total_earnings || 0,
        total_bookings: doc.data().total_bookings || 0,
        total_paid: doc.data().total_paid || 0,
        total_pending: doc.data().total_pending || 0
      }));

      // Sort by month descending
      monthlyData.sort((a, b) => b.month.localeCompare(a.month));

      // Limit to requested months
      const limitedData = monthlyData.slice(0, parseInt(months));

      res.json({
        success: true,
        monthly_earnings: limitedData
      });
    } catch (error) {
      console.error('Get monthly earnings error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get earnings by equipment
  getEarningsByEquipment: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      const earningsSnapshot = await db.collection('owner_earnings')
        .where('owner_id', '==', ownerId)
        .get();

      // Aggregate equipment earnings across all months
      const equipmentMap = new Map();

      earningsSnapshot.docs.forEach(doc => {
        const earnings = doc.data();
        const breakdown = earnings.equipment_breakdown || [];

        breakdown.forEach(item => {
          if (equipmentMap.has(item.equipment_id)) {
            const existing = equipmentMap.get(item.equipment_id);
            existing.earnings += item.earnings;
            existing.bookings += item.bookings;
          } else {
            equipmentMap.set(item.equipment_id, {
              equipment_id: item.equipment_id,
              equipment_name: item.equipment_name,
              earnings: item.earnings,
              bookings: item.bookings
            });
          }
        });
      });

      const equipmentEarnings = Array.from(equipmentMap.values());
      
      // Sort by earnings descending
      equipmentEarnings.sort((a, b) => b.earnings - a.earnings);

      res.json({
        success: true,
        equipment_earnings: equipmentEarnings
      });
    } catch (error) {
      console.error('Get earnings by equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get earnings for specific month
  getMonthEarnings: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      const { month } = req.params; // Format: YYYY-MM

      const earningsId = `${ownerId}_${month}`;
      const earningsDoc = await db.collection('owner_earnings').doc(earningsId).get();

      if (!earningsDoc.exists) {
        return res.json({
          success: true,
          earnings: {
            month,
            total_earnings: 0,
            total_bookings: 0,
            total_paid: 0,
            total_pending: 0,
            equipment_breakdown: []
          }
        });
      }

      const earnings = earningsDoc.data();

      res.json({
        success: true,
        earnings: {
          month: earnings.month,
          total_earnings: earnings.total_earnings || 0,
          total_bookings: earnings.total_bookings || 0,
          total_paid: earnings.total_paid || 0,
          total_pending: earnings.total_pending || 0,
          equipment_breakdown: earnings.equipment_breakdown || []
        }
      });
    } catch (error) {
      console.error('Get month earnings error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = earningsController;
