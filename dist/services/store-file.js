"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeFile = storeFile;
const blob_1 = require("@vercel/blob");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function storeFile(content, filename) {
    try {
        console.log('storing file...');
        const store = await (0, blob_1.put)(filename, content, {
            access: 'public',
            addRandomSuffix: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        console.log('storing file...', store.url);
        return store.url;
    }
    catch (e) {
        console.log('error in storing file...', e);
        throw new Error('Error IN STORING FILE...');
    }
}
