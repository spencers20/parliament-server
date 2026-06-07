"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/upload-report', middleware_1.Authmiddleware, upload.single('File'), async (req, res) => {
    try {
        const data = req.body;
        // await Prescrutiny.uploadreport(data.billId,data.stage,data.file,data.committeeId,data.version)
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        res.status(500).json({ "ERROR_IN_UPLOADING_REPORT": e.message });
    }
});
// GET /api/stakeholders
// Returns all stakeholders for the dropdown
// router.get('/stakeholders', async (_req: Request, res: Response) => {
//   try {
//     const result = await pool.query(
//       `SELECT _id, name, email, organisation
//        FROM app.stakeholders
//        ORDER BY name`
//     );
//     return res.json({ stakeholders: result.rows });
//   } catch (err) {
//     console.error('Error fetching stakeholders:', err);
//     return res.status(500).json({ error: 'Failed to load stakeholders' });
//   }
// });
// GET /api/bills/:billId/clauses
// Returns all clauses for a specific bill (for the clause selector in the modal)
// router.get('/bills/:billId/clauses', async (req: Request, res: Response) => {
//   const { billId } = req.params;
//   try {
//     const result = await pool.query(
//       `SELECT id, number, title, text, type, status, order_index
//        FROM app.clauses
//        WHERE bill_id = $1
//        ORDER BY order_index`,
//       [billId]
//     );
//     return res.json({ clauses: result.rows });
//   } catch (err) {
//     console.error('Error fetching clauses:', err);
//     return res.status(500).json({ error: 'Failed to load clauses' });
//   }
// });
