import { Router } from "express";
import * as deviceController from "../controllers/device.controller.js";

export const deviceRouter = Router();
deviceRouter.get("/", deviceController.list);                      // -> GET /api/devices
deviceRouter.post("/:uid/heartbeat", deviceController.heartbeat);  // -> POST /api/devices/:uid/heartbeat
