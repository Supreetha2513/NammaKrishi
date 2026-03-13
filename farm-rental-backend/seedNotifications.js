const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedNotifications() {
  try {
    // You'll need to replace this with your actual owner ID from Firebase Auth
    const ownerId = 'YOUR_OWNER_ID_HERE'; // Replace with actual owner UID
    
    console.log('🌱 Seeding owner notifications...');

    const notifications = [
      {
        owner_id: ownerId,
        notification_type: 'booking_request',
        title: 'New Booking Request',
        message: 'You have a new booking request for your Tractor Model X',
        status: 'unread',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 14, 10, 30))
      },
      {
        owner_id: ownerId,
        notification_type: 'payment_received',
        title: 'Payment Received',
        message: 'Payment of ₹5,500 received for booking #BK1234',
        status: 'unread',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 14, 9, 15))
      },
      {
        owner_id: ownerId,
        notification_type: 'maintenance_due',
        title: 'Maintenance Reminder',
        message: 'Your Harvester is due for maintenance in 5 days',
        status: 'unread',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 13, 18, 0))
      },
      {
        owner_id: ownerId,
        notification_type: 'demand_alert',
        title: 'High Demand Alert',
        message: 'Harvesting equipment is in high demand in Mandya area',
        status: 'read',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 12, 14, 30))
      },
      {
        owner_id: ownerId,
        notification_type: 'pricing_update',
        title: 'Dynamic Pricing Suggestion',
        message: 'Consider increasing price by 20% for peak season',
        status: 'read',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 11, 11, 0))
      },
      {
        owner_id: ownerId,
        notification_type: 'booking_request',
        title: 'Booking Confirmed',
        message: 'Your booking for Plough has been confirmed',
        status: 'read',
        created_at: admin.firestore.Timestamp.fromDate(new Date(2026, 2, 10, 16, 45))
      }
    ];

    // Add notifications to Firestore
    for (const notification of notifications) {
      await db.collection('owner_notifications').add(notification);
    }

    console.log('✅ Successfully seeded 6 notifications!');
    console.log('📝 Remember to replace YOUR_OWNER_ID_HERE with your actual owner UID');
    console.log('\nTo get your owner ID:');
    console.log('1. Login to the owner portal');
    console.log('2. Open browser console');
    console.log('3. Type: localStorage.getItem("userId")');
    console.log('4. Copy that ID and replace YOUR_OWNER_ID_HERE in this script');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    process.exit(1);
  }
}

seedNotifications();
