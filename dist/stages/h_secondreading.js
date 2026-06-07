"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondReading = void 0;
const audit_1 = require("../services/audit");
const store_file_1 = require("../services/store-file");
const voting_1 = require("../services/voting");
const action_1 = require("../services/action");
const billdeath_1 = require("../services/billdeath");
const notificationService_1 = require("../services/notificationService");
const fetching_1 = require("../fetch/fetching");
const vote = new voting_1.Voting();
const stageactions = new action_1.StageActions();
class SecondReading {
    // table for second reading 
    static async startsecondreading(bill, userid, currentaction, stage_id, date, nextaction) {
        const tracker = new audit_1.tracking(bill.id, userid, stage_id);
        await stageactions.completeaction(currentaction);
        await stageactions.startfutureaction(nextaction, date);
        const stagedata = await fetching_1.Fetch.specificstage(stage_id);
        await tracker.audit(bill.version, `The Clerk set the ${stagedata.name} to ${stageactions.formatDate(new Date(date))}`);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        console.log('billdata..', billdata);
        const all_ids = await fetching_1.Fetch.allprofile();
        await (0, notificationService_1.notifMany)(null, all_ids, `${billdata?.title}:: The bill has been set for  ${stagedata.name}on ${stageactions.formatDate(new Date(date))}  `);
    }
    async openvoting(user, bill, stage) {
        vote.start(bill.id, stage.id);
        const track = new audit_1.tracking(bill.id, user.id, stage.id);
        const stagedata = await fetching_1.Fetch.specificstage(stage.id);
        await track.audit(bill.version, `The Speaker officially opened voting for the ${stagedata.name} stage.`);
        const all_ids = await fetching_1.Fetch.allprofile();
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: The speaker has started voting on principles for the stage ${stagedata.name}}  `);
    }
    async closevoting(user, bill, results, stage, vote_id) {
        vote.close(vote_id, results.total, results.accepted, results.decline, results.abstain);
        // from websockets and redis
        if (results.decline > results.accepted) {
            await (0, billdeath_1.killbill)(bill.id, 'Most votes on decline', stage.id);
        }
        const track = new audit_1.tracking(bill.id, user.id, stage.id);
        await track.audit(bill.version, 'Speaker closed voting');
    }
    static async uploadreport(bill, stage, file, user) {
        const tracker = new audit_1.tracking(bill.id, user.id, stage.id);
        const url = await (0, store_file_1.storeFile)(file.content, file.fileName);
        // table for reading minutes
        // const {rowCount}=await db.query(`
        //         INSERT INTO app.commreports (bill,stage,url,committee) 
        //         VALUES($1,$2,$3,$4)
        //         `,[bill.id,stage.id,url]
        //     )
        // if(rowCount===0) throw new Error('Error in storing the prescrutiny report')
        // notification to speaker
        await tracker.audit(bill.version, 'The clerk uploaded the reading minutes');
        await stageactions.completestage(stage.id);
        await stageactions.startstage(stage.next);
    }
}
exports.SecondReading = SecondReading;
