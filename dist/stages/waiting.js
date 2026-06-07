"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waiting = void 0;
const stage_1 = require("./stage");
const audit_1 = require("../services/audit");
const action_1 = require("../services/action");
const store_file_1 = require("../services/store-file");
const db_1 = require("../database/db");
const notificationService_1 = require("../services/notificationService");
const fetching_1 = require("../fetch/fetching");
const stageactions = new action_1.StageActions();
class Waiting {
    static async uploadpublishedbill(bill, stage, user, file) {
        const tracker = new audit_1.tracking(bill.Id, user.id, stage.id);
        const actionhandler = new stage_1.ActionHandler('clerk');
        // actionhandler.validate(user.role)
        // give the file url
        const url = await (0, store_file_1.storeFile)(file.content, file.fileName);
        const updatebill = await db_1.db.query(`UPDATE app.bills 
                     SET bill=$1 ,
                        bill_number=$2
                     WHERE _id=$3
                    `, [url, bill.number, bill.Id]);
        if (updatebill.rowCount == 0)
            throw new Error('Error updating bill');
        await stageactions.totalcompleteaction(stage.id);
        await stageactions.completestage(stage.id);
        // await stageactions.startaction(nextaction)
        const versionId = await tracker.billversion(url);
        await tracker.audit(versionId, 'The Clerk uploaded published_bill');
        // set timeline for the waiting stage
        // start the waiting stage 
        await stageactions.startstage(stage.next);
        const deadline = new Date(new Date().getTime() + (0 * 24 * 60 * 60 * 1000));
        const settime = await db_1.db.query(`
            UPDATE app.stages 
            SET deadline_date=$1
            WHERE _id=$2`, [deadline, stage.next]);
        if ((settime.rowCount ?? 0) === 0)
            throw new Error('Error in starting stage');
        await tracker.audit(versionId, 'The bill started the waiting stage');
        const billdata = await fetching_1.Fetch.specificbill(bill.Id);
        // const comdata=await Fetch.specificcommittee(committeeId)
        // const stagedata=await Fetch.specificcommittee(stage.id)
        // const receiverId = result.rows[0]._id
        // await notif(
        //     null,
        //     billdata.sponsor,
        //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
        //     )
        const all_ids = await fetching_1.Fetch.allprofile();
        await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: Published Bill with Bill Number ::${bill.number}Has been Uploaded  `);
        // await notifMany(null,)
    }
}
exports.Waiting = Waiting;
