import {db} from "../database/db"
import { TokenService } from "./jwt"
import { PasswordService } from "./pass"
import { Response,Request } from "express"

class AuthServices{
  
    constructor(
        // private mydb:db,
        private passwordservice:PasswordService
    ){}


    static async create(name:string,id:number,role:string,dob:Date,email:string,phonenumber:string){
        const check_query=`SELECT COUNT(*) FROM app.profile WHERE id_number=$1
        `
        const results=await db.query(check_query,[id])
        const count=parseInt(results.rows[0].count)
        console.log('existing db count...', count)
        if (count>0) throw new Error ('id exists already')

        const hashed_pass=await PasswordService.hash(id.toString())
        console.log("hashed_pass..." , hashed_pass)
        if(!hashed_pass) throw new Error('no pass error')
        const query=`
        INSERT INTO app.profile (name,id_number,role,dob,email,phone_number,password) VALUES ($1,$2,$3,$4,$5,$6,$7)`
        const values=[name,id,role,dob,email,phonenumber,hashed_pass]
        const insert_res=await db.query(query,values)
        const res_count=insert_res.rowCount
        if((res_count??0)>0){
            return {success:true}
        }else{
            throw new Error('error in inserting data')
        }

    }

    static async login(id:number,pass:string){
        const query=`SELECT * FROM app.profile WHERE id_number=$1`
        const data=await db.query(query,[id])
        if (data.rows.length==0) throw new Error('User Not Found ')
        const hashed_pass=data.rows[0]?.password
        console.log('hashed_pass',hashed_pass,"password",pass)

        const verified=await PasswordService.verify(hashed_pass,pass)
        console.log('verified..',verified)
        if(!verified) throw new Error('Unauthorized credentials')
        
        const needrehash=PasswordService.needsRehash(hashed_pass)
        if(needrehash){
            const newpass=await PasswordService.hash(pass)
            const update_query=`UPDATE  app.profile SET password=$1 WHERE id_number=$2`
            const update_values=[newpass,id]
            const update=await db.query(update_query,update_values)
            
        }
        const user=data.rows[0]
       const token=TokenService.generate(data.rows[0]?._id)
       console.log('generated token...',token)
        const create_token=await db.query(`INSERT INTO app.active_tokens(userid,token,expires_at,created_at) VALUES ($1,$2,NOW()+INTERVAL'30 minutes',NOW())`,[data.rows[0]._id,token])
        if((create_token.rowCount??0)<1) throw new Error('error in inserting token to db')

        const {password:_,...safeUser}=user

        return {...safeUser,token}

    }

    static async updatePass(newpass:string,pass:string, id:number){
        const  validate_query=`SELECT password FROM app.profile WHERE id_number=$1`
        const v_results=await db.query(validate_query,[id])
        const validate_user=await PasswordService.verify(v_results.rows[0].password,pass)
        if(!validate_user) throw new Error("user not verified")
        console.log('updatingg....')
        const update_query=`UPDATE app.profile SET password=$1 WHERE id_number=$2`
        const hashednew=await PasswordService.hash(newpass)
        const values=[hashednew,id]
        const results =await db.query(update_query,values)
         console.log('updatingg.. done...',results)
        
        if ((results.rowCount??0)>0){
             console.log('updatingg...')
            return {success:true}
        }else{
            throw new Error('Update error')
        }
    }

    static async logout(id:string){
        const loggingout =await db.query(
            `DELETE * FROM app.active_token WHERE userid=$1`,
            [id]
        )
        console.log('deleting')
        if((loggingout.rowCount??0)>0){
            console.log('logged_out')
            return {success:true}
        }
        throw new Error('Error in logging out user')
    }


}

export class AuthController{
    // constructor(
    //     private authservice:AuthServices
    // ){}

    async reqister(req:Request,res:Response){
        try{
            const data=req.body
            const user_created=await AuthServices.create(data.name,data.id,data.role,new Date(data.dob),data.email,data.phonenumber)
            if (user_created.success){
                return res.status(201).json({success:'Profile created successfully'})
            }
            

        }catch(e:any){

            return res.status(500).json({REGISTERING_ERROR:e.message})
        }
    }

    async login(req:Request,res:Response){
        try{
            console.log("reached..")
            const data=req.body
            const user=await AuthServices.login(data.id,data.pass)
            console.log('accepted..',user)
            if(!user) return res.status(500).json({success:false,data:{}})
            
            return res.status(201).json(user)
            
        }catch(e:any){
            return res.status(500).json({LOGGING_ERROR:e.message})
        }
    }

    async getuser(req:Request,res:Response){
        try{
            console.log("reached..")
            const data=req.body
            console.log('user_id',data)
            const query=`SELECT * FROM app.profile WHERE _id=$1`
            const {rows}=await db.query(query,[data.userId])
            const {password:_,...user}=rows[0]
            

            // const user=await AuthServices.login(data.id,data.pass)
            console.log('accepted....user...',user)
            if(!user) return res.status(500).json({success:false,data:{}})
            return res.status(201).json(user)
            
        }catch(e:any){
            return res.status(500).json({GET_USER_ERROR:e.message})
        }
    }

    async update(req:Request,res:Response){
        try{
            const data=req.body
            const updated=await AuthServices.updatePass(data.newpass,data.pass,data.id)
            if(updated?.success){
                res.status(200).json({success:"update successfully"})
            }

        }catch(e:any){
            return res.status(500).json({UPDATING_ERROR:e.message})
        }
    }

    async loggingout(req:Request,res:Response){
        try{
            const body=req.body
            const loggout=await AuthServices.logout(body.id)
            if(loggout.success){
                res.status(200).json({success:"Logged out successfully"})
            }

        }catch(e:any){
            return res.status(500).json({LOG_OUT_ERROR:e.message})
        }
    }
}