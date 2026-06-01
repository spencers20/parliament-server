import { Router } from "express";
import { Authmiddleware } from "../auth/middleware";
import { db } from "../database/db";
import { Fetch } from "../fetch/fetching";
import { Prescrutiny } from "../stages/c_prescrutiny";
import multer from "multer";
import { Scrutiny } from "../stages/g_committee";

const router=Router()
const upload=multer({storage:multer.memoryStorage()})

router.get('/fetchall',Authmiddleware,async(req,res)=>{
    await Fetch.committee(req,res)
})

router.post('/fetchbills',Authmiddleware,async(req,res)=>{
    await Fetch.committeebills(req,res)
})

router.post('/billstage',async(req,res)=>{
  try{
    const {billId}=req.body
    const stage=await Fetch.specificbillstage(billId)
    res.status(200).json(stage)

  }catch(e){
    console.log('error in getting bill stages ....',e)
  }
})

// --COMMITTEE BILLS--

router.post('/commbills',async(req,res)=>{
  // const {commId}=req.body

  const bills=await db.query(`
    SELECT 
  cb.*,
  s.name AS stage_name
FROM app.comm_bill cb
LEFT JOIN app.stages s 
  ON cb.stage_id = s._id
  `,)

  const resp=bills.rows
  return res.status(200).json(resp)
})

router.post('/assigned',async(req,res)=>{
  const {stage_id,bill_id}=req.body

  const bills=await db.query(`
    SELECT 
  cb.bill_id,
  cb.stage_id,
  c.name AS committee_name,
  c.members AS members
FROM app.comm_bill cb
LEFT JOIN app.committee c 
  ON cb.comm_id = c._id
WHERE cb.stage_id = $1
  AND cb.bill_id = $2;
  `,[stage_id,bill_id])

  const resp=bills.rows
  return res.status(200).json(resp)
})

router.post('/fetch_stages',Authmiddleware,async(req,res)=>{
    try{
        const {billId}=req.body
        const data=await Fetch.stages(billId)
        res.status(200).json(data)

    }catch(e:any){
        res.status(500).json({FETCHING_STAGES_ERROR:e.message})
    }
})

router.post('/fetchreport',async(req,res)=>{
  try{
    const {stageId}=req.body
    const report=await Fetch.committeereport(stageId)
    res.status(200).json(report)


  }catch(e){
    console.log('error in finding report ',e)
    return res.status(500).json({error:"error in fetching committee report"})
  }
})

router.post('/prescrutinyreport',Authmiddleware,upload.single('file'),async(req,res)=>{
    try{
        console.log('scrutiny committteeee....')
        const io=req.app.get('io')
        const file_buffer=req.file?.buffer
        const fileName = req.file?.originalname;
        const repofile={
            content:file_buffer,
            fileName
        }
        const {billid,stageid,nextaction,currentaction,committeeId,versionId}=req.body
        await Prescrutiny.uploadreport(billid,stageid,nextaction,currentaction,repofile,committeeId,versionId)
        const stagedata=await Fetch.stages(billid)
        const billdata=await Fetch.specificbill(billid)
            io.to(billid).emit(
                "stage_updated",stagedata
            )
            io.to(billid).emit(
                "bill_updated",billdata
            )
        return res.status(200).json({success:true})

    }catch(e:any){
        console.log('error in com scrutiny report...',e.message)
        res.status(500).json({PRESCRUTINY_ERROR:e.message})
    }

})

router.post('/openpublic',Authmiddleware,async(req,res)=>{
    try{
        console.log('committ....')
        const io=req.app.get('io')
        const {billid,stageid,committeeId,}=req.body
        await Scrutiny.open_participation(billid,stageid,committeeId)
        const stagedata=await Fetch.stages(billid)
        const billdata=await Fetch.specificbill(billid)
            io.to(billid).emit(
                "stage_updated",stagedata
            )
            io.to(billid).emit(
                "bill_updated",billdata
            )
        return res.status(200).json({success:true})

    }catch(e:any){
        res.status(500).json({PRESCRUTINY_ERROR:e.message})
    }

})

router.post('/scrutinyreport',Authmiddleware,upload.single('file'),async(req,res)=>{
    try{
        console.log('committteeee....')
        const io=req.app.get('io')
        const file_buffer=req.file?.buffer
        const fileName = req.file?.originalname;
        const repofile={
            content:file_buffer,
            fileName
        }
        const {billid,stageid,nextaction,currentaction,committeeId,versionId}=req.body
        await Scrutiny.uploadreport(billid,stageid,nextaction,currentaction,repofile,committeeId,versionId)
        const stagedata=await Fetch.stages(billid)
        const billdata=await Fetch.specificbill(billid)
            io.to(billid).emit(
                "stage_updated",stagedata
            )
            io.to(billid).emit(
                "bill_updated",billdata
            )
        return res.status(200).json({success:true})

    }catch(e:any){
        res.status(500).json({PRESCRUTINY_ERROR:e.message})
    }

})

