import { db } from "../database/db";
import { tracking } from "../services/audit";
import { StageActions } from "../services/action";
import { killbill } from "../services/billdeath";
import { StageController } from "./stage";
import { notif } from "../services/notificationService";
import { Fetch } from "../fetch/fetching";

export class DraftingStage{

    static async speakerdecision(verdict:any,billId:string,committee:any,versionId:string,stage:any,user:any){
        const tracker=new tracking(billId,user.id,stage.id)
        console.log('the stage',stage)
        const stageactions=new StageActions()
        if(verdict.verdict==='reject'){
            await killbill(billId,verdict.reason,stage)
            await tracker.audit(versionId,'The speaker rejected the Proposed Bill')
            await tracker.audit(versionId,'The Proposed Bill died')
            await stageactions.completeaction(stage.actionnow)
            await stageactions.completestage(stage.id)    
        }

        const now=new Date()
        const {rowCount}=await db.query(
            `INSERT INTO app.comm_bill(
            comm_id,bill_id,stage_id,assigned_at,duration,instructions)
            VALUES($1,$2,$3,$4,$5,$6)`,
            [committee.id,billId,stage.next,now,committee.duration,committee.instructions]
        )
        if (rowCount===0) throw new Error('assigning bill to committee failed')
        const billdata=await Fetch.specificbill(billId)
        await tracker.audit(versionId,`The speaker assigned the bill to ${committee.name} committee`)
         await notif(
                user.id,
                committee.id,
                `Check on the ${billdata.title} draft for prepublication scrutiny`
                )
        await stageactions.completeaction(stage.actionnow)
        await stageactions.completestage(stage.id)
        await stageactions.startstage(stage.next)
        await stageactions.startaction(stage.nextaction)
        
            
        
    
    }

}