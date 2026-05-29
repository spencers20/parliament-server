import { db } from "../database/db";
import { tracking } from "../services/audit";
import { storeFile } from "../services/store-file";
import { StageActions } from "../services/action";
import { Fetch } from "../fetch/fetching";
// import { killbill } from "./billdeath";


const stageactions = new StageActions()
export class Scrutiny{
    static async open_participation(billid:any,stageid:any,committeeId:string){
        const tracker = new tracking(billid,committeeId,stageid)
        const {rowCount}=await db.query(`
            UPDATE app.bills 
            SET public_participation='true' 
            WHERE _id=$1
            `,[billid]
        )
        console.log('rowcount...',rowCount)
        if(rowCount===0) throw new Error('Error in storing the prescrutiny report')
        const billdata=await Fetch.specificbill(billid)
        
        await tracker.audit(billdata.versionid,'The committee presents the report from the committee scrutiny stage ')
        
    }

    static async uploadreport(billid:any,stageid:any,nextaction:any,currentaction:any,file:any,committeeId:string,versionId:string){
        
       const tracker = new tracking(billid,committeeId,stageid)
        const url=await storeFile(file.content,file.fileName)
        console.log('uploading....')
        const {rowCount}=await db.query(`
            INSERT INTO app.commreports (bill,stage,url,committee) 
            VALUES($1,$2,$3,$4)
            `,[billid,stageid,url,committeeId]
        )
        console.log('rowcount...',rowCount)
        if(rowCount===0) throw new Error('Error in storing the prescrutiny report')
            // notification to speaker
        console.log('tracking...')
        await tracker.audit(versionId,'The committee uploaded the committee stage report')
        await stageactions.completeaction(currentaction)
        await stageactions.startaction(nextaction)

    }
//   committee reading report / more of committee making the report public
    static async read_report(billid:any,stageid:any,nextaction:any,currentaction:any,nextstage:any,committeeId:string,versionId:string){
        const tracker = new tracking(billid,committeeId,stageid)
        await stageactions.completeaction(currentaction)
        await stageactions.completestage(stageid)
        await stageactions.startstage(nextstage)
        await stageactions.startaction(nextaction)
        await tracker.audit(versionId,'The committee presents the report from the committee scrutiny stage ')    
    }



    
}