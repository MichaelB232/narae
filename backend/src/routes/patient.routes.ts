import { Router } from "express";
import * as patientController from "../controllers/patient.controller.js";

export const patientRouter = Router();
patientRouter.get("/", patientController.list);          // -> GET /api/patients?nurseId=
patientRouter.get("/:id", patientController.getDetail);  // -> GET /api/patients/:id
