import OpenAI from "openai";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { CORPUS } from "./eval";
import { DocumentIngester } from "./ingestion";
import { rewriteQuery } from "./query";
import type { RetrievalResult } from "./retrieval";
import { retrieve, VectorStore } from "./retrieval";
import "./shared/env";
import { withRetry } from "./shared/retry";

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
        if (!raw) return [];
        return MemoryFileSchema.parse(JSON.parse(raw));
    } catch {
        return [];
    }
}

function saveMemories(memories: MemoryFile) {
    writeFileSync(MEMORY_PATH, JSON.stringify(memories, null, 2) + "\n", "utf8");
}

function formatMemoriesForPrompt(memories: MemoryFile): string {
    if (memories.length === 0) return "Memory: (none)";
    const recent = memories.slice(-10);
    const lines = recent.flatMap((m, idx) => [
        `Memory ${idx + 1}:`,
        `- createdAt: ${m.createdAt}`,
        `- task: ${m.task}`,
        `- report: ${m.report}`,
    ]);
    return ["Memory (recent):", ...lines].join("\n");
}

function formatEvidence(results: RetrievalResult[]): string {
    if (results.length === 0) return "(no retrieved evidence)";
    return results
        .map((r, idx) => {
            const heading = r.chunk.heading ? ` (${r.chunk.heading})` : "";
            return [
                `Evidence ${idx + 1}:`,
                `- source: ${r.chunk.source}`,
                `- docId: ${r.chunk.docId}${heading}`,
                `- score: ${r.score.toFixed(3)} (sem=${r.semanticScore.toFixed(3)}, kw=${r.keywordScore.toFixed(3)})`,
                `- text: ${r.text}`,
            ].join("\n");
        })
        .join("\n\n");
}

export interface PipelineResult {
    query: string;
    rewrittenQuery: string;
    results: RetrievalResult[];
    answer: string;
}
const openai = new OpenAI();
const store = new VectorStore();
const ingester = new DocumentIngester(store);

export async function runRAG(query: string) {
    await ingester.ingestAll(CORPUS);
    return runPipeline(query)
}

async function runPipeline(query: string): Promise<PipelineResult> {
    // Step 3 (before step 1): load memory
    const memories = loadMemories();

    // Step 1: RAG retrieval → chunks back

    const rewrittenQuery = await rewriteQuery(query, openai);
    const results = await retrieve(rewrittenQuery, store);

    // Step 2: inject evidence into the agent prompt (not as a tool)
    const memoryContext = formatMemoriesForPrompt(memories);
    const evidence = formatEvidence(results);

    const res = await withRetry(() =>
        openai.chat.completions.create({
            model: "gpt-4.1-mini",
            max_tokens: 512,
            messages: [
                {
                    role: "system",
                    content: [
                        "You are an agentic assistant, but in this pipeline you must NOT call tools.",
                        "Use the provided Memory and Evidence to answer the user's question.",
                        "Answer ONLY using Evidence. If Evidence is insufficient, say you don't know.",
                        "Be concise.",
                        "",
                        memoryContext,
                    ].join("\n"),
                },
                {
                    role: "user",
                    content: [`Evidence:\n${evidence}`, "", `Question: ${query}`].join("\n"),
                },
            ],
        }),
    );

    const answer = res.choices[0]?.message?.content?.trim() || "No response generated.";

    // Step 3 (after answer): save to memory
    const next: MemoryEntry = {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        task: query,
        report: answer,
    };
    saveMemories([...memories, next]);

    return { query, rewrittenQuery, results, answer };
}

