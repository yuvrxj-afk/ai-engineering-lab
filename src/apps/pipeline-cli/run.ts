import "../../features/rag/shared/env";
import { runPipeline } from "../../features/rag/pipeline";

async function main(): Promise<void> {
    const query = process.argv.slice(2).join(" ").trim();
    if (!query) {
        console.error('Usage: npm run pipeline:run -- "your question here"');
        process.exitCode = 1;
        return;
    }

    const { rewrittenQuery, results, answer } = await runPipeline(query);

    console.log(`Query: ${query}`);
    if (rewrittenQuery !== query) {
        console.log(`Rewritten: ${rewrittenQuery}`);
    }

    console.log("\nRetrieved evidence:");
    for (const r of results) {
        const heading = r.chunk.heading ? `[${r.chunk.heading}] ` : "";
        console.log(
            `  hybrid=${r.score.toFixed(3)} sem=${r.semanticScore.toFixed(3)} kw=${r.keywordScore.toFixed(3)} ` +
                `${heading}${r.text}`,
        );
    }

    console.log(`\nAnswer:\n${answer}\n`);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
