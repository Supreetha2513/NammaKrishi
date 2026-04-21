const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const twilio = require("twilio");
const { generateListing } = require("./utils/aiUtils");
const { db } = require("./config/firebase");
const verifyOwner = require("./middleware/authMiddleware");

dotenv.config();

const app = express();

// Helper function: Fallback parser for WhatsApp messages
const fallbackParse = (message) => {
  const lower = message.toLowerCase();
  
  // Extract name (equipment type)
  let name = "";
  const equipmentTypes = ["tractor", "harvester", "harvestor", "rotavator", "pump", "baler", "plough", "rotovator"];
  for (const type of equipmentTypes) {
    if (lower.includes(type)) {
      if (type === "harvestor" || type === "harvester") {
        name = "Harvester";
      } else if (type === "rotavator" || type === "rotovator") {
        name = "Rotavator";
      } else {
        name = type.charAt(0).toUpperCase() + type.slice(1);
      }
      break;
    }
  }
  
  // Extract location (city/town name)
  let location = "";
  const locationPatterns = [
    /(?:location|place|city|in)\s*(?:is|:)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i,  // location is Mysore, in Bengaluru
    /in\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?:\s*[,\.]|$|\s+(?:₹|hp|diesel|petrol|electric))/i  // in Mysore,
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) {
      location = match[1].trim();
      // Capitalize properly
      location = location
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      if (location.length > 2 && location.length < 50) break;
    }
  }
  
  // Extract description - try multiple patterns
  let description = "";
  // Pattern 1: "Description: ..." 
  let descMatch = message.match(/description\s*[:=]?\s*(.+?)(?:gps|coordinates|email|phone|contact|$)/i);
  if (descMatch) {
    description = descMatch[1].trim().slice(0, 300);
  }
  // Pattern 2: If no description keyword, extract text between equipment type and technical specs
  if (!description) {
    // Extract everything that looks like a description (not numbers/prices)
    const afterEquip = message.split(/(?:gps|hp|horsepower|fuel|electric|diesel|petrol|price|₹|per\s*(?:hour|day))/i);
    if (afterEquip.length > 0) {
      const desc = afterEquip[0]
        .replace(/^[^a-z]*(?:tractor|harvester|harvestor|rotavator|pump|baler|plough|rotovator)[^a-z]*/i, "")
        .trim()
        .slice(0, 300);
      if (desc && desc.length > 5) {
        description = desc;
      }
    }
  }
  
  // Extract fuel type (Diesel, Petrol, Electric, CNG, etc.)
  let fuel_type = "";
  const fuelPatterns = [
    /(?:fuel|type|powered?|engine)\s*(?:is|:)?\s*(?:a\s+)?(?:diesel|petrol|electric|cng|hybrid)/i,  // fuel is diesel, fuel: diesel
    /(?:diesel|petrol|electric|cng|hybrid)\s*(?:engine|powered|fuel)?/i  // diesel engine, electric powered
  ];
  
  for (const pattern of fuelPatterns) {
    const match = message.match(pattern);
    if (match) {
      const fuelStr = match[0].toLowerCase();
      if (fuelStr.includes("diesel")) {
        fuel_type = "Diesel";
      } else if (fuelStr.includes("petrol")) {
        fuel_type = "Petrol";
      } else if (fuelStr.includes("electric")) {
        fuel_type = "Electric";
      } else if (fuelStr.includes("cng")) {
        fuel_type = "CNG";
      } else if (fuelStr.includes("hybrid")) {
        fuel_type = "Hybrid";
      }
      if (fuel_type) break;
    }
  }
  
  // Extract horsepower - handles: 70HP, 70 HP, 70 horsepower, hp 70, horsepower: 70, etc.
  let horsepower = null;
  const hpPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:hp|h\.p\.|horsepower)\b/i,      // 70HP, 70 HP, 70 horsepower
    /(?:hp|horsepower)\s*[:=]?\s*(\d+(?:\.\d+)?)/i,        // HP: 70 or horsepower: 70
    /\bhp[:\s]*(\d+(?:\.\d+)?)\b/i,                         // hp 70 or hp: 70
    /\b(\d{1,3})\s*(?:hp|h\.?p\.?)\b/i                      // 70 hp or 70 h.p.
  ];
  for (const pattern of hpPatterns) {
    const match = message.match(pattern);
    if (match) {
      horsepower = parseFloat(match[1]);
      break;
    }
  }
  
  // Extract GPS location (coordinates) - flexible format
  let gps_location = "";
  const gpsPatterns = [
    /gps\s*(?:coordinates?)?\s*[:=]?\s*([0-9.]+[\s,]+[0-9.]+)/i,  // GPS: 12.2958, 76.6394
    /coordinates?\s*[:=]?\s*([0-9.]+[\s,]+[0-9.]+)/i,             // coordinates: 12.2958, 76.6394
    /lat(?:itude)?\s*[:=]?\s*([0-9.]+).+?lon(?:gitude)?\s*[:=]?\s*([0-9.]+)/i // lat: 12.29 lon: 76.63
  ];
  for (const pattern of gpsPatterns) {
    const match = message.match(pattern);
    if (match) {
      gps_location = match[1].replace(/[^0-9.,\s-]/g, "").trim();
      break;
    }
  }
  
  // Extract price_per_hour
  let price_per_hour = null;
  const hourPatterns = [
    /(?:₹|rs\.?|rupees?)\s*(\d+(?:[,\d]*\d)?)\s*(?:per\s+)?(?:\/|\s+)?(?:hour|hr|h)/i,  // ₹500/hour, Rs 500 per hour
    /(\d+(?:[,\d]*\d)?)\s*(?:₹|rs\.?|rupees?)\s*(?:per\s+)?(?:\/|\s+)?(?:hour|hr|h)/i,  // 500₹/hour, 500 rupees per hour
    /(?:hour|hr|hourly|per\s+hour)\s*(?::|\s+)₹\s*(\d+(?:[,\d]*\d)?)/i                   // hour: ₹500
  ];
  for (const pattern of hourPatterns) {
    const match = message.match(pattern);
    if (match) {
      price_per_hour = parseInt(match[1].replace(/[,\s]/g, ""));
      break;
    }
  }
  
  // Extract price_per_day
  let price_per_day = null;
  const dayPatterns = [
    /(?:₹|rs\.?|rupees?)\s*(\d+(?:[,\d]*\d)?)\s*(?:per\s+)?(?:\/|\s+)?(?:day|d)/i,    // ₹5000/day, Rs 5000 per day
    /(\d+(?:[,\d]*\d)?)\s*(?:₹|rs\.?|rupees?)\s*(?:per\s+)?(?:\/|\s+)?(?:day|d)/i,    // 5000₹/day, 5000 rupees per day
    /(?:day|daily|per\s+day)\s*(?::|\s+)₹\s*(\d+(?:[,\d]*\d)?)/i                        // day: ₹5000
  ];
  for (const pattern of dayPatterns) {
    const match = message.match(pattern);
    if (match) {
      price_per_day = parseInt(match[1].replace(/[,\s]/g, ""));
      break;
    }
  }
  
  return {
    name,
    category: name || "Equipment",  // category defaults to equipment type or "Equipment"
    location,
    description,
    fuel_type,
    horsepower,
    gps_location,
    price_per_hour,
    price_per_day
  };
};

