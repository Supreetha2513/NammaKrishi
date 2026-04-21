const { generateListing } = require("../utils/aiUtils");
const { db } = require("../config/firebase");

// 🔥 Existing API (used by frontend)
const generateAIListing = async (req, res) => {
  try {
    const { prompt, imageBase64 } = req.body;

    const data = await generateListing(prompt, imageBase64);

    // Save session for history
    await db.collection("AIListingSessions").add({
      owner_id: req.user.uid,
      input_prompt: prompt,
      generated_equipment_name: data.name,
      generated_category: data.category,
      generated_description: data.description,
      suggested_price_per_day: data.suggestedPricePerDay,
      suggested_price_per_hour: data.suggestedPricePerHour || null,
      listing_status: "draft",
      created_at: new Date(),
      source: "web"
    });

    res.json(data);
  } catch (err) {
    console.error("AI Controller Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateAIListing };