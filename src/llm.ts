import Anthropic from "@anthropic-ai/sdk";

import { config } from "dotenv";
import { resolve } from "node:path";
config()

// const apiKey = process.env.ANTHROPIC_API_KEY
// if (!apiKey) throw new Error("API key not available!")


for (const envPath of [resolve(process.cwd(), ".env"), resolve(__dirname, "../.env")]) {
    config({ path: envPath, override: false });
    if (process.env.ANTHROPIC_API_KEY?.trim()) break;
}

if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    for (const envPath of [resolve(process.cwd(), ".env"), resolve(__dirname, "../.env")]) {
        config({ path: envPath, override: true });
        if (process.env.ANTHROPIC_API_KEY?.trim()) break;
    }
}

const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
if (!anthropicApiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Check .env path and key value.");
}


export const client = new Anthropic({
    apiKey: anthropicApiKey,
    baseURL: "https://api.anthropic.com",

})

type JsonSchema = {
    type: string;
    properties?: Record<string, unknown>;
    required?: readonly string[];
    additionalProperties?: boolean;
    items?: unknown;
    [key: string]: unknown;
};

interface RunLLMProps {
    prompt: string;
    temperature?: number;
    max_tokens?: number;
    model?: string;
    schema?: JsonSchema;
    tools?: readonly NonNullable<Anthropic.Messages.MessageCreateParams["tools"]>[number][];
}

export interface RunLLMResult {
    text: string;
    toolUse: { id: string; name: string; input: unknown } | null;
    raw: Anthropic.Messages.Message;
}

function extractText(content: Anthropic.Messages.Message["content"]): string {
    for (const block of content) {
        if ("text" in block && typeof block.text === "string") {
            return block.text;
        }
    }
    return "";
}

function extractToolUse(content: Anthropic.Messages.Message["content"]): RunLLMResult["toolUse"] {
    const toolBlock = content.find((block) => block.type === "tool_use");
    if (!toolBlock) return null;

    return {
        id: toolBlock.id,
        name: toolBlock.name,
        input: toolBlock.input,
    };
}

export async function runLLM({
    prompt,
    temperature = 0,
    max_tokens = 256,
    model = "claude-haiku-4-5-20251001",
    schema,
    tools
}: RunLLMProps): Promise<RunLLMResult> {
    const request: Anthropic.Messages.MessageCreateParams = {
        model,
        max_tokens,
        temperature,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
    };

    if (schema) {
        request.output_config = {
            format: {
                type: "json_schema",
                schema,
            },
        };
    }

    if (tools && tools.length > 0) {
        request.tools = [...tools];
        request.tool_choice = { type: "auto" };
    }

    const res = await client.messages.create(request);
    return {
        text: extractText(res.content),
        toolUse: extractToolUse(res.content),
        raw: res,
    };
}