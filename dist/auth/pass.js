"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const argon2_1 = __importDefault(require("argon2"));
class PasswordService {
    static async hash(plain) {
        return await argon2_1.default.hash(plain, this.OPTIONS);
    }
    static async verify(hashed, plain) {
        try {
            // console.log('awaiting verification...')
            // console.log('hashed_pass',hashed,"password",plain)
            // console.log("password",plain)
            return await argon2_1.default.verify(hashed, plain);
        }
        catch {
            return false;
        }
    }
    static needsRehash(hashed) {
        return argon2_1.default.needsRehash(hashed, this.OPTIONS);
    }
}
exports.PasswordService = PasswordService;
PasswordService.OPTIONS = {
    type: argon2_1.default.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    saltlength: 16
};
