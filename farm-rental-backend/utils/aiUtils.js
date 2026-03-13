// utils/aiUtils.js
// Gemini API integration using OpenAI-compatible endpoint
const OpenAI = require("openai");

let openai = null;

// Lazy load OpenAI client - only instantiate when needed (after dotenv.config() is called)
// Uses Gemini API key for Google's generative AI
function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,  // Uses GEMINI_API_KEY from .env
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",  // Gemini's OpenAI-compatible endpoint
    });
  }
  return openai;
}

async function generateListing(prompt, imageBase64 = null) {
  try {
    const messages = [
      {
        role: "system",
        content: "You are an expert farm equipment listing writer for tractors, harvesters, rotavators, irrigation pumps etc. Return ONLY valid JSON with no extra text, explanations, markdown, or code blocks: {\"name\": \"string\", \"category\": \"string\", \"description\": \"string\", \"suggestedPricePerDay\": number, \"suggestedPricePerHour\": number|null}"
      },
      { role: "user", content: prompt }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    }

    const response = await getOpenAIClient().chat.completions.create({
      model: "gemini-1.5-flash",  // Reliable free/fast model; alternatives: gemini-1.5-pro, gemini-2.0-flash
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error("AI generation error:", error);
    throw error;  // Let controller handle it
  }
}

module.exports = { generateListing };