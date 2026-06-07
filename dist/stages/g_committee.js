"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scrutiny = void 0;
const db_1 = require("../database/db");
const audit_1 = require("../services/audit");
const store_file_1 = require("../services/store-file");
const action_1 = require("../services/action");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("../services/notificationService");
// import { killbill } from "./billdeath";
const stageactions = new action_1.StageActions();
class Scrutiny {
    static async open_participation(billid, stageid, committeeId) {
        const tracker = new audit_1.tracking(billid, committeeId, stageid);
        const { rowCount } = await db_1.db.query(`
            UPDATE app.bills 
            SET public_participation='true' 
            WHERE _id=$1
            `, [billid]);
        console.log('rowcount...', rowCount);
        if (rowCount === 0)
            throw new Error('Error in storing the prescrutiny report');
        const billdata = await fetching_1.Fetch.specificbill(billid);
        await tracker.audit(billdata.versionid, 'The committee Advertises the bill for public participation');
    }
    static async uploadreport(billid, stageid, nextaction, currentaction, file, committeeId, versionId) {
        const tracker = new audit_1.tracking(billid, committeeId, stageid);
        const url = await (0, store_file_1.storeFile)(file.content, file.fileName);
        console.log('uploading....');
        const { rowCount } = await db_1.db.query(`
            INSERT INTO app.commreports (bill,stage,url,committee) 
            VALUES($1,$2,$3,$4)
            `, [billid, stageid, url, committeeId]);
        console.log('rowcount...', rowCount);
        if (rowCount === 0)
            throw new Error('Error in storing the prescrutiny report');
        // notification to speaker
        console.log('tracking...');
        const comdata = await fetching_1.Fetch.specificcommittee(committeeId);
        await tracker.audit(versionId, 'The committee uploaded the committee stage report');
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
    //   committee reading report / more of committee making the report public
    static async read_report(billid, stageid, nextaction, currentaction, nextstage, committeeId, versionId) {
        const tracker = new audit_1.tracking(billid, committeeId, stageid);
        await stageactions.completeaction(currentaction);
        await stageactions.completestage(stageid);
        await stageactions.startstage(nextstage);
        await stageactions.startaction(nextaction);
        await tracker.audit(versionId, 'The committee presents the report from the committee scrutiny stage ');
    }
}
exports.Scrutiny = Scrutiny;
