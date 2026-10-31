import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { patientRouter } from "./routes/patient.routes.js";
import { taskRouter } from "./routes/task.routes.js";
import { helpRequestRouter } from "./routes/helpRequest.routes.js";
import { deviceRouter } from "./routes/device.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { belongingRouter } from "./routes/belonging.routes.js";
import { demoRouter } from "./routes/demo.routes.js";

export const app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/patients", patientRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/help-requests", helpRequestRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/ai", aiRouter);
app.use("/api/belongings", belongingRouter);
app.use("/api/demo", demoRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});
