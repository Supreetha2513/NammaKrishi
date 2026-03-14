const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const bookingController = {
  // Get all bookings for an owner
  getOwnerBookings: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      console.log('📋 Fetching bookings for owner:', ownerId);
      
      // DEBUG: Let's see ALL documents in equipment_request collection
      const allRequestsSnapshot = await db.collection('equipment_request').get();
      console.log(`🔍 DEBUG: Total documents in equipment_request collection: ${allRequestsSnapshot.size}`);
      
      if (allRequestsSnapshot.size > 0) {
        console.log('📄 Sample documents from equipment_request:');
        allRequestsSnapshot.docs.slice(0, 3).forEach(doc => {
          const data = doc.data();
          console.log(`  - Doc ${doc.id}: owner_id="${data.owner_id}", equipment_id="${data.equipment_id}", status="${data.status}"`);
        });
      }
      
      // Query equipment_request directly by owner_id (SIMPLIFIED APPROACH)
      const requestsSnapshot = await db.collection('equipment_request')
        .where('owner_id', '==', ownerId)
        .get();

      console.log(`✅ Found ${requestsSnapshot.size} requests for owner`);

      const bookings = [];
      for (const doc of requestsSnapshot.docs) {
        const bookingData = { id: doc.id, ...doc.data() };
        console.log(`  📦 Request ${doc.id}: status=${bookingData.status}, equipment=${bookingData.equipment_id}`);
        
        // Fetch equipment details
        if (bookingData.equipment_id) {
          const equipmentDoc = await db.collection('equipment').doc(bookingData.equipment_id).get();
          bookingData.equipment = equipmentDoc.exists ? equipmentDoc.data() : null;
        }
        
        // Fetch customer details
        if (bookingData.customer_id) {
          const customerDoc = await db.collection('users').doc(bookingData.customer_id).get();
          bookingData.customer = customerDoc.exists ? customerDoc.data() : null;
        }
        
        bookings.push(bookingData);
      }

      // Sort by created_at desc
      bookings.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      console.log(`✨ Returning ${bookings.length} bookings`);
      res.json({ success: true, bookings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
  },

  // Create a new booking (called by customer portal)
  createBooking: async (req, res) => {
    try {
      const { equipment_id, owner_id, start_date, end_date, total_price } = req.body;
      const customer_id = req.user.uid;

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const now = new Date();

      if (startDate < now) {
        return res.status(400).json({ success: false, message: 'Start date must be in the future' });
      }

      if (endDate <= startDate) {
        return res.status(400).json({ success: false, message: 'End date must be after start date' });
      }

      // Check for double bookings
      const conflictingBookings = await db.collection('equipment_request')
        .where('equipment_id', '==', equipment_id)
        .where('status', 'in', ['pending', 'accepted'])
        .get();

      const hasConflict = conflictingBookings.docs.some(doc => {
        const booking = doc.data();
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        
        // Check for date overlap
        return (startDate <= bookingEnd && endDate >= bookingStart);
      });

      if (hasConflict) {
        return res.status(400).json({ 
          success: false, 
          message: 'Equipment is already booked for these dates' 
        });
      }

      // Create equipment request
      const bookingData = {
        equipment_id,
        owner_id,
        customer_id,
        start_date,
        end_date,
        total_price,
        status: 'pending',
        payment_status: 'unpaid',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const bookingRef = await db.collection('equipment_request').add(bookingData);

      // Create notification for owner
      await db.collection('notifications').add({
        user_id: owner_id,
        notification_type: 'booking_request',
        title: 'New Booking Request',
        message: 'You have received a new booking request',
        booking_id: bookingRef.id,
        status: 'unread',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ 
        success: true, 
        message: 'Booking created successfully',
        booking_id: bookingRef.id 
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
  },

  // Accept a booking (owner action)
  acceptBooking: async (req, res) => {
    try {
      const { booking_id } = req.params;
      const ownerId = req.user.uid;

      const bookingDoc = await db.collection('equipment_request').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Check if still available (double-check)
      const conflictingBookings = await db.collection('equipment_request')
        .where('equipment_id', '==', bookingData.equipment_id)
        .where('status', '==', 'accepted')
        .get();

      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);

      const hasConflict = conflictingBookings.docs.some(doc => {
        if (doc.id === booking_id) return false; // Skip current booking
        const booking = doc.data();
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return (startDate <= bookingEnd && endDate >= bookingStart);
      });

      if (hasConflict) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot accept: dates are now conflicting with another booking' 
        });
      }

      // Update request status and add to payments
      await db.collection('equipment_request').doc(booking_id).update({
        status: 'accepted',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add to payments collection
      await db.collection('payments').add({
        request_id: booking_id,
        equipment_id: bookingData.equipment_id,
        owner_id: ownerId,
        customer_id: bookingData.customer_id,
        amount: bookingData.total_price,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        payment_status: 'pending',
        payment_method: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await db.collection('notifications').add({
        user_id: bookingData.customer_id,
        notification_type: 'booking_accepted',
        title: 'Booking Accepted',
        message: 'Your booking request has been accepted',
        request_id: booking_id,
        status: 'unread',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: 'Booking accepted' });
    } catch (error) {
      console.error('Error accepting booking:', error);
      res.status(500).json({ success: false, message: 'Failed to accept booking' });
    }
  },

  // Reject a booking (owner action)
  rejectBooking: async (req, res) => {
    try {
      const { booking_id } = req.params;
      const { rejection_reason } = req.body;
      const ownerId = req.user.uid;

      const bookingDoc = await db.collection('equipment_request').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Update request status (stays in equipment_request)
      await db.collection('equipment_request').doc(booking_id).update({
        status: 'rejected',
        rejection_reason: rejection_reason || 'Not available',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await db.collection('notifications').add({
        user_id: bookingData.customer_id,
        notification_type: 'booking_rejected',
        title: 'Booking Rejected',
        message: rejection_reason || 'Your booking request was not accepted',
        request_id: booking_id,
        status: 'unread',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: 'Booking rejected' });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      res.status(500).json({ success: false, message: 'Failed to reject booking' });
    }
  },

  // Mark booking as completed
  completeBooking: async (req, res) => {
    try {
      const { booking_id } = req.params;
      const ownerId = req.user.uid;

      const bookingDoc = await db.collection('equipment_request').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await db.collection('equipment_request').doc(booking_id).update({
        status: 'completed',
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({ success: true, message: 'Booking marked as completed' });
    } catch (error) {
      console.error('Error completing booking:', error);
      res.status(500).json({ success: false, message: 'Failed to complete booking' });
    }
  },

  // Check availability for specific dates
  checkAvailability: async (req, res) => {
    try {
      const { equipment_id, start_date, end_date } = req.query;

      if (!equipment_id || !start_date || !end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameters' 
        });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      // Get all accepted/pending requests for this equipment
      const bookingsSnapshot = await db.collection('equipment_request')
        .where('equipment_id', '==', equipment_id)
        .where('status', 'in', ['pending', 'accepted'])
        .get();

      const conflicts = bookingsSnapshot.docs.filter(doc => {
        const booking = doc.data();
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        return (startDate <= bookingEnd && endDate >= bookingStart);
      }).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({ 
        success: true, 
        available: conflicts.length === 0,
        conflicts: conflicts 
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ success: false, message: 'Failed to check availability' });
    }
  }
};

module.exports = bookingController;