router.post('/presentreport',Authmiddleware,async(req,res)=>{
    try{
        console.log('committ....')
        const io=req.app.get('io')
        const {billid,stageid,nextaction,currentaction,nextstage,committeeId,versionId}=req.body
        await Scrutiny.read_report(billid,stageid,nextaction,currentaction,nextstage,committeeId,versionId)
        const stagedata=await Fetch.stages(billid)
        const billdata=await Fetch.specificbill(billid)
            io.to(billid).emit(
                "stage_updated",stagedata
            )
            io.to(billid).emit(
                "bill_updated",billdata
            )
        return res.status(200).json({success:true})

    }catch(e:any){
        res.status(500).json({PRESCRUTINY_ERROR:e.message})
    }

})



// / GET /api/stakeholders
// Returns all stakeholders for the dropdown
router.get('/stakeholders', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT _id, name, email, organisation
       FROM app.stakeholders
       `
    );
    return res.json({ stakeholders: result.rows });
  } catch (err) {
    console.error('Error fetching stakeholders:', err);
    return res.status(500).json({ error: 'Failed to load stakeholders' });
  }
});
 
// GET /api/bills/:billId/clauses
// Returns all clauses for a specific bill (for the clause selector in the modal)
router.get('/bills/:billId/clauses', async (req, res) => {
  const { billId } = req.params;
  try {
    const result = await db.query(
      `SELECT id, number, title, text, type, status, order_index
       FROM app.clauses
       WHERE bill_id = $1
       ORDER BY order_index`,
      [billId]
    );
    return res.json({ clauses: result.rows });
  } catch (err) {
    console.error('Error fetching clauses:', err);
    return res.status(500).json({ error: 'Failed to load clauses' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/review/requests/lookup?bill_id=X&stage=Y
//
// Returns ALL requests for a bill+stage, with every stakeholder
// invite across all those requests. Stakeholders are grouped:
//   - responded: invite has a response
//   - pending:   invite has no response yet
//
// Must be registered BEFORE /:requestId/responses in your router.
// ─────────────────────────────────────────────────────────────

router.get('/requests/lookup', async (req, res) => {
  const { bill_id, stage } = req.query as { bill_id?: string; stage?: string };

  if (!bill_id) {
    return res.status(400).json({ error: 'bill_id is required' });
  }

  try {
    // 1. Fetch ALL requests for this bill (+ optional stage filter)
    const requestsResult = await db.query(
      `SELECT
         req._id              AS request_id,
         req.subject,
         req.stage,
         req.message,
         req.created_at       AS sent_at,
         array_length(req.clause_ids, 1) AS clause_count,
         b.title              AS bill_title,
         b.bill_number,
         c.name               AS committee_name
       FROM app.stakeholder_review_requests req
       JOIN app.bills     b ON b._id = req.bill_id
       JOIN app.committee c ON c._id = req.committee_id
       WHERE req.bill_id = $1
         ${stage ? 'AND req.stage = $2' : ''}
       ORDER BY req.created_at DESC`,
      stage ? [bill_id, stage] : [bill_id]
    );

    if (!requestsResult.rows.length) {
      return res.status(404).json({ error: 'No review requests found for this bill and stage' });
    }

    const requestIds = requestsResult.rows.map((r) => r.request_id);

    // 2. Fetch ALL invites across all those requests in one query
    const invitesResult = await db.query(
      `SELECT
         inv._id              AS invite_id,
         inv.request_id,
         s._id                AS stakeholder_id,
         s.name               AS stakeholder_name,
         s.email              AS stakeholder_email,
         inv.viewed_at,
         inv.responded_at,
         inv.response,
         inv.token,
         inv.created_at
       FROM app.stakeholder_review_invites inv
       JOIN app.stakeholders s ON s._id = inv.stakeholder_id
       WHERE inv.request_id = ANY($1::uuid[])
       ORDER BY inv.responded_at DESC NULLS LAST, inv.created_at ASC`,
      [requestIds]
    );

    // 3. Attach the parent request's subject/sent_at to each invite
    //    so the frontend can show which round the invite belongs to
    const requestMap = new Map(requestsResult.rows.map((r) => [r.request_id, r]));

    const enrichedInvites = invitesResult.rows.map((inv) => {
      const parentRequest = requestMap.get(inv.request_id);
      return {
        ...inv,
        request_subject: parentRequest?.subject ?? null,
        request_sent_at: parentRequest?.sent_at ?? null,
      };
    });

    // 4. Split into responded vs pending
    const responded = enrichedInvites.filter((i) => !!i.responded_at);
    const pending   = enrichedInvites.filter((i) => !i.responded_at);

    // 5. Bill-level meta (use first request for shared fields)
    const firstRequest = requestsResult.rows[0];
    const meta = {
      bill_title:     firstRequest.bill_title,
      bill_number:    firstRequest.bill_number,
      committee_name: firstRequest.committee_name,
      stage:          firstRequest.stage,
      total_requests: requestsResult.rows.length,
      requests:       requestsResult.rows,   // full list if frontend wants to show rounds
    };

    return res.json({
      meta,
      responded,
      pending,
      // flat list in case the frontend prefers filtering itself
      all: enrichedInvites,
    });
  } catch (err) {
    console.error('Error looking up review requests:', err);
    return res.status(500).json({ error: 'Failed to load review requests' });
  }
});
export default router;