import { db } from "../database/db";
import { StageActions } from "../services/action";

export async function timedStages(stage:any,action:string,type?:string){
    const stageactions=new StageActions()
    if(type==='action'){
        console.log('starting action...',stage)
        await stageactions.startaction(stage._id)
    }
    if (stage.name==='Waiting Period'){
        await stageactions.completestage(stage._id)   
        await stageactions.totalcompleteaction(stage.id) 
    }

    if (stage.name==='First Reading'){
        await stageactions.startstage(stage._id)
        const stageaction=await db.query(`UPDATE app.stage_actions set status='current' WHERE stage=$1 AND index=1`,[stage._id])
        // await stag
    }

    if (action==='complete'){
        console.log('completing stage...')
        await stageactions.completestage(stage._id)
          await stageactions.totalcompleteaction(stage._id)   
    }else{
        await stageactions.startstage(stage._id)
    }

    
}

