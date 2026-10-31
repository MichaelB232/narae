import { Router } from "express";
import * as aiController from "../controllers/ai.controller.js";

export const aiRouter = Router();
aiRouter.post("/converse", aiController.converse);              // -> POST /api/ai/converse
aiRouter.get("/history/:patientId", aiController.history);      // -> GET /api/ai/history/:patientId
