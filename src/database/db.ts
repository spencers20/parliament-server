import { Pool, Client } from "pg";
import dotenv from "dotenv";
import { Fetch } from "../fetch/fetching";
import { io } from "../socket";

dotenv.config();

const DB_URL = "postgresql://admin:admin001@localhost:5432/parliament_db";

// ── Pool for normal queries (keep this as is) ────────────────
export const db = new Pool({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ── Dedicated client ONLY for LISTEN (never use for queries) ─
const listenerClient = new Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

export async function startdbListener() {
  await listenerClient.connect();
  console.log('🐘 PostgreSQL LISTEN client connected');

  await listenerClient.query('LISTEN bills');
  await listenerClient.query('LISTEN stages');
  await listenerClient.query('LISTEN stage_actions');
  console.log('👀 Watching: bills, stages, stage_actions');

  // ✅ attached to listenerClient, not db
  (listenerClient as any).on('notification', async (msg: any) => {
    if (!msg.payload) return;

    let parsed: { table: string; operation: string; data: any };
    try {
      parsed = JSON.parse(msg.payload);
    } catch (e) {
      console.error('Failed to parse pg notify payload:', e);
      return;
    }

    const { table, data } = parsed;
    console.log(`🔔 PG Notify — table: ${table}, op: ${parsed.operation}`);

    if (table === 'bills') {
      const billId = data._id?.toString() ?? data.id?.toString();
      if (!billId) return;
      const updatedBill = await Fetch.specificbill(billId);
      if (updatedBill) io.to(billId).emit('bill_updated', updatedBill);
    }

    if (table === 'stages') {
      const billId = data.bill?.toString();
      if (!billId) return;
      const allStages = await Fetch.stages(billId);
      io.to(billId).emit('stage_updated', allStages);
    }

    if (table === 'stage_actions') {
      const billId = data.bill?.toString();
      if (!billId) return;
      const allStages = await Fetch.stages(billId);
      io.to(billId).emit('stage_updated', allStages);
      io.to(billId).emit('action_updated', data);
    }
  });

  listenerClient.on('error', async (err) => {
    console.error('PG listener error:', err);
    setTimeout(() => startdbListener().catch(console.error), 5000);
  });
}