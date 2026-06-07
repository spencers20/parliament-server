"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.startdbListener = startdbListener;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const fetching_1 = require("../fetch/fetching");
const socket_1 = require("../socket");
dotenv_1.default.config();
const DB_URL = "postgresql://admin:admin001@localhost:5432/parliament_db";
// ── Pool for normal queries (keep this as is) ────────────────
exports.db = new pg_1.Pool({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// ── Dedicated client ONLY for LISTEN (never use for queries) ─
const listenerClient = new pg_1.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
});
async function startdbListener() {
    await listenerClient.connect();
    console.log('🐘 PostgreSQL LISTEN client connected');
    await listenerClient.query('LISTEN bills');
    await listenerClient.query('LISTEN stages');
    await listenerClient.query('LISTEN stage_actions');
    console.log('👀 Watching: bills, stages, stage_actions');
    // ✅ attached to listenerClient, not db
    listenerClient.on('notification', async (msg) => {
        if (!msg.payload)
            return;
        let parsed;
        try {
            parsed = JSON.parse(msg.payload);
        }
        catch (e) {
            console.error('Failed to parse pg notify payload:', e);
            return;
        }
        const { table, data } = parsed;
        console.log(`🔔 PG Notify — table: ${table}, op: ${parsed.operation}`);
        if (table === 'bills') {
            const billId = data._id?.toString() ?? data.id?.toString();
            if (!billId)
                return;
            const updatedBill = await fetching_1.Fetch.specificbill(billId);
            if (updatedBill)
                socket_1.io.to(billId).emit('bill_updated', updatedBill);
        }
        if (table === 'stages') {
            const billId = data.bill?.toString();
            if (!billId)
                return;
            const allStages = await fetching_1.Fetch.stages(billId);
            socket_1.io.to(billId).emit('stage_updated', allStages);
        }
        if (table === 'stage_actions') {
            const billId = data.bill?.toString();
            if (!billId)
                return;
            const allStages = await fetching_1.Fetch.stages(billId);
            socket_1.io.to(billId).emit('stage_updated', allStages);
            socket_1.io.to(billId).emit('action_updated', data);
        }
    });
    listenerClient.on('error', async (err) => {
        console.error('PG listener error:', err);
        setTimeout(() => startdbListener().catch(console.error), 5000);
    });
}
