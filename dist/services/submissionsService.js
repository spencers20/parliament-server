"use strict";
// src/services/submissionsService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasAlreadySubmitted = hasAlreadySubmitted;
exports.createSubmission = createSubmission;
exports.getSubmissionStats = getSubmissionStats;
exports.getDailyTrends = getDailyTrends;
exports.getRecentSubmissions = getRecentSubmissions;
// import { db } from '../db';
const db_1 = require("../database/db");
const socket_1 = require("../socket");
// ─── Deduplication check ──────────────────────────────────────────────────────
async function hasAlreadySubmitted(billId, stage, idno_, fingerprint) {
    if (idno_) {
        const res = await db_1.db.query(`SELECT id FROM app.public_submissions WHERE bill_id = $1 AND stage = $2 AND id_number  = $3`, [billId, stage, idno_]);
        if (res.rows.length > 0)
            return true;
    }
    if (fingerprint) {
        const res = await db_1.db.query(`SELECT id FROM app.public_submissions WHERE bill_id = $1 AND stage = $2 AND fingerprint = $3`, [billId, stage, fingerprint]);
        if (res.rows.length > 0)
            return true;
    }
    return false;
}
// ─── Create submission + upsert daily trend + broadcast ───────────────────────
async function createSubmission(params) {
    const { billId, stage, name, category, comment, attachmentUrl, idno_, fingerprint } = params;
    const alreadySubmitted = await hasAlreadySubmitted(billId, stage, idno_, fingerprint);
    if (alreadySubmitted) {
        throw new Error('You have already submitted feedback for this bill at this stage.');
    }
    const client = await db_1.db.connect();
    try {
        await client.query('BEGIN');
        // Insert submission
        const subRes = await client.query(`INSERT INTO app.public_submissions
         (bill_id, stage, name, category, comment, attachment_url, id_number , fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [billId, stage, name ?? null, category, comment, attachmentUrl ?? null, idno_ ?? null, fingerprint ?? null]);
        const submission = subRes.rows[0];
        // Upsert daily trend — increment today's row
        await client.query(`INSERT INTO app.submission_daily_trends
         (bill_id, stage, trend_date, submissions, support, oppose, amendment, concern, general)
       VALUES ($1, $2, CURRENT_DATE, 1, $3, $4, $5, $6, $7)
       ON CONFLICT (bill_id, stage, trend_date)
       DO UPDATE SET
         submissions = submission_daily_trends.submissions + 1,
         support     = submission_daily_trends.support     + $3,
         oppose      = submission_daily_trends.oppose      + $4,
         amendment   = submission_daily_trends.amendment   + $5,
         concern     = submission_daily_trends.concern     + $6,
         general     = submission_daily_trends.general     + $7`, [
            billId, stage,
            category === 'support' ? 1 : 0,
            category === 'oppose' ? 1 : 0,
            category === 'amendment' ? 1 : 0,
            category === 'concern' ? 1 : 0,
            category === 'general' ? 1 : 0,
        ]);
        await client.query('COMMIT');
        const [stats, trends] = await Promise.all([
            getSubmissionStats(billId, stage),
            getDailyTrends(billId, stage),
        ]);
        (0, socket_1.broadcastSubmission)(billId, stage, {
            type: 'SUBMISSION_UPDATE',
            bill_id: billId,
            stage,
            stats,
            latest_trend: trends[trends.length - 1] ?? null,
            trends,
        });
        return { submission, stats, trends };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ─── Stats ────────────────────────────────────────────────────────────────────
async function getSubmissionStats(billId, stage) {
    const res = await db_1.db.query(`SELECT
       COUNT(*)                                          AS total,
       COUNT(*) FILTER (WHERE category = 'support')     AS support,
       COUNT(*) FILTER (WHERE category = 'oppose')      AS oppose,
       COUNT(*) FILTER (WHERE category = 'amendment')   AS amendment,
       COUNT(*) FILTER (WHERE category = 'concern')     AS concern,
       COUNT(*) FILTER (WHERE category = 'general')     AS general
     FROM app.public_submissions
     WHERE bill_id = $1 AND stage = $2`, [billId, stage]);
    const row = res.rows[0];
    return {
        total: parseInt(row.total),
        support: parseInt(row.support),
        oppose: parseInt(row.oppose),
        amendment: parseInt(row.amendment),
        concern: parseInt(row.concern),
        general: parseInt(row.general),
    };
}
// ─── Daily trends ─────────────────────────────────────────────────────────────
async function getDailyTrends(billId, stage) {
    const res = await db_1.db.query(`SELECT
       trend_date::TEXT AS trend_date,
       submissions, support, oppose, amendment, concern, general
     FROM app.submission_daily_trends
     WHERE bill_id = $1 AND stage = $2
     ORDER BY trend_date ASC`, [billId, stage]);
    return res.rows;
}
// ─── Recent submissions (safe — no PII) ──────────────────────────────────────
async function getRecentSubmissions(billId, stage, limit = 20) {
    const res = await db_1.db.query(`SELECT id, bill_id, stage, name, category, comment, attachment_url, submitted_at
     FROM app.public_submissions
     WHERE bill_id = $1 AND stage = $2
     ORDER BY submitted_at DESC
     LIMIT $3`, [billId, stage, limit]);
    return res.rows;
}