// Helper: Get missing fields for equipment
const getMissingFields = (data) => {
  const missing = [];
  
  // Required fields as per specification
  if (!data.name || data.name.trim() === "") missing.push("name (e.g., Tractor, Harvester)");
  if (!data.category || data.category.trim() === "") missing.push("category (e.g., Equipment)");
  if (!data.description || data.description.trim() === "") missing.push("description");
  if (!data.fuel_type || data.fuel_type.trim() === "") missing.push("fuel type (Diesel/Petrol/Electric)");
  if (!data.horsepower || data.horsepower <= 0) missing.push("horsepower (HP)");
  if (!data.location || data.location.trim() === "") missing.push("location (e.g., Mysore)");
  if ((!data.price_per_hour || data.price_per_hour <= 0) && (!data.price_per_day || data.price_per_day <= 0)) {
    missing.push("price (₹/hour or ₹/day)");
  }
  
  return missing;
};

// Helper: Format missing fields message for WhatsApp
const formatMissingFieldsMessage = (missing) => {
  const fieldsList = missing.map(f => `  • ${f}`).join("\n");
  return `Please provide ALL details in one message:\n\n${fieldsList}\n\nExample:\nTractor, 50 HP, Diesel, In Mysore, ₹500/hour, Excellent condition`;
};

