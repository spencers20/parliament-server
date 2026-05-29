import argon2 from 'argon2'

export class PasswordService{
    private static readonly OPTIONS={
        type:argon2.argon2id,
        memoryCost:19456,
        timeCost:2,
        parallelism:1,
        saltlength:16
    }

    static async hash(plain:string):Promise<string>{
        return await argon2.hash(plain,this.OPTIONS)
    }

    static async verify(hashed:string,plain:string):Promise<boolean>{
        try{
            // console.log('awaiting verification...')
            // console.log('hashed_pass',hashed,"password",plain)
            // console.log("password",plain)
            return await argon2.verify(hashed,plain)
        }
        catch{
            return false
        }

    }

    static needsRehash(hashed:string):boolean{
        return argon2.needsRehash(hashed,this.OPTIONS)

    }
}