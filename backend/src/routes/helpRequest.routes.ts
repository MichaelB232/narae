import { Router } from "express";
import * as helpRequestController from "../controllers/helpRequest.controller.js";

export const helpRequestRouter = Router();
helpRequestRouter.get("/", helpRequestController.list);           // -> GET /api/help-requests?nurseId=&status=
helpRequestRouter.post("/", helpRequestController.create);        // -> POST /api/help-requests
helpRequestRouter.patch("/:id", helpRequestController.updateStatus); // -> PATCH /api/help-requests/:id