// Helper: Check if user has a pending listing
const getPendingListing = async (userId) => {
  const snapshot = await db
    .collection("pending_equipment")
    .where("owner_id", "==", userId)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  return null;
};

// Helper: Save pending equipment
const savePendingEquipment = async (ownerId, data) => {
  await db.collection("pending_equipment").add({
    owner_id: ownerId,
    ...data,
    updated_at: new Date(),
    source: "whatsapp"
  });
};

// Helper: Update pending equipment
const updatePendingEquipment = async (docId, newData) => {
  await db.collection("pending_equipment").doc(docId).update({
    ...newData,
    updated_at: new Date()
  });
};

// Helper: Move pending to equipment (finalize listing)
const finalizeListing = async (pendingId, userId) => {
  const pending = await db.collection("pending_equipment").doc(pendingId).get();
  const data = pending.data();

  // Save to equipment
  await db.collection("equipment").add({
    name: data.name,
    category: data.category || "Equipment",
    location: data.location,
    price_per_hour: data.price_per_hour || null,
    price_per_day: data.price_per_day || null,
    owner_id: userId,
    created_at: new Date(),
    source: "whatsapp"
  });

  // Delete from pending
  await db.collection("pending_equipment").doc(pendingId).delete();
};

// Helper: Normalize WhatsApp phone number
const normalizePhone = (whatsappFrom) => {
  // Example: "whatsapp:+918867556856" -> "8867556856"
  let phone = whatsappFrom.replace("whatsapp:", "").replace("+", "");
  
  // Remove country code "91" if it's at the start
  if (phone.startsWith("91") && phone.length === 12) {
    phone = phone.slice(2);
  }
  
  return phone;
};

// Helper: Get owner from Firestore by normalized phone
const getOwnerByPhone = async (whatsappFrom) => {
  const normalizedPhone = normalizePhone(whatsappFrom);
  console.log("🔍 Looking for owner with phone:", normalizedPhone);

  const snapshot = await db
    .collection("owners")
    .where("phone", "==", normalizedPhone)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const ownerDoc = snapshot.docs[0];
    const ownerData = ownerDoc.data();
    // Return owner id from document id or "id" field
    const ownerId = ownerData.id || ownerDoc.id;
    console.log("✅ Owner found:", ownerId);
    return ownerId;
  }

  console.log("❌ Owner not found for phone:", normalizedPhone);
  return null;
};

// 🔥 REQUIRED FOR TWILIO
app.use(express.urlencoded({ extended: false }));

