// src/services/committeeService.ts

// import { pool } from '../db';
import { db } from "../database/db";
import { broadcastCommittee } from "../socket";
import { StageActions } from "./action";
// import {
//   Clause,
//   Amendment,
//   CommitteeVotingSession,
//   CommitteeVote,
//   CommitteeVoteTally,
//   CommitteeBillStatus,
//   CommitteeItemType,
//   VoteChoice,
// } from '../types/committee';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTally(session:any ) {
  return {
    accept: session.total_accept,
    reject: session.total_reject,
    abstain: session.total_abstain,
    total: session.total_accept + session.total_reject + session.total_abstain,
  };
}

// ─── READ:   + amendments for a bill ───────────────────────────────────

export async function getBillClauses(billId:any){
  const clauseRes = await db.query(
    `SELECT * FROM app.clauses WHERE bill_id = $1 ORDER BY order_index ASC`,
    [billId]
  );

  const clauses = clauseRes.rows;

  // Fetch amendments for each clause and attach votes from closed sessions
  for (const clause of clauses) {
    const amdRes = await db.query(
      `SELECT a.*,
              cvs.total_accept, cvs.total_reject, cvs.total_abstain, cvs.passed as voted_passed,
              cvs.status as session_status
       FROM app.amendments a
       LEFT JOIN app.committee_voting_sessions cvs
         ON cvs.amendment_id = a._id AND cvs.status = 'closed'
       WHERE a.clause_id = $1
       ORDER BY a.date ASC`,
      [clause.id]
    );

    clause.amendments = amdRes.rows.map((row) => ({
      id: row._id,
      clause_id: row.clause_id,
      bill_id: row.bill,
    //   preview: row.preview,
      proposed_change: row.change,
      justification: row.justification,
    //   proposed_by: row.proposed_by,
      author_name: row.author,
      status: row.status,
      created_at: row.date,
      votes: row.session_status === 'closed'
        ? {
            accept: row.total_accept,
            reject: row.total_reject,
            abstain: row.total_abstain,
            total: row.total_accept + row.total_reject + row.total_abstain,
          }
        : null,
    }));
  }

  return clauses;
}

// ─── READ: Active session for a bill ─────────────────────────────────────────

export async function getActiveSession(
  billId: any
) {
  const res = await db.query(
    `SELECT * FROM app.committee_voting_sessions
     WHERE bill_id = $1 AND status = 'open'
     LIMIT 1`,
    [billId]
  );
  return res.rows[0] ?? null;
}

// ─── READ: Bill committee status summary ─────────────────────────────────────

export async function getBillCommitteeStatus(
  billId: any
){
  const [clauseStats, amdStats, active] = await Promise.all([
    db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status != 'not_voted') as voted,
         COUNT(*) FILTER (WHERE status = 'passed') as passed,
         COUNT(*) FILTER (WHERE status = 'failed') as failed
       FROM app.clauses WHERE bill_id = $1`,
      [billId]
    ),
    db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status != 'pending') as voted
       FROM app.amendments WHERE bill = $1`,
      [billId]
    ),
    getActiveSession(billId),
  ]);

  const c = clauseStats.rows[0];
  const a = amdStats.rows[0];

  const totalClauses = parseInt(c.total);
  const passedClauses = parseInt(c.passed);
  const failedClauses = parseInt(c.failed);
  const allClausesVoted = parseInt(c.voted) === totalClauses && totalClauses > 0;
  const allAmendmentsVoted = parseInt(a.total) === 0 || parseInt(a.voted) === parseInt(a.total);

  // Bill is killed if more than half the clauses failed
  const billKilled = allClausesVoted && failedClauses > totalClauses / 2;

  return {
    bill_id: billId,
    total_clauses: totalClauses,
    clauses_voted: parseInt(c.voted),
    clauses_passed: passedClauses,
    clauses_failed: failedClauses,
    all_amendments_voted: allAmendmentsVoted,
    all_clauses_voted: allClausesVoted,
    bill_killed: billKilled,
    active_session: active ?? undefined,
  };
}

// ─── SPEAKER: Open a voting session ──────────────────────────────────────────

