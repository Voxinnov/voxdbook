import { Router } from 'express';
import {
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
  getNotificationStats,
} from '../controllers/notifications';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get user notifications
router.get('/', authenticate, getNotifications);

// Mark specific notifications as read
router.post('/mark-read', authenticate, markNotificationsRead);

// Mark all notifications as read
router.post('/mark-all-read', authenticate, markAllNotificationsRead);

// Get notification statistics
router.get('/stats', authenticate, getNotificationStats);

export default router;
