import { db } from "../database/db"
import { Fetch } from "../fetch/fetching";
import { tracking } from "./audit";
import { notif, notifMany } from "./notificationService";

export async function killbill(billId:string,reason:string,stage:string){
    const client = await db.connect();
    const now=new Date()
    const {rowCount}=await db.query(`
            INSERT INTO app.deadbills(
            bill,reason,stage,date) 
            VALUES($1,$2,$3,$4)
            `,[billId,reason,stage,now] )
     await client.query(
          `UPDATE app.bills
           SET status = 'dead'
           WHERE _id = $1
           `,
          [billId]
        );

    if (rowCount===0) throw new Error ('error in killing bill')
    const billdata=await Fetch.specificbill(billId)
    // const comdata=await Fetch.specificcommittee(committeeId)
    const stagedata=await Fetch.specificstage(stage)
    // const receiverId = result.rows[0]._id
    // await notif(
    //     null,
    //     billdata.sponsor,
    //     `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
    //     )

    const all_ids=await Fetch.allprofile()

    await notifMany(null,all_ids,
        `${billdata.title}:: ${billdata._id} Bill Has been killed at ${stagedata.name} report due to ${reason} `
    )
   

    return {succes:true}
}