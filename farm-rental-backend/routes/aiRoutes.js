const express = require("express");
const { generateAIListing } = require("../controllers/aiController");
const router = express.Router();

router.post("/generate", generateAIListing);

module.exports = router;