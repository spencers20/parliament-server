"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracking = void 0;
const db_1 = require("../database/db");
class tracking {
    constructor(bill, actor, stage) {
        this.bill = bill;
        this.actor = actor;
        this.stage = stage;
    }
    async billversion(url) {
        const now = new Date();
        console.log("bill", this.bill, "\nuser", this.actor, "\nstage", this.stage);
        const { rows: [version] } = await db_1.db.query(`INSERT INTO app.billversions (
            bill,responsible,stage,version,time_created) 
            VALUES($1,$2,$3,$4,$5) RETURNING _id`, [this.bill, this.actor, this.stage, url, now]);
        console.log('NEW VERSION..', version._id);
        if (!version._id)
            throw new Error('Version not tracked');
        return version._id;
    }
    async audit(version, action) {
        // version here is the version_id
        console.log("bill", this.bill, "\nuser", this.actor, "\nstage", this.stage);
        const now = new Date();
        const { rows: [audit] } = await db_1.db.query(`INSERT INTO app.audits(
            bill,responsible,stage,version,action,time)
            VALUES($1,$2,$3,$4,$5,$6) RETURNING _id`, [this.bill, this.actor, this.stage, version, action, now]);
        console.log('New audit....', audit);
        if (!audit._id)
            throw new Error('Audit not tracked');
        return audit._id;
    }
}
exports.tracking = tracking;