// General middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ✅ WhatsApp Webhook Route - Full Workflow with Complete Validation
app.post("/whatsapp", async (req, res) => {
  const message = req.body.Body?.trim();
  const whatsappPhone = req.body.From;

  console.log("📩 [WhatsApp] From:", whatsappPhone);
  console.log("📩 [WhatsApp] Message:", message);

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  try {
    // ========== STEP 1: Owner Verification ==========
    console.log("🔐 [Step 1] Verifying owner...");
    const ownerId = await getOwnerByPhone(whatsappPhone);

    if (!ownerId) {
      console.log("❌ [Step 1] Owner not found");
      twiml.message("⚠️ Please register on NammaKrishi portal using this phone number before listing equipment.");
      res.writeHead(200, { "Content-Type": "text/xml" });
      res.end(twiml.toString());
      return;
    }
    console.log("✅ [Step 1] Owner found:", ownerId);

    // ========== STEP 2: Parse Message ==========
    console.log("📝 [Step 2] Parsing message...");
    const parsedData = fallbackParse(message);
    console.log("📝 [Step 2] Parsed:", JSON.stringify(parsedData));

    // ========== STEP 3: Check Pending Listing ==========
    console.log("⏳ [Step 3] Checking for pending listing...");
    let pending = await getPendingListing(ownerId);

    if (pending) {
      console.log("⏳ [Step 3] Found pending listing:", pending.id);
    } else {
      console.log("⏳ [Step 3] No pending listing");
    }

    // ========== STEP 4: Merge Data ==========
    console.log("🔄 [Step 4] Merging data with pending...");
    let equipmentData = {
      name: parsedData.name || (pending?.name || ""),
      category: parsedData.category || (pending?.category || "Equipment"),
      description: parsedData.description || (pending?.description || ""),
      fuel_type: parsedData.fuel_type || (pending?.fuel_type || ""),
      horsepower: parsedData.horsepower || (pending?.horsepower || null),
      location: parsedData.location || (pending?.location || ""),
      price_per_hour: parsedData.price_per_hour || (pending?.price_per_hour || null),
      price_per_day: parsedData.price_per_day || (pending?.price_per_day || null)
    };
    console.log("🔄 [Step 4] Merged:", JSON.stringify(equipmentData));

    // ========== STEP 5: Validate ALL Required Fields ==========
    console.log("✔️ [Step 5] Validating ALL required fields...");
    const missing = getMissingFields(equipmentData);

    if (missing.length > 0) {
      console.log("✔️ [Step 5] Missing", missing.length, "fields:", missing);

      // Ask for ALL missing fields in ONE message - DO NOT save pending
      const missingMessage = formatMissingFieldsMessage(missing);
      twiml.message(missingMessage);
      console.log("📤 [Reply] Asking for all missing fields in one message");
    } else {
      // ========== STEP 6: All Fields Complete - Validate & Save ==========
      console.log("✅ [Step 6] All fields validated! Saving equipment...");

      // VALIDATION: Ensure critical fields are not empty
      if (!equipmentData.name || !equipmentData.location || 
          (!equipmentData.price_per_hour && !equipmentData.price_per_day)) {
        throw new Error("Validation failed: Critical fields are missing");
      }

      // Delete pending if exists
      if (pending) {
        console.log("🗑️ [Step 6] Deleting pending:", pending.id);
        await db.collection("pending_equipment").doc(pending.id).delete();
      }

      // SAVE TO FIRESTORE
      const equipmentRef = await db.collection("equipment").add({
        name: equipmentData.name,
        category: equipmentData.category,
        description: equipmentData.description,
        fuel_type: equipmentData.fuel_type,
        horsepower: equipmentData.horsepower,
        location: equipmentData.location,
        price_per_hour: equipmentData.price_per_hour,
        price_per_day: equipmentData.price_per_day,
        owner_id: ownerId,
        created_at: new Date(),
        source: "whatsapp",
        status: "available"
      });

      console.log("✅ [Step 6] Equipment saved to Firestore:", equipmentRef.id);

      // Success response with image upload request
      const priceDisplay = equipmentData.price_per_hour || equipmentData.price_per_day;
      const priceUnit = equipmentData.price_per_hour ? "/hr" : "/day";
      
      const successMsg = `✅ Equipment Listed!\n\n📋 ${equipmentData.name}\n📍 ${equipmentData.location}\n💰 ₹${priceDisplay}${priceUnit}\n\n📸 Please upload a clear image of the equipment to improve your listing visibility.\n\nThank you for using NammaKrishi!`;
      
      twiml.message(successMsg);
      console.log("📤 [Reply] Success! Asking for image upload");
    }

  } catch (error) {
    console.error("❌ [WhatsApp Error]", error.message);
    console.error(error);
    twiml.message("❌ Error processing your request. Please try again or contact support.");
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

// Public routes
app.use("/api/auth", require("./routes/authRoutes"));

// Protected routes
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/dashboard", verifyOwner, require("./routes/dashboardRoutes"));
app.use("/api/equipment", verifyOwner, require("./routes/equipmentRoutes"));
app.use("/api/bookings", verifyOwner, require("./routes/bookingRoutes"));
app.use("/api/ai", verifyOwner, require("./routes/aiRoutes"));
app.use("/api/maintenance", verifyOwner, require("./routes/maintenanceRoutes"));
app.use("/api/analytics", verifyOwner, require("./routes/analyticsRoutes"));
app.use("/api/payments", verifyOwner, require("./routes/paymentRoutes"));
app.use("/api/earnings", verifyOwner, require("./routes/earningsRoutes"));
app.use("/api/notifications", verifyOwner, require("./routes/notificationRoutes"));

// Root
app.get("/", (req, res) => {
  res.send("🚜 NammaKrishi Owner Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Owner Backend running on http://localhost:${PORT}`);
});

// Firebase check
(async () => {
  try {
    console.log("✅ Firebase initialized with projectId: nammakrishi-b0612");
  } catch (err) {
    console.error("❌ Firebase initialization failed:", err.message);
  }
})();