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

      if (constraints.length > 0) {
        q = query(q, ...constraints);
        const querySnapshot = await getDocs(q);
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
          const searchLower = filters.search.toLowerCase();
          results = results.filter(
            (item) =>
              item.name.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower)
          );
        }

        return results;
      } else {
        const querySnapshot = await getDocs(collection(db, 'equipment'));
        let results = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Apply client-side filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
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

  async getEquipmentById(id) {
    try {
      const docSnap = await getDoc(doc(db, 'equipment', id));
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      }
      return null;
    } catch (error) {
      console.error('Error fetching equipment:', error);
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

  async getEquipmentByCategory(category) {
    try {
      const q = query(
        collection(db, 'equipment'),
        where('category', '==', category)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
    } catch (error) {
      console.error('Error fetching equipment by category:', error);
      throw error;
    }
  }
}

export default new EquipmentService();
