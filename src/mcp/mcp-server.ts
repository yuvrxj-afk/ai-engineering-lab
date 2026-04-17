import fastify from "fastify";
import { evaluate } from "mathjs";
import { z } from "zod";

const app = fastify({ logger: true });

const GetWeatherArgs = z.object({
    city: z.string().min(1),
});

const CalculateArgs = z.object({
    expression: z.string().min(1),
});

const SAFE_MATH_EXPRESSION = /^[0-9+\-*/^%.() eE]+$/;

function calculate(expression: string) {
    return evaluate(expression);
}

function get_weather(city: string) {
    const db: Record<string, { city: string; temp_c: number; condition: string }> = {
        Mumbai: { city: "Mumbai", temp_c: 32, condition: "Hazy sunshine" },
        "New York": { city: "New York", temp_c: 18, condition: "Partly cloudy" },
    };
    return db[city] ?? { city, temp_c: 0, condition: "Unknown (fake weather db)" };
}

// OpenAI-compatible tool definitions (returned to client to pass to model)
const tools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get the (fake) weather for a city.",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    city: { type: "string", description: "City name, e.g. New York" },
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
] as const;

app.get("/tools", async (_req, res) => {
    return res.status(200).send(tools);
});

const ExecuteBodySchema = z.object({
    toolName: z.string().min(1),
    args: z.record(z.string(), z.unknown()),
});

app.post("/execute", async (req, res) => {
    const parsed = ExecuteBodySchema.safeParse((req as any).body);
    if (!parsed.success) {
        return res.status(400).send({ error: parsed.error.flatten() });
    }

    const { toolName, args } = parsed.data;

    try {
        if (toolName === "get_weather") {
            const { city } = GetWeatherArgs.parse(args);
            return res.send(get_weather(city));
        }

        if (toolName === "calculate") {
            const { expression } = CalculateArgs.parse(args);
            if (!SAFE_MATH_EXPRESSION.test(expression)) {
                return res.status(400).send({ error: "Unsafe math expression", expression });
            }
            return res.send(calculate(expression));
        }

        return res.status(404).send({ error: `Unknown tool: ${toolName}` });
    } catch (err) {
        return res.status(400).send({ error: String(err) });
    }
});

async function main() {
    const port = Number(process.env.MCP_PORT ?? "9090");
    const host = process.env.MCP_HOST ?? "127.0.0.1";
    await app.listen({ port, host });
}

main().catch((err) => {
    app.log.error(err);
    process.exitCode = 1;
});

