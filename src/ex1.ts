import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

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

const client = new Anthropic({
    apiKey: anthropicApiKey,
    // baseURL: "https://api.anthropic.com",
}
);

const TxAnalysisSchema = z.object({
    action: z.enum(["swap", "transfer", "approve", "mint", "burn", "stake", "unknown"]),
    protocol: z.string().describe("Protocol name e.g. Uniswap, Aave, unknown"),
    asset_in: z.string().nullable(),
    asset_out: z.string().nullable(),
    amount_usd_estimate: z.number().nullable(),
    risk_flags: z.array(z.string()),
    plain_english: z.string().describe("One sentence explaining what happened"),
    chain: z.string()
});

type TxAnalysis = z.infer<typeof TxAnalysisSchema>;

const RAW_TX = `
  From: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
  To: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D (Uniswap V2 Router)
  Value: 2.5 ETH
  Method: swapExactETHForTokens
  Decoded input: {
    amountOutMin: 4200000000 (USDC, 6 decimals = 4200 USDC),
    path: [WETH, USDC],
    deadline: 1711234567
  }
  Gas used: 142000
  Status: success
`;

// config/models.ts
export const MODELS = {
    fast: "claude-haiku-4-5-20251001",
    balanced: "claude-sonnet-4-6",
    powerful: "claude-opus-4-6",
} as const;

async function analyzeTx(rawTx: string, attempt = 1): Promise<TxAnalysis> {
    const MAX_ATTEMPTS = 3;
    const preferredModel = process.env.ANTHROPIC_MODEL?.trim() || MODELS.balanced;
    const modelCandidates = [
        preferredModel,
        MODELS.fast,
        MODELS.balanced,
        MODELS.powerful,
        "claude-sonnet-4-20250514",
        "claude-3-haiku-20240307",
    ];
    const uniqueModels = [...new Set(modelCandidates.filter(Boolean))];

    let response: Awaited<ReturnType<typeof client.messages.create>> | undefined;
    let lastError: unknown;
    for (const model of uniqueModels) {
        try {
            response = await client.messages.create({
                model,
                stream: false,
                max_tokens: 512,
                temperature: 0, // deterministic for structured extraction
                tools: [
                    {
                        name: "test_tx_and_submit_analysis",
                        description: "Submit the structured analysis of the transaction",
                        input_schema: {
                            type: "object" as const,
                            properties: {
                                action: { type: "string", enum: ["swap", "transfer", "approve", "mint", "burn", "stake", "unknown"] },
                                protocol: { type: "string" },
                                chain: { type: "string" },
                                asset_in: { type: ["string", "null"] },
                                asset_out: { type: ["string", "null"] },
                                amount_usd_estimate: { type: ["number", "null"] },
                                risk_flags: { type: "array", items: { type: "string" } },
                                plain_english: { type: "string" },
                            },
                            required: ["action", "protocol", "asset_in", "asset_out", "chain", "amount_usd_estimate", "risk_flags", "plain_english"],
                        },
                    },
                ],
                tool_choice: { type: "any" }, // force tool use
                messages: [
                    {
                        role: "user",
                        content: `Analyze this Ethereum transaction and call submit_analysis with your findings.\n\n<transaction>\n${rawTx}\n</transaction>`,
                    },
                ],
            });
            const count = await client.messages.countTokens({
                model: "claude-sonnet-4-0",
                messages: [{ role: "user", content: "Are you there? I'm Yuvraj - uv - 0708." }]
            })
            console.log(count.input_tokens)
            break;
        } catch (error: unknown) {
            lastError = error;
            const maybeAnthropicError = error as { type?: string; status?: number };
            const isModelNotFound = maybeAnthropicError?.type === "not_found_error" || maybeAnthropicError?.status === 404;
            if (!isModelNotFound) throw error;
            console.warn(`Model unavailable: ${model}. Trying next candidate...`);
        }
    }

    if (!response) {
        throw lastError instanceof Error
            ? lastError
            : new Error("No available Anthropic model found. Set ANTHROPIC_MODEL to a valid model id.");
    }
    if (!("content" in response)) {
        throw new Error("Unexpected streaming response shape.");
    }

    // Extract tool call
    const toolUse = response.content.find((b: { type: string }) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("Model did not call the tool");
    }

    // Validate with Zod — never trust raw model output
    const parsed = TxAnalysisSchema.safeParse(toolUse.input);
    if (!parsed.success) {
        console.error(`Attempt ${attempt} failed validation:`, parsed.error.issues);
        if (attempt >= MAX_ATTEMPTS) throw new Error("Max retry attempts reached");
        return analyzeTx(rawTx, attempt + 1); // retry
    }

    console.log(response, toolUse.caller, toolUse.input);
    return parsed.data;
}

// Run it
analyzeTx(RAW_TX).then((result) => {
    console.log("\n=== Transaction Analysis ===");
    console.log(JSON.stringify(result, null, 2));
    console.log(`\nSummary: ${result.plain_english}`);
    if (result.risk_flags.length > 0) {
        console.log(`⚠️  Risk flags: ${result.risk_flags.join(", ")}`);
    }
}).catch(console.error);