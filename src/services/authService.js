import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

class AuthService {
  async setPersistance() {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error('Error setting persistence:', error);
    }
  }

  async signup(email, password, userData) {
    try {
      await this.setPersistance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: userData.name,
      });

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: userData.name,
        email: email,
        phone: userData.phone || '',
        language_preference: userData.language_preference || 'en',
        created_at: new Date(),
        profile_complete: true,
      });

      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      await this.setPersistance();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return auth.currentUser;
  }
}

export default new AuthService();
