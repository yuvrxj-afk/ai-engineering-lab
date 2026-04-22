import OpenAI from "openai";
import "../../features/rag/shared/env";
import { GOLDEN_SET, CORPUS } from "../../features/rag/eval";
import { GroundednessJudgementSchema } from "../../features/rag/eval/schema";
import { generateAnswer } from "../../features/rag/generation";
import { DocumentIngester } from "../../features/rag/ingestion";
import { rewriteQuery } from "../../features/rag/query";
import { createVectorStore, retrieve } from "../../features/rag/retrieval";
import { withRetry } from "../../features/rag/shared/retry";
import { z } from "zod";
function precisionAtK(results: string[], relevant: Set<string>, k: number): number {
    const top = results.slice(0, k);
    if (top.length === 0) return 0;
    const hits = top.filter((id) => relevant.has(id)).length;
    return hits / top.length;
}

function recallAtK(results: string[], relevant: Set<string>, k: number): number {
    if (relevant.size === 0) return 1;
    const hits = results.slice(0, k).filter((id) => relevant.has(id)).length;
    return hits / relevant.size;
}

function thresholdFromEnv(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

async function judgeGroundedness(
    chunks: string[],
    answer: string,
    judgeClient: OpenAI,
): Promise<z.infer<typeof GroundednessJudgementSchema>> {
    const res = await withRetry(() =>
        judgeClient.chat.completions.create({
            model: "gpt-4.1-nano",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content:
                        "You judge whether an answer is fully grounded in the provided chunks. " +
                        "Return JSON only with keys grounded:boolean and ungrounded_claims:string[]. " +
                        "Mark grounded=false if any material claim is unsupported by the chunks.",
                },
                {
                    role: "user",
                    content: [
                        "Chunks:",
                        ...chunks.map((chunk, index) => `Chunk ${index + 1}: ${chunk}`),
                        "",
                        `Answer: ${answer}`,
                        "",
                        "Respond with JSON only.",
                    ].join("\n"),
                },
            ],
        }),
    );

    const content = res.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    return GroundednessJudgementSchema.parse(parsed);
}

async function runEval(): Promise<void> {
    const openai = new OpenAI();
    const judgeClient = new OpenAI();
    const store = await createVectorStore();
    const ingester = new DocumentIngester(store);
    try {
        await ingester.ingestAll(CORPUS);

        let sumP3 = 0;
        let sumR3 = 0;
        let groundedCount = 0;

        for (const testCase of GOLDEN_SET) {
            const rewritten = await rewriteQuery(testCase.query, openai);
            const results = await retrieve(rewritten, store, { topK: 3 });
            const answer = await generateAnswer(testCase.query, results);
            const chunks = results.map((r) => r.text);
            const groundedness = await judgeGroundedness(chunks, answer, judgeClient);
            const retrievedDocIds = results.map((r) => r.chunk.docId);
            const relevant = new Set(testCase.relevantDocIds);

            const p3 = precisionAtK(retrievedDocIds, relevant, 3);
            const r3 = recallAtK(retrievedDocIds, relevant, 3);
            sumP3 += p3;
            sumR3 += r3;
            if (groundedness.grounded) groundedCount += 1;

            console.log(`[${testCase.id}]`);
            console.log(`  query: ${testCase.query}`);
            if (rewritten !== testCase.query) console.log(`  rewritten: ${rewritten}`);
            console.log(`  retrieved: ${retrievedDocIds.join(", ")}`);
            console.log(`  answer: ${answer}`);
            console.log(`  P@3=${p3.toFixed(3)}  R@3=${r3.toFixed(3)}`);
            console.log(`  grounded=${groundedness.grounded}`);
            if (groundedness.ungrounded_claims.length > 0) {
                console.log(`  ungrounded_claims: ${groundedness.ungrounded_claims.join(" | ")}`);
            }
        }

        const n = GOLDEN_SET.length || 1;
        const avgP3 = sumP3 / n;
        const avgR3 = sumR3 / n;
        const groundedRate = groundedCount / n;
        console.log("\nAggregate:");
        console.log(`  Avg P@3=${avgP3.toFixed(3)}`);
        console.log(`  Avg R@3=${avgR3.toFixed(3)}`);
        console.log(`  Grounded rate=${groundedRate.toFixed(3)}`);

        const minP3 = thresholdFromEnv("RAG_MIN_P3", 0.2);
        const minR3 = thresholdFromEnv("RAG_MIN_R3", 0.6);

        if (avgP3 < minP3 || avgR3 < minR3) {
            console.error(
                `Eval failed thresholds: AvgP3=${avgP3.toFixed(3)} (min ${minP3}), AvgR3=${avgR3.toFixed(3)} (min ${minR3})`,
            );
            process.exit(1);
        }
    } finally {
        await store.close?.();
    }
}

runEval().catch((err) => {
    console.error(err);
    process.exit(1);
});
