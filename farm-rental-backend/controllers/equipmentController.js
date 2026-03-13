const { db, bucket } = require("../config/firebase");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const equipmentController = {
  // Get all equipment for the logged-in owner with analytics
  getMyEquipment: async (req, res) => {
    try {
      const snapshot = await db.collection("equipment")
        .where("owner_id", "==", req.user.uid)
        .get();
      
      const equipment = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get verification status (with error handling)
        let verificationStatus = 'pending';
        try {
          const verificationDoc = await db.collection("equipment_verification")
            .where("equipment_id", "==", doc.id)
            .limit(1)
            .get();
          
          verificationStatus = verificationDoc.empty 
            ? 'pending' 
            : verificationDoc.docs[0].data().verification_status;
        } catch (err) {
          console.log('Verification query error:', err.message);
        }

        // Get booking analytics (with error handling)
        let timesRented = 0;
        let totalRevenue = 0;
        try {
          const bookingsSnapshot = await db.collection("bookings")
            .where("equipment_id", "==", doc.id)
            .where("booking_status", "==", "completed")
            .get();
          
          timesRented = bookingsSnapshot.size;
          bookingsSnapshot.docs.forEach(booking => {
            totalRevenue += booking.data().total_price || 0;
          });
        } catch (err) {
          console.log('Bookings query error:', err.message);
        }

        // Get SMS alert count (with error handling)
        let smsAlertCount = 0;
        try {
          const requestsSnapshot = await db.collection("equipment_requests")
            .where("equipment_name", "==", data.name)
            .where("request_status", "==", "pending")
            .get();
          
          smsAlertCount = requestsSnapshot.size;
        } catch (err) {
          console.log('Requests query error:', err.message);
        }

        // Get maintenance data (with error handling)
        let lastMaintenance = null;
        try {
          const maintenanceSnapshot = await db.collection("equipment_maintenance")
            .where("equipment_id", "==", doc.id)
            .limit(1)
            .get();
          
          lastMaintenance = maintenanceSnapshot.empty 
            ? null 
            : maintenanceSnapshot.docs[0].data();
        } catch (err) {
          console.log('Maintenance query error:', err.message);
        }

        // Get dynamic pricing data (with error handling)
        let dynamicPricing = null;
        try {
          const pricingSnapshot = await db.collection("dynamic_pricing")
            .where("equipment_id", "==", doc.id)
            .limit(1)
            .get();
          
          dynamicPricing = pricingSnapshot.empty 
            ? null 
            : pricingSnapshot.docs[0].data();
        } catch (err) {
          console.log('Pricing query error:', err.message);
        }

        equipment.push({
          id: doc.id,
          ...data,
          verification_status: verificationStatus,
          analytics: {
            times_rented: timesRented,
            total_revenue: totalRevenue,
            sms_alert_count: smsAlertCount
          },
          last_maintenance: lastMaintenance,
          dynamic_pricing: dynamicPricing,
          created_at: data.created_at?.toDate?.()?.toISOString() || null
        });
      }

      res.json({ success: true, equipment });
    } catch (error) {
      console.error('Get equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get single equipment by ID
  getEquipmentById: async (req, res) => {
    try {
      const doc = await db.collection("equipment").doc(req.params.id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      const data = doc.data();
      
      // Verify ownership
      if (data.owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      res.json({ success: true, equipment: { id: doc.id, ...data } });
    } catch (error) {
      console.error('Get equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add new equipment with extended specifications
  addEquipment: async (req, res) => {
    try {
      const { 
        name, category, description, price_per_hour, price_per_day, location, 
        image_url, image_urls, horsepower, fuel_type, year_of_manufacture, 
        model_number, gps_location, status 
      } = req.body;

      // Validate required fields
      if (!name || !category || !price_per_hour || !price_per_day || !location) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      const equipmentData = {
        owner_id: req.user.uid,
        name,
        category,
        description: description || '',
        price_per_hour: parseFloat(price_per_hour),
        price_per_day: parseFloat(price_per_day),
        location,
        availability_status: status || "available",
        image_url: image_url || '',
        image_urls: image_urls || [],
        // Technical specifications - handle empty strings
        horsepower: horsepower && horsepower !== '' ? horsepower : null,
        fuel_type: fuel_type && fuel_type !== '' ? fuel_type : null,
        year_of_manufacture: year_of_manufacture && year_of_manufacture !== '' ? year_of_manufacture : null,
        model_number: model_number && model_number !== '' ? model_number : null,
        gps_location: gps_location && gps_location !== '' ? gps_location : null,
        created_at: new Date()
      };

      const docRef = await db.collection("equipment").add(equipmentData);

      // Auto-create verification entry
      await db.collection("equipment_verification").add({
        equipment_id: docRef.id,
        owner_id: req.user.uid,
        verification_status: 'pending',
        created_at: new Date()
      });

      res.status(201).json({ 
        success: true, 
        message: 'Equipment added successfully',
        equipment: { id: docRef.id, ...equipmentData }
      });
    } catch (error) {
      console.error('Add equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update equipment
  updateEquipment: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, category, description, price_per_hour, price_per_day, location, 
        image_url, image_urls, horsepower, fuel_type, year_of_manufacture, 
        model_number, gps_location 
      } = req.body;

      // Get existing equipment
      const doc = await db.collection("equipment").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      // Verify ownership
      if (doc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (price_per_hour) updateData.price_per_hour = parseFloat(price_per_hour);
      if (price_per_day) updateData.price_per_day = parseFloat(price_per_day);
      if (location) updateData.location = location;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (image_urls !== undefined) updateData.image_urls = image_urls;
      // Handle optional fields - convert empty strings to null
      if (horsepower !== undefined) updateData.horsepower = horsepower && horsepower !== '' ? horsepower : null;
      if (fuel_type !== undefined) updateData.fuel_type = fuel_type && fuel_type !== '' ? fuel_type : null;
      if (year_of_manufacture !== undefined) updateData.year_of_manufacture = year_of_manufacture && year_of_manufacture !== '' ? year_of_manufacture : null;
      if (model_number !== undefined) updateData.model_number = model_number && model_number !== '' ? model_number : null;
      if (gps_location !== undefined) updateData.gps_location = gps_location && gps_location !== '' ? gps_location : null;

      await db.collection("equipment").doc(id).update(updateData);

      res.json({ 
        success: true, 
        message: 'Equipment updated successfully',
        equipment: { id, ...doc.data(), ...updateData }
      });
    } catch (error) {
      console.error('Update equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Toggle availability
  toggleAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { availability_status } = req.body;

      if (!['available', 'unavailable', 'rented'].includes(availability_status)) {
        return res.status(400).json({ error: 'Invalid availability status' });
      }

      const doc = await db.collection("equipment").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (doc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await db.collection("equipment").doc(id).update({ availability_status });

      res.json({ 
        success: true, 
        message: 'Availability updated successfully',
        availability_status
      });
    } catch (error) {
      console.error('Toggle availability error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete equipment
  deleteEquipment: async (req, res) => {
    try {
      const { id } = req.params;

      const doc = await db.collection("equipment").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (doc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if there are active bookings
      const activeBookings = await db.collection("bookings")
        .where("equipment_id", "==", id)
        .where("booking_status", "in", ["pending", "accepted"])
        .get();

      if (!activeBookings.empty) {
        return res.status(400).json({ 
          error: 'Cannot delete equipment with active bookings' 
        });
      }

      await db.collection("equipment").doc(id).delete();

      res.json({ 
        success: true, 
        message: 'Equipment deleted successfully'
      });
    } catch (error) {
      console.error('Delete equipment error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get equipment analytics and details
  getEquipmentAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await db.collection("equipment").doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (doc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Get maintenance logs (with error handling)
      let maintenanceLogs = [];
      try {
        const maintenanceSnapshot = await db.collection("equipment_maintenance")
          .where("equipment_id", "==", id)
          .get();
        
        maintenanceLogs = maintenanceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          service_date: doc.data().service_date?.toDate?.()?.toISOString()
        }));
      } catch (err) {
        console.log('Maintenance logs error:', err.message);
      }

      // Get availability calendar (with error handling)
      let availability = [];
      try {
        const availabilitySnapshot = await db.collection("equipment_availability")
          .where("equipment_id", "==", id)
          .get();
        
        availability = availabilitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.()?.toISOString()
        }));
      } catch (err) {
        console.log('Availability error:', err.message);
      }

      // Get booking history (with error handling)
      let bookings = [];
      try {
        const bookingsSnapshot = await db.collection("bookings")
          .where("equipment_id", "==", id)
          .get();
        
        bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          start_date: doc.data().start_date?.toDate?.()?.toISOString(),
          end_date: doc.data().end_date?.toDate?.()?.toISOString(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString()
        }));
      } catch (err) {
        console.log('Bookings error:', err.message);
      }

      res.json({
        success: true,
        analytics: {
          maintenance_logs: maintenanceLogs,
          availability_calendar: availability,
          booking_history: bookings
        }
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add maintenance log
  addMaintenanceLog: async (req, res) => {
    try {
      const { equipment_id, service_type, service_notes, service_date, next_service_due } = req.body;

      // Verify equipment ownership
      const equipmentDoc = await db.collection("equipment").doc(equipment_id).get();
      if (!equipmentDoc.exists || equipmentDoc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const maintenanceData = {
        equipment_id,
        owner_id: req.user.uid,
        service_type,
        service_notes: service_notes || '',
        service_date: new Date(service_date),
        next_service_due: next_service_due ? new Date(next_service_due) : null,
        created_at: new Date()
      };

      const docRef = await db.collection("equipment_maintenance").add(maintenanceData);

      res.status(201).json({
        success: true,
        message: 'Maintenance log added successfully',
        log: { id: docRef.id, ...maintenanceData }
      });
    } catch (error) {
      console.error('Add maintenance log error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update dynamic pricing
  updateDynamicPricing: async (req, res) => {
    try {
      const { equipment_id, enabled, price_multiplier, season, start_date, end_date } = req.body;

      // Verify equipment ownership
      const equipmentDoc = await db.collection("equipment").doc(equipment_id).get();
      if (!equipmentDoc.exists || equipmentDoc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if pricing document exists
      const pricingSnapshot = await db.collection("dynamic_pricing")
        .where("equipment_id", "==", equipment_id)
        .limit(1)
        .get();

      const pricingData = {
        equipment_id,
        enabled: enabled !== undefined ? enabled : true,
        price_multiplier: price_multiplier || 1.0,
        season: season || 'peak',
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        updated_at: new Date()
      };

      if (pricingSnapshot.empty) {
        // Create new
        const docRef = await db.collection("dynamic_pricing").add({
          ...pricingData,
          created_at: new Date()
        });
        res.status(201).json({
          success: true,
          message: 'Dynamic pricing created',
          pricing: { id: docRef.id, ...pricingData }
        });
      } else {
        // Update existing
        const docId = pricingSnapshot.docs[0].id;
        await db.collection("dynamic_pricing").doc(docId).update(pricingData);
        res.json({
          success: true,
          message: 'Dynamic pricing updated',
          pricing: { id: docId, ...pricingData }
        });
      }
    } catch (error) {
      console.error('Update dynamic pricing error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Set blackout dates (unavailable periods)
  // Set blackout dates (unavailable periods)
  setBlackoutDates: async (req, res) => {
    try {
      console.log('Set blackout dates request body:', req.body);
      const { equipment_id, start_date, end_date } = req.body;

      if (!equipment_id || !start_date || !end_date) {
        return res.status(400).json({ 
          error: 'Missing required fields: equipment_id, start_date, end_date' 
        });
      }

      // Verify equipment ownership
      const equipmentDoc = await db.collection("equipment").doc(equipment_id).get();
      if (!equipmentDoc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }
      
      if (equipmentDoc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Generate dates between start and end
      const dates = [];
      const currentDate = new Date(start_date);
      const endDateTime = new Date(end_date);
      
      while (currentDate <= endDateTime) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Blocking ${dates.length} dates for equipment ${equipment_id}`);

      // Add blackout dates to availability calendar
      const batch = db.batch();
      
      for (const date of dates) {
        // Create a unique ID based on equipment and date
        const dateStr = date.toISOString().split('T')[0];
        const docId = `${equipment_id}_${dateStr}`;
        const availabilityRef = db.collection("equipment_availability").doc(docId);
        
        batch.set(availabilityRef, {
          equipment_id,
          date: date,
          availability_status: 'blackout',
          booking_id: null,
          created_at: new Date()
        }, { merge: true });
      }

      await batch.commit();

      console.log(`Successfully blocked ${dates.length} dates`);

      res.json({
        success: true,
        message: 'Blackout dates set successfully',
        dates_blocked: dates.length
      });
    } catch (error) {
      console.error('Set blackout dates error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get calendar availability for equipment
  getCalendarAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;

      // Verify equipment exists and ownership
      const equipmentDoc = await db.collection("equipment").doc(id).get();
      if (!equipmentDoc.exists) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (equipmentDoc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Layer 1: Get confirmed bookings
      let bookings = [];
      try {
        const bookingsSnapshot = await db.collection("bookings")
          .where("equipment_id", "==", id)
          .where("booking_status", "in", ["accepted", "pending"])
          .get();
        
        bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          start_date: doc.data().start_date?.toDate?.()?.toISOString(),
          end_date: doc.data().end_date?.toDate?.()?.toISOString(),
          status: doc.data().booking_status,
          customer_id: doc.data().customer_id,
          total_price: doc.data().total_price,
          type: 'booking',
          editable: false
        }));
      } catch (err) {
        console.log('Bookings query error:', err.message);
      }

      // Layer 2: Get owner blackout dates
      let blackoutDates = [];
      try {
        const availabilitySnapshot = await db.collection("equipment_availability")
          .where("equipment_id", "==", id)
          .where("availability_status", "==", "blackout")
          .get();
        
        blackoutDates = availabilitySnapshot.docs.map(doc => ({
          id: doc.id,
          date: doc.data().date?.toDate?.()?.toISOString(),
          type: 'blackout',
          editable: true
        }));
      } catch (err) {
        console.log('Availability query error:', err.message);
      }

      // Layer 3: Get dynamic pricing periods
      let pricingPeriods = [];
      try {
        const pricingSnapshot = await db.collection("dynamic_pricing")
          .where("equipment_id", "==", id)
          .where("enabled", "==", true)
          .get();
        
        pricingPeriods = pricingSnapshot.docs.map(doc => ({
          id: doc.id,
          start_date: doc.data().start_date?.toDate?.()?.toISOString(),
          end_date: doc.data().end_date?.toDate?.()?.toISOString(),
          price_multiplier: doc.data().price_multiplier,
          season: doc.data().season,
          type: 'pricing'
        }));
      } catch (err) {
        console.log('Pricing query error:', err.message);
      }

      res.json({
        success: true,
        calendar_data: {
          bookings,
          blackout_dates: blackoutDates,
          pricing_periods: pricingPeriods
        }
      });
    } catch (error) {
      console.error('Get calendar availability error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Remove blackout dates
  removeBlackoutDates: async (req, res) => {
    try {
      console.log('Remove blackout dates request body:', req.body);
      const { equipment_id, start_date, end_date } = req.body;

      if (!equipment_id || !start_date || !end_date) {
        return res.status(400).json({ 
          error: 'Missing required fields: equipment_id, start_date, end_date' 
        });
      }

      // Verify equipment ownership
      const equipmentDoc = await db.collection("equipment").doc(equipment_id).get();
      if (!equipmentDoc.exists || equipmentDoc.data().owner_id !== req.user.uid) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Generate dates between start and end
      const dates = [];
      const currentDate = new Date(start_date);
      const endDateTime = new Date(end_date);
      
      while (currentDate <= endDateTime) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const docId = `${equipment_id}_${dateStr}`;
        dates.push(docId);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Removing ${dates.length} blackout dates`);

      // Remove blackout dates
      const batch = db.batch();
      
      for (const docId of dates) {
        const availabilityRef = db.collection("equipment_availability").doc(docId);
        batch.delete(availabilityRef);
      }

      await batch.commit();

      // Check for pending equipment requests and send SMS notifications
      try {
        const equipmentData = equipmentDoc.data();
        const requestsSnapshot = await db.collection("equipment_requests")
          .where("equipment_name", "==", equipmentData.name)
          .where("request_status", "==", "pending")
          .where("location", "==", equipmentData.location)
          .get();

        if (!requestsSnapshot.empty) {
          // TODO: Trigger SMS notifications to farmers
          console.log(`Found ${requestsSnapshot.size} pending requests for ${equipmentData.name}`);
        }
      } catch (err) {
        console.log('SMS notification check error:', err.message);
      }

      res.json({
        success: true,
        message: 'Blackout dates removed successfully',
        dates_unblocked: dates.length
      });
    } catch (error) {
      console.error('Remove blackout dates error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = equipmentController;