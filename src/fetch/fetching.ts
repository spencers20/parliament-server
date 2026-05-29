import { Request,Response } from "express";
import { db } from "../database/db";

export class Fetch{
    static async bills(req:Request,res:Response){
        try{
            const {rows}=await db.query(`
                SELECT b.*,v._id AS versionid, p.name AS proposedBy,  s.name AS current_stage,sa.name AS action_name, sa.responsibility AS action_responsibility
                    FROM app.bills b
                    LEFT JOIN app.profile p ON p._id=b.sponsor
                    LEFT JOIN app.billversions v ON v.bill=b._id
                    LEFT JOIN app.stages s
                    ON s.bill=b._id AND s.status='current' 
                    LEFT JOIN app.stage_actions sa
                    ON sa.stage=s._id AND sa.status='current'`)
                
            if(rows.length===0) res.status(200).json({message:'No bills available'})
                
            res.status(200).json(rows)
        
        }catch(e:any){
            res.status(500).json({FETCHING_BILLS_ERROR:e.message})
         }

    }

    static async specificbill(billId:string){
        try{
            const {rows}=await db.query(`
                SELECT b.*,v._id AS versionid, p.name AS proposedBy,  s.name AS current_stage,sa.name AS action_name, sa.responsibility AS action_responsibility
                    FROM app.bills b
                    LEFT JOIN app.profile p ON p._id=b.sponsor
                    LEFT JOIN app.billversions v ON v.bill=b._id
                    LEFT JOIN app.stages s
                    ON s.bill=b._id AND s.status='current' 
                    LEFT JOIN app.stage_actions sa
                    ON sa.stage=s._id AND sa.status='current'
                    WHERE b._id=$1`,[billId])
                
            if(rows.length===0) throw new Error('Error in getting the stages')

            return rows[0]
        
        }catch(e:any){
            console.log('error',e.message)
            return {}
         }

    }

    static async stages(billId:string){
        try{
            console.log('bill id...',billId)
            const {rows}=await db.query(`
                SELECT
                  s.*,
                COALESCE(actions.actions, '[]'::json) AS actions
                FROM app.stages s
                LEFT JOIN LATERAL (
                SELECT json_agg(
                  json_build_object(
                 'id', sa._id,
                 'action_name', sa.name,
                 'action_responsibility', sa.responsibility,
                 'status', sa.status,
                 'index', sa.index,
                 'started_at',sa.started_at
                )
                 ) AS actions
               FROM app.stage_actions sa
               WHERE sa.stage = s._id
                ) actions ON true
            WHERE s.bill = $1
             ORDER BY s.index;`,[billId])
          
             if(rows.length===0) throw new Error('Error in getting the stages')

            return rows

        }catch(e:any){
            console.log('error',e)
            return []
        }
    }
    

    static async committee(req:Request,res:Response){
        try{
            const {rows}=await db.query(`
                SELECT * FROM app.committee `)
                
            if(rows.length===0) res.status(200).json({message:'No bills available'})
                
            res.status(200).json(rows)
        
        }catch(e:any){
            res.status(500).json({FETCHING_COMMS_ERROR:e.message})
         }

    }

    static async specificcommittee(comId:string){
        try{
            const {rows}=await db.query(`
                SELECT * FROM app.committee WHERE _id=$1`,[comId])
                
            if(rows.length===0) throw new Error('Error in getting the stages')

            return rows[0]
            
        
        }catch(e:any){
            console.log('error in getting specific-committee..',e.message)
            return {}
         }

    }

    static async committeereport(stageid:string){
        try{
            const {rows}=await db.query(`
                SELECT * FROM app.commreports WHERE stage=$1`,[stageid])
                
            if(rows.length===0) throw new Error('Error in getting the stages')

            return rows[0]
            
        
        }catch(e:any){
            console.log('error in getting specific-committee..report',e.message)
            return {}
         }

    }

    static async specificstage(stageId:string){
        try{
            const {rows}=await db.query(`
                SELECT * FROM app.stages WHERE _id=$1`,[stageId])
                
            if(rows.length===0) throw new Error('Error in getting the stages')

            return rows[0]
            
        
        }catch(e:any){
            console.log('error in getting specific-committee..',e.message)
            return {}
         }

    }

    static async allprofile(): Promise<string[]>{
        try{
            const { rows } = await db.query(`
             SELECT _id FROM app.profile
           `)

          return rows.map(r => r._id)
            
        
        }catch(e:any){
            console.log('error in getting specific-committee..',e.message)
            return []
         }

    }



    static async committeebills(req:Request,res:Response){
        try{
            const {commId}=req.body
            const {rows}=await db.query(`
                SELECT 
                    cb.*, 
                    b.*,v._id AS versionid, p.name AS proposedBy,  s.name AS current_stage,sa.name AS action_name, sa.responsibility AS action_responsibility
                FROM app.comm_bill cb
                LEFT JOIN app.bills b
                ON cb.bill_id = b._id
                LEFT JOIN app.profile p ON p._id=b.sponsor
                LEFT JOIN app.billversions v ON v.bill=b._id
                    LEFT JOIN app.stages s
                    ON s.bill=b._id AND s.status='current' 
                    LEFT JOIN app.stage_actions sa
                    ON sa.stage=s._id AND sa.status='current'
                WHERE cb.comm_id = $1 `,[commId])
                
            if(rows.length===0) res.status(200).json({message:'No bills available'})
                
            res.status(200).json(rows)
        
        }catch(e:any){
            res.status(500).json({FETCHING_COMMS_ERROR:e.message})
         }

    }
}

