"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const i_ammendmentproposal_1 = require("../stages/i_ammendmentproposal");
const router = (0, express_1.Router)();
router.post('/setcomm_stage', async (req, res) => {
    const { bill, userid, stage, date } = req.body;
    if (!bill || !stage || !userid || !date) {
        res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
        return;
    }
    console.log('setting on date..', stage);
    await i_ammendmentproposal_1.Ammendments.startcommittee(bill, userid, stage, date);
    res.status(200).json({ success: true });
});
router.post('/fetch', async (req, res) => {
    try {
        console.log('fetching....');
        const { billId, stage } = req.body;
        if (!billId || !stage) {
            res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
            return;
        }
        const data = await i_ammendmentproposal_1.Ammendments.getAmendments(billId, stage);
        res.status(200).json(data);
    }
    catch (e) {
        res.status(500).json({ FETCHING_STAGES_ERROR: e.message });
    }
});
router.post('/add', async (req, res) => {
    try {
        console.log('adding....');
        const { billid, stage, user, ammendment } = req.body;
        if (!billid || !stage || !user || !ammendment) {
            res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
            return;
        }
        const data = await i_ammendmentproposal_1.Ammendments.addammend(billid, user, stage, ammendment);
        res.status(200).json(data);
    }
    catch (e) {
        res.status(500).json({ FETCHING_STAGES_ERROR: e.message });
    }
});
exports.default = router;
