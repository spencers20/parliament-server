import { db } from "../database/db";
import { tracking } from "../services/audit";
import { StageActions } from "../services/action";
import { Fetch } from "../fetch/fetching";
import { notif } from "../services/notificationService";

export class FirstReading{

    static async clerkreading(bill:any,stage:any,userid:any){
        const tracker=new tracking(bill.id,userid,stage.id)
        const stageactions=new StageActions()
        await stageactions.completeaction(stage.actionnow)
        await stageactions.startaction(stage.nextaction)
        await tracker.audit(bill.version,`The clerk read the bill for the first time `)

    }
    
    static async assigncommittee(bill:any,stage:any,userid:any,committee:any){
        const tracker=new tracking(bill.id,userid,stage.id)
        const stageactions=new StageActions()
        const now=new Date()
        const {rowCount}=await db.query(
            `INSERT INTO app.comm_bill(
            comm_id,bill_id,stage_id,assigned_at,duration,instructions)
            VALUES($1,$2,$3,$4,$5,$6)`,
            [committee.id,bill.id,stage.next,now,committee.duration,committee.instructions]
        )
        if (rowCount===0) throw new Error('assigning bill to committee failed')
        await tracker.audit(bill.version,`The speaker assigned the bill to ${committee.name} committee for committee stage`)
        const billdata=await Fetch.specificbill(bill.id)
            // const comdata=await Fetch.specificcommittee(committeeId)
        const stagedata=await Fetch.specificstage(stage)
        // const receiverId = result.rows[0]._id
        await notif(
                null,
                billdata.sponsor,
       `Your ${billdata.title}:: ${billdata._id} Bill Has been Assigned to ${committee.name} for the ${stagedata.name} `
               )

        await notif(
                null,
                committee.id,
       `You have been assigned ${billdata.title}:: bill Bill for the ${stagedata.name} `
               )
        
            const all_ids=await Fetch.allprofile()
        
            // await notifMany(null,all_ids,
            //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
            // )
           
        await stageactions.completeaction(stage.actionnow)
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await stageactions.stagedeadline(stage.next,in30Days)
        await stageactions.completestage(stage.id)
        await stageactions.startstage(stage.next)
        await stageactions.startaction(stage.nextaction)

    }
}