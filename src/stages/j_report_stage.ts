import { db } from "../database/db"
import { tracking } from "../services/audit"
import { storeFile } from "../services/store-file"
import { Voting } from "../services/voting"
import { StageActions } from "../services/action"
import { killbill } from "../services/billdeath"

const vote=new Voting()
const stageactions=new StageActions()

class ReportStage{

    async openvoting(user:any,bill:any,stage:any){
        vote.start(bill.id,stage.id)
        const track=new tracking(bill.id,user.id,stage.id)
        await track.audit(bill.version,'Speaker opened voting for report stage')

        
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