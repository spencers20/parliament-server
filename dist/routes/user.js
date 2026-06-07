"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = require("express");
const auth_service_1 = require("../auth/auth_service");
const middleware_1 = require("../auth/middleware");
const router = (0, express_1.Router)();
dotenv_1.default.config();
const authcontroller = new auth_service_1.AuthController();
router.post('/register', (req, res) => authcontroller.reqister(req, res));
router.post('/getuser', middleware_1.Authmiddleware, (req, res) => authcontroller.getuser(req, res));
router.post('/login', (req, res) => authcontroller.login(req, res));
router.post('/update', middleware_1.Authmiddleware, (req, res) => authcontroller.update(req, res));
router.post('/logout', middleware_1.Authmiddleware, (req, res) => authcontroller.loggingout(req, res));
exports.default = router;
