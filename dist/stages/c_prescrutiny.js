"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prescrutiny = void 0;
const db_1 = require("../database/db");
const audit_1 = require("../services/audit");
const store_file_1 = require("../services/store-file");
const action_1 = require("../services/action");
const billdeath_1 = require("../services/billdeath");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("../services/notificationService");
const stageactions = new action_1.StageActions();
class Prescrutiny {
    static async uploadreport(billid, stageid, nextaction, currentaction, file, committeeId, versionId) {
        const tracker = new audit_1.tracking(billid, committeeId, stageid);
        const url = await (0, store_file_1.storeFile)(file.content, file.fileName);
        const { rowCount } = await db_1.db.query(`
            INSERT INTO app.commreports (bill,stage,url,committee) 
            VALUES($1,$2,$3,$4)
            `, [billid, stageid, url, committeeId]);
        if (rowCount === 0)
            throw new Error('Error in storing the prescrutiny report');
        await db_1.db.query(`
            UPDATE  app.comm_bill SET completed_on=NOW()
           WHERE bill_id=$1 AND stage_id=$2
            `, [billid, stageid]);
        // notification to speaker
        const comdata = await fetching_1.Fetch.specificcommittee(committeeId);
        await tracker.audit(versionId, `The ${comdata.name} committee submitted the prepublication scrutiny report`);
        await stageactions.completeaction(currentaction);
        await stageactions.startaction(nextaction);
        const result = await db_1.db.query(`
                        SELECT _id
                        FROM app.profile
                        WHERE role = 'speaker'
                        `);
        const billdata = await fetching_1.Fetch.specificbill(billid);
        const stagedata = await fetching_1.Fetch.specificstage(stageid);
        if (result.rows.length > 0) {
            const receiverId = result.rows[0]._id;
            await (0, notificationService_1.notif)(null, receiverId, `${billdata.title}:: ${comdata.name} Committee submitted the ${stagedata.name} report `);
        }
    }
    static async publicationapproval(verdict, billId, speakerId, stage, versionId) {
        const tracker = new audit_1.tracking(billId, speakerId, stage.id);
        if (verdict.verdict === 'reject') {
            await (0, billdeath_1.killbill)(billId, verdict.reason, stage.id);
            await tracker.audit(versionId, 'The speaker rejected the bill at pre-publication scrutiny');
            await tracker.audit(versionId, 'The draft bill died ');
            await stageactions.completeaction(stage.action);
            await stageactions.completestage(stage.id);
        }
        await stageactions.completeaction(stage.action);
        await stageactions.completestage(stage.id);
        await stageactions.startstage(stage.next);
        // await this.stageactions.startaction(stage.nextaction) 
        await tracker.audit(versionId, 'The speaker forwarded approved for publication');
    }
}
exports.Prescrutiny = Prescrutiny;
