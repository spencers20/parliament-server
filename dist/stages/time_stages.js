"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timedStages = timedStages;
const db_1 = require("../database/db");
const action_1 = require("../services/action");
async function timedStages(stage, action, type) {
    const stageactions = new action_1.StageActions();
    if (type === 'action') {
        console.log('starting action...', stage);
        await stageactions.startaction(stage._id);
    }
    if (stage.name === 'Waiting Period') {
        await stageactions.completestage(stage._id);
        await stageactions.totalcompleteaction(stage.id);
    }
    if (stage.name === 'First Reading') {
        await stageactions.startstage(stage._id);
        const stageaction = await db_1.db.query(`UPDATE app.stage_actions set status='current' WHERE stage=$1 AND index=1`, [stage._id]);
        // await stag
    }
    if (action === 'complete') {
        console.log('completing stage...');
        await stageactions.completestage(stage._id);
        await stageactions.totalcompleteaction(stage._id);
    }
    else {
        await stageactions.startstage(stage._id);
    }
}
