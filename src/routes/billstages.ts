import { Router,Express } from "express";
import { Authmiddleware } from "../auth/middleware";
import { StageController,ActionHandler } from "../stages/stage";
import multer from 'multer'
import { storeFile } from "../services/store-file";
import { query_n8n } from "../services/n8n";
import { tracking } from "../services/audit";
import { db } from "../database/db";
import { StageActions } from "../services/action";
import { Waiting } from "../stages/waiting";
import { Fetch } from "../fetch/fetching";
import { FirstReading } from "../stages/f_first_reading";
import {SecondReading} from "../stages/h_secondreading"
import { notif } from "../services/notificationService";
// import { error } from "node:console";


const router=Router()
// router.use(express.json())
const stagecontrol=new StageController()
const upload=multer({storage:multer.memoryStorage()})

router.post('/create',Authmiddleware,async(req,res)=>await stagecontrol.introduce(req,res))

router.post('/todrafting',Authmiddleware,async(req,res)=>await stagecontrol.todrafting(req,res))

router.post('/download',Authmiddleware,async(req,res)=>{
    try{
        const {billId,userId,stageId,user,versionId}=req.body
        const tracker=new tracking(billId,userId,stageId)
        tracker.audit(versionId,`${user} downloaded the proposal`)
        res.status(200).json({success:true})
    }catch(e:any){
        console.log('error in updating bill download',e)
        res.status(500).json({success:false, error:e.message})
    }
})
//upload during drafting
router.post('/uploaddraft',Authmiddleware,upload.single('file'),async(req,res)=>{
    try{
        console.log('uploadreached....  ')
        const modelurl=process.env.N8N_URL??''
        const io=req.app.get('io')
        // const actionhandler=new ActionHandler('dls')
        const {billId,currentaction,nextaction,stage,userrole,userid,nextstageaction,nextstage}=req.body
        console.log('user...',nextaction)
        if(!nextaction) return
        // actionhandler.validate(userrole)
        
        const stageactions=new StageActions()
        const tracker=new tracking(billId,userid,stage)
        const file_buffer=req.file?.buffer
        const fileName = req.file?.originalname;
        // const model_url=process.env.MODEL_URL||'jjjj'
        if(!file_buffer || !fileName) throw new Error('file not found')
        

        const file_url=await storeFile(file_buffer,fileName)
        const response= await query_n8n(modelurl,file_url,fileName,undefined,'clause')
        const clauses=await response[0]?.output?.clauses??await response[0]?.output
     // saving the clauses
        for (let clause of clauses){
            await db.query(
                ` INSERT INTO app.clauses(bill_id,number,title,text,type,status,order_index,created_at,interpretation)
                VALUES ($1,$2,$3,$4,'original','not_voted',$5,NOW(),$6)`,
                [billId,clause.clause_number,clause.clause_title,clause.clause_text,clause.clause_number,clause.clause_interpretation]
            )

        }
        const updatebill=await db.query(
            `UPDATE app.bills 
             SET bill=$1
             WHERE _id=$2
            `,
            [file_url,billId]
        )
        if(updatebill.rowCount==0) throw new Error('Error updating bill')
        const stagedata=await Fetch.specificbill(stage)
    if(stagedata.name==='Reprinting'){
        await stageactions.completestage(stage)
        await stageactions.totalcompleteaction(stage)
        await stageactions.startaction(nextstageaction)
        await stageactions.startstage(nextstage)
    }else{
        await stageactions.completeaction(currentaction)
        await stageactions.startaction(nextaction)
    }
        const billdata=await Fetch.specificbill(billId)
        const versionId=await tracker.billversion(file_url)
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'clerk'
                `
        const clerkResult = await db.query(clerkQuery)
                
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id
                
            await tracker.audit(versionId,'The Directorate of Legislative Service updloaded Drafted Bill')
            await notif(
            userid,
            billdata.sponsor,
            'Read through the drafted bill and approve it. '
            )
        
        }
        
        io.to(billId).emit(
            "stage_updated",stagedata
        )
        io.to(billId).emit(
            "bill_updated",billdata
        )


    }catch(e:any){
        console.log('error in updating bill upload',e)
        res.status(500).json({success:false, error:e.message})

    }
})

// SPONSOR APPROVAL
router.post('/approvedraft',Authmiddleware,async(req,res)=>{
    try{
        const io=req.app.get('io')
        const {billId,stageId,user,versionId,currentaction,nextaction}=req.body
        const actionhandler=new ActionHandler('sponsor')
        actionhandler.validate(user.role)
        const stageactions=new StageActions()
        const updatebill=await db.query(
            `UPDATE app.bills 
             SET sponsor_approved=TRUE
             WHERE _id=$1
            `,
            [billId]
        )
        if(updatebill.rowCount==0) throw new Error('Error updating bill')
        const tracker=new tracking(billId,user.id,stageId)
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'clerk'
                `
        const clerkResult = await db.query(clerkQuery)
        const billdata=await Fetch.specificbill(billId)
                
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id
           await notif(
            null,
            clerkId,
            `${billdata.title} Draft approved by sponsor forward it to the speaker`
            )}
        tracker.audit(versionId,`${user.name} Accepted the Drafting version to proceed as is`)
        await stageactions.completeaction(currentaction)
        await stageactions.startaction(nextaction)
        const stagedata=await Fetch.stages(billId)
      
        io.to(billId).emit(
            "stage_updated",stagedata
        )
        io.to(billId).emit(
            "bill_updated",billdata
        )
        
        res.status(200).json({success:true})
    }catch(e:any){
        console.log('error in updating bill download',e)
        res.status(500).json({success:false, error:e.message})
    }
})
router.post('/forwarddraft',Authmiddleware,async(req,res)=>{
    try{
        console.log('forwardiing draft..')
        const io=req.app.get('io')
        const {billId,stageId,user,versionId,currentaction,nextaction}=req.body
        const actionhandler=new ActionHandler('clerk')
        actionhandler.validate(user.role)
        const stageactions=new StageActions()
        // comments are sent to notification
        // const updatebill=await db.query(
        //     `UPDATE app.bills 
        //      SET sponsor_approved=TRUE
        //      WHERE _id=$1
        //     `,
        //     [billId]
        // )
        // if(updatebill.rowCount==0) throw new Error('Error updating bill')
        await stageactions.completeaction(currentaction)
        await stageactions.startaction(nextaction)
        const tracker=new tracking(billId,user._id,stageId)
        tracker.audit(versionId,`Clerk forwarded draft to speaker with comment`)
        const clerkQuery = `
                SELECT _id
                FROM app.profile
                WHERE role = 'speaker'
                `
        const clerkResult = await db.query(clerkQuery)
        const billdata=await Fetch.specificbill(billId)
        console.log('billdata..',billdata)
                
        if (clerkResult.rows.length > 0) {
            const clerkId = clerkResult.rows[0]._id
           await notif(
            null,
            clerkId,
            `${billdata.title} Draft has been approved, My comment about the bill is`
            )}
        
        const stagedata=await Fetch.stages(billId)
        // const billdata=await Fetch.specificbill(billId)
        io.to(billId).emit(
            "stage_updated",stagedata
        )
        io.to(billId).emit(
            "bill_updated",billdata
        )
        
        res.status(200).json({success:true})
    }catch(e:any){
        console.log('error in updating bill draft',e)
        res.status(500).json({success:false, error:e.message})
    }
})

router.post('/toprescrutiny',Authmiddleware,async(req,res)=>await stagecontrol.to_prescrutiny(req,res))

router.post('/topublication',Authmiddleware,async(req,res)=>await stagecontrol.topublication(req,res))
router.post('/upload-published',Authmiddleware,upload.single('File'),async(req,res)=>{
    try{
        const io=req.app.get('io')
        const {stageid,nextstage,userId,billId,billNumber}=req.body
        const file_buffer=req.file?.buffer
        const fileName = req.file?.originalname;
        const stage={
            id:stageid,
            next:nextstage,
        }
        const user={
            id:userId
        }
        const file={
            content:file_buffer,
            fileName
        }
        const bill={
            Id:billId,
            number:billNumber
        }
        await Waiting.uploadpublishedbill(bill,stage,user,file)
        const stagedata=await Fetch.stages(billId)
        const billdata=await Fetch.specificbill(billId)
        io.to(billId).emit(
            "stage_updated",stagedata
        )
        io.to(billId).emit(
            "bill_updated",billdata
        )
        res.status(200).json({
            success:true
        })
    }catch(e:any){
        res.status(500).json({"ERROR_IN_UPLOADING_REPORT":e.message})
    }
})

router.post('/f_reading',Authmiddleware,async(req,res)=>await stagecontrol.schedulefirstreading(req,res))


router.post('/clerk_freading',Authmiddleware,async(req,res)=>{
    try{
        console.log('reaching...')
        const io=req.app.get('io')
        const {bill,stage,userid}=req.body
        console.log('bill...',bill)
        await FirstReading.clerkreading(bill,stage,userid)
        const stagedata=await Fetch.stages(bill.id)
        const billdata=await Fetch.specificbill(bill.id)
        io.to(bill.id).emit(
            "stage_updated",stagedata
        )
        io.to(bill.id).emit(
            "bill_updated",billdata
        )
        res.status(200).json({
            success:true
        })

    }catch(e:any){
        console.log('error...',e)
        res.status(500).json({error:e.messsage})
    }
})

router.post('/freading_assigncomm',Authmiddleware,async(req,res)=>{
    try{
        console.log('reaching out....')
        const io=req.app.get('io')
        const {bill,stage,userid,committee}=req.body
        await FirstReading.assigncommittee(bill,stage,userid,committee)
        const stagedata=await Fetch.stages(bill.id)
        const billdata=await Fetch.specificbill(bill.id)
        io.to(bill.id).emit(
            "stage_updated",stagedata
        )
        io.to(bill.id).emit(
            "bill_updated",billdata
        )
        res.status(200).json({
            success:true
        })

    }catch(e:any){
         console.log('error...',e)
        res.status(500).json({error:e.messsage})
    }
})

router.post('/s_reading',Authmiddleware,async(req,res)=>{
    try{
        console.log('reaching out....')
        const io=req.app.get('io')
        const {bill,userid,currentaction,stage_id,date,nextaction}=req.body
        await SecondReading.startsecondreading(bill,userid,currentaction,stage_id,date,nextaction)
        const stagedata=await Fetch.stages(bill.id)
        const billdata=await Fetch.specificbill(bill.id)
        io.to(bill.id).emit(
            "stage_updated",stagedata
        )
        io.to(bill.id).emit(
            "bill_updated",billdata
        )
        res.status(200).json({
            success:true
        })

    }catch(e:any){
         console.log('error...',e)
        res.status(500).json({error:e.messsage})
    }
})


export default router
