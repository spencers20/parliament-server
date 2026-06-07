"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageController = exports.ActionHandler = void 0;
const audit_1 = require("../services/audit");
const billstages_1 = require("../lib/billstages");
const action_1 = require("../services/action");
const b_drafting_1 = require("./b_drafting");
const a_introduction_1 = require("./a_introduction");
const c_prescrutiny_1 = require("./c_prescrutiny");
const fetching_1 = require("../fetch/fetching");
class ActionHandler {
    constructor(requiredrole) {
        this.role = requiredrole;
    }
    validate(actor) {
        if (actor !== this.role) {
            throw new Error(`Only ${this.role} can perform this action`);
        }
    }
}
exports.ActionHandler = ActionHandler;
const bill_stages = billstages_1.billStages;
const stageactions = new action_1.StageActions();
class StageController {
    async introduce(req, res) {
        try {
            const { source, title, summary, category, cosponsor, sponsor, objectives, bill_url } = req.body;
            const intro = await a_introduction_1.Introduction.create(title, bill_url, sponsor, summary, objectives, source, category, cosponsor);
            return res.status(200).json({ success: 'Bill created successfully' });
            // const file_url=storeFile(file.content,title)
        }
        catch (e) {
            res.status(500).json({ 'INTROUDUCTION_ERROR': e.message });
        }
    }
    async todrafting(req, res) {
        try {
            const io = req.app.get("io");
            const data = req.body;
            console.log('reached..', data);
            await a_introduction_1.Introduction.toDrafting(data.role, data.userId, data.versionid, data.billid, data.nextstage, data.currentstage, data.currentaction, data.nextaction);
            const stagedata = await fetching_1.Fetch.stages(data.billid);
            io.to(data.billid).emit("stage_updated", stagedata);
            res.status(200).json({ success: true });
        }
        catch (e) {
            console.log('error', e.message);
            res.status(500).json({ 'TO_DRAFTING_ERROR': e.message });
        }
    }
    async to_prescrutiny(req, res) {
        try {
            console.log('reached...');
            const data = req.body;
            console.log('user', data.committee);
            await b_drafting_1.DraftingStage.speakerdecision(data.verdict, data.billId, data.committee, data.version, data.stage, data.user);
            res.status(200).json({ success: true });
        }
        catch (e) {
            res.status(500).json({ "TO_PRE_SCRUTINY_ERROR": e.message });
        }
    }
    async topublication(req, res) {
        try {
            const io = req.app.get('io');
            const data = req.body;
            await c_prescrutiny_1.Prescrutiny.publicationapproval(data.verdict, data.billId, data.speakerid, data.stage, data.versionId);
            const stagedata = await fetching_1.Fetch.stages(data.billId);
            const billdata = await fetching_1.Fetch.specificbill(data.billId);
            io.to(data.billId).emit("stage_updated", stagedata);
            io.to(data.billId).emit("bill_updated", billdata);
            res.status(200).json({ success: true });
        }
        catch (e) {
            res.status(500).json({ 'TOPUBLICATION_ERROR': e.message });
        }
    }
    async schedulefirstreading(req, res) {
        try {
            const { stage_id, date, bill, userid } = req.body;
            const tracker = new audit_1.tracking(bill.id, userid, stage_id);
            await stageactions.stagefuture(stage_id, date);
            await tracker.audit(bill.version, `The Clerk set the first reading to ${new Date(date)}`);
            res.status(200).json({ success: true });
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.StageController = StageController;
