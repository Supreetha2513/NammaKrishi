const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {

  await db.collection("users").doc("owner_1").set({
    name: "Ramesh",
    phone: "9876543210",
    role: "owner",
    language_preference: "Kannada",
    created_at: new Date()
  });

  await db.collection("equipment").doc("eq_1").set({
    owner_id: "owner_1",
    name: "John Deere Tractor",
    category: "tractor",
    description: "Heavy duty tractor",
    price_per_hour: 500,
    price_per_day: 4000,
    location: "Mandya",
    availability_status: "available",
    image_url: "",
    created_at: new Date()
  });

  await db.collection("bookings").doc("booking_1").set({
    equipment_id: "eq_1",
    customer_id: "customer_1",
    owner_id: "owner_1",
    start_date: "2026-03-20",
    end_date: "2026-03-21",
    total_price: 2000,
    booking_status: "pending",
    payment_status: "unpaid",
    created_at: new Date()
  });

  await db.collection("payments").doc("payment_1").set({
    booking_id: "booking_1",
    payment_gateway: "razorpay",
    payment_status: "success",
    created_at: new Date()
  });

  await db.collection("equipment_requests").doc("req_1").set({
    customer_id: "customer_5",
    equipment_name: "harvester",
    location: "Mandya",
    request_status: "open",
    created_at: new Date()
  });

  await db.collection("notifications").doc("notif_1").set({
    owner_id: "owner_1",
    notification_type: "booking_request",
    title: "New booking request",
    message: "Your tractor has a new booking",
    status: "unread",
    created_at: new Date()
  });

  await db.collection("maintenance_logs").doc("log_1").set({
    equipment_id: "eq_1",
    service_date: "2026-03-01",
    notes: "Oil change",
    next_service_due: "2026-06-01"
  });

  console.log("Firestore seeded successfully");
}

seed();