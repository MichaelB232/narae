import { Router } from "express";
import * as belongingController from "../controllers/belonging.controller.js";

export const belongingRouter = Router();
belongingRouter.get("/", belongingController.list);       // -> GET /api/belongings?patientId=
belongingRouter.post("/", belongingController.create);    // -> POST /api/belongings
belongingRouter.patch("/:id", belongingController.update); // -> PATCH /api/belongings/:id
belongingRouter.delete("/:id", belongingController.remove); // -> DELETE /api/belongings/:id
