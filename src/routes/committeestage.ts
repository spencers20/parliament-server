// src/routes/committee.ts

import { Router, Request, Response, NextFunction } from 'express';
import {
  getBillClauses,
  getActiveSession,
  getBillCommitteeStatus,
  openCommitteeSession,
  castCommitteeVote,
  closeCommitteeSession,
  getSenatorCommitteeVote,
} from '../services/committeestageService';
// import { CommitteeItemType, VoteChoice } from '../types/committee';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ── GET /api/committee/:billId/clauses ────────────────────────────────────────
// Returns all clauses with their amendments and vote results
router.post(
  '/clauses',
  asyncHandler(async (req, res) => {
    const {billId}=req.body
    console.log('REACHED....001.')
    console.log('bill_id..clauses...',billId)
    const clauses = await getBillClauses(billId);
    res.json({ clauses });
  })
);

// ── GET /api/committee/:billId/status ─────────────────────────────────────────
// Returns summary: how many clauses voted, any active session, bill killed?
router.post(
  '/status',
  asyncHandler(async (req, res) => {
    console.log('REACHED.....')
    const {billId}=req.body
    console.log('bill_id..',billId)
    const status = await getBillCommitteeStatus(billId);
    res.json(status);
  })
);

// ── GET /api/committee/:billId/active-session ─────────────────────────────────
router.get(
  '/:billId/active-session',
  asyncHandler(async (req, res) => {
    const session = await getActiveSession(req.params.billId);
    res.json({ session: session ?? null });
  })
);

// ── POST /api/committee/sessions/open ────────────────────────────────────────
// Speaker opens a voting session for an amendment, clause, en_bloc, or new_clause
// Body: { bill_id, speaker_id, item_type, amendment_id?, clause_id?, en_bloc_clause_ids? }
router.post(
  '/sessions/open',
  asyncHandler(async (req, res) => {
    const { bill_id, speaker_id, item_type, amendment_id, clause_id, en_bloc_clause_ids } = req.body;

    if (!bill_id || !speaker_id || !item_type) {
      res.status(400).json({ error: 'bill_id, speaker_id, and item_type are required' });
      return;
    }

    const validTypes = ['amendment', 'clause', 'en_bloc', 'new_clause'];
    if (!validTypes.includes(item_type)) {
      res.status(400).json({ error: `item_type must be one of: ${validTypes.join(', ')}` });
      return;
    }

    if (item_type === 'amendment' && !amendment_id) {
      res.status(400).json({ error: 'amendment_id required for amendment voting' });
      return;
    }
    if ((item_type === 'clause' || item_type === 'new_clause') && !clause_id) {
      res.status(400).json({ error: 'clause_id required for clause/new_clause voting' });
      return;
    }
    if (item_type === 'en_bloc' && (!en_bloc_clause_ids || !en_bloc_clause_ids.length)) {
      res.status(400).json({ error: 'en_bloc_clause_ids required for en bloc voting' });
      return;
    }

    const session = await openCommitteeSession({
      billId: bill_id,
      speakerId: speaker_id,
      itemType: item_type,
      amendmentId: amendment_id,
      clauseId: clause_id,
      enBlocClauseIds: en_bloc_clause_ids,
    });

    res.status(201).json({ success: true, session });
  })
);

// ── POST /api/committee/sessions/:sessionId/vote ──────────────────────────────
// Senator casts their vote
// Body: { senator_id, choice }
router.post(
  '/sessions/:sessionId/vote',
  asyncHandler(async (req, res) => {
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

    const result = await castCommitteeVote(sessionId, senator_id, choice );
    res.status(201).json({ success: true, ...result });
  })
);

// ── POST /api/committee/sessions/:sessionId/close ─────────────────────────────
// Speaker closes the session
// Body: { speaker_id }
router.post(
  '/sessions/:sessionId/close',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { speaker_id,stage } = req.body;

    if (!speaker_id) {
      res.status(400).json({ error: 'speaker_id is required' });
      return;
    }

    const result = await closeCommitteeSession(sessionId, speaker_id,stage);
    res.status(200).json({ success: true, ...result });
  })
);

// ── GET /api/committee/sessions/:sessionId/my-vote?senator_id=... ─────────────
router.get(
  '/sessions/:sessionId/my-vote',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { senator_id } = req.query;
    if (!senator_id) {
      res.status(400).json({ error: 'senator_id query param required' });
      return;
    }
    const vote = await getSenatorCommitteeVote(sessionId, senator_id as string);
    res.json({ voted: !!vote, vote: vote ?? null });
  })
);

// Error handler
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

export default router;