import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

class EquipmentService {

  /* ==============================
     SEARCH EQUIPMENT
  ============================== */

  async searchEquipment(filters) {
    try {

      let q = collection(db, "equipment");
      const constraints = [];

      if (filters.category && filters.category !== "all") {
        constraints.push(where("category", "==", filters.category));
      }

      if (filters.location && filters.location !== "all") {
        constraints.push(where("location", "==", filters.location));
      }

      if (filters.availability_status === "available") {
        constraints.push(where("availability_status", "==", "available"));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);

      let results = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      /* Client-side filters */

      if (filters.search) {
        const searchLower = String(filters.search).toLowerCase();

        results = results.filter(
          (item) =>
            item.name?.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)
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

    } catch (error) {
      console.error("Error searching equipment:", error);
      throw error;
    }
  }

  /* ==============================
     GET ALL EQUIPMENT
  ============================== */

  async getAllEquipment() {
    try {

      const snapshot = await getDocs(collection(db, "equipment"));

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

    } catch (error) {
      console.error("Error fetching equipment:", error);
      throw error;
    }
  }

  /* ==============================
     GET EQUIPMENT BY ID
  ============================== */

  async getEquipmentById(equipmentId) {
    try {

      const ref = doc(db, "equipment", equipmentId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        throw new Error("Equipment not found");
      }

      return {
        id: snap.id,
        ...snap.data(),
      };

    } catch (error) {
      console.error("Error fetching equipment:", error);
      throw error;
    }
  }

  /* ==============================
     DYNAMIC PRICING
  ============================== */

  async calculateDynamicPrice(equipment) {
    try {

      const basePrice = equipment.price_per_day;

      /* Demand Multiplier (based on recent bookings) */

      const thirtyDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("equipment_id", "==", equipment.id),
        where("booking_date", ">=", thirtyDaysAgo)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);

      const bookingCount = bookingsSnapshot.size;

      let demandMultiplier = 1.0;

      if (bookingCount > 10) demandMultiplier = 1.2;
      else if (bookingCount > 5) demandMultiplier = 1.1;

      /* Availability Multiplier */

      const units = equipment.available_units || 0;

      let availabilityMultiplier = 1.0;

      if (units <= 2) availabilityMultiplier = 1.2;
      else if (units <= 5) availabilityMultiplier = 1.1;

      /* Seasonal Multiplier */

      const currentMonth = new Date().getMonth() + 1;

      const seasonalMultiplier =
        [3, 4, 5, 9, 10].includes(currentMonth) ? 1.3 : 1.0;

      /* Final Dynamic Price */

      const dynamicPrice =
        basePrice *
        demandMultiplier *
        availabilityMultiplier *
        seasonalMultiplier;

      return parseFloat(dynamicPrice.toFixed(2));

    } catch (error) {

      console.error("Dynamic pricing error:", error);

      return equipment.price_per_day;
    }
  }

  /* ==============================
     GET EQUIPMENT WITH DYNAMIC PRICING
  ============================== */

  async getAllEquipmentWithDynamicPricing() {
    try {

      const snapshot = await getDocs(collection(db, "equipment"));

      const equipmentList = await Promise.all(

        snapshot.docs.map(async (docSnap) => {

          const equipment = {
            ...docSnap.data(),
            id: docSnap.id,
          };

          const dynamicPrice =
            await this.calculateDynamicPrice(equipment);

          equipment.dynamic_price = dynamicPrice;

          return equipment;
        })
      );

      return equipmentList;

    } catch (error) {
      console.error("Error fetching equipment with pricing:", error);
      throw error;
    }
  }

  /* ==============================
     OWNER DETAILS
  ============================== */

  async getOwnerDetails(ownerId) {
    try {

      const ownerDoc = await getDoc(doc(db, "owners", ownerId));

      if (!ownerDoc.exists()) {
        throw new Error("Owner not found");
      }

      return ownerDoc.data();

    } catch (error) {
      console.error("Owner fetch error:", error);
      throw error;
    }
  }

  /* ==============================
     NOTIFY WHEN AVAILABLE
  ============================== */

  async notifyWhenAvailable(request) {
    try {

      const {
        customer_id,
        phone_number,
        equipment_name,
        location
      } = request;

      if (!customer_id || !phone_number || !equipment_name || !location) {
        throw new Error("All fields are required");
      }

      const requestDoc = {
        customer_id,
        phone_number,
        equipment_name,
        location,
        status: "pending",
        created_at: Timestamp.now(),
      };

      await addDoc(collection(db, "equipment_requests"), requestDoc);

    } catch (error) {
      console.error("Notify error:", error);
      throw error;
    }
  }

  /* ==============================
     REQUEST EQUIPMENT
  ============================== */

  async requestItem(request) {
    try {

      const {
        customer_id,
        customer_name,
        equipment_id,
        start_date,
        end_date,
        phone_number = "",
        location = "",
        message = ""
      } = request;

      if (!customer_id || !equipment_id || !start_date || !end_date) {
        throw new Error("Missing required booking fields");
      }

      // Fetch equipment details to get owner_id and equipment_name
      const equipment = await this.getEquipmentById(equipment_id);
      if (!equipment) {
        throw new Error("Equipment not found");
      }

      const owner_id = equipment.owner_id || equipment.ownerId;
      if (!owner_id) {
        throw new Error("Equipment owner not found");
      }

      const equipment_name = equipment.name;

      // Convert JS Date objects to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(new Date(start_date));
      const endTimestamp = Timestamp.fromDate(new Date(end_date));

      console.log("Creating request with details:", {
        customer_id,
        customer_name,
        equipment_id,
        equipment_name,
        owner_id,
        start_date: start_date,
        end_date: end_date,
        location,
        phone_number,
      });

      const requestDoc = {
        equipment_id,
        equipment_name,
        customer_id,
        customer_name,
        owner_id,
        start_date: startTimestamp,
        end_date: endTimestamp,
        location,
        phone_number,
        booking_status: "pending",
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "equipment_requests"),
        requestDoc
      );

      return docRef.id;

    } catch (error) {
      console.error("Request item error:", error);
      throw error;
    }
  }

}

const equipmentService = new EquipmentService();

export default equipmentService;