import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";

export const taskRouter = Router();
taskRouter.get("/", taskController.listByPatient);               // -> GET /api/tasks?patientId=
taskRouter.post("/", taskController.create);                   // -> POST /api/tasks
taskRouter.patch("/:id", taskController.update);                // -> PATCH /api/tasks/:id (edit as a whole)
taskRouter.delete("/:id", taskController.remove);                // -> DELETE /api/tasks/:id
taskRouter.post("/:id/played", taskController.markPlayed);      // -> POST /api/tasks/:id/played
taskRouter.post("/:id/report", taskController.reportComplete);  // -> POST /api/tasks/:id/report
taskRouter.patch("/:id/confirm", taskController.confirm);       // -> PATCH /api/tasks/:id/confirm
taskRouter.get("/:id/history", taskController.history);         // -> GET /api/tasks/:id/history
