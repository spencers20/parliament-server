// import { Server, Socket } from "socket.io"

// export default function socketHandler(io:Server){
//     io.on('connection',(socket:Socket)=>{
//         console.log('Socket connected with id:::',socket.id)
//         socket.on("bill_room",(billId:string)=>{
//             socket.join(billId)
//         })
//     })
// }

// src/socket/socketManager.ts
// Replaces wsManager.ts — drop this file in, delete wsManager.ts

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from './database/db';
import { Fetch } from './fetch/fetching';
// import { WsEvent } from '../types/voting';

let io: SocketIOServer;

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? '*', // e.g. "http://localhost:3000"
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client emits this immediately after connecting to watch a session


    // e.g. socket.emit('join_session', sessionId)
    socket.on('join_session', (sessionId: string) => {
      if (!sessionId || typeof sessionId !== 'string') return;

      socket.join(sessionId);
      console.log(`   ↳ ${socket.id} joined session room: ${sessionId}`);

      // Acknowledge the join
      socket.emit('session_joined', { session_id: sessionId });
    });

    socket.on('join_user_room', (userId: string) => {
  if (!userId || typeof userId !== 'string') return;
  socket.join(`user:${userId}`);
  console.log(`   ↳ ${socket.id} joined user room: user:${userId}`);
});




    socket.on('leave_session', (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`   ↳ ${socket.id} left session room: ${sessionId}`);
    });

     // ── Used by BOTH plenary (second/third reading) and committee voting ──────
    // Room name convention:
    //   Plenary session:   session_id (UUID)
    //   Committee bill:    committee:{bill_id}   ← all clients on the same bill
    socket.on('join_session', (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') return;
      socket.join(roomId);
      console.log(`   ↳ ${socket.id} joined room: ${roomId}`);
      socket.emit('session_joined', { room_id: roomId });
    });

     socket.on('leave_session', (roomId: string) => {
      socket.leave(roomId);
    });
//  FOR stages
   socket.on('bill_room', (billId: string) => {
  if (!billId || typeof billId !== 'string') return;
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
export function broadcast(sessionId: string, event: any): void {
  if (!io) {
    console.warn('Socket.IO not initialized — cannot broadcast');
    return;
  }
  io.to(sessionId).emit(event.type, event);
}

/** How many clients are currently in a session room */
export async function getConnectedCount(sessionId: string): Promise<number> {
  if (!io) return 0;
  const sockets = await io.in(sessionId).fetchSockets();
  return sockets.length;
}

 
// ─── Committee voting broadcast ───────────────────────────────────────────────
// All committee clients for a bill join room `committee:{billId}`
// so a single broadcast reaches everyone watching that bill's committee stage.
export function broadcastCommittee(billId: any, event: any): void {
  if (!io) { console.warn('Socket.IO not initialised'); return; }
  const room = `committee:${billId}`;
  io.to(room).emit(event.type, event);
}

 
export async function getcommitteeConnectedCount(roomId: string): Promise<number> {
  if (!io) return 0;
  const sockets = await io.in(roomId).fetchSockets();
  return sockets.length;
}


// ─── Public submissions broadcast ────────────────────────────────────────────
// Room: submissions:{billId}:{stage}
export function broadcastSubmission(
  billId: string,
  stage: string,
  payload: {
    type: 'SUBMISSION_UPDATE';
    bill_id: string;
    stage: string;
    stats: object;
    latest_trend: object | null;
    trends: object[];
  }
): void {
  if (!io) { console.warn('Socket.IO not initialised'); return; }
  const room = `submissions:${billId}:${stage}`;
  io.to(room).emit('SUBMISSION_UPDATE', payload);
}

export function notifyUser(userId: string, notification: object): void {
  if (!io) { console.warn('Socket.IO not initialised'); return; }
  io.to(`user:${userId}`).emit('NOTIFICATION', notification);
}




export { io };