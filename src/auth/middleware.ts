import { NextFunction, Request, Response } from "express";
import { error } from "node:console";
import { TokenService } from "./jwt";
import { db } from "../database/db";

export async function Authmiddleware(req:Request,res:Response,next:NextFunction){
    try{
        const authHeader=req.headers.authorization
        if(!authHeader?.startsWith('Bearer ')){
            return res.status(401).json({error:'Please login'})
        }
        
        const token =authHeader.split(' ')[1]
        const decode=TokenService.verify(token) as {id:string}
        const now=new Date()
        const stored_query=`
        SELECT * FROM app.active_tokens 
         WHERE userid=$1
         AND token=$2 
         AND expires_at>$3`
         const values=[decode?.id,token,now]
         const stored_res=await db.query(stored_query,values)
        //  console.log('stored token...',stored_res)

         if(stored_res.rows.length===0){
            return res.status(401).json({error:'session expired -- please login again'})
         }

         await db.query(`
            UPDATE app.active_tokens
            SET expires_at=NOW() + INTERVAL '60 minutes'
            WHERE token  = $1`,
             [token])

        req.user={id:decode.id}
        next()

    }catch(e:any){
        console.log('error in authentication middleware ...',e)
        return ({error:e.message})
    }
}