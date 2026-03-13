const { db } = require('../config/firebase');
const admin = require('firebase-admin');

const bookingController = {
  // Get all bookings for an owner
  getOwnerBookings: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      
      const bookingsSnapshot = await db.collection('bookings')
        .where('owner_id', '==', ownerId)
        .orderBy('created_at', 'desc')
        .get();

      const bookings = [];
      for (const doc of bookingsSnapshot.docs) {
        const bookingData = { id: doc.id, ...doc.data() };
        
        // Fetch equipment details
        const equipmentDoc = await db.collection('equipment').doc(bookingData.equipment_id).get();
        bookingData.equipment = equipmentDoc.exists ? equipmentDoc.data() : null;
        
        // Fetch customer details
        const customerDoc = await db.collection('users').doc(bookingData.customer_id).get();
        bookingData.customer = customerDoc.exists ? customerDoc.data() : null;
        
        bookings.push(bookingData);
      }

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
      const conflictingBookings = await db.collection('bookings')
        .where('equipment_id', '==', equipment_id)
        .where('booking_status', 'in', ['pending', 'accepted'])
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

      // Create booking
      const bookingData = {
        equipment_id,
        owner_id,
        customer_id,
        start_date,
        end_date,
        total_price,
        booking_status: 'pending',
        payment_status: 'unpaid',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const bookingRef = await db.collection('bookings').add(bookingData);

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

      const bookingDoc = await db.collection('bookings').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Check if still available (double-check)
      const conflictingBookings = await db.collection('bookings')
        .where('equipment_id', '==', bookingData.equipment_id)
        .where('booking_status', '==', 'accepted')
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

      // Update booking status
      await db.collection('bookings').doc(booking_id).update({
        booking_status: 'accepted',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await db.collection('notifications').add({
        user_id: bookingData.customer_id,
        notification_type: 'booking_accepted',
        title: 'Booking Accepted',
        message: 'Your booking request has been accepted',
        booking_id: booking_id,
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

      const bookingDoc = await db.collection('bookings').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Update booking status
      await db.collection('bookings').doc(booking_id).update({
        booking_status: 'rejected',
        rejection_reason: rejection_reason || 'Not available',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify customer
      await db.collection('notifications').add({
        user_id: bookingData.customer_id,
        notification_type: 'booking_rejected',
        title: 'Booking Rejected',
        message: rejection_reason || 'Your booking request was not accepted',
        booking_id: booking_id,
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

      const bookingDoc = await db.collection('bookings').doc(booking_id).get();
      
      if (!bookingDoc.exists) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingData = bookingDoc.data();

      // Verify ownership
      if (bookingData.owner_id !== ownerId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      await db.collection('bookings').doc(booking_id).update({
        booking_status: 'completed',
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

      // Get all accepted/pending bookings for this equipment
      const bookingsSnapshot = await db.collection('bookings')
        .where('equipment_id', '==', equipment_id)
        .where('booking_status', 'in', ['pending', 'accepted'])
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
