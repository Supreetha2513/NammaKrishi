import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

class EquipmentService {
  async searchEquipment(filters) {
    try {
      let q = collection(db, 'equipment');
      const constraints = [];

      if (filters.category && filters.category !== 'all') {
        constraints.push(where('category', '==', filters.category));
      }

      if (filters.location) {
        constraints.push(where('location', '==', filters.location));
      }

      if (filters.availability_status === 'available') {
        constraints.push(where('availability_status', '==', 'available'));
      }

      console.log('Filters applied:', filters);
      console.log('Query constraints:', constraints);

      if (constraints.length > 0) {
        q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);
        console.log('Query results:', querySnapshot.docs.map((doc) => doc.data()));
        let results = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Filter by price range on client side
        if (filters.priceRange) {
          results = results.filter(
            (item) =>
              item.price_per_day >= filters.priceRange[0] &&
              item.price_per_day <= filters.priceRange[1]
          );
        }

        // Filter by name on client side
        if (filters.search) {
          const searchLower = String(filters.search).toLowerCase();
          results = results.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower)
          );
        }

        console.log('Filtered results:', results);
        return results;
      } else {
        const querySnapshot = await getDocs(collection(db, 'equipment'));
        let results = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Apply client-side filters
        if (filters.search) {
          const searchLower = String(filters.search).toLowerCase();
          results = results.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower)
          );
        }

        if (filters.priceRange) {
          results = results.filter(
            (item) =>
              item.price_per_day >= filters.priceRange[0] &&
              item.price_per_day <= filters.priceRange[1]
          );
        }

        return results;
      }
    } catch (error) {
      console.error('Error searching equipment:', error);
      throw error;
    }
  }

  async notifyWhenAvailable(request) {
    try {
      const { customer_id, phone_number, equipment_name, location } = request;
      if (!customer_id || !phone_number || !equipment_name || !location) {
        throw new Error('All fields are required for the notification request');
      }

      const requestDoc = {
        customer_id,
        phone_number,
        equipment_name,
        location,
        status: 'pending',
        created_at: Timestamp.now(),
      };

      await addDoc(collection(db, 'equipment_requests'), requestDoc);
      console.log('Notification request added successfully:', requestDoc);
    } catch (error) {
      console.error('Error adding notification request:', error);
      throw error;
    }
  }

  async getAllEquipment() {
    try {
      const querySnapshot = await getDocs(collection(db, 'equipment'));
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
    } catch (error) {
      console.error('Error fetching all equipment:', error);
      throw error;
    }
  }

  async calculateDynamicPrice(equipment) {
    try {
      const basePrice = equipment.price_per_day;

      // Calculate demand factor (e.g., based on recent searches or bookings)
      const demandFactor = Math.min(equipment.recent_searches || 0, 10) * 10; // Example: +10 for each recent search, capped at 10

      // Calculate availability factor (e.g., based on available units)
      const availabilityFactor = equipment.available_units > 5 ? 0 : (5 - equipment.available_units) * 20; // Example: -20 for each unit below 5

      // Fetch bookings in the last 30 days
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('equipment_id', '==', equipment.id),
        where('booking_date', '>=', thirtyDaysAgo)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingCount = bookingsSnapshot.size;

      // Adjust price based on booking count
      let bookingFactor = 0;
      if (bookingCount >= 3) {
        bookingFactor = basePrice; // Double the price
      } else if (bookingCount < 3) {
        bookingFactor = -basePrice / 2; // Reduce price by half
      }

      // Calculate dynamic price
      const dynamicPrice = basePrice + demandFactor + availabilityFactor + bookingFactor;

      return dynamicPrice;
    } catch (error) {
      console.error('Error calculating dynamic price:', error);
      return equipment.price_per_day; // Fallback to base price in case of error
    }
  }

  async getAllEquipmentWithDynamicPricing() {
    try {
      const querySnapshot = await getDocs(collection(db, 'equipment'));
      const equipmentList = querySnapshot.docs.map((doc) => {
        const equipment = { ...doc.data(), id: doc.id };
        equipment.dynamic_price = this.calculateDynamicPrice(equipment);
        return equipment;
      });
      return equipmentList;
    } catch (error) {
      console.error('Error fetching equipment with dynamic pricing:', error);
      throw error;
    }
  }
}

const equipmentService = new EquipmentService();
export default equipmentService;
