import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

class EquipmentRequestService {
  async createEquipmentRequest(requestData) {
    try {
      const request = {
        ...requestData,
        booking_status: 'pending',
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
      console.error('Error fetching equipment requests:', error);
      throw error;
    }
  }
}

export default new EquipmentRequestService();
