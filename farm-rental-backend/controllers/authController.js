// Authentication controller
const { admin, db } = require('../config/firebase');

const authController = {
  // Register new user (customer or owner)
  register: async (req, res) => {
    try {
      const { email, password, name, phone, role, language_preference } = req.body;

      // Validate required fields
      if (!email || !password || !name || !phone || !role) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate role
      if (role !== 'customer' && role !== 'owner') {
        return res.status(400).json({ error: 'Role must be either customer or owner' });
      }

      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone.startsWith('+') ? phone : `+91${phone}`, // Assuming India, adjust as needed
      });

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name,
        phone,
        role,
        language_preference: language_preference || 'en',
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      // Generate custom token for immediate login
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        uid: userRecord.uid,
        token: customToken,
        role
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: error.message || 'Registration failed' 
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'ID token is required' });
      }

      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found in database' });
      }

      const userData = userDoc.data();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          uid,
          email: decodedToken.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          language_preference: userData.language_preference
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ 
        error: error.message || 'Authentication failed' 
      });
    }
  },

  // Get current user info (for authenticated requests)
  getCurrentUser: async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];

      if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();

      res.status(200).json({
        success: true,
        user: {
          uid,
          email: decodedToken.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          language_preference: userData.language_preference,
          created_at: userData.created_at
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ 
        error: 'Authentication failed' 
      });
    }
  }
};

module.exports = authController;
