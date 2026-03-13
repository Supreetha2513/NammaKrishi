// CUSTOMER PORTAL - Equipment Booking Component Example
// This demonstrates how a customer portal would create bookings
// that sync with the owner portal in real-time via Firestore

import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import api from '../services/api';

function CustomerEquipmentBooking({ equipment, ownerId }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [availability, setAvailability] = useState(null);

  // Calculate total price when dates change
  useEffect(() => {
    if (startDate && endDate && equipment.rental_price) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        setTotalPrice(days * equipment.rental_price);
        checkAvailability();
      } else {
        setTotalPrice(0);
      }
    }
  }, [startDate, endDate, equipment.rental_price]);

  // Check availability for selected dates
  const checkAvailability = async () => {
    if (!startDate || !endDate) return;

    try {
      // Method 1: Using backend API (recommended)
      const response = await api.get('/bookings/availability', {
        params: {
          equipment_id: equipment.id,
          start_date: startDate,
          end_date: endDate
        }
      });

      setAvailability(response.data.available);
      setConflicts(response.data.conflicts || []);

    } catch (error) {
      console.error('Error checking availability:', error);
      
      // Method 2: Direct Firestore query (fallback)
      checkAvailabilityDirectly();
    }
  };

  // Alternative: Check availability directly from Firestore
  const checkAvailabilityDirectly = async () => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('equipment_id', '==', equipment.id),
      where('booking_status', 'in', ['pending', 'accepted'])
    );

    const snapshot = await getDocs(q);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const hasConflict = snapshot.docs.some(doc => {
      const booking = doc.data();
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      // Date overlap logic
      return (start <= bookingEnd && end >= bookingStart);
    });

    setAvailability(!hasConflict);
  };

  // Create booking (writes to Firestore)
  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('Please select dates');
      return;
    }

    if (availability === false) {
      alert('Equipment is not available for these dates');
      return;
    }

    setLoading(true);

    try {
      const customerId = localStorage.getItem('userId'); // Customer's user ID

      // Method 1: Using backend API (BEST - has validation & notifications)
      const response = await api.post('/bookings', {
        equipment_id: equipment.id,
        owner_id: ownerId,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice
      });

      if (response.data.success) {
        alert('Booking request sent successfully!');
        
        // Reset form
        setStartDate('');
        setEndDate('');
        setTotalPrice(0);
        
        // Optionally navigate to bookings page
        // navigate('/my-bookings');
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Create booking directly in Firestore (not recommended - bypasses validation)
  const createBookingDirectly = async () => {
    const customerId = localStorage.getItem('userId');

    const bookingData = {
      equipment_id: equipment.id,
      owner_id: ownerId,
      customer_id: customerId,
      start_date: startDate,
      end_date: endDate,
      total_price: totalPrice,
      booking_status: 'pending',
      payment_status: 'unpaid',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    // Write to Firestore
    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

    // Create notification for owner
    await addDoc(collection(db, 'notifications'), {
      user_id: ownerId,
      notification_type: 'booking_request',
      title: 'New Booking Request',
      message: `New booking request for ${equipment.name}`,
      booking_id: bookingRef.id,
      status: 'unread',
      created_at: serverTimestamp()
    });

    console.log('Booking created:', bookingRef.id);
  };

  return (
    <div className="booking-form-container">
      <h2>Book {equipment.name}</h2>
      <p>₹{equipment.rental_price}/day</p>

      <form onSubmit={handleCreateBooking}>
        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {startDate && endDate && (
          <div className="booking-summary">
            <p><strong>Duration:</strong> {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days</p>
            <p><strong>Total Price:</strong> ₹{totalPrice.toLocaleString()}</p>
            
            {availability === false && (
              <div className="availability-warning">
                ⚠️ Equipment is already booked for these dates
              </div>
            )}
            
            {availability === true && (
              <div className="availability-success">
                ✅ Equipment is available!
              </div>
            )}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || availability === false}
          className="btn-book-now"
        >
          {loading ? 'Sending Request...' : 'Send Booking Request'}
        </button>
      </form>

      <div className="booking-info">
        <h4>How it works:</h4>
        <ol>
          <li>Select your rental dates</li>
          <li>Submit booking request</li>
          <li>Owner reviews and accepts/rejects</li>
          <li>You get notified instantly via Firestore real-time updates</li>
          <li>If accepted, proceed with payment</li>
        </ol>
      </div>
    </div>
  );
}

// Example: Customer's "My Bookings" page with real-time updates
function CustomerMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupRealtimeListener();
  }, []);

  // Real-time listener for customer's bookings
  const setupRealtimeListener = () => {
    const customerId = localStorage.getItem('userId');
    
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('customer_id', '==', customerId)
    );

    // Real-time listener - automatically updates when owner accepts/rejects
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  return (
    <div className="customer-bookings">
      <h1>My Bookings</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        bookings.map(booking => (
          <div key={booking.id} className="booking-item">
            <h3>Equipment ID: {booking.equipment_id}</h3>
            <p>Dates: {booking.start_date} - {booking.end_date}</p>
            <p>Total: ₹{booking.total_price}</p>
            <p>Status: 
              <span className={`status-${booking.booking_status}`}>
                {booking.booking_status}
              </span>
            </p>
            
            {booking.booking_status === 'pending' && (
              <div className="status-info">
                ⏳ Waiting for owner to review
              </div>
            )}
            
            {booking.booking_status === 'accepted' && (
              <div className="status-info success">
                ✅ Booking accepted! Proceed to payment
              </div>
            )}
            
            {booking.booking_status === 'rejected' && (
              <div className="status-info error">
                ❌ Booking rejected
                {booking.rejection_reason && (
                  <p>Reason: {booking.rejection_reason}</p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export { CustomerEquipmentBooking, CustomerMyBookings };

/*
==============================================
HOW THE BOOKING SYNC WORKS:
==============================================

1. SHARED FIRESTORE DATABASE
   - Both customer and owner portals connect to the same Firestore instance
   - Collection: "bookings"

2. CUSTOMER CREATES BOOKING
   - Customer fills form, selects dates
   - POST /bookings API endpoint (or direct Firestore write)
   - Booking document created with status: "pending"

3. REAL-TIME SYNC TO OWNER
   - Owner portal has onSnapshot listener on 'bookings' collection
   - Filtered by: where('owner_id', '==', ownerId)
   - The moment customer creates booking → it appears in owner's dashboard
   - No polling, no refresh needed!

4. OWNER ACCEPTS/REJECTS
   - Owner clicks "Accept" or "Reject" button
   - Updates Firestore: booking_status = "accepted" or "rejected"
   - Notification created for customer

5. CUSTOMER SEES UPDATE
   - Customer portal also has onSnapshot listener
   - Filtered by: where('customer_id', '==', customerId)
   - Status change appears instantly!

6. DOUBLE-BOOKING PREVENTION
   - Before creating booking, check for conflicts
   - Query bookings with status "pending" or "accepted"
   - Check date overlap using the formula:
     new_start <= existing_end AND new_end >= existing_start

==============================================
FIRESTORE COLLECTIONS STRUCTURE:
==============================================

bookings/
  {booking_id}:
    equipment_id: string
    owner_id: string
    customer_id: string
    start_date: string (YYYY-MM-DD)
    end_date: string (YYYY-MM-DD)
    total_price: number
    booking_status: "pending" | "accepted" | "rejected" | "completed"
    payment_status: "unpaid" | "paid"
    created_at: timestamp
    updated_at: timestamp

notifications/
  {notification_id}:
    user_id: string (owner or customer)
    notification_type: string
    title: string
    message: string
    booking_id: string (reference)
    status: "read" | "unread"
    created_at: timestamp

equipment/
  {equipment_id}:
    name: string
    owner_id: string
    rental_price: number
    ...other fields

==============================================
KEY POINTS:
==============================================

✅ Both portals share the SAME Firestore database
✅ Use onSnapshot() for real-time updates (not .get())
✅ Status lifecycle: pending → accepted → completed
✅ Always check for date conflicts before creating bookings
✅ Notifications keep both parties informed
✅ No complex backend sync needed - Firestore handles it!

*/
