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

      // Choose collection based on role
      const collection = role === 'owner' ? 'owners' : 'customers';

      // Create user document in appropriate Firestore collection
      await db.collection(collection).doc(userRecord.uid).set({
        id: userRecord.uid,
        email,
        name,
        phone,
        language_preference: language_preference || 'en',
        profile_complete: true,
        upi_id: null, // To be added later
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

      // Try to find user in owners collection first
      let userDoc = await db.collection('owners').doc(uid).get();
      let role = 'owner';

      // If not found in owners, try customers collection
      if (!userDoc.exists) {
        userDoc = await db.collection('customers').doc(uid).get();
        role = 'customer';
      }

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found in database' });
      }

      const userData = userDoc.data();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          uid,
          id: userData.id,
          email: userData.email || decodedToken.email,
          name: userData.name,
          phone: userData.phone,
          role: role,
          language_preference: userData.language_preference,
          profile_complete: userData.profile_complete,
          upi_id: userData.upi_id || null
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

      // Try to find user in owners collection first
      let userDoc = await db.collection('owners').doc(uid).get();
      let role = 'owner';

      // If not found in owners, try customers collection
      if (!userDoc.exists) {
        userDoc = await db.collection('customers').doc(uid).get();
        role = 'customer';
      }

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();

      res.status(200).json({
        success: true,
        user: {
          uid,
          id: userData.id,
          email: userData.email || decodedToken.email,
          name: userData.name,
          phone: userData.phone,
          role: role,
          language_preference: userData.language_preference,
          profile_complete: userData.profile_complete,
          upi_id: userData.upi_id || null,
          created_at: userData.created_at
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ 
        error: 'Authentication failed' 
      });
    }
  },

  // Update user profile (for adding UPI ID and other details later)
  updateProfile: async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];

      if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const { upi_id, name, phone, language_preference } = req.body;

      // Try to find user in owners collection first
      let userDoc = await db.collection('owners').doc(uid).get();
      let collection = 'owners';

      // If not found in owners, try customers collection
      if (!userDoc.exists) {
        userDoc = await db.collection('customers').doc(uid).get();
        collection = 'customers';
      }

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build update object with only provided fields
      const updateData = {};
      if (upi_id !== undefined) updateData.upi_id = upi_id;
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (language_preference !== undefined) updateData.language_preference = language_preference;

      // Update user document
      await db.collection(collection).doc(uid).update(updateData);

      // Get updated user data
      const updatedDoc = await db.collection(collection).doc(uid).get();
      const userData = updatedDoc.data();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          uid,
          id: userData.id,
          email: userData.email || decodedToken.email,
          name: userData.name,
          phone: userData.phone,
          role: collection === 'owners' ? 'owner' : 'customer',
          language_preference: userData.language_preference,
          profile_complete: userData.profile_complete,
          upi_id: userData.upi_id || null,
          created_at: userData.created_at
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to update profile' 
      });
    }
  }
};

module.exports = authController;
