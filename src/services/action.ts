import { db } from "../database/db"

export class StageActions{
    // stage:string //stage_id
    // action:string //action_id
    // bill:string

    // constructor(stage:string,action:string,bill:string){
    //     this.stage=stage
    //     this.action=action
    //     this.bill=bill
    // }
    formatDate(date: Date | string | number): string {
    const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

    async completestage(stage:string){
        const completestage=await db.query(
            ` UPDATE app.stages
            SET status='completed',
            completed_date=NOW()
            WHERE _id=$1
            `,[stage]
        )
        if((completestage.rowCount??0)===0) throw new Error(`Error in completing  stage ${stage} `)

        return{success:true}
    }

    async startstage(stage:string,date?:any){
        const startdate=date?new Date(date):new Date()
        const startstage=await db.query(
            ` UPDATE app.stages
            SET status='current',
            starting_date=$1
            WHERE _id=$2
            `,[startdate,stage]
        )
        if((startstage.rowCount??0)===0) throw new Error(`Error in starting stage ${stage} `)

        return{success:true}
    }

    async completeaction(action:string){
        console.log('completing action...',action)
        const complete_res=await db.query(`
        UPDATE app.stage_actions 
        SET status='completed',
        performed_time=NOW()
        WHERE _id=$1
        `,[action]
       )
       if((complete_res.rowCount??0)===0) throw new Error(`Error in completing action ${action}  `)

       return{success:true}
    }

    async totalcompleteaction(stage:string){
        console.log('completing action...',stage)
        const complete_res=await db.query(`
        UPDATE app.stage_actions 
        SET 
          status = 'completed',
          performed_time = CASE 
            WHEN performed_time IS NULL THEN NOW() 
            ELSE performed_time 
          END
        WHERE stage = $1
        `,[stage]
       )
       if((complete_res.rowCount??0)===0) throw new Error(`Error in completing action ${stage}  `)

       return{success:true}
    }

    async totalstartaction(stage:string){
        console.log('completing action...',stage)
        const complete_res=await db.query(`
        UPDATE app.stage_actions 
        SET status='current',
        started_at=NOW()
        WHERE stage=$1
        `,[stage]
       )
       if((complete_res.rowCount??0)===0) throw new Error(`Error in completing action ${stage}  `)

       return{success:true}
    }

    async startaction(action:string){
        const start_res=await db.query(`
            UPDATE app.stage_actions
            SET status='current',
            started_at=NOW()
            WHERE _id=$1    
            `,[action])
        
            if((start_res.rowCount??0)===0) throw new Error(`Error in completing action ${action}  `)
             return {success:true}

    }
//for order paper 
    async stagedeadline(stage:string,date:Date){
        const when=new Date(date)
         const settime=await db.query(`
            UPDATE app.stages 
            SET deadline_date=$1
            WHERE _id=$2`,[when,stage])
        if((settime.rowCount??0)===0) throw new Error('Error in starting stage')

    }

    async stagefuture(stage:string,date:Date){
        const when=new Date(date)
         const settime=await db.query(`
            UPDATE app.stages 
            SET starting_date=$1
            WHERE _id=$2`,[when,stage])
        if((settime.rowCount??0)===0) throw new Error('Error in starting stage')

    }


    async startfutureaction(action:string,date?:any){
         const startdate=date?new Date(date):new Date()
        const start_res=await db.query(`
            UPDATE app.stage_actions
            SET started_at=$1
            WHERE _id=$2    
            `,[startdate,action])
        
            if((start_res.rowCount??0)===0) throw new Error(`Error in completing action ${action}  `)
             return {success:true}

    }
//for o

}