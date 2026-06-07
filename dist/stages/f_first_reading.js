"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstReading = void 0;
const db_1 = require("../database/db");
const audit_1 = require("../services/audit");
const action_1 = require("../services/action");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("../services/notificationService");
class FirstReading {
    static async clerkreading(bill, stage, userid) {
        const tracker = new audit_1.tracking(bill.id, userid, stage.id);
        const stageactions = new action_1.StageActions();
        await stageactions.completeaction(stage.actionnow);
        await stageactions.startaction(stage.nextaction);
        await tracker.audit(bill.version, `The clerk read the bill for the first time `);
    }
    static async assigncommittee(bill, stage, userid, committee) {
        const tracker = new audit_1.tracking(bill.id, userid, stage.id);
        const stageactions = new action_1.StageActions();
        const now = new Date();
        const { rowCount } = await db_1.db.query(`INSERT INTO app.comm_bill(
            comm_id,bill_id,stage_id,assigned_at,duration,instructions)
            VALUES($1,$2,$3,$4,$5,$6)`, [committee.id, bill.id, stage.next, now, committee.duration, committee.instructions]);
        if (rowCount === 0)
            throw new Error('assigning bill to committee failed');
        await tracker.audit(bill.version, `The speaker assigned the bill to ${committee.name} committee for committee stage`);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        // const comdata=await Fetch.specificcommittee(committeeId)
        const stagedata = await fetching_1.Fetch.specificstage(stage);
        // const receiverId = result.rows[0]._id
        await (0, notificationService_1.notif)(null, billdata.sponsor, `Your ${billdata.title}:: ${billdata._id} Bill Has been Assigned to ${committee.name} for the ${stagedata.name} `);
        await (0, notificationService_1.notif)(null, committee.id, `You have been assigned ${billdata.title}:: bill Bill for the ${stagedata.name} `);
        const all_ids = await fetching_1.Fetch.allprofile();
        // await notifMany(null,all_ids,
        //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
        // )
        await stageactions.completeaction(stage.actionnow);
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await stageactions.stagedeadline(stage.next, in30Days);
        await stageactions.completestage(stage.id);
        await stageactions.startstage(stage.next);
        await stageactions.startaction(stage.nextaction);
    }
}
exports.FirstReading = FirstReading;
