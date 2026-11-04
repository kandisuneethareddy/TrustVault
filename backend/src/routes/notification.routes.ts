import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { NotificationService } from '../services/NotificationService';

const router = Router();

// GET /api/notifications - List user's notifications
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  const user = req.user!;
  const notifications = NotificationService.getUserNotifications(user.id);
  res.json({ notifications });
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', authenticateToken, (req: Request, res: Response): void => {
  const user = req.user!;
  const success = NotificationService.markAsRead(req.params.id, user.id);
  res.json({ success });
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', authenticateToken, (req: Request, res: Response): void => {
  const user = req.user!;
  NotificationService.markAllAsRead(user.id);
  res.json({ success: true });
});

export default router;

