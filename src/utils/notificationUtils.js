import { messaging } from '../services/firebase';
import { getToken } from 'firebase/messaging';

class NotificationService {
  async requestPermission() {
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
        });
        return token;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return null;
  }

  async subscribeToNotifications() {
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return;
    }

    try {
      const token = await this.requestPermission();
      if (token) {
        console.log('FCM Token:', token);
        // Store token in Firestore user document
        return token;
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  setupMessageListener() {
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return;
    }

    try {
      // Handle messages when the app is in the foreground
      // This requires setting up a message handler
      console.log('Message listener setup ready');
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }

  showLocalNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}

export default new NotificationService();
