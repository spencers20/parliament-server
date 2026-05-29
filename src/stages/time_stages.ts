import { db } from "../database/db";
import { StageActions } from "../services/action";

export async function timedStages(stage:any,action:string){
    const stageactions=new StageActions()
    if (stage.name==='Waiting Period'){
        await stageactions.completestage(stage._id)   
        await stageactions.totalcompleteaction(stage.id) 
    }

    if (stage.name==='First Reading'){
        await stageactions.startstage(stage._id)
    }

    if (action==='complete'){
        await stageactions.completestage(stage._id)
          await stageactions.totalcompleteaction(stage.id)   
    }else{
        await stageactions.startstage(stage._id)
    }

    
}

