"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_1 = __importDefault(require("./routes/user"));
const billstages_1 = __importDefault(require("./routes/billstages"));
const db_1 = require("./database/db");
const time_stages_1 = require("./stages/time_stages");
const middleware_1 = require("./auth/middleware");
const multer_1 = __importDefault(require("multer"));
const store_file_1 = require("./services/store-file");
const n8n_1 = require("./services/n8n");
const bills_1 = __importDefault(require("./routes/bills"));
const voting_1 = __importDefault(require("./routes/voting"));
const committee_1 = __importDefault(require("./routes/committee"));
const ammendments_1 = __importDefault(require("./routes/ammendments"));
const stakeholderreview_1 = __importDefault(require("./routes/stakeholderreview"));
const submission_1 = __importDefault(require("./routes/submission"));
const http_1 = __importDefault(require("http"));
// import socketHandler from "./socket";
const fetching_1 = require("./fetch/fetching");
const socket_1 = require("./socket");
const committeestage_1 = __importDefault(require("./routes/committeestage"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// app.set('io',io)
const httpServer = http_1.default.createServer(app);
// Setup socket AND attach io to app so routes can use req.app.get('io')
const io = (0, socket_1.setupSocketIO)(httpServer);
app.set('io', io);
// const server=createServer(app)
// const io=new Server(server,{
//     cors:{
//         origin:"*"
//     }
// })
// socketHandler(io)
app.use('/user', user_1.default);
app.use('/stages', billstages_1.default);
app.use('/bills', bills_1.default);
app.use('/committee', committee_1.default);
app.use('/voting', voting_1.default);
app.use('/ammendments', ammendments_1.default);
app.use('/api/committee', committeestage_1.default);
app.use('/reviews', stakeholderreview_1.default);
app.use('/api/submissions', submission_1.default);
app.use('/api/notifications', notifications_1.default);
app.get('/health', (_req, res) => res.json({ ok: true }));
// 👈 same config, not a duplicate
// ---SOCKET.IO---
const server = http_1.default.createServer(app);
// Setup Socket.IO (replaces setupWebSocketServer)
(0, socket_1.setupSocketIO)(server);
// const PORT = process.env.PORT ?? 4000;
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
let isRunning = false;
//     cron.schedule('* * * * *',
//         async()=>{
//             console.log('RUNNING CRON JOB.....')
//             if (isRunning) {
//              console.warn('Previous cron still running, skipping...');
//               return;
//             }
//              isRunning = true;
//         try{
//             const {rows}=await db.query(
//                 `SELECT * FROM app.stages WHERE status='current' AND deadline_date::date=CURRENT_DATE`
//             )
//             for (const stage of rows){
//             console.log('completed_stages...',stage)
//             await timedStages(stage,'complete')
//             const stagedata=await Fetch.stages(stage.bill)
//             const billdata=await Fetch.specificbill(stage.bill)
//             io.to(stage.bill).emit(
//                 "stage_updated",stagedata
//                 )
//             io.to(stage.bill).emit(
//                 "bill_updated",billdata
//                 )
//             }
//         const startstage=await db.query(
//             `SELECT * FROM app.stages WHERE status='pending' AND starting_date::date=CURRENT_DATE`
//         )
//         for (const stage of startstage.rows){
//              console.log('starting...',stage)
//             await timedStages(stage,'start')
//         }
//     }catch(e){
//         console.log('error in crone scheduling...',e)
//     }finally {
//     isRunning = false;
//   }
// },
// {
//     timezone: "Africa/Nairobi",
//   }
// )
const INTERVAL_MS = 1 * 60 * 1000; // 3 minute
const runJob = async () => {
    if (isRunning) {
        console.warn('Previous job still running, skipping...');
        return;
    }
    isRunning = true;
    console.log('RUNNING SCHEDULED JOB.....');
    try {
        const { rows } = await db_1.db.query(`SELECT * FROM app.stages WHERE status='current' AND deadline_date::date=CURRENT_DATE`);
        for (const stage of rows) {
            console.log('completed_stages...', stage);
            await (0, time_stages_1.timedStages)(stage, 'complete');
            const stagedata = await fetching_1.Fetch.stages(stage.bill);
            const billdata = await fetching_1.Fetch.specificbill(stage.bill);
            io.to(stage.bill).emit('stage_updated', stagedata);
            io.to(stage.bill).emit('bill_updated', billdata);
        }
        const { rows: startRows } = await db_1.db.query(`SELECT * FROM app.stages WHERE status='pending' AND starting_date::date=CURRENT_DATE`);
        for (const stage of startRows) {
            console.log('starting...', stage);
            await (0, time_stages_1.timedStages)(stage, 'start');
        }
        const { rows: startactions } = await db_1.db.query(`SELECT * FROM app.stage_actions WHERE status='pending' AND started_at::date=CURRENT_DATE`);
        for (const stage of startactions) {
            console.log('starting...', stage);
            await (0, time_stages_1.timedStages)(stage, 'start', 'action');
        }
    }
    catch (e) {
        console.error('Error in scheduled job:', e);
    }
    finally {
        isRunning = false;
    }
};
// Run immediately on startup, then every minute
runJob();
setInterval(runJob, INTERVAL_MS);
// To stop it cleanly (e.g. on shutdown):
// clearInterval(jobInterval);
app.get('/', (req, res) => {
    console.log('intro...');
    console.log('intro...');
    res.send('backend is running');
});
app.post('/about_bill', middleware_1.Authmiddleware, upload.single('file'), async (req, res) => {
    try {
        let file_url;
        let fileName;
        const model_url = process.env.N8N_URL ?? '';
        if (req.file) {
            const file_buffer = req.file?.buffer;
            fileName = req.file?.originalname;
            if (!file_buffer || !fileName)
                throw new Error('file not found');
            file_url = await (0, store_file_1.storeFile)(file_buffer, fileName);
        }
        else {
            const { url } = req.body;
            file_url = url;
            fileName = url;
        }
        const get_contents = await (0, n8n_1.query_n8n)(model_url, file_url, fileName);
        const response = get_contents[0]?.output;
        return res.status(200).json({ ...response, file_url });
    }
    catch (e) {
        console.log(e.message);
        res.status(500).json({ error: "errror in uploading bill..", ERROR: e.message });
    }
});
try {
    server.listen(3001, async () => {
        console.log('listening at: http://localhost:3001');
        (0, db_1.startdbListener)().catch(console.error);
    }).on('error', (err) => {
        console.error('Server error:', err);
    });
}
catch (e) {
    console.error('Startup crash:', e);
}
