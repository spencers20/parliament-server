// src/routes/submissions.ts

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createSubmission,
  getSubmissionStats,
  getDailyTrends,
  getRecentSubmissions,
  hasAlreadySubmitted,
  SubmissionCategory,
} from '../services/submissionsService';

const router = Router();

// ── Multer file upload ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOC files are allowed'));
  },
});

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ── POST /api/submissions/:billId/:stage ──────────────────────────────────────
router.post(
  '/:billId/:stage',
  upload.single('attachment'),
  asyncHandler(async (req, res) => {
    // const { billId, stage } = req.params;
    const billId = Array.isArray(req.params.billId)
      ? req.params.billId[0]
      : req.params.billId;

    const stage = Array.isArray(req.params.stage)
      ? req.params.stage[0]
      : req.params.stage;
    const { name, category, comment, idno_, fingerprint, } = req.body;

    if (!comment?.trim()) { res.status(400).json({ error: 'comment is required' }); return; }
    if (!idno_ && !fingerprint) { res.status(400).json({ error: 'email or fingerprint required' }); return; }

    const validCategories: SubmissionCategory[] = ['general', 'support', 'oppose', 'amendment', 'concern'];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` }); return;
    }

    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const result = await createSubmission({
      billId, stage,
      name: name?.trim() || undefined,
      category: category as SubmissionCategory,
      comment: comment.trim(),
      attachmentUrl,
      idno_: idno_,
      fingerprint: fingerprint?.trim() || undefined,
    });

    res.status(201).json({ success: true, ...result });
  })
);

// ── GET /api/submissions/:billId/:stage/stats ─────────────────────────────────
router.get('/:billId/:stage/stats', asyncHandler(async (req, res) => {
    const billId = Array.isArray(req.params.billId)
      ? req.params.billId[0]
      : req.params.billId;

    const stage = Array.isArray(req.params.stage)
      ? req.params.stage[0]
      : req.params.stage;
  const stats = await getSubmissionStats(billId, stage);
  res.json(stats);
}));

// ── GET /api/submissions/:billId/:stage/trends ────────────────────────────────
router.get('/:billId/:stage/trends', asyncHandler(async (req, res) => {
    const billId = Array.isArray(req.params.billId)
      ? req.params.billId[0]
      : req.params.billId;

    const stage = Array.isArray(req.params.stage)
      ? req.params.stage[0]
      : req.params.stage;
  const trends = await getDailyTrends(billId, stage);
  res.json({ trends });
}));

// ── GET /api/submissions/:billId/:stage/recent ────────────────────────────────
router.get('/:billId/:stage/recent', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const billId = Array.isArray(req.params.billId)
      ? req.params.billId[0]
      : req.params.billId;

    const stage = Array.isArray(req.params.stage)
      ? req.params.stage[0]
      : req.params.stage;
 
  const submissions = await getRecentSubmissions(billId, stage, limit);
  res.json({ submissions });
}));

// ── GET /api/submissions/:billId/:stage/check?email=...&fingerprint=... ───────
router.get('/:billId/:stage/check', asyncHandler(async (req, res) => {
//   const { billId, stage } = req.params;
const billId = Array.isArray(req.params.billId)
      ? req.params.billId[0]
      : req.params.billId;

    const stage = Array.isArray(req.params.stage)
      ? req.params.stage[0]
      : req.params.stage;
  const { email, fingerprint } = req.query;
  if (!email && !fingerprint) { res.status(400).json({ error: 'email or fingerprint required' }); return; }
  const submitted = await hasAlreadySubmitted(billId, stage, email as string | undefined, fingerprint as string | undefined);
  res.json({ already_submitted: submitted });
}));

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

export default router;