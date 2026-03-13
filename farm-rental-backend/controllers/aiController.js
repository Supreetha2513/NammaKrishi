const { generateListing } = require("../utils/aiUtils");
const { db } = require("../config/firebase");

const generateAIListing = async (req, res) => {
  try {
    const { prompt, imageBase64 } = req.body;  // imageBase64 optional
    const data = await generateListing(prompt, imageBase64);

    // Save session for history
    await db.collection("AIListingSessions").add({
      owner_id: req.user.uid,
      input_prompt: prompt,
      generated_equipment_name: data.name,
      generated_category: data.category,
      generated_description: data.description,
      suggested_price: data.suggestedPricePerDay,
      listing_status: "draft",
      created_at: new Date()
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateAIListing };