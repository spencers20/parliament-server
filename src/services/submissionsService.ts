// src/services/submissionsService.ts

// import { db } from '../db';
import { db } from '../database/db';
import { broadcastSubmission } from '../socket';
// import { broadcastSubmission } from '../socket/socketManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubmissionCategory = 'general' | 'support' | 'oppose' | 'amendment' | 'concern';

export interface PublicSubmission {
  id: string;
  bill_id: string;
  stage: string;
  name?: string;
  category: SubmissionCategory;
  comment: string;
  attachment_url?: string;
  idno_?: string;
  fingerprint?: string;
  submitted_at: Date;
}

export interface DailyTrend {
  trend_date: string;
  submissions: number;
  support: number;
  oppose: number;
  amendment: number;
  concern: number;
  general: number;
}

export interface SubmissionStats {
  total: number;
  support: number;
  oppose: number;
  amendment: number;
  concern: number;
  general: number;
}

// ─── Deduplication check ──────────────────────────────────────────────────────

export async function hasAlreadySubmitted(
  billId: string,
  stage: string,
  idno_?: string,
  fingerprint?: string
): Promise<boolean> {
  if (idno_) {
    const res = await db.query(
      `SELECT id FROM app.public_submissions WHERE bill_id = $1 AND stage = $2 AND id_number  = $3`,
      [billId, stage, idno_]
    );
    if (res.rows.length > 0) return true;
  }
  if (fingerprint) {
    const res = await db.query(
      `SELECT id FROM app.public_submissions WHERE bill_id = $1 AND stage = $2 AND fingerprint = $3`,
      [billId, stage, fingerprint]
    );
    if (res.rows.length > 0) return true;
  }
  return false;
}

// ─── Create submission + upsert daily trend + broadcast ───────────────────────

export async function createSubmission(params: {
  billId: string;
  stage: any;
  name?: string;
  category: SubmissionCategory;
  comment: string;
  attachmentUrl?: string;
  idno_?: string;
  fingerprint?: string;
}): Promise<{ submission: PublicSubmission; stats: SubmissionStats; trends: DailyTrend[] }> {
  const { billId, stage, name, category, comment, attachmentUrl, idno_, fingerprint } = params;

  const alreadySubmitted = await hasAlreadySubmitted(billId, stage, idno_, fingerprint);
  if (alreadySubmitted) {
    throw new Error('You have already submitted feedback for this bill at this stage.');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Insert submission
    const subRes = await client.query<PublicSubmission>(
      `INSERT INTO app.public_submissions
         (bill_id, stage, name, category, comment, attachment_url, id_number , fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [billId, stage, name ?? null, category, comment, attachmentUrl ?? null, idno_ ?? null, fingerprint ?? null]
    );
    const submission = subRes.rows[0];

    // Upsert daily trend — increment today's row
    await client.query(
      `INSERT INTO app.submission_daily_trends
         (bill_id, stage, trend_date, submissions, support, oppose, amendment, concern, general)
       VALUES ($1, $2, CURRENT_DATE, 1, $3, $4, $5, $6, $7)
       ON CONFLICT (bill_id, stage, trend_date)
       DO UPDATE SET
         submissions = submission_daily_trends.submissions + 1,
         support     = submission_daily_trends.support     + $3,
         oppose      = submission_daily_trends.oppose      + $4,
         amendment   = submission_daily_trends.amendment   + $5,
         concern     = submission_daily_trends.concern     + $6,
         general     = submission_daily_trends.general     + $7`,
      [
        billId, stage,
        category === 'support'   ? 1 : 0,
        category === 'oppose'    ? 1 : 0,
        category === 'amendment' ? 1 : 0,
        category === 'concern'   ? 1 : 0,
        category === 'general'   ? 1 : 0,
      ]
    );

    await client.query('COMMIT');

    const [stats, trends] = await Promise.all([
      getSubmissionStats(billId, stage),
      getDailyTrends(billId, stage),
    ]);

    broadcastSubmission(billId, stage, {
      type: 'SUBMISSION_UPDATE',
      bill_id: billId,
      stage,
      stats,
      latest_trend: trends[trends.length - 1] ?? null,
      trends,
    });

    return { submission, stats, trends };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getSubmissionStats(billId: string, stage: string): Promise<SubmissionStats> {
  const res = await db.query(
    `SELECT
       COUNT(*)                                          AS total,
       COUNT(*) FILTER (WHERE category = 'support')     AS support,
       COUNT(*) FILTER (WHERE category = 'oppose')      AS oppose,
       COUNT(*) FILTER (WHERE category = 'amendment')   AS amendment,
       COUNT(*) FILTER (WHERE category = 'concern')     AS concern,
       COUNT(*) FILTER (WHERE category = 'general')     AS general
     FROM app.public_submissions
     WHERE bill_id = $1 AND stage = $2`,
    [billId, stage]
  );
  const row = res.rows[0];
  return {
    total:     parseInt(row.total),
    support:   parseInt(row.support),
    oppose:    parseInt(row.oppose),
    amendment: parseInt(row.amendment),
    concern:   parseInt(row.concern),
    general:   parseInt(row.general),
  };
}

// ─── Daily trends ─────────────────────────────────────────────────────────────

export async function getDailyTrends(billId: string, stage: string): Promise<DailyTrend[]> {
  const res = await db.query<DailyTrend>(
    `SELECT
       trend_date::TEXT AS trend_date,
       submissions, support, oppose, amendment, concern, general
     FROM app.submission_daily_trends
     WHERE bill_id = $1 AND stage = $2
     ORDER BY trend_date ASC`,
    [billId, stage]
  );
  return res.rows;
}

// ─── Recent submissions (safe — no PII) ──────────────────────────────────────

export async function getRecentSubmissions(
  billId: string,
  stage: string,
  limit = 20
): Promise<Omit<PublicSubmission, 'idno_' | 'fingerprint'>[]> {
  const res = await db.query(
    `SELECT id, bill_id, stage, name, category, comment, attachment_url, submitted_at
     FROM app.public_submissions
     WHERE bill_id = $1 AND stage = $2
     ORDER BY submitted_at DESC
     LIMIT $3`,
    [billId, stage, limit]
  );
  return res.rows;
}