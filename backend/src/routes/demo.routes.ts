import { Router } from "express";
import * as demoController from "../controllers/demo.controller.js";

export const demoRouter = Router();

demoRouter.post("/generate", demoController.generateSession); // -> POST /api/demo/generate
demoRouter.post("/reset", demoController.resetSession);       // -> POST /api/demo/reset
