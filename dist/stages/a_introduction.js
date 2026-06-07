"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Introduction = void 0;
const db_1 = require("../database/db");
const billstages_1 = require("../lib/billstages");
const audit_1 = require("../services/audit");
const action_1 = require("../services/action");
const stage_1 = require("./stage");
const notificationService_1 = require("../services/notificationService");
class Introduction {
    // static id: string;
    constructor(identity, role) {
        this.identity = identity;
        this.role = role;
    }
    static async create(title, url, actor, summary, objectives, source, category, cosponsor) {
        // const userId:string=this.identity
        const create_bill = await db_1.db.query(`
            INSERT INTO app.bills(title,sponsor,summary,bill,objectives,source,category,cosponsor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
            `, [title, actor, summary, url, objectives, source, category, cosponsor]);
        if (create_bill.rows.length < 1)
            throw new Error('Error in creating bill');
        const billId = create_bill.rows[0]._id;
        let stage;
        let stage_id = "";
        for (stage of billstages_1.billStages) {
            let date;
            console.log('stages', stage);
            if (stage.index === 1) {
                date = new Date();
            }
            // const updatedstage={...stage,bill:billId}
            const { rows: [stage_row] } = await db_1.db.query(`
            INSERT INTO app.stages(
            bill,index,name,status,starting_date) 
            VALUES ($1,$2,$3,$4,$5) RETURNING _id`, [billId, stage.index, stage.name, stage.status, date]);
            if (!stage_row._id)
                throw new Error('Error in creating stage');
            if (stage.index === 1) { // 👈 check stage.index from the loop
                stage_id = stage_row._id;
                console.log('stage+id...', stage_row);
            }
            let action;
            if (stage.actions) {
                for (action of stage.actions) {
                    const { rows: [stageActions] } = await db_1.db.query(`
                    INSERT INTO app.stage_actions(
                    stage,name,responsibility,status,index)
                    VALUES($1,$2,$3,$4,$5) RETURNING *`, [stage_row._id, action.name, action.responsibility, action.status, action.index]);
                    console.log(stageActions);
                    if (!stageActions._id)
                        throw new Error('Error in creating stage');
                }
            }
        }
        // version bill
        console.log('stagefjffid...', stage_id);
        const tracker = new audit_1.tracking(billId, actor, stage_id);
        const versioning = await tracker.billversion(url);
        console.log('versioning....', versioning);
        const clerkQuery = `
        SELECT _id
        FROM app.profile
        WHERE role = 'clerk'
      `;
        const clerkResult = await db_1.db.query(clerkQuery);
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id;
            await (0, notificationService_1.notif)(null, clerkId, 'A new bill has been introduced and is awaiting drafting preparation by the Clerk’s office.');
            await tracker.audit(versioning, 'The bill was introduced and forwarded to the Clerk for drafting preparation.');
        }
        // await tracker.audit(versioning,'The legislative proposal has been officially introduced and tracking has commenced.')
        return { success: true };
    }
    static async toDrafting(role, userid, versionid, billId, nextstageid, currentstageid, currentactionid, nextactionid) {
        // ending on one stage to the next i.e(clerk forwarding bill...end intro and start of the drafting stage)
        const actionhandler = new stage_1.ActionHandler('clerk');
        actionhandler.validate(role);
        const stageactions = new action_1.StageActions();
        const tracker = new audit_1.tracking(billId, userid, currentstageid);
        await stageactions.completeaction(currentactionid);
        await stageactions.completestage(currentstageid);
        await stageactions.startstage(nextstageid);
        await stageactions.startaction(nextactionid);
        const dlsQuery = `
        SELECT _id
        FROM app.profile
        WHERE role = 'dls'
      `;
        const Result = await db_1.db.query(dlsQuery);
        if (Result.rows.length > 0) {
            const clerkId = Result.rows[0]._id;
            await (0, notificationService_1.notif)(null, clerkId, 'The Clerk has forwarded a proposed bill to your office for legal drafting and review.');
            await tracker.audit(versionid, 'The Clerk forwarded the proposed bill to the Directorate of Legal Services (DLS) for Legal drafting.');
        }
        //   await tracker.audit(versionid,'Clerk forwarded proposed bill to DLS for drafting')
    }
}
exports.Introduction = Introduction;
