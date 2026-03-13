// Payment controller for owners
const { admin, db } = require('../config/firebase');

const paymentController = {
  // Get all payments for owner's equipment
  getOwnerPayments: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      const { status, limit = 50 } = req.query;

      // Get all payments for this owner
      let paymentsQuery = db.collection('payments')
        .where('owner_id', '==', ownerId);

      if (status) {
        paymentsQuery = paymentsQuery.where('payment_status', '==', status);
      }

      const paymentsSnapshot = await paymentsQuery.limit(parseInt(limit)).get();

      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString()
      }));

      res.json({
        success: true,
        payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get payment details by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user.uid;

      const paymentDoc = await db.collection('payments').doc(id).get();

      if (!paymentDoc.exists) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentDoc.data();

      // Verify ownership
      if (payment.owner_id !== ownerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json({
        success: true,
        payment: {
          id: paymentDoc.id,
          ...payment,
          created_at: payment.created_at?.toDate?.()?.toISOString(),
          verified_at: payment.verified_at?.toDate?.()?.toISOString()
        }
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Verify payment (owner confirms receiving payment)
  verifyPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const ownerId = req.user.uid;

      const paymentDoc = await db.collection('payments').doc(id).get();

      if (!paymentDoc.exists) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentDoc.data();

      // Verify ownership
      if (payment.owner_id !== ownerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Update payment status
      await db.collection('payments').doc(id).update({
        payment_status: 'completed',
        verified_at: admin.firestore.FieldValue.serverTimestamp(),
        verified_by: ownerId
      });

      // Update booking payment status
      if (payment.booking_id) {
        try {
          await db.collection('bookings').doc(payment.booking_id).update({
            payment_status: 'paid'
          });
        } catch (err) {
          console.log('Booking update error:', err.message);
        }
      }

      // Update owner earnings
      await updateOwnerEarnings(ownerId, payment);

      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get pending payments (awaiting verification)
  getPendingPayments: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      const paymentsSnapshot = await db.collection('payments')
        .where('owner_id', '==', ownerId)
        .where('payment_status', '==', 'pending_verification')
        .get();

      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString()
      }));

      res.json({
        success: true,
        payments,
        count: payments.length
      });
    } catch (error) {
      console.error('Get pending payments error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get payment statistics
  getPaymentStats: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      const paymentsSnapshot = await db.collection('payments')
        .where('owner_id', '==', ownerId)
        .get();

      let totalReceived = 0;
      let totalPending = 0;
      let completedCount = 0;
      let pendingCount = 0;

      paymentsSnapshot.docs.forEach(doc => {
        const payment = doc.data();
        if (payment.payment_status === 'completed') {
          totalReceived += payment.amount || 0;
          completedCount++;
        } else if (payment.payment_status === 'pending_verification') {
          totalPending += payment.amount || 0;
          pendingCount++;
        }
      });

      res.json({
        success: true,
        stats: {
          total_received: totalReceived,
          total_pending: totalPending,
          completed_count: completedCount,
          pending_count: pendingCount,
          total_transactions: paymentsSnapshot.size
        }
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

// Helper function to update owner earnings
async function updateOwnerEarnings(ownerId, payment) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const earningsId = `${ownerId}_${currentMonth}`;

    const earningsDoc = await db.collection('owner_earnings').doc(earningsId).get();

    if (earningsDoc.exists) {
      // Update existing earnings
      const earnings = earningsDoc.data();
      const equipmentBreakdown = earnings.equipment_breakdown || [];
      
      // Find equipment in breakdown
      const equipmentIndex = equipmentBreakdown.findIndex(
        eq => eq.equipment_id === payment.equipment_id
      );

      if (equipmentIndex >= 0) {
        equipmentBreakdown[equipmentIndex].earnings += payment.amount;
        equipmentBreakdown[equipmentIndex].bookings += 1;
      } else {
        equipmentBreakdown.push({
          equipment_id: payment.equipment_id,
          equipment_name: payment.equipment_name || 'Unknown',
          earnings: payment.amount,
          bookings: 1
        });
      }

      await db.collection('owner_earnings').doc(earningsId).update({
        total_earnings: admin.firestore.FieldValue.increment(payment.amount),
        total_bookings: admin.firestore.FieldValue.increment(1),
        total_paid: admin.firestore.FieldValue.increment(payment.amount),
        equipment_breakdown: equipmentBreakdown,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new earnings document
      await db.collection('owner_earnings').doc(earningsId).set({
        owner_id: ownerId,
        month: currentMonth,
        total_earnings: payment.amount,
        total_bookings: 1,
        total_paid: payment.amount,
        total_pending: 0,
        equipment_breakdown: [{
          equipment_id: payment.equipment_id,
          equipment_name: payment.equipment_name || 'Unknown',
          earnings: payment.amount,
          bookings: 1
        }],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Update earnings error:', error);
  }
}

module.exports = paymentController;
