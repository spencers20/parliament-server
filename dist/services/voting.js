"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Voting = void 0;
const db_1 = require("../database/db");
class Voting {
    async start(billid, stageid) {
        const now = new Date();
        const openvoting = await db_1.db.query(`
            INSERT INTO  votings(
            bill,stage,begin_at) 
            VALUES($1,$2,$3) RETURNING _id
            `, [billid, stageid, now]);
        if (openvoting.rows.length === 0)
            throw new Error('Error in starting vote');
    }
    async close(vote_id, totalcast, accept, decline, abstain) {
        const now = new Date();
        const closevoting = await db_1.db.query(`
            UPDATE votings 
            SET ended_at=NOW(),
            totalvoters=$2, accept=$3,decline=$4, abstain=$5
            WHERE _id=$1
           `, [vote_id, totalcast, accept, decline, abstain]);
        if (closevoting.rows.length === 0)
            throw new Error('Error in starting vote');
    }
}
exports.Voting = Voting;
