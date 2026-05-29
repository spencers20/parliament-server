// src/routes/notifications.ts

import { Router, Request, Response, NextFunction } from 'express';
import {
  getUserNotifications,
  markAsRead,
  getUnreadCount,
} from '../services/notificationService';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ── GET /api/notifications/:userId ────────────────────────────────────────────
// Called on login to load all notifications
// Query: ?unread_only=true&limit=50
router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    // const { userId } = req.params;
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const unreadOnly = req.query.unread_only === 'true';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const notifications = await getUserNotifications(userId, { unreadOnly, limit });
    res.json({ notifications });
  })
);

// ── GET /api/notifications/:userId/unread-count ───────────────────────────────
// Lightweight — just the badge number
router.get(
  '/:userId/unread-count',
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const count = await getUnreadCount(userId);
    res.json({ count });
  })
);

// ── PATCH /api/notifications/:userId/read ─────────────────────────────────────
// Mark as read. Body: { ids?: string[] } — omit ids to mark ALL as read
router.patch(
  '/:userId/read',
  asyncHandler(async (req, res) => {
    // const { userId } = req.params;
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const { ids } = req.body;
    await markAsRead(userId, ids);
    res.json({ success: true });
  })
);

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

export default router;