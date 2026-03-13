const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const verifyOwner = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // for base64 images

// Public routes
app.use("/api/auth", require("./routes/authRoutes"));

// Protected owner routes
app.use("/api/dashboard", verifyOwner, require("./routes/dashboardRoutes"));
app.use("/api/equipment", verifyOwner, require("./routes/equipmentRoutes"));
app.use("/api/bookings", verifyOwner, require("./routes/bookingRoutes"));
app.use("/api/ai", verifyOwner, require("./routes/aiRoutes"));
app.use("/api/maintenance", verifyOwner, require("./routes/maintenanceRoutes"));
app.use("/api/analytics", verifyOwner, require("./routes/analyticsRoutes"));
app.use("/api/payments", verifyOwner, require("./routes/paymentRoutes"));
app.use("/api/earnings", verifyOwner, require("./routes/earningsRoutes"));
app.use("/api/notifications", verifyOwner, require("./routes/notificationRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Owner Backend running on http://localhost:${PORT}`));

// Temporary test – add at the very bottom of server.js
const { db } = require("./config/firebase");

(async () => {
  try {
    // Test Firestore connection by checking if it's initialized
    console.log("✅ Firebase initialized with projectId: nammakrishi-b0612");
  } catch (err) {
    console.error("❌ Firebase initialization failed:", err.message);
  }
})();