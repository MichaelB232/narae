import { app } from "./app.js";
import { env } from "./config/env.js";
import { helpRequestService } from "./services/helpRequest.service.js";

app.listen(env.port, () => {
  console.log(`[narae-backend] listening on :${env.port}`);
});

setInterval(() => {
  helpRequestService.expireOverdue().catch((e) => console.error("[expire-sweep]", e));
}, 60 * 1000);
