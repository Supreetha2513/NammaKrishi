const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const Razorpay = require('razorpay');
const axios = require('axios');
const crypto = require('crypto');

admin.initializeApp();

const corsHandler = cors({ origin: true });

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(400).send('Method not allowed');
      return;
    }

    try {
      const { booking_id, amount, currency, equipment_name } = req.body;

      if (!booking_id || !amount || !currency) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency || 'INR',
        receipt: `booking_${booking_id}`,
        notes: {
          booking_id: booking_id,
          equipment_name: equipment_name,
        },
      };

      const order = await razorpay.orders.create(options);

      // Store order details in Firestore
      await admin.firestore().collection('payments').doc(booking_id).set({
        booking_id: booking_id,
        razorpay_order_id: order.id,
        amount: amount,
        currency: currency,
        created_at: admin.firestore.Timestamp.now(),
        payment_status: 'pending',
      }, { merge: true });

      res.json({
        success: true,
        order_id: order.id,
        amount: amount,
        currency: currency,
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        error: error.message || 'Failed to create order',
      });
    }
  });
});

// Verify Payment
exports.verifyPayment = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(400).send('Method not allowed');
      return;
    }

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Verify signature
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        res.status(400).json({
          success: false,
          error: 'Signature verification failed',
        });
        return;
      }

      // Update payment status in Firestore
      const paymentsSnapshot = await admin
        .firestore()
        .collection('payments')
        .where('razorpay_order_id', '==', razorpay_order_id)
        .get();

      if (paymentsSnapshot.empty) {
        res.status(404).json({ error: 'Payment record not found' });
        return;
      }

      const paymentDoc = paymentsSnapshot.docs[0];
      const bookingId = paymentDoc.data().booking_id;

      // Update payment status
      await paymentDoc.ref.update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_status: 'success',
        updated_at: admin.firestore.Timestamp.now(),
      });

      // Update booking status
      await admin.firestore().collection('bookings').doc(bookingId).update({
        payment_status: 'success',
        booking_status: 'confirmed',
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        error: error.message || 'Payment verification failed',
      });
    }
  });
});

// Send SMS Notification when Equipment Becomes Available
exports.notifyEquipmentAvailable = functions.firestore
  .document('equipment/{equipmentId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if equipment changed from unavailable to available
    if (
      beforeData.availability_status !== 'available' &&
      afterData.availability_status === 'available'
    ) {
      try {
        // Find matching equipment requests
        const requestsSnapshot = await admin
          .firestore()
          .collection('equipment_requests')
          .where('equipment_name', '==', afterData.name)
          .where('request_status', '==', 'pending')
          .get();

        for (const doc of requestsSnapshot.docs) {
          const request = doc.data();
          const customer = await admin.firestore()
            .collection('users')
            .doc(request.customer_id)
            .get();

          if (customer.exists && customer.data().phone) {
            // Send SMS
            await sendSMS(
              customer.data().phone,
              `Great! ${afterData.name} is now available for rent at ${afterData.location}. Book now!`
            );

            // Update request status
            await doc.ref.update({
              request_status: 'notified',
              notified_at: admin.firestore.Timestamp.now(),
            });
          }
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
  });

// Send SMS Function (Placeholder - Replace with your SMS API)
async function sendSMS(phone, message) {
  try {
    // Example SMS API call (Replace with your SMS provider)
    const response = await axios.post(process.env.SMS_API_ENDPOINT, {
      phone: phone,
      message: message,
      api_key: process.env.SMS_API_KEY,
    });

    console.log('SMS sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

// HTTP function to manually send SMS (for testing)
exports.sendTestSMS = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(400).send('Method not allowed');
      return;
    }

    try {
      const { phone, message } = req.body;

      if (!phone || !message) {
        res.status(400).json({ error: 'Missing phone or message' });
        return;
      }

      await sendSMS(phone, message);

      res.json({
        success: true,
        message: 'SMS sent successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to send SMS',
      });
    }
  });
});

// Cleanup old pending bookings
exports.cleanupPendingBookings = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const twentyFourHoursAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const bookingsSnapshot = await admin
        .firestore()
        .collection('bookings')
        .where('booking_status', '==', 'pending')
        .where('created_at', '<', twentyFourHoursAgo)
        .get();

      let deletedCount = 0;

      for (const doc of bookingsSnapshot.docs) {
        await doc.ref.update({
          booking_status: 'cancelled',
        });
        deletedCount++;
      }

      console.log(`Cleaned up ${deletedCount} pending bookings`);
      return null;
    } catch (error) {
      console.error('Error cleaning up bookings:', error);
    }
  });
