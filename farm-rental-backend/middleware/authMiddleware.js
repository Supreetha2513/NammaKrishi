const { admin } = require("../config/firebase");

const verifyOwner = async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "No token" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== "owner") {
      return res.status(403).json({ error: "Not an owner" });
    }
    
    req.user = { uid: decodedToken.uid, ...userDoc.data() };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyOwner;