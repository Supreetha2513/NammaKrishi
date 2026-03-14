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
      // Fetch equipment details to get owner_id and equipment_name
      const equipment = await this.getEquipmentById(bookingData.equipment_id);
      if (!equipment) {
        throw new Error("Equipment not found");
      }

      const owner_id = equipment.owner_id || equipment.ownerId;
      if (!owner_id) {
        throw new Error("Equipment owner not found");
      }

      const equipment_name = equipment.name;
      const customer_name = bookingData.customer_name || 'Unknown User';

      const booking = {
        ...bookingData,
        equipment_name,
        customer_name,
        owner_id,
        start_date: Timestamp.fromDate(new Date(bookingData.start_date)),
        end_date: Timestamp.fromDate(new Date(bookingData.end_date)),
        created_at: Timestamp.now(),
        booking_status: 'pending',
        payment_status: 'pending',
      };

      console.log('Creating booking with details:', {
        equipment_id: bookingData.equipment_id,
        equipment_name,
        customer_id: bookingData.customer_id,
        customer_name,
        owner_id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
      });

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
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          start_date: data.start_date?.toDate ? data.start_date.toDate() : data.start_date,
          end_date: data.end_date?.toDate ? data.end_date.toDate() : data.end_date,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        };
      });
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      throw error;
    }
  }

  async getEquipmentById(equipmentId) {
    try {
      const docRef = doc(db, 'equipment', equipmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Equipment not found');
      }
    } catch (error) {
      console.error('Error fetching equipment by ID:', error);
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

  async updateBookingPaymentStatus(bookingId, paymentStatus) {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        payment_status: paymentStatus,
      });
    } catch (error) {
      console.error('Error updating booking payment status:', error);
      throw error;
    }
  }

  async getBookingsByCustomerIdAndPaymentStatus(customerId, paymentStatus) {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('customer_id', '==', customerId),
        where('payment_status', '==', paymentStatus)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          start_date: data.start_date?.toDate ? data.start_date.toDate() : data.start_date,
          end_date: data.end_date?.toDate ? data.end_date.toDate() : data.end_date,
          created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        };
      });
    } catch (error) {
      console.error('Error fetching bookings by payment status:', error);
      throw error;
    }
  }

  async updatePayment(paymentId, updateData) {
    try {
      await updateDoc(doc(db, 'payments', paymentId), updateData);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

export default new BookingService();
