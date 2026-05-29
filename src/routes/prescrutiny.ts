import { Router } from "express";
import { Authmiddleware } from "../auth/middleware";
import multer from "multer";
import { Prescrutiny } from "../stages/c_prescrutiny";

const router=Router()
const upload=multer({storage:multer.memoryStorage()})
router.post('/upload-report',Authmiddleware,upload.single('File'),async(req,res)=>{
    try{
        const data=req.body
        // await Prescrutiny.uploadreport(data.billId,data.stage,data.file,data.committeeId,data.version)
        res.status(200).json({
            success:true
        })
    }catch(e:any){
        res.status(500).json({"ERROR_IN_UPLOADING_REPORT":e.message})
    }
})

// GET /api/stakeholders
// Returns all stakeholders for the dropdown
// router.get('/stakeholders', async (_req: Request, res: Response) => {
//   try {
//     const result = await pool.query(
//       `SELECT _id, name, email, organisation
//        FROM app.stakeholders
//        ORDER BY name`
//     );
//     return res.json({ stakeholders: result.rows });
//   } catch (err) {
//     console.error('Error fetching stakeholders:', err);
//     return res.status(500).json({ error: 'Failed to load stakeholders' });
//   }
// });
 
// GET /api/bills/:billId/clauses
// Returns all clauses for a specific bill (for the clause selector in the modal)
// router.get('/bills/:billId/clauses', async (req: Request, res: Response) => {
//   const { billId } = req.params;
//   try {
//     const result = await pool.query(
//       `SELECT id, number, title, text, type, status, order_index
//        FROM app.clauses
//        WHERE bill_id = $1
//        ORDER BY order_index`,
//       [billId]
//     );
//     return res.json({ clauses: result.rows });
//   } catch (err) {
//     console.error('Error fetching clauses:', err);
//     return res.status(500).json({ error: 'Failed to load clauses' });
//   }
// });