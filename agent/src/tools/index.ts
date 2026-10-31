import type { Tool } from "./types.js";
import { getTodayTasksTool } from "./getTodayTasks.tool.js";
import { getBelongingsTool } from "./getBelongings.tool.js";
import { getBelongingsSummaryTool } from "./getBelongings.tool.js";
import { getCurrentDateTimeTool } from "./getCurrentDateTime.tool.js";
import { requestNurseCallTool } from "./requestNurseCall.tool.js";
import { reportTaskCompleteTool } from "./reportTaskComplete.tool.js";

// Tambah tool baru = tambah 1 file di folder ini + daftarkan di sini. Tidak ada tempat lain yang perlu diubah.
export const allTools: Tool[] = [
  getTodayTasksTool,
  getBelongingsTool,
  getCurrentDateTimeTool,
  requestNurseCallTool,
  reportTaskCompleteTool,
  getBelongingsSummaryTool,
];

export const toolsByName: Record<string, Tool> = Object.fromEntries(allTools.map((t) => [t.name, t]));

export * from "./types.js";
