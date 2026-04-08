import z from "zod";
import { runLLM } from "./llm";
import { tools } from "./tools";

type PromptCase = {
    type: string;
    text: string;
};

const PERSON_JSON_SCHEMA = {
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "number" },
        city: { type: "string" },
    },
    required: ["name", "age", "city"],
    additionalProperties: false,
} as const;

async function promptTypes() {
    console.log("\n === PROMPT TYPES === \n")

    const prompts: PromptCase[] = [
        { type: "factual", text: "What is the capital of Japan?" },
        { type: "creative", text: "Write a 2-sentence story about a lost robot." },
        { type: "instruction", text: "List 3 steps to make coffee, numbered." },
    ];

    for (const p of prompts) {
        const res = await runLLM({
            prompt: p.text
        })

        console.log(`\n [${p.type.toUpperCase()}]\n ${res.text} \n`)
    }
}

async function tempSweep() {
    console.log("\n=== Temperature Sweep ===\n");
    const prompt = "Write a 2 sentence story about a lost robot."
    const temps = [0.2, 0, 0.7, 1.0]

    for (const t of temps) {
        const res = await runLLM({
            prompt,
            temperature: t,
            max_tokens: 128
        })

        console.log(`\n[TEMP ${t}]\n${res.text}\n`);
    }
}

const PersonSchema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string()
})

const TransactionSchema = z.object({
    action: z.enum(["swap", "transfer", "stake", "approve", "unknown"]),
    protocol: z.string(),
    asset_in: z.string(),
    asset_out: z.string(),
    risk_flags: z.array(z.string()),
});

function tryParseJson(text: string): unknown | null {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const BASE_PROMPT = `
You are a blockchain transaction analyzer.

Your job:
- Identify the action type
- Identify protocol (if mentioned)
- Identify input/output assets
- Identify any risk signals (like high gas, unknown protocol, large amount)

Rules:
- If unsure, use "unknown"
- Do NOT explain anything
- MUST call the tool
`;

const inputs = [
    "User swapped 2.5 ETH for USDC on Uniswap and paid high gas",
    "User sent tokens to a contract",
    "User swapped tokens"
];

async function truncTest() {
    console.log("\n===  Test ===\n");

    for (const p of inputs) {
        const prompt = `
        ${BASE_PROMPT}
        
        Transaction:
        "${p}"
          `;

          
        const long = await runLLM({
            prompt,
            max_tokens: 200,
            tools,
        })

        console.log("\n[FULL TEXT]\n", long.text);
        console.log("\n[TOOL USE]\n", long.toolUse);

        if (!long.toolUse) {
            console.log("No tool call returned!");
            return;
        }

        const validated = TransactionSchema.safeParse(long.toolUse.input);
        if (!validated.success) {
            console.log("tool input validation failed!", validated.error.format());
            return;
        }

        console.log("\n === VALIDATED TOOL INPUT === \n", validated.data)
    }
}

async function main() {
    // await promptTypes();
    // await tempSweep();
    await truncTest();
}

main().catch(console.error)