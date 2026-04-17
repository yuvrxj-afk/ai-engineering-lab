import { evaluate } from "mathjs";
import { config } from "dotenv";
import OpenAI from "openai";
import { z } from "zod";
import { countTokens, truncateToTokens } from "../features/rag/shared/tokenizer";
import { withRetry } from "../features/rag/shared/retry";

config();

const EnvSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
});

const env = EnvSchema.parse(process.env);
const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const MAX_ITERATIONS = 10;
let iterations = 0;
const TOOL_RESULT_TOKEN_CAP = 500;

const GetWeatherArgs = z.object({
    city: z.string().min(1)
})

const CalculateArgs = z.object({
    expression: z.string().min(1)
})

const SAFE_MATH_EXPRESSION = /^[0-9+\-*/^%.() eE]+$/;

function calculate(expression: string) {
    return evaluate(expression);
}

function get_weather(city: string) {
    const db: Record<string, { city: string; temp_c: number; condition: string }> =
    {
        Mumbai: { city: "Mumbai", temp_c: 32, condition: "Hazy sunshine" },
    };

    return (
        db[city] ?? { city, temp_c: 0, condition: "Unknown (fake weather db)" }
    );
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get the (fake) weather for a city.",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    city: { type: "string", description: "City name, e.g. Mumbai" },
                },
                required: ["city"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "calculate",
            description: "Evaluate a math expression and return the result.",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    expression: {
                        type: "string",
                        description: 'Math expression, e.g. "42 * 7"',
                    },
                },
                required: ["expression"],
            },
        },
    },
];

async function main() {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content:
                "You are a helpful assistant. Use tools when needed. After you receive tool results, give a final plain-text answer grounded in those results. Do not call tools in the final message.",
        },
        {
            role: "user",
            content: "What's the weather in New York and what is 42 * 7e9?",
        },
    ];

    while (true) {
        if (iterations++ >= MAX_ITERATIONS) {
            throw new Error("Tool call loop exceeded max iterations");
        }
        const res = await withRetry(() =>
            client.chat.completions.create({
                messages,
                tools,
                tool_choice: "auto",
                model: "gpt-4.1-mini",
            }),
        );

        const msg = res.choices[0]?.message;
        if (!msg) throw new Error("No message returned from model");

        const toolCalls = msg.tool_calls ?? [];
        if (toolCalls.length === 0) {
            console.log(msg.content ?? "");
            return;
        }

        // Record the assistant message that requested tool calls
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
            let args: unknown;
            try {
                args = JSON.parse(toolCall.function.arguments || "{}");
            } catch (e) {
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

            let result: unknown;
            if (toolName === "get_weather") {
                const { city } = GetWeatherArgs.parse(args);
                result = get_weather(city);
            } else if (toolName === "calculate") {
                const { expression } = CalculateArgs.parse(args);

                if (!SAFE_MATH_EXPRESSION.test(expression)) {
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({
                            error: "Unsafe math expression",
                            expression,
                        }),
                    });
                    continue;
                }

                result = calculate(expression);
            } else {
                result = { error: `Unknown tool: ${toolName}` };
            }

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
}
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
