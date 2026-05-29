import { db } from "../database/db"
import { billStages } from "../lib/billstages"
import { tracking } from "../services/audit"
import { StageActions } from "../services/action"
import { ActionHandler } from "./stage"
import { notif } from "../services/notificationService"

export class Introduction{
    identity:string
    role:string
    // static id: string;
    constructor(identity:string,role:string){
        this.identity=identity
        this.role=role
    }

    static async create(title:string,url:string,actor:string,summary:string,objectives:string[],source:string,category:string,cosponsor:string){
        // const userId:string=this.identity
        const create_bill=await db.query(
            `
            INSERT INTO app.bills(title,sponsor,summary,bill,objectives,source,category,cosponsor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
            `,
            [title,actor,summary,url,objectives,source,category,cosponsor]
        )

        if(create_bill.rows.length<1) throw new Error('Error in creating bill')
        const billId=create_bill.rows[0]._id
        let stage:any
        let stage_id:string=""
        for(stage of billStages){
            let date;
            console.log('stages',stage)
            if (stage.index===1){
                date=new Date()
                
            }
            // const updatedstage={...stage,bill:billId}
            const {rows:[stage_row]}=await db.query(`
            INSERT INTO app.stages(
            bill,index,name,status,starting_date) 
            VALUES ($1,$2,$3,$4,$5) RETURNING _id`,
            [billId,stage.index,stage.name,stage.status,date])
            
            if(!stage_row._id) throw new Error('Error in creating stage')
                if (stage.index === 1) {  // 👈 check stage.index from the loop
             stage_id = stage_row._id;
             console.log('stage+id...',stage_row)
                 }
            let action:any
            if(stage.actions){
            for (action of stage.actions){
                const {rows:[stageActions]}=await db.query(
                    `
                    INSERT INTO app.stage_actions(
                    stage,name,responsibility,status,index)
                    VALUES($1,$2,$3,$4,$5) RETURNING *`,
                    [stage_row._id,action.name,action.responsibility,action.status,action.index]
                )
                console.log(stageActions)
                if(!stageActions._id) throw new Error('Error in creating stage')
    
            }}

        }
        // version bill
        console.log('stagefjffid...',stage_id)
        const tracker=new tracking(billId,actor,stage_id)
        const versioning:any=await tracker.billversion(url)
        console.log('versioning....',versioning)
        const clerkQuery = `
        SELECT _id
        FROM app.profile
        WHERE role = 'clerk'
      `
      
      const clerkResult = await db.query(clerkQuery)
      
      if (clerkResult.rows.length > 0) {
        const clerkId = clerkResult.rows[0]._id
      
        await notif(
          null,
          clerkId,
          'A new bill has been introduced and is awaiting drafting preparation by the Clerk’s office.'
        )
      
        await tracker.audit(
          versioning,
          'The bill was introduced and forwarded to the Clerk for drafting preparation.'
        )
      }
        
        // await tracker.audit(versioning,'The legislative proposal has been officially introduced and tracking has commenced.')

        return {success:true}
        
    }

    static async toDrafting(role:string,userid:string,versionid:string,billId:string,nextstageid:string,currentstageid:string,currentactionid:string,nextactionid:string){
      // ending on one stage to the next i.e(clerk forwarding bill...end intro and start of the drafting stage)
      const actionhandler=new ActionHandler('clerk')
      actionhandler.validate(role)
      const stageactions=new StageActions()
      const tracker=new tracking(billId,userid,currentstageid)
      await stageactions.completeaction(currentactionid)
      await stageactions.completestage(currentstageid)
      await stageactions.startstage(nextstageid)
      await stageactions.startaction(nextactionid)
       const dlsQuery = `
        SELECT _id
        FROM app.profile
        WHERE role = 'dls'
      `
      
      const Result = await db.query(dlsQuery)
      
      if (Result.rows.length > 0) {
        const clerkId = Result.rows[0]._id
      
        await notif(
          null,
          clerkId,
          'The Clerk has forwarded a proposed bill to your office for legal drafting and review.'
        )
      
        await tracker.audit(
          versionid,
          'The Clerk forwarded the proposed bill to the Directorate of Legal Services (DLS) for Legal drafting.'
        )
      }
    //   await tracker.audit(versionid,'Clerk forwarded proposed bill to DLS for drafting')

    }

    // static Uploaddraft(file)
}