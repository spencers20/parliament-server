"use strict";
// import { Server, Socket } from "socket.io"
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
exports.setupSocketIO = setupSocketIO;
exports.broadcast = broadcast;
exports.getConnectedCount = getConnectedCount;
exports.broadcastCommittee = broadcastCommittee;
exports.getcommitteeConnectedCount = getcommitteeConnectedCount;
exports.broadcastSubmission = broadcastSubmission;
exports.notifyUser = notifyUser;
const socket_io_1 = require("socket.io");
// import { WsEvent } from '../types/voting';
let io;
function setupSocketIO(httpServer) {
    exports.io = io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ?? '*', // e.g. "http://localhost:3000"
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Client emits this immediately after connecting to watch a session
        // e.g. socket.emit('join_session', sessionId)
        socket.on('join_session', (sessionId) => {
            if (!sessionId || typeof sessionId !== 'string')
                return;
            socket.join(sessionId);
            console.log(`   ↳ ${socket.id} joined session room: ${sessionId}`);
            // Acknowledge the join
            socket.emit('session_joined', { session_id: sessionId });
        });
        socket.on('join_user_room', (userId) => {
            if (!userId || typeof userId !== 'string')
                return;
            socket.join(`user:${userId}`);
            console.log(`   ↳ ${socket.id} joined user room: user:${userId}`);
        });
        socket.on('leave_session', (sessionId) => {
            socket.leave(sessionId);
            console.log(`   ↳ ${socket.id} left session room: ${sessionId}`);
        });
        // ── Used by BOTH plenary (second/third reading) and committee voting ──────
        // Room name convention:
        //   Plenary session:   session_id (UUID)
        //   Committee bill:    committee:{bill_id}   ← all clients on the same bill
        socket.on('join_session', (roomId) => {
            if (!roomId || typeof roomId !== 'string')
                return;
            socket.join(roomId);
            console.log(`   ↳ ${socket.id} joined room: ${roomId}`);
            socket.emit('session_joined', { room_id: roomId });
        });
        socket.on('leave_session', (roomId) => {
            socket.leave(roomId);
        });
        //  FOR stages
        socket.on('bill_room', (billId) => {
            if (!billId || typeof billId !== 'string')
                return;
            socket.join(billId);
            console.log(`   ↳ ${socket.id} joined bill room: ${billId}`);
        });
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Client disconnected: ${socket.id} — ${reason}`);
        });
        socket.on('error', (err) => {
            console.error(`WS error on ${socket.id}:`, err);
        });
    });
    return io;
}
/**
 * Broadcast an event to every client watching a specific voting session.
 * Call this from votingService.ts exactly where broadcast() was called before —
 * the function signature is identical.
 */
function broadcast(sessionId, event) {
    if (!io) {
        console.warn('Socket.IO not initialized — cannot broadcast');
        return;
    }
    io.to(sessionId).emit(event.type, event);
}
/** How many clients are currently in a session room */
async function getConnectedCount(sessionId) {
    if (!io)
        return 0;
    const sockets = await io.in(sessionId).fetchSockets();
    return sockets.length;
}
// ─── Committee voting broadcast ───────────────────────────────────────────────
// All committee clients for a bill join room `committee:{billId}`
// so a single broadcast reaches everyone watching that bill's committee stage.
function broadcastCommittee(billId, event) {
    if (!io) {
        console.warn('Socket.IO not initialised');
        return;
    }
    const room = `committee:${billId}`;
    io.to(room).emit(event.type, event);
}
async function getcommitteeConnectedCount(roomId) {
    if (!io)
        return 0;
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.length;
}
// ─── Public submissions broadcast ────────────────────────────────────────────
// Room: submissions:{billId}:{stage}
function broadcastSubmission(billId, stage, payload) {
    if (!io) {
        console.warn('Socket.IO not initialised');
        return;
    }
    const room = `submissions:${billId}:${stage}`;
    io.to(room).emit('SUBMISSION_UPDATE', payload);
}
function notifyUser(userId, notification) {
    if (!io) {
        console.warn('Socket.IO not initialised');
        return;
    }
    io.to(`user:${userId}`).emit('NOTIFICATION', notification);
}
