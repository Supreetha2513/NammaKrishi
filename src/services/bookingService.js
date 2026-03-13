import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import axios from 'axios';

class BookingService {
  async createBooking(bookingData) {
    try {
      const booking = {
        ...bookingData,
        created_at: Timestamp.now(),
        booking_status: 'pending',
        payment_status: 'pending',
      };

      const docRef = await addDoc(collection(db, 'bookings'), booking);
      return { id: docRef.id, ...booking };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookingsByCustomerId(customerId) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('customer_id', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      throw error;
    }
  }

  async getBookingById(bookingId) {
    try {
      const docSnap = await getDoc(doc(db, 'bookings', bookingId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId, status) {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        booking_status: status,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  async createRazorpayOrder(bookingData) {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/createRazorpayOrder`,
        bookingData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  async verifyPayment(paymentData) {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/verifyPayment`,
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }
}

export default new BookingService();
