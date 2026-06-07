"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const stage_1 = require("../stages/stage");
const multer_1 = __importDefault(require("multer"));
const store_file_1 = require("../services/store-file");
const n8n_1 = require("../services/n8n");
const audit_1 = require("../services/audit");
const db_1 = require("../database/db");
const action_1 = require("../services/action");
const waiting_1 = require("../stages/waiting");
const fetching_1 = require("../fetch/fetching");
const f_first_reading_1 = require("../stages/f_first_reading");
const h_secondreading_1 = require("../stages/h_secondreading");
const notificationService_1 = require("../services/notificationService");
const billdeath_1 = require("../services/billdeath");
// import { error } from "node:console";
const router = (0, express_1.Router)();
// router.use(express.json())
const stagecontrol = new stage_1.StageController();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/create', middleware_1.Authmiddleware, async (req, res) => await stagecontrol.introduce(req, res));
router.post('/todrafting', middleware_1.Authmiddleware, async (req, res) => await stagecontrol.todrafting(req, res));
router.post('/download', middleware_1.Authmiddleware, async (req, res) => {
    try {
        const { billId, userId, stageId, user, versionId } = req.body;
        const tracker = new audit_1.tracking(billId, userId, stageId);
        tracker.audit(versionId, `${user} downloaded the proposal`);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in updating bill download', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
router.post('/download', middleware_1.Authmiddleware, async (req, res) => {
    try {
        const { billId, userId, stageId, user, versionId } = req.body;
        const tracker = new audit_1.tracking(billId, userId, stageId);
        tracker.audit(versionId, `${user} downloaded the proposal`);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in updating bill download', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
router.post('/reject', async (req, res) => {
    try {
        const { billId, userId, stageId, reason, versionId } = req.body;
        const tracker = new audit_1.tracking(billId, userId, stageId);
        const stagedata = await fetching_1.Fetch.specificstage(stageId);
        await (0, billdeath_1.killbill)(billId, `bill has been rejected during the ${stagedata.name} because ${reason}`, stageId);
        tracker.audit(versionId, `Speaker rejected the bill with reason ${reason}`);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in rejecting bill', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
//upload during drafting
router.post('/uploaddraft', middleware_1.Authmiddleware, upload.single('file'), async (req, res) => {
    try {
        console.log('uploadreached....  ');
        const modelurl = process.env.N8N_URL ?? '';
        const io = req.app.get('io');
        // const actionhandler=new ActionHandler('dls')
        const { billId, currentaction, nextaction, stage, userrole, userid, nextstageaction, nextstage } = req.body;
        console.log('user...', billId);
        if (!nextaction)
            return;
        // actionhandler.validate(userrole)
        const stageactions = new action_1.StageActions();
        const tracker = new audit_1.tracking(billId, userid, stage);
        const file_buffer = req.file?.buffer;
        const fileName = req.file?.originalname;
        // const model_url=process.env.MODEL_URL||'jjjj'
        if (!file_buffer || !fileName)
            throw new Error('file not found');
        const file_url = await (0, store_file_1.storeFile)(file_buffer, fileName);
        const updatebill = await db_1.db.query(`UPDATE app.bills 
             SET bill=$1
             WHERE _id=$2
            `, [file_url, billId]);
        if (updatebill.rowCount == 0)
            throw new Error('Error updating bill');
        const stagedata = await fetching_1.Fetch.specificstage(stage);
        const versionId = await tracker.billversion(file_url);
        if (stagedata.name === 'Reprinting') {
            await stageactions.completestage(stage);
            await stageactions.totalcompleteaction(stage);
            await stageactions.startaction(nextstageaction);
            await stageactions.startstage(nextstage);
            await tracker.audit(versionId, 'The Directorate of Legislative Service uploaded the ammended Bill');
            res.status(200).json({ success: true });
        }
        else {
            const response = await (0, n8n_1.query_n8n)(modelurl, file_url, fileName, undefined, 'clause');
            const clauses = await response[0]?.output?.clauses ?? await response[0]?.output;
            // saving the clauses
            for (let clause of clauses) {
                await db_1.db.query(` INSERT INTO app.clauses(bill_id,number,title,text,type,status,order_index,created_at,interpretation)
                VALUES ($1,$2,$3,$4,'original','not_voted',$5,NOW(),$6)`, [billId, clause.clause_number, clause.clause_title, clause.clause_text, clause.clause_number, clause.clause_interpretation]);
            }
            await stageactions.completeaction(currentaction);
            await stageactions.startaction(nextaction);
        }
        const billdata = await fetching_1.Fetch.specificbill(billId);
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'clerk'
                `;
        const clerkResult = await db_1.db.query(clerkQuery);
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id;
            await tracker.audit(versionId, 'The Directorate of Legislative Service updloaded Drafted Bill');
            await (0, notificationService_1.notif)(userid, billdata.sponsor, 'Read through the drafted bill and approve it. ');
        }
        io.to(billId).emit("stage_updated", stagedata);
        io.to(billId).emit("bill_updated", billdata);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in updating bill upload', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
// SPONSOR APPROVAL
router.post('/approvedraft', middleware_1.Authmiddleware, async (req, res) => {
    try {
        const io = req.app.get('io');
        const { billId, stageId, user, versionId, currentaction, nextaction } = req.body;
        const actionhandler = new stage_1.ActionHandler('sponsor');
        actionhandler.validate(user.role);
        const stageactions = new action_1.StageActions();
        const updatebill = await db_1.db.query(`UPDATE app.bills 
             SET sponsor_approved=TRUE
             WHERE _id=$1
            `, [billId]);
        if (updatebill.rowCount == 0)
            throw new Error('Error updating bill');
        const tracker = new audit_1.tracking(billId, user.id, stageId);
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'clerk'
                `;
        const clerkResult = await db_1.db.query(clerkQuery);
        const billdata = await fetching_1.Fetch.specificbill(billId);
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id;
            await (0, notificationService_1.notif)(null, clerkId, `${billdata.title} Draft approved by sponsor forward it to the speaker`);
        }
        tracker.audit(versionId, `Senator ${user.name} Accepted the Drafting version to proceed as is`);
        await stageactions.completeaction(currentaction);
        await stageactions.startaction(nextaction);
        const stagedata = await fetching_1.Fetch.stages(billId);
        io.to(billId).emit("stage_updated", stagedata);
        io.to(billId).emit("bill_updated", billdata);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in updating bill download', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
router.post('/forwarddraft', middleware_1.Authmiddleware, async (req, res) => {
    try {
        console.log('forwardiing draft..');
        const io = req.app.get('io');
        const { billId, stageId, user, versionId, currentaction, nextaction, comment } = req.body;
        const actionhandler = new stage_1.ActionHandler('clerk');
        actionhandler.validate(user.role);
        const stageactions = new action_1.StageActions();
        // comments are sent to notification
        // const updatebill=await db.query(
        //     `UPDATE app.bills 
        //      SET sponsor_approved=TRUE
        //      WHERE _id=$1
        //     `,
        //     [billId]
        // )
        // if(updatebill.rowCount==0) throw new Error('Error updating bill')
        await stageactions.completeaction(currentaction);
        await stageactions.startaction(nextaction);
        const tracker = new audit_1.tracking(billId, user._id, stageId);
        tracker.audit(versionId, `Clerk forwarded draft to speaker with `);
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'speaker'
                `;
        const clerkResult = await db_1.db.query(clerkQuery);
        const billdata = await fetching_1.Fetch.specificbill(billId);
        console.log('billdata..', billdata);
        if (clerkResult.rows.length > 0) {
            const speakerId = clerkResult.rows[0]._id;
            await (0, notificationService_1.notif)(user._id, speakerId, `Review the ${billdata.title} Draft, My comment about the draft is ${comment}`);
        }
        const stagedata = await fetching_1.Fetch.stages(billId);
        // const billdata=await Fetch.specificbill(billId)
        io.to(billId).emit("stage_updated", stagedata);
        io.to(billId).emit("bill_updated", billdata);
        res.status(200).json({ success: true });
    }
    catch (e) {
        console.log('error in updating bill draft', e);
        res.status(500).json({ success: false, error: e.message });
    }
});
router.post('/toprescrutiny', middleware_1.Authmiddleware, async (req, res) => await stagecontrol.to_prescrutiny(req, res));
router.post('/topublication', middleware_1.Authmiddleware, async (req, res) => await stagecontrol.topublication(req, res));
router.post('/upload-published', middleware_1.Authmiddleware, upload.single('File'), async (req, res) => {
    try {
        const io = req.app.get('io');
        const { stageid, nextstage, userId, billId, billNumber } = req.body;
        const file_buffer = req.file?.buffer;
        const fileName = req.file?.originalname;
        const stage = {
            id: stageid,
            next: nextstage,
        };
        const user = {
            id: userId
        };
        const file = {
            content: file_buffer,
            fileName
        };
        const bill = {
            Id: billId,
            number: billNumber
        };
        await waiting_1.Waiting.uploadpublishedbill(bill, stage, user, file);
        const stagedata = await fetching_1.Fetch.stages(billId);
        const billdata = await fetching_1.Fetch.specificbill(billId);
        io.to(billId).emit("stage_updated", stagedata);
        io.to(billId).emit("bill_updated", billdata);
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        res.status(500).json({ "ERROR_IN_UPLOADING_REPORT": e.message });
    }
});
router.post('/f_reading', middleware_1.Authmiddleware, async (req, res) => await stagecontrol.schedulefirstreading(req, res));
router.post('/clerk_freading', middleware_1.Authmiddleware, async (req, res) => {
    try {
        console.log('reaching...');
        const io = req.app.get('io');
        const { bill, stage, userid } = req.body;
        console.log('bill...', bill);
        await f_first_reading_1.FirstReading.clerkreading(bill, stage, userid);
        const stagedata = await fetching_1.Fetch.stages(bill.id);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        io.to(bill.id).emit("stage_updated", stagedata);
        io.to(bill.id).emit("bill_updated", billdata);
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        console.log('error...', e);
        res.status(500).json({ error: e.messsage });
    }
});
router.post('/freading_assigncomm', middleware_1.Authmiddleware, async (req, res) => {
    try {
        console.log('reaching out....');
        const io = req.app.get('io');
        const { bill, stage, userid, committee } = req.body;
        await f_first_reading_1.FirstReading.assigncommittee(bill, stage, userid, committee);
        const stagedata = await fetching_1.Fetch.stages(bill.id);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        io.to(bill.id).emit("stage_updated", stagedata);
        io.to(bill.id).emit("bill_updated", billdata);
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        console.log('error...', e);
        res.status(500).json({ error: e.messsage });
    }
});
router.post('/s_reading', middleware_1.Authmiddleware, async (req, res) => {
    try {
        console.log('reaching out....');
        const io = req.app.get('io');
        const { bill, userid, currentaction, stage_id, date, nextaction } = req.body;
        await h_secondreading_1.SecondReading.startsecondreading(bill, userid, currentaction, stage_id, date, nextaction);
        const stagedata = await fetching_1.Fetch.stages(bill.id);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        io.to(bill.id).emit("stage_updated", stagedata);
        io.to(bill.id).emit("bill_updated", billdata);
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        console.log('error...', e);
        res.status(500).json({ error: e.messsage });
    }
});
exports.default = router;
