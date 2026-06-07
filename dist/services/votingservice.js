"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Existingsession = Existingsession;
exports.openVotingSession = openVotingSession;
exports.castVote = castVote;
exports.closeVotingSession = closeVotingSession;
exports.getSessionTally = getSessionTally;
exports.getAuditTrail = getAuditTrail;
exports.getSenatorVoteInSession = getSenatorVoteInSession;
// src/services/votingService.ts
const db_1 = require("../database/db");
const socket_1 = require("../socket");
const action_1 = require("./action");
const billdeath_1 = require("./billdeath");
const audit_1 = require("./audit");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("./notificationService");
// import { broadcast } from '../socket/socketManager';
// import {
//   Stage,
//   VoteChoice,
//   VotingSession,
//   SenatorVote,
//   VoteTally,
// } from '../types/voting';
// ─── Check existing session─────────────────────────────────
async function Existingsession(billId, stageId) {
    const client = await db_1.db.connect();
    try {
        let session;
        await client.query('BEGIN');
        // Ensure no other session is already open for this bill+stage
        const existing = await client.query(`SELECT * FROM app.voting_sessions WHERE bill_id = $1 AND stage = $2`, [billId, stageId]);
        if (existing.rows.length > 0) {
            session = existing.rows[0];
            console.log('session...', session);
        }
        await client.query('COMMIT');
        return session;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ─── Open a voting session (speaker action) ─────────────────────────────────
async function openVotingSession(bill, stage, speakerId) {
    const client = await db_1.db.connect();
    try {
        const stageactions = new action_1.StageActions();
        await client.query('BEGIN');
        // Ensure no other session is already open for this bill+stage
        const existing = await client.query(`SELECT _id, status FROM app.voting_sessions WHERE bill_id = $1 AND stage = $2`, [bill.id, stage.id]);
        if (existing.rows.length > 0) {
            const row = existing.rows[0];
            if (row.status === 'open') {
                throw new Error(`A voting session for ${stage.name} bill ${bill.id} is already open`);
            }
            if (row.status === 'closed') {
                throw new Error(`Voting for ${stage} bill ${bill.id} has already been completed`);
            }
        }
        const result = await client.query(`INSERT INTO app.voting_sessions
         (bill_id, stage, status, opened_by, opened_at)
       VALUES ($1, $2, 'open', $3, NOW())
       RETURNING *`, [bill.id, stage.id, speakerId]);
        await client.query('COMMIT');
        const session = result.rows[0];
        await stageactions.completeaction(stage.currentaction);
        await stageactions.startaction(stage.nextaction);
        const track = new audit_1.tracking(bill.id, speakerId, stage.id);
        const stagedata = await fetching_1.Fetch.specificstage(stage.id);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        await track.audit(billdata.versionid, `The Speaker officially opened voting for the ${stagedata.name} stage.`);
        const all_ids = await fetching_1.Fetch.allprofile();
        await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: The speaker has started voting on principles for the stage ${stagedata.name}}  `);
        // Broadcast session opened
        (0, socket_1.broadcast)(session.id, {
            type: 'SESSION_OPENED',
            session,
        });
        return session;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ─── Cast a vote (senator action) ───────────────────────────────────────────
async function castVote(sessionId, senatorId, choice) {
    const client = await db_1.db.connect();
    try {
        await client.query('BEGIN');
        // Lock and fetch session
        const sessionRes = await client.query(`SELECT * FROM app.voting_sessions WHERE _id = $1 FOR UPDATE`, [sessionId]);
        if (sessionRes.rows.length === 0) {
            throw new Error('Voting session not found');
        }
        const session = sessionRes.rows[0];
        if (session.status !== 'open') {
            throw new Error('Voting session is not open');
        }
        // Check if senator already voted
        const existing = await client.query(`SELECT _id FROM app.senator_votes WHERE session_id = $1 AND senator_id = $2`, [sessionId, senatorId]);
        if (existing.rows.length > 0) {
            throw new Error('Senator has already voted in this session');
        }
        // Record the vote
        const voteRes = await client.query(`INSERT INTO app.senator_votes
         (session_id, senator_id, bill_id, stage, choice, voted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`, [sessionId, senatorId, session.bill_id, session.stage, choice]);
        // Increment the running tally on the session row
        const colMap = {
            accept: 'total_accept',
            reject: 'total_reject',
            abstain: 'total_abstain',
        };
        const col = colMap[choice];
        const updatedSession = await client.query(`UPDATE app.voting_sessions
       SET ${col} = ${col} + 1
       WHERE _id = $1
       RETURNING total_accept, total_reject, total_abstain`, [sessionId]);
        await client.query('COMMIT');
        const { total_accept, total_reject, total_abstain } = updatedSession.rows[0];
        const tally = {
            accept: total_accept,
            reject: total_reject,
            abstain: total_abstain,
            total: total_accept + total_reject + total_abstain,
        };
        // Broadcast real-time tally update to all watchers
        (0, socket_1.broadcast)(sessionId, {
            type: 'VOTE_UPDATE',
            session_id: sessionId,
            tally,
        });
        return { vote: voteRes.rows[0], tally };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ─── Close voting session (speaker action) ──────────────────────────────────
async function closeVotingSession(bill_version, sessionId, speakerId, nextstage) {
    const stageactions = new action_1.StageActions();
    const client = await db_1.db.connect();
    try {
        console.log('closing....', sessionId);
        await client.query('BEGIN');
        const sessionRes = await client.query(`SELECT * FROM app.voting_sessions WHERE _id = $1 AND opened_by = $2 FOR UPDATE`, [sessionId, speakerId]);
        if (sessionRes.rows.length === 0) {
            throw new Error('Session not found or you are not the session owner');
        }
        const session = sessionRes.rows[0];
        if (session.status !== 'open') {
            throw new Error('Session is not open');
        }
        const passed = session.total_accept > session.total_reject;
        // Close session and record result
        const closed = await client.query(`UPDATE app.voting_sessions
       SET status = 'closed', closed_at = NOW(), passed = $1
       WHERE _id = $2
       RETURNING *`, [passed, sessionId]);
        const stagedata = await fetching_1.Fetch.specificstage(session.stage);
        const track = new audit_1.tracking(session.bill_id, speakerId, session.stage);
        const billdata = await fetching_1.Fetch.specificbill(session.bill_id);
        if (!passed) {
            await (0, billdeath_1.killbill)(session.bill_id, 'Most votes on decline', session.stage);
            await track.audit(billdata.versionid, `The Speaker officially closing voting for the ${stagedata.name} stage.`);
            await track.audit(bill_version, 'Speaker closed voting and the bill failed due to most votes decline');
        }
        else {
            await client.query('COMMIT');
            await stageactions.completestage(session.stage);
            await track.audit(bill_version, 'Speaker closed voting, ');
            if (nextstage) {
                await stageactions.startstage(nextstage);
                await stageactions.totalstartaction(nextstage);
            }
            if (stagedata.name === 'Third Reading' && passed) {
                await db_1.db.query(`UPDATE app.bills SET status = 'passed' WHERE _id = $1`, [session.bill_id]);
            }
            await track.audit(bill_version, `Bill passed to The ${stagedata.name === 'Third Reading' ? 'National Assembly' : 'Next Stage'}: Majority Voted on the Bill`);
            const all_ids = await fetching_1.Fetch.allprofile();
            await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: The speaker has closed voting  for the stage ${stagedata.name}}  `);
        }
        await stageactions.totalcompleteaction(session.stage);
        const closedSession = closed.rows[0];
        const tally = {
            accept: closedSession.total_accept,
            reject: closedSession.total_reject,
            abstain: closedSession.total_abstain,
            total: closedSession.total_accept +
                closedSession.total_reject +
                closedSession.total_abstain,
        };
        // Broadcast final result
        (0, socket_1.broadcast)(sessionId, {
            type: 'SESSION_CLOSED',
            session: closedSession,
            tally,
            passed,
        });
        return { session: closedSession, tally, passed };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// ─── Get current tally (for initial page load) ──────────────────────────────
async function getSessionTally(sessionId) {
    const sessionRes = await db_1.db.query(`SELECT * FROM app.voting_sessions WHERE _id = $1`, [sessionId]);
    if (sessionRes.rows.length === 0) {
        throw new Error('Session not found');
    }
    const session = sessionRes.rows[0];
    const tally = {
        accept: session.total_accept,
        reject: session.total_reject,
        abstain: session.total_abstain,
        total: session.total_accept + session.total_reject + session.total_abstain,
    };
    return { session, tally };
}
// ─── Get audit trail for a session ──────────────────────────────────────────
async function getAuditTrail(sessionId) {
    const res = await db_1.db.query(`SELECT sv.*, s.name as senator_name
     FROM app.senator_votes sv
     LEFT JOIN app.profile s ON sv.senator_id = s._id
     WHERE sv.session_id = $1
     ORDER BY sv.voted_at ASC`, [sessionId]);
    return res.rows;
}
// ─── Check if a senator has already voted ───────────────────────────────────
async function getSenatorVoteInSession(sessionId, senatorId) {
    const res = await db_1.db.query(`SELECT * FROM app.senator_votes WHERE session_id = $1 AND senator_id = $2`, [sessionId, senatorId]);
    return res.rows[0] ?? null;
}
