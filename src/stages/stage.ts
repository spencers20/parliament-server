import { db } from "../database/db"
import { tracking } from "../services/audit";
import { Request,Response } from "express";
import { storeFile } from "../services/store-file";
import {billStages} from "../lib/billstages"
import { StageActions } from "../services/action";
import { DraftingStage } from "./b_drafting";
import { Introduction } from "./a_introduction";
import { Prescrutiny } from "./c_prescrutiny";
import { Fetch } from "../fetch/fetching";

export class ActionHandler{
    role:string
    constructor(requiredrole:string){
        this.role=requiredrole
    }

    validate(actor:string){
        if(actor!==this.role){
            throw new Error(`Only ${this.role} can perform this action`)

        }
    }

}

const bill_stages=billStages
const stageactions=new StageActions()


type fileContents={
    content:Buffer,
    filename:string,
    mimetype:string
  }

export class StageController{
  
  async introduce(req:Request,res:Response){
    try{
      const {source,title,summary,category,cosponsor,sponsor,objectives,bill_url}=req.body
      const intro=await Introduction.create(title,bill_url,sponsor,summary,objectives,source,category,cosponsor)
      return res.status(200).json({success:'Bill created successfully'})
      // const file_url=storeFile(file.content,title)
    }catch(e:any){
      res.status(500).json({'INTROUDUCTION_ERROR':e.message})
    }
  } 

  async todrafting(req:Request,res:Response){
    try{
      const io=req.app.get("io")
      const data=req.body
      console.log('reached..',data)
      await Introduction.toDrafting(data.role,data.userId,data.versionid,data.billid,data.nextstage,data.currentstage,data.currentaction,data.nextaction)
      const stagedata=await Fetch.stages(data.billid)
      io.to(data.billid).emit(
        "stage_updated",stagedata
      )
      res.status(200).json({success:true})
    }catch(e:any){
      console.log('error',e.message)
      res.status(500).json({'TO_DRAFTING_ERROR':e.message})
    }
  }

  async to_prescrutiny(req:Request,res:Response){
    try{
      console.log('reached...')
      const data=req.body
      console.log('user',data.committee)
      await DraftingStage.speakerdecision(data.verdict,data.billId,data.committee,data.version,data.stage,data.user)
      res.status(200).json({success:true})
    }catch(e:any){
      res.status(500).json({"TO_PRE_SCRUTINY_ERROR":e.message})
    }
  }

  async topublication(req:Request,res:Response){
    try{
      const io=req.app.get('io')
      const data=req.body
      await Prescrutiny.publicationapproval(data.verdict,data.billId,data.speakerid,data.stage,data.versionId)
      const stagedata=await Fetch.stages(data.billId)
        const billdata=await Fetch.specificbill(data.billId)
      io.to(data.billId).emit(
            "stage_updated",stagedata
        )
        io.to(data.billId).emit(
            "bill_updated",billdata
        )
      res.status(200).json({success:true})
    }catch(e:any){
      res.status(500).json({'TOPUBLICATION_ERROR':e.message})
    }
  }

  async schedulefirstreading(req:Request,res:Response){
    try{

      const {stage_id,date,bill,userid}=req.body
      const tracker=new tracking(bill.id,userid,stage_id)
      await stageactions.stagefuture(stage_id,date)
      await tracker.audit(bill.version,`The Clerk set the first reading to ${new Date(date)}`)
      res.status(200).json({success:true})

    }catch(e:any){
      res.status(500).json({error:e.message})
    }
  }
   
   

}