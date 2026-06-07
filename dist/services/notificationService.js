"use strict";
// src/services/notificationsService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.notif = notif;
exports.notifMany = notifMany;
exports.getUserNotifications = getUserNotifications;
exports.markAsRead = markAsRead;
exports.getUnreadCount = getUnreadCount;
const db_1 = require("../database/db");
const socket_1 = require("../socket");
// ─── Core reusable function ───────────────────────────────────────────────────
// notif(senderId, receiverId, message)
// senderId can be null for system notifications
//
// Usage examples:
//   notif(speakerId, senatorId, 'Voting on Clause 3 has been opened.')
//   notif(null, userId, 'Your public submission has been received.')
//   notif(senatorA, senatorB, 'Your amendment was approved.')
async function notif(senderId, receiverId, message) {
    const res = await db_1.db.query(`INSERT INTO app.notifications (sender_id, receiver_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`, [senderId ?? null, receiverId, message]);
    const notification = res.rows[0];
    // Push to receiver's socket room in real time if they are online
    // Room convention: user:{receiverId}
    (0, socket_1.notifyUser)(receiverId, notification);
    return notification;
}
// ─── Broadcast notif to multiple receivers at once ────────────────────────────
// e.g. notify all senators when speaker opens a vote
async function notifMany(senderId, receiverIds, message) {
    if (receiverIds.length === 0)
        return;
    // Bulk insert
    const values = receiverIds
        .map((_, i) => `($1, $${i + 2}, $${receiverIds.length + 2})`)
        .join(', ');
    await db_1.db.query(`INSERT INTO app.notifications (sender_id, receiver_id, message)
     VALUES ${values}`, [senderId ?? null, ...receiverIds, message]);
    // Fetch the inserted rows to push via socket
    const inserted = await db_1.db.query(`SELECT * FROM app.notifications
     WHERE receiver_id = ANY($1)
       AND message = $2
       AND created_at >= NOW() - INTERVAL '5 seconds'
     ORDER BY created_at DESC`, [receiverIds, message]);
    // Push to each receiver's socket room
    for (const notification of inserted.rows) {
        (0, socket_1.notifyUser)(notification.receiver_id, notification);
    }
}
// ─── Get notifications for a user (called on login) ───────────────────────────
async function getUserNotifications(userId, options = {}) {
    const { unreadOnly = false, limit = 50 } = options;
    const res = await db_1.db.query(`SELECT
       n.id,
       n.sender_id,
       n.receiver_id,
       n.message,
       n.is_read,
       n.created_at,
        COALESCE(s.name, sc.name) AS sender_name
     FROM app.notifications n
     LEFT JOIN app.profile s ON n.sender_id = s._id
     LEFT JOIN app.committee  sc ON n.sender_id   = sc._id
     WHERE n.receiver_id = $1
       ${unreadOnly ? 'AND n.is_read = FALSE' : ''}
     ORDER BY n.created_at DESC
     LIMIT $2`, [userId, limit]);
    return res.rows;
}
// ─── Mark notifications as read ───────────────────────────────────────────────
async function markAsRead(userId, notificationIds // if omitted, marks ALL as read
) {
    if (notificationIds && notificationIds.length > 0) {
        await db_1.db.query(`UPDATE app.notifications
       SET is_read = TRUE
       WHERE receiver_id = $1 AND id = ANY($2)`, [userId, notificationIds]);
    }
    else {
        await db_1.db.query(`UPDATE app.notifications SET is_read = TRUE WHERE receiver_id = $1`, [userId]);
    }
}
// ─── Unread count (for badge) ─────────────────────────────────────────────────
async function getUnreadCount(userId) {
    const res = await db_1.db.query(`SELECT COUNT(*) AS count FROM app.notifications
     WHERE receiver_id = $1 AND is_read = FALSE`, [userId]);
    return parseInt(res.rows[0].count);
}
