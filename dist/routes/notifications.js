"use strict";
// src/routes/notifications.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationService_1 = require("../services/notificationService");
const router = (0, express_1.Router)();
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
// ── GET /api/notifications/:userId ────────────────────────────────────────────
// Called on login to load all notifications
// Query: ?unread_only=true&limit=50
router.get('/:userId', asyncHandler(async (req, res) => {
    // const { userId } = req.params;
    const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
    const unreadOnly = req.query.unread_only === 'true';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const notifications = await (0, notificationService_1.getUserNotifications)(userId, { unreadOnly, limit });
    res.json({ notifications });
}));
// ── GET /api/notifications/:userId/unread-count ───────────────────────────────
// Lightweight — just the badge number
router.get('/:userId/unread-count', asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
    const count = await (0, notificationService_1.getUnreadCount)(userId);
    res.json({ count });
}));
// ── PATCH /api/notifications/:userId/read ─────────────────────────────────────
// Mark as read. Body: { ids?: string[] } — omit ids to mark ALL as read
router.patch('/:userId/read', asyncHandler(async (req, res) => {
    // const { userId } = req.params;
    const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
    const { ids } = req.body;
    await (0, notificationService_1.markAsRead)(userId, ids);
    res.json({ success: true });
}));
router.use((err, _req, res, _next) => {
    console.error(err);
    res.status(400).json({ error: err.message });
});
exports.default = router;
