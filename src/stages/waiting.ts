import { ActionHandler } from "./stage"
import { tracking } from "../services/audit";
import { StageActions } from "../services/action";
import { storeFile } from "../services/store-file";
import { db } from "../database/db";
import { notifMany } from "../services/notificationService";
import { Fetch } from "../fetch/fetching";

const stageactions=new StageActions()
export class Waiting{

    static async uploadpublishedbill(bill:any,stage:any,user:any,file:any){
        const tracker=new tracking(bill.Id,user.id,stage.id)
        const actionhandler=new ActionHandler('clerk')
        // actionhandler.validate(user.role)
        // give the file url
        const url=await storeFile(file.content,file.fileName)
        const updatebill=await db.query(
                    `UPDATE app.bills 
                     SET bill=$1 ,
                        bill_number=$2
                     WHERE _id=$3
                    `,
                    [url,bill.number,bill.Id]
                )
        if(updatebill.rowCount==0) throw new Error('Error updating bill')
        await stageactions.totalcompleteaction(stage.id)
        await stageactions.completestage(stage.id)
    
        // await stageactions.startaction(nextaction)
        const versionId=await tracker.billversion(url)
        await tracker.audit(versionId,'The Clerk uploaded published_bill')
        
        // set timeline for the waiting stage
        // start the waiting stage 
        await stageactions.startstage(stage.next)
        const deadline=new Date(new Date().getTime() + (30*24*60*60*1000))
        const settime=await db.query(`
            UPDATE app.stages 
            SET deadline_date=$1
            WHERE _id=$2`,[deadline,stage.next])
        if((settime.rowCount??0)===0) throw new Error('Error in starting stage')
        await tracker.audit(versionId,'The bill started the waiting stage')
        
        const billdata=await Fetch.specificbill(bill.Id)
            // const comdata=await Fetch.specificcommittee(committeeId)
        const stagedata=await Fetch.specificcommittee(stage.id)
            // const receiverId = result.rows[0]._id
            // await notif(
            //     null,
            //     billdata.sponsor,
            //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
            //     )
        
            const all_ids=await Fetch.allprofile()
        
            await notifMany(null,all_ids,
                `${billdata.title}:: Published Bill with Bill Number ::${bill.number}Has been Uploaded  `
            )
           

        // await notifMany(null,)
         
    }
}