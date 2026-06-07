"use strict";
// src/routes/submissions.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const submissionsService_1 = require("../services/submissionsService");
const router = (0, express_1.Router)();
// ── Multer file upload ────────────────────────────────────────────────────────
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext))
            cb(null, true);
        else
            cb(new Error('Only PDF and DOC files are allowed'));
    },
});
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
// ── POST /api/submissions/:billId/:stage ──────────────────────────────────────
router.post('/:billId/:stage', upload.single('attachment'), asyncHandler(async (req, res) => {
    // const { billId, stage } = req.params;
    const billId = Array.isArray(req.params.billId)
        ? req.params.billId[0]
        : req.params.billId;
    const stage = Array.isArray(req.params.stage)
        ? req.params.stage[0]
        : req.params.stage;
    const { name, category, comment, idno_, fingerprint, } = req.body;
    if (!comment?.trim()) {
        res.status(400).json({ error: 'comment is required' });
        return;
    }
    if (!idno_ && !fingerprint) {
        res.status(400).json({ error: 'email or fingerprint required' });
        return;
    }
    const validCategories = ['general', 'support', 'oppose', 'amendment', 'concern'];
    if (!validCategories.includes(category)) {
        res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
        return;
    }
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const result = await (0, submissionsService_1.createSubmission)({
        billId, stage,
        name: name?.trim() || undefined,
        category: category,
        comment: comment.trim(),
        attachmentUrl,
        idno_: idno_,
        fingerprint: fingerprint?.trim() || undefined,
    });
    res.status(201).json({ success: true, ...result });
}));
// ── GET /api/submissions/:billId/:stage/stats ─────────────────────────────────
router.get('/:billId/:stage/stats', asyncHandler(async (req, res) => {
    const billId = Array.isArray(req.params.billId)
        ? req.params.billId[0]
        : req.params.billId;
    const stage = Array.isArray(req.params.stage)
        ? req.params.stage[0]
        : req.params.stage;
    console.log('stage...', stage);
    const stats = await (0, submissionsService_1.getSubmissionStats)(billId, stage);
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
    const trends = await (0, submissionsService_1.getDailyTrends)(billId, stage);
    res.json({ trends });
}));
// ── GET /api/submissions/:billId/:stage/recent ────────────────────────────────
router.get('/:billId/:stage/recent', asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const billId = Array.isArray(req.params.billId)
        ? req.params.billId[0]
        : req.params.billId;
    const stage = Array.isArray(req.params.stage)
        ? req.params.stage[0]
        : req.params.stage;
    const submissions = await (0, submissionsService_1.getRecentSubmissions)(billId, stage, limit);
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
    if (!email && !fingerprint) {
        res.status(400).json({ error: 'email or fingerprint required' });
        return;
    }
    const submitted = await (0, submissionsService_1.hasAlreadySubmitted)(billId, stage, email, fingerprint);
    res.json({ already_submitted: submitted });
}));
router.use((err, _req, res, _next) => {
    console.error(err);
    res.status(400).json({ error: err.message });
});
exports.default = router;
