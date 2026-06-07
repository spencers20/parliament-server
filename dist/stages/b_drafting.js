"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftingStage = void 0;
const db_1 = require("../database/db");
const audit_1 = require("../services/audit");
const action_1 = require("../services/action");
const billdeath_1 = require("../services/billdeath");
const notificationService_1 = require("../services/notificationService");
const fetching_1 = require("../fetch/fetching");
// import { addDays } from 'date-fns';
// const in14Days = addDays(new Date(), 14);
class DraftingStage {
    static async speakerdecision(verdict, billId, committee, versionId, stage, user) {
        const tracker = new audit_1.tracking(billId, user.id, stage.id);
        console.log('the stage', stage);
        const stageactions = new action_1.StageActions();
        if (verdict.verdict === 'reject') {
            await (0, billdeath_1.killbill)(billId, verdict.reason, stage);
            await tracker.audit(versionId, 'The speaker rejected the Proposed Bill');
            await tracker.audit(versionId, 'The Proposed Bill died');
            await stageactions.completeaction(stage.actionnow);
            await stageactions.completestage(stage.id);
            return;
        }
        const now = new Date();
        const { rowCount } = await db_1.db.query(`INSERT INTO app.comm_bill(
            comm_id,bill_id,stage_id,assigned_at,duration,instructions)
            VALUES($1,$2,$3,$4,$5,$6)`, [committee.id, billId, stage.next, now, committee.duration, committee.instructions]);
        if (rowCount === 0)
            throw new Error('assigning bill to committee failed');
        const billdata = await fetching_1.Fetch.specificbill(billId);
        const commdata = await fetching_1.Fetch.specificcommittee(committee.id);
        await tracker.audit(versionId, `The speaker assigned the bill to ${commdata.name} committee`);
        await (0, notificationService_1.notif)(user.id, committee.id, `Check on the ${billdata.title} draft for prepublication scrutiny`);
        await stageactions.completeaction(stage.actionnow);
        await stageactions.completestage(stage.id);
        // const rnow = new Date();
        const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await stageactions.stagedeadline(stage.next, in14Days);
        await stageactions.startstage(stage.next);
        await stageactions.startaction(stage.nextaction);
    }
}
exports.DraftingStage = DraftingStage;
