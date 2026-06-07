"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.killbill = killbill;
const db_1 = require("../database/db");
const fetching_1 = require("../fetch/fetching");
const action_1 = require("./action");
const notificationService_1 = require("./notificationService");
async function killbill(billId, reason, stage) {
    const stageactions = new action_1.StageActions();
    const client = await db_1.db.connect();
    const now = new Date();
    stageactions.Killstage(stage);
    const { rowCount } = await db_1.db.query(`
            INSERT INTO app.deadbills(
            bill,reason,stage,date) 
            VALUES($1,$2,$3,$4)
            `, [billId, reason, stage, now]);
    await client.query(`UPDATE app.bills
           SET status = 'dead'
           WHERE _id = $1
           `, [billId]);
    if (rowCount === 0)
        throw new Error('error in killing bill');
    const billdata = await fetching_1.Fetch.specificbill(billId);
    // const comdata=await Fetch.specificcommittee(committeeId)
    const stagedata = await fetching_1.Fetch.specificstage(stage);
    // const receiverId = result.rows[0]._id
    // await notif(
    //     null,
    //     billdata.sponsor,
    //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
    //     )
    const all_ids = await fetching_1.Fetch.allprofile();
    await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `);
    return { succes: true };
}
