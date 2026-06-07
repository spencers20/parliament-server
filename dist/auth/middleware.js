"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authmiddleware = Authmiddleware;
const jwt_1 = require("./jwt");
const db_1 = require("../database/db");
async function Authmiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Please login' });
        }
        const token = authHeader.split(' ')[1];
        const decode = jwt_1.TokenService.verify(token);
        const now = new Date();
        const stored_query = `
        SELECT * FROM app.active_tokens 
         WHERE userid=$1
         AND token=$2 
         AND expires_at>$3`;
        const values = [decode?.id, token, now];
        const stored_res = await db_1.db.query(stored_query, values);
        //  console.log('stored token...',stored_res)
        if (stored_res.rows.length === 0) {
            return res.status(401).json({ error: 'session expired -- please login again' });
        }
        await db_1.db.query(`
            UPDATE app.active_tokens
            SET expires_at=NOW() + INTERVAL '60 minutes'
            WHERE token  = $1`, [token]);
        req.user = { id: decode.id };
        next();
    }
    catch (e) {
        console.log('error in authentication middleware ...', e);
        return ({ error: e.message });
    }
}
