"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/voting.ts
const express_1 = require("express");
const votingservice_1 = require("../services/votingservice");
// import { Stage, VoteChoice } from '../types/voting';
const router = (0, express_1.Router)();
// Helper: wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
// ─── POST /voting/sessions/open ─────────────────────────────────────────
// Body: { bill_id, stage, }
// Opens a voting session for a specific stage
router.post('/sessions', asyncHandler(async (req, res) => {
    console.log('reached....');
    const { bill, stage, } = req.body;
    if (!bill || !stage) {
        res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
        return;
    }
    // const validStages = ['second_reading', 'report_stage', 'third_reading'];
    // if (!validStages.includes(stage.name)) {
    //   res.status(400).json({ error: `stage must be one of: ${validStages.join(', ')}` });
    //   return;
    // }
    const session = await (0, votingservice_1.Existingsession)(bill, stage);
    console.log('session.......', session);
    res.status(201).json({ session });
}));
// ─── POST /api/voting/sessions/open ─────────────────────────────────────────
// Body: { bill_id, stage, speaker_id }
// Opens a voting session for a specific stage
router.post('/sessions/open', asyncHandler(async (req, res) => {
    const { bill, stage, speaker_id } = req.body;
    if (!bill || !stage || !speaker_id) {
        res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
        return;
    }
    const validStages = ['Second Reading', 'Report Stage', 'Third Reading'];
    if (!validStages.includes(stage.name)) {
        res.status(400).json({ error: `stage must be one of: ${validStages.join(', ')}` });
        return;
    }
    const session = await (0, votingservice_1.openVotingSession)(bill, stage, speaker_id);
    res.status(201).json({ success: true, session });
}));
// ─── POST /api/voting/sessions/:sessionId/vote ───────────────────────────────
// Body: { senator_id, choice }
// Casts a senator's vote
router.post('/sessions/:sessionId/vote', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { senator_id, choice } = req.body;
    if (!senator_id || !choice) {
        res.status(400).json({ error: 'senator_id and choice are required' });
        return;
    }
    const validChoices = ['accept', 'reject', 'abstain'];
    if (!validChoices.includes(choice)) {
        res.status(400).json({ error: `choice must be one of: ${validChoices.join(', ')}` });
        return;
    }
    const result = await (0, votingservice_1.castVote)(sessionId, senator_id, choice);
    res.status(201).json({ success: true, ...result });
}));
// ─── POST /api/voting/sessions/:sessionId/close ──────────────────────────────
// Body: { speaker_id }
// Closes the voting session and finalizes results
router.post('/sessions/:sessionId/close', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { speaker_id, bill_version, nextstage } = req.body;
    console.log('closing voting..');
    if (!speaker_id) {
        res.status(400).json({ error: 'speaker_id is required' });
        return;
    }
    const result = await (0, votingservice_1.closeVotingSession)(bill_version, sessionId, speaker_id, nextstage);
    res.status(200).json({ success: true, ...result });
}));
// ─── GET /api/voting/sessions/:sessionId ─────────────────────────────────────
// Gets current tally and session info
router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const result = await (0, votingservice_1.getSessionTally)(sessionId);
    res.json(result);
}));
// ─── GET /api/voting/sessions/:sessionId/my-vote?senator_id=... ──────────────
// Checks if a senator has already voted
router.get('/sessions/:sessionId/my-vote', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { senator_id } = req.query;
    if (!senator_id) {
        res.status(400).json({ error: 'senator_id query param is required' });
        return;
    }
    const vote = await (0, votingservice_1.getSenatorVoteInSession)(sessionId, senator_id);
    res.json({ voted: !!vote, vote: vote ?? null });
}));
// ─── GET /api/voting/sessions/:sessionId/audit ───────────────────────────────
// Full audit trail (typically speaker/admin only)
router.get('/sessions/:sessionId/audit', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const trail = await (0, votingservice_1.getAuditTrail)(sessionId);
    res.json({ audit_trail: trail });
}));
// Error handler
router.use((err, req, res, _next) => {
    console.error(err);
    res.status(400).json({ error: err.message });
});
exports.default = router;
