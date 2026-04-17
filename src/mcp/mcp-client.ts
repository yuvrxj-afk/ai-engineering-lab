import { config } from "dotenv";
import OpenAI from "openai";
import { z } from "zod";
import { countTokens, truncateToTokens } from "../features/rag/shared/tokenizer";
import { withRetry } from "../features/rag/shared/retry";

config();

const EnvSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    MCP_BASE_URL: z.string().url().default("http://127.0.0.1:9090"),
});

const env = EnvSchema.parse(process.env);
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MAX_ITERATIONS = 10;
const TOOL_RESULT_TOKEN_CAP = 500;

const ToolSchema = z.object({
    type: z.literal("function"),
    function: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        parameters: z.any(),
    }),
});
const ToolsSchema = z.array(ToolSchema);

async function fetchTools(): Promise<OpenAI.Chat.Completions.ChatCompletionTool[]> {
    const res = await withRetry(() => fetch(`${env.MCP_BASE_URL}/tools`));
    if (!res.ok) throw new Error(`GET /tools failed: ${res.status} ${res.statusText}`);
    const json = await res.json();
    const parsed = ToolsSchema.parse(json);
    return parsed as unknown as OpenAI.Chat.Completions.ChatCompletionTool[];
}

async function executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const res = await withRetry(() =>
        fetch(`${env.MCP_BASE_URL}/execute`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ toolName, args }),
        }),
    );

    const text = await res.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = { error: "Non-JSON response from MCP server", raw: text };
    }

    if (!res.ok) {
        return { error: "MCP tool execution failed", status: res.status, body: json };
    }
    return json;
}

async function main() {
    const tools = await fetchTools();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content:
                "You are a helpful assistant. Use tools when needed. After you receive tool results, " +
                "give a final plain-text answer grounded in those results. Do not call tools in the final message.",
        },
        {
            role: "user",
            content: "What's the weather in New York and what is 42 * 7e9?",
        },
    ];

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        const res = await withRetry(() =>
            openai.chat.completions.create({
                model: "gpt-4.1-mini",
                tool_choice: "auto",
                stream: false,
                tools,
                messages,
            }),
        );

        const msg = res.choices[0]?.message;
        if (!msg) throw new Error("No message returned from model");

        const toolCalls = msg.tool_calls ?? [];
        if (toolCalls.length === 0) {
            console.log(msg.content ?? "");
            return;
        }

        messages.push(msg);

        for (const toolCall of toolCalls) {
            if (toolCall.type !== "function") {
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: `Unsupported tool type: ${toolCall.type}` }),
                });
                continue;
            }

            const toolName = toolCall.function.name;
            let args: Record<string, unknown>;
            try {
                args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({
                        error: "Invalid tool arguments JSON",
                        toolName,
                    }),
                });
                continue;
            }

            const result = await executeTool(toolName, args);

            const rawToolContent = JSON.stringify(result);
            const toolContent =
                countTokens(rawToolContent) > TOOL_RESULT_TOKEN_CAP
                    ? truncateToTokens(rawToolContent, TOOL_RESULT_TOKEN_CAP) +
                      "\n...[truncated tool output]"
                    : rawToolContent;

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolContent,
            });
        }
    }

    throw new Error("Tool call loop exceeded max iterations");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});

