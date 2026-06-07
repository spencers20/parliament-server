"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ammendments = void 0;
const db_1 = require("../database/db");
const audit_1 = require("../services/audit");
const action_1 = require("../services/action");
const fetching_1 = require("../fetch/fetching");
const notificationService_1 = require("../services/notificationService");
const stageactions = new action_1.StageActions();
class Ammendments {
    static async startcommittee(bill, userid, stage, date) {
        const tracker = new audit_1.tracking(bill.id, userid, stage.id);
        await stageactions.stagefuture(stage.next, date);
        await stageactions.stagedeadline(stage.id, date);
        //  const settime=await db.query(`
        //     UPDATE app.stages 
        //     SET deadline_date=$1
        //     WHERE _id=$2`,[date,stage.id])
        //         if((settime.rowCount??0)===0) throw new Error('Error in starting stage')
        await tracker.audit(bill.version, `The Clerk set the Committee Stage  to ${stageactions.formatDate(new Date(date))}`);
        const billdata = await fetching_1.Fetch.specificbill(bill.id);
        const all_ids = await fetching_1.Fetch.allprofile();
        await (0, notificationService_1.notifMany)(null, all_ids, `${billdata.title}:: The bill has been set for  committee stage ${stageactions.formatDate(new Date(date))}  `);
        // await tracker.audit(bill.version,'The bill started the waiting stage')
    }
    static async addammend(billid, user, stageid, ammendment) {
        const client = await db_1.db.connect();
        try {
            // const existing=await client.query(
            //     `SELECT clause,change,justification FROM app.amendments wHERE bill=$1`,[billid]
            // )
            // // 2. Call AI to check similarity
            // const aiResponse = await fetch("https://your-ai-endpoint/check-amendment", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({
            //     new_amendment: { ammendment.clause, ammendment.change, ammendment.justification },
            //     existing_amendments: existing.rows,
            //   }),
            // })
            // const aiResult = await aiResponse.json()
            // // 3. AI says it already exists
            // if (aiResult.exists) {
            //   return {
            //     success: false,
            //     message: "Amendment already suggested (AI detected similarity)",
            //   }
            // }
            // 4. Insert amendment
            const result = await client.query(`INSERT INTO app.amendments
               (bill, proposer_uuid, stage, author, clause_id, change, justification, status, date)
               VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',NOW())
               RETURNING *`, [billid, user.id, stageid, user.name, ammendment.clause, ammendment.change, ammendment.justification]);
            // client.
            return {
                success: true,
                message: "Amendment submitted successfully",
                data: result.rows[0],
            };
        }
        finally {
            client.release();
        }
    }
    static async getAmendments(billId, stageId) {
        // const client = await db.connect()
        try {
            const result = await db_1.db.query(`SELECT *
             FROM app.amendments
             WHERE bill = $1
             AND stage = $2
             ORDER BY date DESC`, [billId, stageId]);
            return {
                success: true,
                data: result.rows,
            };
        }
        catch (err) {
            console.error(err);
            return {
                success: false,
                message: "Failed to fetch amendments",
            };
        }
        finally {
            // client.release()
        }
    }
}
exports.Ammendments = Ammendments;
