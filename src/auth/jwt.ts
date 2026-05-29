import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const SECRECY:any=process.env.JWT_SECRET
console.log('secrecy...',SECRECY)
export class TokenService{
    static generate(userid:string):string{
        return jwt.sign(
            {id:userid},
            SECRECY
        )
    }

    static verify(token:string){
        return jwt.verify(token,SECRECY)
    }


}