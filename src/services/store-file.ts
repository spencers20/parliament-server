import {put} from '@vercel/blob'
import dotenv from 'dotenv'

dotenv.config()
export async function storeFile(content:Buffer,filename:string):Promise<string>{
    try{
        console.log('storing file...')
        const store=await put(filename,content,{
            access:'public',
            addRandomSuffix:true,
            token:process.env.BLOB_READ_WRITE_TOKEN
        })
         console.log('storing file...',store.url)
        return store.url;

    }catch(e:any){
        console.log('error in storing file...',e)
        throw new Error('Error IN STORING FILE...')
    }
    
}