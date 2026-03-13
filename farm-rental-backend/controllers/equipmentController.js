const { db, bucket } = require("../config/firebase");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const addEquipment = async (req, res) => {
  try {
    const file = req.file;
    let imageUrl = "";

    if (file) {
      const fileName = `equipment/${Date.now()}_${file.originalname}`;
      const blob = bucket.file(fileName);
      await blob.save(file.buffer, { contentType: file.mimetype });
      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
    }

    const equipmentData = {
      owner_id: req.user.uid,
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      price_per_hour: parseFloat(req.body.price_per_hour),
      price_per_day: parseFloat(req.body.price_per_day),
      location: req.body.location,
      availability_status: "available",
      image_url: imageUrl,
      created_at: new Date()
    };

    const docRef = await db.collection("Equipment").add(equipmentData);

    // Auto-create availability slots for next 90 days
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      await db.collection("EquipmentAvailability").add({
        equipment_id: docRef.id,
        date: date.toISOString().split("T")[0],
        availability_status: "available",
        booking_id: null
      });
    }

    res.json({ id: docRef.id, ...equipmentData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyEquipment = async (req, res) => {
  const snapshot = await db.collection("Equipment")
    .where("owner_id", "==", req.user.uid)
    .get();
  const equipment = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(equipment);
};

const toggleAvailability = async (req, res) => {
  await db.collection("Equipment").doc(req.params.id).update({
    availability_status: req.body.status
  });
  res.json({ success: true });
};

// Add more methods: editEquipment, deleteEquipment, getVerificationStatus, etc. (same pattern)

module.exports = { addEquipment, getMyEquipment, toggleAvailability /* + others */ };