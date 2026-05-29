import express, { Application } from "express";
import cors from 'cors'
import user from "./routes/user" ;
import stages from "./routes/billstages"
import cron from 'node-cron'
import { db } from "./database/db";
import { timedStages } from "./stages/time_stages";
import { Authmiddleware } from "./auth/middleware";
import multer from "multer";
import { storeFile } from "./services/store-file";
import { query_n8n } from "./services/n8n";
import bills from './routes/bills'
import votingRouter from './routes/voting';
import committee from './routes/committee'
import ammendmentsRouter from './routes/ammendments'
import stakeholderReview from './routes/stakeholderreview'
import submissionsRouter from './routes/submission'
import http from 'http';
import { createServer } from "node:http";
import { Server } from "socket.io";
// import socketHandler from "./socket";
import { Fetch } from "./fetch/fetching";
import {  setupSocketIO } from "./socket";
import committeeRouter from './routes/committeestage';
import notificationsRouter from './routes/notifications';

const app:Application=express()
app.use(cors())
app.use(express.json())
// app.set('io',io)
const httpServer = http.createServer(app);

// Setup socket AND attach io to app so routes can use req.app.get('io')
const io = setupSocketIO(httpServer);
app.set('io', io)
// const server=createServer(app)
// const io=new Server(server,{
//     cors:{
//         origin:"*"
//     }
// })
// socketHandler(io)

app.use('/user',user)
app.use('/stages',stages)
app.use('/bills',bills)
app.use('/committee',committee)
app.use('/voting', votingRouter);
app.use('/ammendments',ammendmentsRouter)
app.use('/api/committee', committeeRouter);
app.use('/reviews', stakeholderReview);
app.use('/api/submissions', submissionsRouter);
app.use('/api/notifications',  notificationsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

 // 👈 same config, not a duplicate

// ---SOCKET.IO---

const server = http.createServer(app);
 
// Setup Socket.IO (replaces setupWebSocketServer)
setupSocketIO(server);

 
// const PORT = process.env.PORT ?? 4000;



const upload=multer({storage:multer.memoryStorage()})

    cron.schedule('0 6 * * *',
        async()=>{
        try{
            console.log('RUNNING CRON JOB.....')
            const {rows}=await db.query(
                `SELECT * FROM app.stages WHERE status='current' AND deadline_date::date=CURRENT_DATE`
            )
            for (const stage of rows){
            console.log('completed_stages...',stage)
            await timedStages(stage,'complete')
            const stagedata=await Fetch.stages(stage.bill)
            const billdata=await Fetch.specificbill(stage.bill)
            io.to(stage.bill).emit(
                "stage_updated",stagedata
                )
            io.to(stage.bill).emit(
                "bill_updated",billdata
                )
            }

        const startstage=await db.query(
           
            `SELECT * FROM app.stages WHERE status='pending' AND starting_date::date=CURRENT_DATE`
        )
        for (const stage of startstage.rows){
             console.log('starting...',stage)
            await timedStages(stage,'start')
        }

    }catch(e){
        console.log('error in crone scheduling...',e)
    }
},
{
    timezone: "Africa/Nairobi",
  }
        
)

app.get('/',(req,res)=>{
    console.log('intro...')
    console.log('intro...')
    res.send('backend is running')
})

app.post('/about_bill',Authmiddleware,upload.single('file'),async(req,res)=>{
    try{
        let file_url;
        let fileName;
        const model_url=process.env.N8N_URL??''
        if(req.file){
        const file_buffer=req.file?.buffer
        fileName = req.file?.originalname;
        if(!file_buffer || !fileName) throw new Error('file not found')

        file_url=await storeFile(file_buffer,fileName)
        } else{
            const {url}=req.body
            file_url=url
            fileName=url
        }

        const get_contents=await query_n8n(model_url,file_url,fileName)
        const response=get_contents[0]?.output
        return res.status(200).json({...response,file_url})

    }catch(e:any){
        console.log(e.message)
        res.status(500).json({error:"errror in uploading bill..",ERROR:e.message})
    }

})

try {
    server.listen(3001, () => {
        console.log('listening at: http://localhost:3001')
    }).on('error', (err) => {
        console.error('Server error:', err)
    })
} catch (e) {
    console.error('Startup crash:', e)
}