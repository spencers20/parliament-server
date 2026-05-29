import { db } from "../database/db"
import { tracking } from "../services/audit"
import { storeFile } from "../services/store-file"
import { Voting } from "../services/voting"
import { StageActions } from "../services/action"
import { killbill } from "../services/billdeath"
import { notifMany } from "../services/notificationService"
import { Fetch } from "../fetch/fetching"

const vote=new Voting()
const stageactions=new StageActions()

export class SecondReading{

    // table for second reading 
    static async startsecondreading(bill:any,userid:string,currentaction:string,stage_id:string,date:any,nextaction:string){
        const tracker=new tracking(bill.id,userid,stage_id)
        await stageactions.completeaction(currentaction)
        await stageactions.startfutureaction(nextaction,date)
        const stagedata=await Fetch.specificstage(stage_id)
        await tracker.audit(bill.version,`The Clerk set the ${stagedata.name} to ${stageactions.formatDate(new Date(date))}`)
        const billdata=await Fetch.specificbill(bill.Id)
        const all_ids=await Fetch.allprofile()
        
        await notifMany(null,all_ids,
            `${billdata.title}:: The bill has been set for  ${stagedata.name}on ${stageactions.formatDate(new Date(date))}  `
        )
    }

    async openvoting(user:any,bill:any,stage:any){
        vote.start(bill.id,stage.id)
        const track=new tracking(bill.id,user.id,stage.id)
        const stagedata=await Fetch.specificstage(stage.id)
        await track.audit(bill.version,`The Speaker officially opened voting for the ${stagedata.name} stage.`)
        const all_ids=await Fetch.allprofile()
        const billdata=await Fetch.specificbill(bill.Id)
        
        await notifMany(null,all_ids,
            `${billdata.title}:: The speaker has started voting on principles for the stage ${stagedata.name}}  `
        )

        
    }

    async closevoting(user:any,bill:any,results:any,stage:any,vote_id:string){
        vote.close(vote_id,results.total,results.accepted,results.decline,results.abstain)
        // from websockets and redis
        if (results.decline>results.accepted){
            await killbill(bill.id,'Most votes on decline',stage.id)
        }
        const track=new tracking(bill.id,user.id,stage.id)
        await track.audit(bill.version,'Speaker closed voting')
    }

     static async uploadreport(bill:any,stage:any,file:any,user:any){
        const tracker = new tracking(bill.id,user.id,stage.id)
        const url=await storeFile(file.content,file.fileName)
        // table for reading minutes
        // const {rowCount}=await db.query(`
        //         INSERT INTO app.commreports (bill,stage,url,committee) 
        //         VALUES($1,$2,$3,$4)
        //         `,[bill.id,stage.id,url]
        //     )
        // if(rowCount===0) throw new Error('Error in storing the prescrutiny report')
                // notification to speaker
    
        await tracker.audit(bill.version,'The clerk uploaded the reading minutes')
        await stageactions.completestage(stage.id)
        await stageactions.startstage(stage.next)
    
        }

}