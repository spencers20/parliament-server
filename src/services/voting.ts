import { db } from "../database/db"

export class Voting{

    async start(billid:any,stageid:any){
        const now=new Date()
        const openvoting=await db.query(`
            INSERT INTO  votings(
            bill,stage,begin_at) 
            VALUES($1,$2,$3) RETURNING _id
            `,[billid,stageid,now])
        
        if(openvoting.rows.length===0) throw new Error('Error in starting vote')
    }
    
    async close(vote_id:string,totalcast:number,accept:number,decline:number,abstain:number){
        const now=new Date()
        const closevoting=await db.query(`
            UPDATE votings 
            SET ended_at=NOW(),
            totalvoters=$2, accept=$3,decline=$4, abstain=$5
            WHERE _id=$1
           `,[vote_id,totalcast,accept,decline,abstain])
        
        if(closevoting.rows.length===0) throw new Error('Error in starting vote')

    }

}