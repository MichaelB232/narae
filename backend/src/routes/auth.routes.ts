import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

export const authRouter = Router();
authRouter.post("/login", authController.login); // -> POST /api/auth/login
