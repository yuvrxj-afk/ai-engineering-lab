import type { Chunk } from "../shared/types/chunk";
import type { CorpusDoc } from "../shared/embeddingClient";
import { embedBatch } from "../shared/embeddingClient";
import type { VectorStore } from "../retrieval/vectorStore";
import { RecursiveChunker } from "./chunker";

const BATCH_SIZE = 100;

export class DocumentIngester {
    private chunker = new RecursiveChunker();

    constructor(private store: VectorStore) {}

    async ingest(
        doc: CorpusDoc,
        opts: { maxTokens?: number; overlap?: number } = {},
    ): Promise<void> {
        const { maxTokens = 300, overlap = 50 } = opts;
        const cleaned = this.preprocess(doc.text);
        const chunkOptions = {
            maxTokens,
            overlap,
            docId: doc.id,
            source: doc.source,
            ...(doc.heading !== undefined ? { heading: doc.heading } : {}),
        };

        const chunks = this.chunker.chunk(cleaned, chunkOptions);
        await this.store.deleteByDocId(doc.id);

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            const texts = batch.map((c) => c.embeddingText);
            const vectors = await embedBatch(texts);

            const finalChunks: Chunk[] = batch.map((chunk, j) => ({
                ...chunk,
                vector: vectors[j] ?? [],
            }));
            await this.store.addMany(finalChunks);
        }
    }

    async ingestAll(
        docs: CorpusDoc[],
        opts: { maxTokens?: number; overlap?: number } = {},
    ): Promise<void> {
        for (const doc of docs) {
            await this.ingest(doc, opts);
        }
        console.log(`Ingested ${await this.store.size()} chunks from ${docs.length} documents`);
    }

    private preprocess(text: string): string {
        return text
            .replace(/\r\n/g, "\n")
            .replace(/\t/g, " ")
            .replace(/[ ]{3,}/g, "  ")
            .replace(/\n{4,}/g, "\n\n\n")
            .trim();
    }
}
