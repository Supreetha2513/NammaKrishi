// config/firebase.js
const admin = require("firebase-admin");

// Load service account credentials for nammakrishi-b0612 Firebase project
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "nammakrishi-b0612.appspot.com",
  projectId: "nammakrishi-b0612"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };