import { Router } from "express";
import { Authmiddleware } from "../auth/middleware";
import { db } from "../database/db";
import { Fetch } from "../fetch/fetching";
import { Ammendments } from "../stages/i_ammendmentproposal";

const router=Router()

router.post('/setcomm_stage',async(req,res)=>{
    const {bill,userid,stage,date}=req.body
    if (!bill|| !stage || !userid || !date)  {
      res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
      return;
    }

    await Ammendments.startcommittee(bill,userid,stage,date)
    res.status(200).json({success:true})

    
})

router.post('/fetch',async(req,res)=>{
    try{
        console.log('fetching....')
        const {billId,stage}=req.body
        if (!billId|| !stage )  {
      res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
      return;
    }

        const data=await Ammendments.getAmendments(billId,stage)
        res.status(200).json(data)

    }catch(e:any){
        res.status(500).json({FETCHING_STAGES_ERROR:e.message})
    }
})

router.post('/add',async(req,res)=>{
    try{
        console.log('adding....')
        const {billid,stage,user,ammendment}=req.body
        if (!billid|| !stage || !user || !ammendment )  {
      res.status(400).json({ error: 'bill_id, stage, and speaker_id are required' });
      return;
    }

        const data=await Ammendments.addammend(billid,user,stage,ammendment)
        res.status(200).json(data)

    }catch(e:any){
        res.status(500).json({FETCHING_STAGES_ERROR:e.message})
    }
})
export default router;