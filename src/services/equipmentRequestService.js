import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

class EquipmentRequestService {
  async createEquipmentRequest(requestData) {
    try {
      const request = {
        ...requestData,
        request_status: 'pending',
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'equipment_requests'), request);
      return { id: docRef.id, ...request };
    } catch (error) {
      console.error('Error creating equipment request:', error);
      throw error;
    }
  }

  async getRequestsByCustomerId(customerId) {
    try {
      const q = query(
        collection(db, 'equipment_requests'),
        where('customer_id', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching equipment requests:', error);
      throw error;
    }
  }
}

export default new EquipmentRequestService();
