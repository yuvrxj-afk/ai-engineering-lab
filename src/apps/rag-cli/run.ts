import OpenAI from "openai";
import "../../features/rag/shared/env";
import { answer } from "../../features/rag/generation";
import { DocumentIngester } from "../../features/rag/ingestion";
import { rewriteQuery } from "../../features/rag/query";
import { createVectorStore, retrieve } from "../../features/rag/retrieval";
import { CORPUS } from "../../features/rag/eval";

async function run(): Promise<void> {
    const openai = new OpenAI();
    const store = await createVectorStore();
    const ingester = new DocumentIngester(store);

    try {
        await ingester.ingestAll(CORPUS);

        const queries = [
            "how do decentralized token swaps work?",
            "what are the costs of sending a transaction?",
            "tall landmark in France",
        ];

        for (const query of queries) {
            const rewrittenQuery = await rewriteQuery(query, openai);
            const results = await retrieve(rewrittenQuery, store);
            await answer(query, results);

            console.log(`Query: "${query}"`);
            if (rewrittenQuery !== query) {
                console.log(`Rewritten: "${rewrittenQuery}"`);
            }
            for (const r of results) {
                const heading = r.chunk.heading ? `[${r.chunk.heading}]` : "";
                console.log(
                    `  hybrid=${r.score.toFixed(3)}  sem=${r.semanticScore.toFixed(3)}  kw=${r.keywordScore.toFixed(3)}  ${heading} ${r.text}`,
                );
            }
            console.log();
        }
    } finally {
        await store.close?.();
    }
}

run().catch(console.error);
