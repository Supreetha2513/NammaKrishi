const { admin } = require("../config/firebase");

const verifyOwner = async (req, res, next) => {
  console.log('🔐 Auth Middleware: Checking authorization...');
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  
  if (!idToken) {
    console.log('❌ Auth: No token provided');
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Auth: Token verified for user:', decodedToken.uid);
    
    const userDoc = await admin.firestore().collection("owners").doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      console.log('❌ Auth: User not found in owners collection');
      return res.status(403).json({ error: "Not an owner" });
    }
    
    console.log('✅ Auth: Owner verified:', decodedToken.uid);
    req.user = { uid: decodedToken.uid, ...userDoc.data() };
    next();
  } catch (err) {
    console.log('❌ Auth: Token verification failed:', err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyOwner;