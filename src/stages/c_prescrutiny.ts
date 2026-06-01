import { db } from "../database/db";
import { tracking } from "../services/audit";
import { storeFile } from "../services/store-file";
import { StageActions } from "../services/action";
import { killbill } from "../services/billdeath";
import { Fetch } from "../fetch/fetching";
import { notif } from "../services/notificationService";


const stageactions = new StageActions()
export class Prescrutiny{

    static async uploadreport(billid:string,stageid:any,nextaction:string,currentaction:string,file:any,committeeId:string,versionId:string){
       const tracker = new tracking(billid,committeeId,stageid)
        const url=await storeFile(file.content,file.fileName)
        const {rowCount}=await db.query(`
            INSERT INTO app.commreports (bill,stage,url,committee) 
            VALUES($1,$2,$3,$4)
            `,[billid,stageid,url,committeeId]
        )
        if(rowCount===0) throw new Error('Error in storing the prescrutiny report')
         await db.query(`
            UPDATE  app.comm_bill SET completed_on=NOW()
           WHERE bill_id=$1 AND stage_id=$2
            `,[billid,stageid]
        )
        
            // notification to speaker
         const comdata=await Fetch.specificcommittee(committeeId)
        await tracker.audit(versionId,`The ${comdata.name} committee submitted the prepublication scrutiny report`)
        await stageactions.completeaction(currentaction)
        await stageactions.startaction(nextaction)
      
        const result = await db.query( `
                        SELECT _id
                        FROM app.profile
                        WHERE role = 'speaker'
                        `)
        const billdata=await Fetch.specificbill(billid)
        const stagedata=await Fetch.specificstage(stageid)
      
        if (result.rows.length > 0) {
            const receiverId = result.rows[0]._id
            await notif(
            null,
            receiverId,
            `${billdata.title}:: ${comdata.name} Committee submitted the ${stagedata.name} report `
            )}

    }

    static async publicationapproval(verdict:any,billId:string,speakerId:string,stage:any,versionId:string){
        const tracker = new tracking(billId,speakerId,stage.id)
        if(verdict.verdict==='reject'){
            await killbill(billId,verdict.reason,stage.id)
            await tracker.audit(versionId,'The speaker rejected the bill at pre-publication scrutiny')
            await tracker.audit(versionId, 'The draft bill died ')
            await stageactions.completeaction(stage.action)
            await stageactions.completestage(stage.id)  
        }

        await stageactions.completeaction(stage.action)
        await stageactions.completestage(stage.id)
        await stageactions.startstage(stage.next)
        
        // await this.stageactions.startaction(stage.nextaction) 

        await tracker.audit(versionId, 'The speaker forwarded approved for publication')


    }
}