import type { Chunk } from "../shared/types/chunk";

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        magA += (a[i] ?? 0) ** 2;
        magB += (b[i] ?? 0) ** 2;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom === 0) return 0;
    return dot / denom;
}

export class VectorStore {
    private chunks: Chunk[] = [];

    add(chunk: Chunk): void {
        this.chunks.push(chunk);
    }

    addMany(chunks: Chunk[]): void {
        this.chunks.push(...chunks);
    }

    deleteByDocId(docId: string): void {
        this.chunks = this.chunks.filter((c) => c.docId !== docId);
    }

    search(queryVector: number[], topK = 3): Array<{ chunk: Chunk; score: number }> {
        return this.chunks
            .map((chunk) => ({
                chunk,
                score: cosineSimilarity(queryVector, chunk.vector),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    size(): number {
        return this.chunks.length;
    }
}
