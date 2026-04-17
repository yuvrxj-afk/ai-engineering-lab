
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
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

let savedReport: string | null = null;
const TOOL_RESULT_TOKEN_CAP = 500;
const CONTEXT_TOKEN_LIMIT = 6000;
const KEEP_LAST_MESSAGES = 10;

const MEMORY_PATH = resolve(process.cwd(), "src/agents/memory.json");

const MemoryEntrySchema = z.object({
    id: z.string().min(1),
    createdAt: z.string().min(1),
    task: z.string().min(1),
    report: z.string().min(1),
});
type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

const MemoryFileSchema = z.array(MemoryEntrySchema);
type MemoryFile = z.infer<typeof MemoryFileSchema>;

function loadMemories(): MemoryFile {
    try {
        const raw = readFileSync(MEMORY_PATH, "utf8").trim();
        if (raw.length === 0) return [];
        return MemoryFileSchema.parse(JSON.parse(raw));
    } catch {
        return [];
    }
}

function saveMemories(memories: MemoryFile) {
    writeFileSync(MEMORY_PATH, JSON.stringify(memories, null, 2) + "\n", "utf8");
}

function formatMemoriesForPrompt(memories: MemoryFile) {
    if (memories.length === 0) {
        return "Episodic memory: (none yet)";
    }

    const recent = memories.slice(-10); // keep it simple + bounded
    const lines = recent.flatMap((m, idx) => [
        `Memory ${idx + 1}:`,
        `- createdAt: ${m.createdAt}`,
        `- task: ${m.task}`,
        `- report: ${m.report}`,
    ]);
    return ["Episodic memory (past reports):", ...lines].join("\n");
}

function estimateMessagesTokens(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): number {
    // Rough-but-useful: count tokens of serialized payload.
    return countTokens(JSON.stringify(messages));
}

async function summarizeOlderTurns(
    older: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<string> {
    const transcript = truncateToTokens(JSON.stringify(older), 4500);
    const res = await withRetry(() =>
        client.chat.completions.create({
            model: "gpt-4.1-nano",
            temperature: 0,
            max_tokens: 300,
            messages: [
                {
                    role: "system",
                    content:
                        "Summarize the following conversation turns for future context. " +
                        "Capture the user's goals, key facts, tool results, and any decisions. " +
                        "Be concise. Output plain text only.",
                },
                { role: "user", content: transcript },
            ],
        }),
    );
    return res.choices[0]?.message?.content?.trim() ?? "";
}

async function maybeTrimMessages(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    const est = estimateMessagesTokens(messages);
    if (est <= CONTEXT_TOKEN_LIMIT) return messages;
    if (messages.length <= 2) return messages; // system + user

    const system = messages[0]!;
    const keep = messages.slice(-KEEP_LAST_MESSAGES);
    const older = messages.slice(1, Math.max(1, messages.length - KEEP_LAST_MESSAGES));

    const summary = await summarizeOlderTurns(older);
    const summaryMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
        role: "system",
        content: `Conversation summary (older turns):\n${summary || "(empty summary)"}`,
    };

    const trimmed = [system, summaryMsg, ...keep];
    return trimmed;
}

const ReadPageArgs = z.object({
    url: z.string().min(1),
});

const SearchArgs = z.object({
    query: z.string().min(1),
});

const WriteReportArgs = z.object({
    content: z.string(),
});

function write_report(content: string) {
    savedReport = content;
    return { ok: true };
}

function search(query: string) {
    // Fake search results (hardcoded)
    return [
        {
            title: "Ethereum Whitepaper (archived copy)",
            url: "https://example.com/ethereum-whitepaper",
            snippet:
                "Ethereum is a decentralized platform enabling smart contracts and dApps on a programmable blockchain.",
        },
        {
            title: "Ethereum docs: Proof of Stake overview",
            url: "https://example.com/ethereum-pos",
            snippet:
                "Ethereum uses Proof of Stake where validators propose and attest to blocks in exchange for rewards.",
        },
        {
            title: "EIP-1559: Fee market change summary",
            url: "https://example.com/eip-1559",
            snippet:
                "Transaction fees include a base fee burned by the protocol plus an optional tip to validators.",
        },
    ].filter((r) => query.length > 0);
}

function read_page(url: string) {
    // Fake page content (hardcoded by URL)
    if (url.includes("ethereum-whitepaper")) {
        return [
            "Ethereum is a general-purpose blockchain designed for decentralized applications.",
            "It introduces a virtual machine (EVM) to run smart contracts on-chain.",
            "Accounts can be externally-owned (EOA) or contract accounts with associated code.",
        ].join("\n");
    }
    if (url.includes("ethereum-pos")) {
        return [
            "Ethereum's consensus is Proof of Stake (PoS).",
            "Validators stake ETH to participate in block proposal and attestation.",
            "Finality is provided via checkpoint epochs and validator supermajority agreement.",
        ].join("\n");
    }
    if (url.includes("eip-1559")) {
        return [
            "EIP-1559 introduced a base fee that adjusts with network demand.",
            "The base fee is burned; users can add a priority fee (tip) to incentivize inclusion.",
            "This improves fee predictability and reduces some MEV-related issues, but does not eliminate them.",
        ].join("\n");
    }
    return "No content found (fake page store).";
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "search",
            description: "Search the query",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    query: { type: "string", description: "search query" },
                },
                required: ["query"],
            },
        },
    }, {
        type: "function",
        function: {
            name: "read_page",
            description: "Read the page",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    url: { type: "string", description: "read the page from url" },
                },
                required: ["url"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "write_report",
            description: "write the report",
            parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    content: { type: "string", description: "content to write the report" },
                },
                required: ["content"],
            },
        },
    },

];

async function main() {
    const defaultTask = "Research Ethereum and write a short report.";
    const userPrompt = process.argv.slice(2).join(" ").trim() || defaultTask;
    const memories = loadMemories();
    const memoryContext = formatMemoriesForPrompt(memories);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content:
                [
                    "You are a helpful assistant following the ReAct pattern.",
                    "Before acting, think step by step about what to do next.",
                    "Use the available tools when they help you make progress.",
                    "When you have enough information, call write_report(content) exactly once with the final report.",
                    "",
                    memoryContext,
                    "",
                    'If the user asks "What did you find about Ethereum last time?", answer using Episodic memory.',
                ].join("\n"),
        },
        {
            role: "user",
            content: userPrompt,
        },
    ];


    while (true) {
        if (iterations++ >= MAX_ITERATIONS) {
            throw new Error("Tool call loop exceeded max iterations");
        }
        const trimmedMessages = await maybeTrimMessages(messages);
        // If trimming happened, mutate in place so the loop keeps the compact state.
        if (trimmedMessages !== messages) {
            messages.length = 0;
            messages.push(...trimmedMessages);
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
            if (toolName === "search") {
                const { query } = SearchArgs.parse(args);
                result = search(query);
            } else if (toolName === "read_page") {
                const { url } = ReadPageArgs.parse(args);
                result = read_page(url);
            } else if (toolName === "write_report") {
                const { content } = WriteReportArgs.parse(args);
                result = write_report(content);
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

            // Stop condition: the agent stops as soon as write_report is called.
            if (toolName === "write_report") {
                const report = savedReport ?? "";
                const next: MemoryEntry = {
                    id: `${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    task: userPrompt,
                    report,
                };
                saveMemories([...memories, next]);
                console.log(savedReport ?? "");
                return;
            }
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
