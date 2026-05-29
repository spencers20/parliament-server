// import {Pool} from 'pg'
// import dotenv from 'dotenv'

// dotenv.config()
// export class db{
//     static connect(){
//         return new Pool({
//         connectionString:"postgresql://admin:admin001@localhost:5432/parliament_db",
//         ssl:{rejectUnauthorized:false}
        
//     })}

// }

// // export default db;

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const db = new Pool({
  connectionString:
    "postgresql://admin:admin001@localhost:5432/parliament_db",
  ssl: {rejectUnauthorized:false},
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});