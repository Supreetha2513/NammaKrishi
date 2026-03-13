const { db } = require('../config/firebase');

const dashboardController = {
  // Get owner dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      // Get equipment count
      const equipmentSnapshot = await db
        .collection('equipment')
        .where('owner_id', '==', ownerId)
        .get();
      const equipmentCount = equipmentSnapshot.size;

      // Get active bookings (pending or accepted)
      const bookingsSnapshot = await db
        .collection('bookings')
        .where('owner_id', '==', ownerId)
        .where('booking_status', 'in', ['pending', 'accepted'])
        .get();
      const activeBookings = bookingsSnapshot.size;

      // Get total earnings
      const earningsDoc = await db
        .collection('owner_earnings')
        .doc(ownerId)
        .get();
      
      const earnings = earningsDoc.exists ? earningsDoc.data() : {
        total_earnings: 0,
        monthly_earnings: 0,
        completed_bookings: 0
      };

      // Get recent bookings (last 5)
      const recentBookingsSnapshot = await db
        .collection('bookings')
        .where('owner_id', '==', ownerId)
        .orderBy('created_at', 'desc')
        .limit(5)
        .get();

      const recentBookings = [];
      for (const doc of recentBookingsSnapshot.docs) {
        const booking = { id: doc.id, ...doc.data() };
        
        // Get equipment details
        const equipmentDoc = await db.collection('equipment').doc(booking.equipment_id).get();
        booking.equipment_name = equipmentDoc.exists ? equipmentDoc.data().name : 'Unknown';
        
        recentBookings.push(booking);
      }

      // Get monthly revenue trend (last 6 months)
      const monthlyRevenue = await getMonthlyRevenue(ownerId);

      res.status(200).json({
        success: true,
        stats: {
          equipmentCount,
          activeBookings,
          totalEarnings: earnings.total_earnings || 0,
          monthlyEarnings: earnings.monthly_earnings || 0,
          completedBookings: earnings.completed_bookings || 0
        },
        recentBookings,
        monthlyRevenue
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  },

  // Get demand insights for owner
  getDemandInsights: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      // Get owner's equipment to determine relevant categories
      const equipmentSnapshot = await db
        .collection('equipment')
        .where('owner_id', '==', ownerId)
        .get();

      const categories = new Set();
      const locations = new Set();
      
      equipmentSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.category) categories.add(data.category);
        if (data.location) locations.add(data.location);
      });

      // Get demand analytics for relevant categories and locations
      let demandQuery = db.collection('demand_analytics');

      if (categories.size > 0) {
        demandQuery = demandQuery.where('equipment_category', 'in', Array.from(categories).slice(0, 10));
      }

      const demandSnapshot = await demandQuery
        .orderBy('demand_score', 'desc')
        .limit(5)
        .get();

      const insights = demandSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.status(200).json({
        success: true,
        insights
      });
    } catch (error) {
      console.error('Demand insights error:', error);
      res.status(200).json({
        success: true,
        insights: [] // Return empty array on error
      });
    }
  }
};

// Helper function to get monthly revenue
async function getMonthlyRevenue(ownerId) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('owner_id', '==', ownerId)
      .where('booking_status', '==', 'completed')
      .where('created_at', '>=', sixMonthsAgo)
      .get();

    const monthlyData = {};

    bookingsSnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.created_at?.toDate() || new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, bookings: 0 };
      }
      
      monthlyData[monthKey].revenue += data.total_price || 0;
      monthlyData[monthKey].bookings += 1;
    });

    // Convert to array format for charts
    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.bookings
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  } catch (error) {
    console.error('Monthly revenue error:', error);
    return [];
  }
}

module.exports = dashboardController;
