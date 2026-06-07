"use strict";
// ============================================================
// routes/stakeholderReview.ts
// Mount in your app: app.use('/api/review', stakeholderReviewRouter)
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../database/db");
const n8n_1 = require("../services/n8n");
const audit_1 = require("../services/audit");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("../services/notificationService");
// import { db } from '../db'; // your existing pool
const frontend = 'http://localhost:3000/';
const router = (0, express_1.Router)();
// ─────────────────────────────────────────────
// POST /api/review/requests
// Committee sends a new review request
// Body: { bill_id, committee_id, stage, subject, message, clause_ids[], stakeholder_ids[] }
// ─────────────────────────────────────────────
router.post('/requests', async (req, res) => {
    const { bill_id, committee_id, stage, subject, message, clause_ids, stakeholder_ids } = req.body;
    console.log('reached.....', subject);
    if (!bill_id || !committee_id || !subject || !message || !stakeholder_ids?.length) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const client = await db_1.db.connect();
    try {
        console.log('reached.....to db.');
        await client.query('BEGIN');
        // 1. Insert the request
        const requestResult = await client.query(`INSERT INTO app.stakeholder_review_requests
         (bill_id, committee_id, stage, subject, message, clause_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING _id`, [bill_id, committee_id, stage, subject, message, clause_ids ?? []]);
        const requestId = requestResult.rows[0]._id;
        // 2. Create one invite (with unique token) per stakeholder
        const inviteRows = [];
        for (const stakeholderId of stakeholder_ids) {
            const inviteResult = await client.query(`INSERT INTO app.stakeholder_review_invites (request_id, stakeholder_id)
         VALUES ($1, $2)
         ON CONFLICT (request_id, stakeholder_id) DO NOTHING
         RETURNING _id, token`, [requestId, stakeholderId]);
            if (inviteResult.rows.length > 0) {
                // Fetch stakeholder name + email for response
                const stakeholderResult = await client.query(`SELECT name, email FROM app.stakeholders WHERE _id = $1`, [stakeholderId]);
                if (stakeholderResult.rows.length > 0) {
                    inviteRows.push({
                        stakeholder_id: stakeholderId,
                        token: inviteResult.rows[0].token,
                        email: stakeholderResult.rows[0].email,
                        name: stakeholderResult.rows[0].name,
                    });
                }
            }
        }
        await client.query('COMMIT');
        // Return invite tokens so the caller can construct links and send emails
        inviteRows.forEach(async (inv) => {
            const model_url = 'https://untawed-overheady-tony.ngrok-free.dev/webhook/4b60dc1a-9c58-46af-9366-6da6c4978f26';
            const data = {
                email: inv.email,
                name: inv.name,
                reviewlink: `${frontend}/stakeholders/${inv.token}`,
                subject,
                message
            };
            await (0, n8n_1.query_n8n)(model_url, undefined, undefined, data);
            const track = new audit_1.tracking(bill_id, committee_id, stage);
            const billdata = await fetching_1.Fetch.specificbill(bill_id);
            const comdata = await fetching_1.Fetch.specificcommittee(committee_id);
            await track.audit(billdata.versionid, `${comdata.name} invited ${inv.name} for comments about the bill`);
        });
        return res.status(201).json({
            request_id: requestId,
            invites: inviteRows.map((inv) => ({
                stakeholder_id: inv.stakeholder_id,
                name: inv.name,
                email: inv.email,
                token: inv.token,
                review_link: `${frontend}/stakeholders/${inv.token}`,
            })),
        });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating review request:', err);
        return res.status(500).json({ error: 'Failed to create review request' });
    }
    finally {
        client.release();
    }
});
// ─────────────────────────────────────────────
// GET /api/review/:token
// Stakeholder opens their unique link
// Returns: bill info, committee, message, assigned clauses
// ─────────────────────────────────────────────
router.get('/:token', async (req, res) => {
    const { token } = req.params;
    try {
        // Fetch invite + request + bill + committee + stakeholder in one query
        const result = await db_1.db.query(`SELECT
         inv._id            AS invite_id,
         inv.token,
         inv.viewed_at,
         inv.responded_at,
         inv.response,
         req._id            AS request_id,
         req.stage,
         req.subject,
         req.message,
         req.clause_ids,
         req.created_at     AS sent_at,
         b._id              AS bill_id,
         b.bill_number,
         b.title            AS bill_title,
         b.summary          AS bill_summary,
         b.bill             AS bill_url,
         c.name             AS committee_name,
         s._id              AS stakeholder_id,
         s.name             AS stakeholder_name,
         s.email            AS stakeholder_email
       FROM app.stakeholder_review_invites inv
       JOIN app.stakeholder_review_requests req ON req._id = inv.request_id
       JOIN app.bills b                         ON b._id  = req.bill_id
       JOIN app.committee c                     ON c._id  = req.committee_id
       JOIN app.stakeholders s                  ON s._id  = inv.stakeholder_id
       WHERE inv.token = $1`, [token]);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid or expired review link' });
        }
        const row = result.rows[0];
        // Mark as viewed if first time
        if (!row.viewed_at) {
            await db_1.db.query(`UPDATE app.stakeholder_review_invites SET viewed_at = NOW() WHERE token = $1`, [token]);
        }
        // Fetch the specific clauses assigned to this review
        let clauses = [];
        if (row.clause_ids && row.clause_ids.length > 0) {
            const clauseResult = await db_1.db.query(`SELECT id, number, title, text, type, status, order_index
         FROM app.clauses
         WHERE id = ANY($1::uuid[])
         ORDER BY order_index`, [row.clause_ids]);
            clauses = clauseResult.rows;
        }
        return res.json({
            invite_id: row.invite_id,
            already_responded: !!row.responded_at,
            existing_response: row.response ?? null,
            request: {
                id: row.request_id,
                stage: row.stage,
                subject: row.subject,
                message: row.message,
                sent_at: row.sent_at,
            },
            bill: {
                id: row.bill_id,
                bill_number: row.bill_number,
                title: row.bill_title,
                summary: row.bill_summary,
                bill_url: row.bill_url,
            },
            committee: {
                name: row.committee_name,
            },
            stakeholder: {
                id: row.stakeholder_id,
                name: row.stakeholder_name,
                email: row.stakeholder_email,
            },
            clauses,
        });
    }
    catch (err) {
        console.error('Error fetching review:', err);
        return res.status(500).json({ error: 'Failed to load review' });
    }
});
// ─────────────────────────────────────────────
// POST /api/review/:token/respond
// Stakeholder submits their response
// Body: { response: string }
// ─────────────────────────────────────────────
router.post('/:token/respond', async (req, res) => {
    const { token } = req.params;
    const { response } = req.body;
    if (!response?.trim()) {
        return res.status(400).json({ error: 'Response cannot be empty' });
    }
    try {
        const result = await db_1.db.query(`UPDATE app.stakeholder_review_invites
       SET response = $1, responded_at = NOW()
       WHERE token = $2
       RETURNING _id, stakeholder_id, responded_at,request_id`, [response.trim(), token]);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Invalid review link' });
        }
        const request_d = await db_1.db.query(`
      SELECT * FROM app.stakeholder_review_requests WHERE _id=$1
      `, [result.rows[0].request_id]);
        const billdata = await fetching_1.Fetch.specificbill(request_d.rows[0].bill_id);
        const comdata = await fetching_1.Fetch.specificcommittee(request_d.rows[0].committee_id);
        const track = new audit_1.tracking(request_d.rows[0].bill_id, request_d.rows[0].committee_id, request_d.rows[0].stage);
        const stakeholderResult = await db_1.db.query(`SELECT name, email FROM app.stakeholders WHERE _id = $1`, [result.rows[0].stakeholder_id]);
        await track.audit(billdata.versionid, `${comdata.name} received a response comment about the bill from ${stakeholderResult.rows[0].name}`);
        await (0, notificationService_1.notif)(null, request_d.rows[0].committee_id, `${stakeholderResult.rows[0].name} sent a response comment about the bill ${billdata.title} `);
        // await track.audit(bill_version,'Speaker closed voting and the bill failed due to most votes decline')
        return res.json({
            success: true,
            responded_at: result.rows[0].responded_at,
        });
    }
    catch (err) {
        console.error('Error saving response:', err);
        return res.status(500).json({ error: 'Failed to save response' });
    }
});
// ─────────────────────────────────────────────
// GET /api/review/requests/:requestId/responses
// Committee views all responses for a request
// ─────────────────────────────────────────────
router.get('/requests/:requestId/responses', async (req, res) => {
    const { requestId } = req.params;
    try {
        const result = await db_1.db.query(`SELECT
         inv._id          AS invite_id,
         s.name           AS stakeholder_name,
         s.email          AS stakeholder_email,
         inv.viewed_at,
         inv.responded_at,
         inv.response,
         inv.token
       FROM app.stakeholder_review_invites inv
       JOIN app.stakeholders s ON s._id = inv.stakeholder_id
       WHERE inv.request_id = $1
       ORDER BY inv.created_at`, [requestId]);
        return res.json({ responses: result.rows });
    }
    catch (err) {
        console.error('Error fetching responses:', err);
        return res.status(500).json({ error: 'Failed to load responses' });
    }
});
exports.default = router;
