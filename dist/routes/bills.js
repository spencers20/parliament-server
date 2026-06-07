"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../database/db");
const fetching_1 = require("../fetch/fetching");
const router = (0, express_1.Router)();
router.get('/fetch', async (req, res) => {
    await fetching_1.Fetch.bills(req, res);
});
router.post('/fetch_stages', async (req, res) => {
    try {
        const { billid } = req.body;
        console.log('bill id>>>>>', billid);
        const data = await fetching_1.Fetch.stages(billid);
        res.status(200).json(data);
    }
    catch (e) {
        res.status(500).json({ FETCHING_STAGES_ERROR: e.message });
    }
});
router.post('/fetch_bill', async (req, res) => {
    try {
        const { billid } = req.body;
        console.log('bill id>>>>>', billid);
        const data = await fetching_1.Fetch.specificbill(billid);
        res.status(200).json(data);
    }
    catch (e) {
        res.status(500).json({ FETCHING_STAGES_ERROR: e.message });
    }
});
router.get("/:billId/timeline", async (req, res) => {
    try {
        const { billId } = req.params;
        const result = await db_1.db.query(`SELECT
         a._id,
         a.time,
         a.action,
 
         -- Who did it
         p._id          AS profile_id,
         p.name         AS author_name,
         p.role         AS author_role,
 
         -- Which stage
         s._id          AS stage_id,
         s.name         AS stage_name,
        
 
         -- Which version (nullable)
         v._id          AS version_id,
         v.time_created   AS version_created_at
 
       FROM app.audits a
       LEFT JOIN app.profile       p ON p._id = a.responsible
       LEFT JOIN app.stages        s ON s._id = a.stage
       LEFT JOIN app.billversions  v ON v._id = a.version
       WHERE a.bill = $1
       ORDER BY a.time ASC`, [billId]);
        const timeline = result.rows.map((row) => ({
            id: row._id,
            time: row.time,
            action: row.action,
            author: {
                id: row.profile_id,
                name: row.author_name ?? "Unknown",
                role: row.author_role ?? null,
            },
            stage: row.stage_id
                ? {
                    id: row.stage_id,
                    name: row.stage_name,
                    description: row.stage_description ?? null,
                }
                : null,
            version: row.version_id
                ? {
                    id: row.version_id,
                    createdAt: row.version_created_at,
                }
                : null,
            // Derive a UI event type from the action string for icon/color mapping
            //   eventType: deriveEventType(row.action),
        }));
        res.status(200).json(timeline);
    }
    catch (err) {
        console.error("Timeline fetch error:", err);
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});
/**
 * Maps free-text action strings → one of the UI event type buckets.
 * Extend the keyword lists to match your actual action values.
 */
// function deriveEventType(
//   action: string
// ): "vote" | "amendment" | "comment" | "status" | "assignment" | "version" | "other" {
//   const a = action.toLowerCase();
//   if (a.includes("vote") || a.includes("voted") || a.includes("approved") || a.includes("rejected"))
//     return "vote";
//   if (a.includes("amend") || a.includes("clause") || a.includes("edit") || a.includes("modif"))
//     return "amendment";
//   if (a.includes("comment") || a.includes("feedback") || a.includes("review"))
//     return "comment";
//   if (a.includes("status") || a.includes("passed") || a.includes("failed") || a.includes("tabled") || a.includes("published"))
//     return "status";
//   if (a.includes("assign") || a.includes("refer") || a.includes("committee") || a.includes("transfer"))
//     return "assignment";
//   if (a.includes("version") || a.includes("draft") || a.includes("upload"))
//     return "version";
//   return "other";
// }
exports.default = router;
