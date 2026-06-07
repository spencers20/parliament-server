"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query_n8n = query_n8n;
const pinecone_1 = require("@pinecone-database/pinecone");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pc = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY ?? '' });
const index = pc.index({ name: 'parliament' });
async function fetchWithRetry(model_url, data, 
//   index: any,
namespace, clause, maxRetries = 4) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log('to results,,,,', model_url);
            const result = await fetch(model_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            console.log('N8n results,,,,', result);
            if (!result.ok) {
                const errorText = await result.text();
                throw new Error(`N8N request failed [${result.status}]: ${errorText}`);
            }
            const res = await result.json();
            console.log(`results/// attempt ${attempt}:`, res);
            // Validate the response — retry if empty
            const isValid = res?.every?.((item) => {
                const out = item?.output;
                const hasMetadata = out?.title?.trim() &&
                    out?.summary?.trim() &&
                    Array.isArray(out?.objectives) &&
                    out.objectives.length > 0;
                const hasClauses = Array.isArray(out?.clauses) &&
                    out.clauses.length > 0;
                return hasMetadata || hasClauses;
            });
            if (isValid) {
                if (namespace)
                    await index.namespace(namespace).deleteAll();
                return res;
            }
            console.warn(`Attempt ${attempt}/${maxRetries}: Empty fields in response, retrying...`);
            lastError = new Error('Response contained empty title, summary, or objectives');
        }
        catch (err) {
            lastError = err;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        }
        // Optional: wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
            await new Promise(res => setTimeout(res, attempt * 1000));
        }
    }
    throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
}
async function query_n8n(model_url, file_url, namespace, senddata, clause) {
    let lastError;
    try {
        let data;
        if (file_url && namespace) {
            if (clause) {
                data = {
                    file_url,
                    namespace,
                    clause: true
                };
            }
            else {
                data = {
                    file_url,
                    namespace
                };
            }
            console.log('data/..', data);
            return await fetchWithRetry(model_url, data, namespace);
        }
        else {
            data = senddata;
        }
        let maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`data/.. (attempt ${attempt})`, data);
                console.log('data/..', data);
                const result = await fetch(model_url, {
                    method: 'POST',
                    headers: {
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!result.ok) {
                    const errorText = await result.text();
                    throw new Error(`N8N request failed [${result.status}]: ${errorText}`);
                }
                const res = await result.json();
                console.log('results///', res);
                //remove namespace
                //    if(namespace)
                if (namespace)
                    await index.namespace(namespace).deleteAll();
                return res;
            }
            catch (e) {
                lastError = new Error(`Error in running N8N.. ${e}`);
                console.warn(`Attempt ${attempt} failed:`, lastError.message);
                if (attempt < maxRetries) {
                    const delay = attempt * 1000; // 1s, 2s backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                }
                throw new Error(`Error in running N8N.. ${e}`);
            }
        }
    }
    catch (e) {
        throw lastError ?? new Error('N8N failed after maximum retries with no error details');
    }
}
