import dotenv from'dotenv'
import { Router } from 'express'
import { AuthController } from '../auth/auth_service'
import { Authmiddleware } from '../auth/middleware'

const router=Router()

dotenv.config()

const authcontroller=new AuthController()

router.post('/register',(req,res)=>authcontroller.reqister(req,res))
router.post('/getuser',Authmiddleware,(req,res)=>authcontroller.getuser(req,res))
router.post('/login',(req,res)=>authcontroller.login(req,res))
router.post('/update',Authmiddleware,(req,res)=>authcontroller.update(req,res))
router.post('/logout',Authmiddleware,(req,res)=>authcontroller.loggingout(req,res))


export default router;
