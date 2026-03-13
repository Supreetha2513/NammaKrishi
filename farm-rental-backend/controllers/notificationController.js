// Notification controller
const { db } = require('../config/firebase');

const notificationController = {
  // Get notifications for owner
  getOwnerNotifications: async (req, res) => {
    try {
      const ownerId = req.user.uid;
      const limit = parseInt(req.query.limit) || 10;

      const notificationsSnapshot = await db.collection('owner_notifications')
        .where('owner_id', '==', ownerId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();

      const notifications = [];
      notificationsSnapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || null
        });
      });

      // Count unread
      const unreadCount = notifications.filter(n => n.status === 'unread').length;

      res.status(200).json({
        success: true,
        notifications,
        unread_count: unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        error: 'Failed to fetch notifications'
      });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const ownerId = req.user.uid;

      const notificationRef = db.collection('owner_notifications').doc(notificationId);
      const doc = await notificationRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (doc.data().owner_id !== ownerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await notificationRef.update({
        status: 'read'
      });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read'
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const ownerId = req.user.uid;

      const unreadSnapshot = await db.collection('owner_notifications')
        .where('owner_id', '==', ownerId)
        .where('status', '==', 'unread')
        .get();

      const batch = db.batch();
      unreadSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: 'read' });
      });

      await batch.commit();

      res.status(200).json({
        success: true,
        message: `${unreadSnapshot.size} notifications marked as read`
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Failed to mark notifications as read'
      });
    }
  }
};

module.exports = notificationController;
