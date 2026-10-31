
import { createGeminiClient } from "./geminiClient.js";
import { SYSTEM_PROMPT } from "./prompt/systemPrompt.js";
import { buildJitContext } from "./prompt/jitContext.js";
import {
  allTools,
  toolsByName,
  type ToolExecContext,
} from "./tools/index.js";
import type {
  AgentDataProvider,
  ConverseInput,
  ConverseResult,
} from "./types.js";

export interface AgentOptions {
  apiKey: string;
  model: string;
}

const MAX_TOOL_ROUNDS = 4;

export async function converse(
  input: ConverseInput,
  provider: AgentDataProvider,
  options: AgentOptions
): Promise<ConverseResult> {
  const started = Date.now();
  let escalate = false;
  const toolCallsUsed: string[] = [];

  const execCtx: ToolExecContext = {
    patient: input.patient,
    provider,
    markEscalate: () => {
      escalate = true;
    },
  };

  const ai = createGeminiClient(options);

  const chat = ai.chats.create({
    model: options.model,
    config: {
      tools: [
        {
          functionDeclarations: allTools.map(
            (tool) => tool.declaration
          ),
        },
      ],
    },
    history: [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: "Baik, saya akan mengikuti aturan itu." }],
      },
      {
        role: "user",
        parts: [{ text: buildJitContext(input.patient) }],
      },
      {
        role: "model",
        parts: [{ text: "Dimengerti." }],
      },
    ],
  });

  let result = await chat.sendMessage({
    message: input.transcript,
  });

  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    const parts = result.candidates?.[0]?.content?.parts ?? [];

    const calls = parts
      .map((part) => part.functionCall)
      .filter((call) => call !== undefined);

    if (calls.length === 0) break;

    const responses = await Promise.all(
      calls.map(async (call) => {
        const toolName = call.name;

        if (!toolName) {
          return {
            functionResponse: {
              name: "unknown",
              response: {
                error: "Function call name is missing",
              },
            },
          };
        }

        toolCallsUsed.push(toolName);

        const tool = toolsByName[toolName];

        const output = tool
          ? await tool.execute(call.args, execCtx)
          : { error: `Tool ${call.name} tidak dikenal` };

        return {
          functionResponse: {
            name: call.name,
            response: output as Record<string, unknown>,
          },
        };
      })
    );

    result = await chat.sendMessage({
      message: responses,
    });

    rounds += 1;
  }

  const responseText =
    result.text?.trim() ||
    "Maaf, saya belum bisa menjawab itu sekarang.";

  return {
    responseText,
    escalate,
    latencyMs: Date.now() - started,
    toolCallsUsed,
  };
}