export async function openCommitteeSession(params: {
  billId: string;
  speakerId: string;
  itemType: any;
  amendmentId?: string;
  clauseId?: string;
  enBlocClauseIds?: string[];
}){
  const { billId, speakerId, itemType, amendmentId, clauseId, enBlocClauseIds } = params;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Only one open session at a time per bill
    const existing = await client.query(
      `SELECT id FROM app.committee_voting_sessions WHERE bill_id = $1 AND status = 'open'`,
      [billId]
    );
    if (existing.rows.length > 0) {
      throw new Error('Another voting session is already open for this bill. Close it first.');
    }

    // Validate: for amendment sessions, all prior amendments of same clause must be done
    if (itemType === 'amendment' && amendmentId) {
      const amd = await client.query(
        `SELECT * FROM app.amendments WHERE _id = $1`, [amendmentId]
      );
      if (!amd.rows[0]) throw new Error('Amendment not found');
      if (amd.rows[0].status !== 'pending') {
        throw new Error('This amendment has already been voted on');
      }
    }

    // Validate: for clause sessions, all amendments of that clause must be voted
    if (itemType === 'clause' && clauseId) {
      const unvoted = await client.query(
        `SELECT _id FROM app.amendments WHERE clause_id = $1 AND status = 'pending'`,
        [clauseId]
      );
      if (unvoted.rows.length > 0) {
        throw new Error('All amendments must be voted on before voting on the clause.');
      }
    }

    const res = await client.query(
      `INSERT INTO app.committee_voting_sessions
         (bill_id, item_type, amendment_id, clause_id, en_bloc_clause_ids,
          status, opened_by, opened_at)
       VALUES ($1, $2, $3, $4, $5, 'open', $6, NOW())
       RETURNING *`,
      [
        billId,
        itemType,
        amendmentId ?? null,
        clauseId ?? null,
        enBlocClauseIds ?? null,
        speakerId,
      ]
    );

    await client.query('COMMIT');
    const session = res.rows[0];

    // Build human-readable label for the broadcast
    let label = '';
    if (itemType === 'amendment' && amendmentId) {
      const amd = await db.query(`SELECT preview FROM app.amendments WHERE _id = $1`, [amendmentId]);
      label = `Amendment: ${amd.rows[0]?.preview ?? ''}`;
    } else if (itemType === 'clause' && clauseId) {
      const cl = await db.query(`SELECT number, title FROM app.clauses WHERE id = $1`, [clauseId]);
      label = `Clause ${cl.rows[0]?.number}: ${cl.rows[0]?.title ?? ''}`;
    } else if (itemType === 'en_bloc' && enBlocClauseIds?.length) {
      const cls = await db.query(
        `SELECT number FROM app.clauses WHERE id = ANY($1) ORDER BY order_index`,
        [enBlocClauseIds]
      );
      label = `En Bloc — Clauses ${cls.rows.map((r) => r.number).join(', ')}`;
    } else if (itemType === 'new_clause' && clauseId) {
      const cl = await db.query(`SELECT number, title FROM app.clauses WHERE id = $1`, [clauseId]);
      label = `New Clause ${cl.rows[0]?.number}: ${cl.rows[0]?.title ?? ''}`;
    }

    broadcastCommittee(billId, {
      type: 'COMMITTEE_SESSION_OPENED',
      session,
      item_type: itemType,
      label,
    });

    return session;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── SENATOR: Cast a vote ─────────────────────────────────────────────────────

export async function castCommitteeVote(
  sessionId: any,
  senatorId: any,
  choice: any
) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const sessionRes = await client.query(
      `SELECT * FROM app.committee_voting_sessions WHERE id = $1 FOR UPDATE`,
      [sessionId]
    );
    if (!sessionRes.rows[0]) throw new Error('Session not found');
    const session = sessionRes.rows[0];
    if (session.status !== 'open') throw new Error('Voting session is not open');

    // Prevent double vote
    const already = await client.query(
      `SELECT id FROM app.committee_votes WHERE session_id = $1 AND senator_id = $2`,
      [sessionId, senatorId]
    );
    if (already.rows.length > 0) throw new Error('You have already voted in this session');

    // Record vote
    const voteRes = await client.query(
      `INSERT INTO app.committee_votes
         (session_id, senator_id, bill_id, item_type, choice, voted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [sessionId, senatorId, session.bill_id, session.item_type, choice]
    );

    // Increment tally
    const col = choice === 'accept' ? 'total_accept' : choice === 'reject' ? 'total_reject' : 'total_abstain';
    const updated = await client.query(
      `UPDATE app.committee_voting_sessions
       SET ${col} = ${col} + 1
       WHERE id = $1
       RETURNING total_accept, total_reject, total_abstain`,
      [sessionId]
    );

    await client.query('COMMIT');

    const { total_accept, total_reject, total_abstain } = updated.rows[0];
    const tally = {
      accept: total_accept,
      reject: total_reject,
      abstain: total_abstain,
      total: total_accept + total_reject + total_abstain,
    };

    // Broadcast live tally to all watching this bill
    broadcastCommittee(session.bill_id, {
      type: 'COMMITTEE_VOTE_UPDATE',
      session_id: sessionId,
      item_type: session.item_type,
      tally,
    });

    return { vote: voteRes.rows[0], tally };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── SPEAKER: Close session ───────────────────────────────────────────────────

export async function closeCommitteeSession(
  sessionId: any,
  speakerId: any,
  stage:any
): Promise<{
  session: any
  tally: any
  passed: boolean;
  bill_killed: boolean;
  affected_clause_ids: string[];
}> {
  const stageactions=new StageActions()
  const client = await db.connect();


  try {
    await client.query('BEGIN');

    const sessionRes = await client.query(
      `SELECT * FROM app.committee_voting_sessions WHERE id = $1 AND opened_by = $2 FOR UPDATE`,
      [sessionId, speakerId]
    );
    if (!sessionRes.rows[0]) throw new Error('Session not found or you are not the session owner');
    const session = sessionRes.rows[0];
    if (session.status !== 'open') throw new Error('Session is not open');

    const passed = session.total_accept > session.total_reject;
    const affectedClauseIds: string[] = [];

    // Close the session
    const closed = await client.query(
      `UPDATE app.committee_voting_sessions SET status='closed', closed_at=NOW(), passed=$1 WHERE id=$2 RETURNING *`,
      [passed, sessionId]
    );

    // ── Update the relevant item's status based on result ──────────────────

    if (session.item_type === 'amendment' && session.amendment_id) {
      await client.query(
        `UPDATE app.amendments SET status = $1 WHERE _id = $2`,
        [passed ? 'passed' : 'failed', session.amendment_id]
      );
      // Get the clause_id of the amendment so UI can refresh
      const amd = await client.query(`SELECT clause_id FROM app.amendments WHERE _id = $1`, [session.amendment_id]);
      if (amd.rows[0]) affectedClauseIds.push(amd.rows[0].clause_id);
    }

    if (session.item_type === 'clause' && session.clause_id) {
      await client.query(
        `UPDATE app.clauses SET status = $1 WHERE id = $2`,
        [passed ? 'passed' : 'failed', session.clause_id]
      );
      affectedClauseIds.push(session.clause_id);
    }

    if (session.item_type === 'new_clause' && session.clause_id) {
      await client.query(
        `UPDATE app.clauses SET status = $1 WHERE id = $2`,
        [passed ? 'passed' : 'failed', session.clause_id]
      );
      affectedClauseIds.push(session.clause_id);
    }

    if (session.item_type === 'en_bloc' && session.en_bloc_clause_ids?.length) {
      // En bloc: if passed all pass, if failed all fail
      await client.query(
        `UPDATE app.clauses SET status = $1 WHERE id = ANY($2)`,
        [passed ? 'passed' : 'failed', session.en_bloc_clause_ids]
      );
      affectedClauseIds.push(...session.en_bloc_clause_ids);
    }

    // ── Check if bill should be killed ────────────────────────────────────

    const clauseStats = await client.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'passed') as passed,
         COUNT(*) FILTER (WHERE status = 'abstain') as abstain
       FROM app.clauses WHERE bill_id = $1`,
      [session.bill_id]
    );
    const total = parseInt(clauseStats.rows[0].total);
    const failed = parseInt(clauseStats.rows[0].failed);
    const pass = parseInt(clauseStats.rows[0].passed);
    const abstained = parseInt(clauseStats.rows[0].abstain);
    const billKilled = total > 0 && failed > total / 2;

    if(total===(pass+abstained+failed)){
      await stageactions.completestage(stage.id)
      // await stageactions.completeaction
      await stageactions.startaction(stage.nextaction)
      await stageactions.startstage(stage.nextstage)
      console.log('new stage started')
    }

    if (billKilled) {
      await client.query(`UPDATE app.bills SET status = 'failed' WHERE id = $1`, [session.bill_id]);
    }

    await client.query('COMMIT');

    const closedSession = closed.rows[0];
    const tally = buildTally(closedSession);

    broadcastCommittee(session.bill_id, {
      type: 'COMMITTEE_SESSION_CLOSED',
      session: closedSession,
      tally,
      passed,
      item_type: session.item_type,
      affected_clause_ids: affectedClauseIds,
      bill_killed: billKilled,
    });

    return { session: closedSession, tally, passed, bill_killed: billKilled, affected_clause_ids: affectedClauseIds };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Get senator's vote for a session ────────────────────────────────────────

export async function getSenatorCommitteeVote(
  sessionId: any,
  senatorId: any
){
  const res = await db.query(
    `SELECT * FROM app.committee_votes WHERE session_id = $1 AND senator_id = $2`,
    [sessionId, senatorId]
  );
  return res.rows[0] ?? null;
}