import type { Chunk } from "../shared/types/chunk";
import { embed } from "../shared/embeddingClient";
import { rerank } from "./reranker";
import { VectorStore } from "./vectorStore";

const STOPWORDS = new Set([
    "the", "is", "in", "on", "at", "of", "a", "an", "and", "to", "for",
    "how", "do", "what", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "does", "did", "will", "would", "could", "should",
    "i", "me", "my", "we", "you", "it", "its", "this", "that", "these", "those",
    "with", "from", "by", "as", "or", "but", "not", "so", "if", "then",
]);

export interface RetrievalConfig {
    semanticWeight: number;
    keywordWeight: number;
    topK: number;
    candidateK: number;
    minScore: number;
}

export const DEFAULT_CONFIG: RetrievalConfig = {
    semanticWeight: 0.7,
    keywordWeight: 0.3,
    topK: 3,
    candidateK: 10,
    minScore: 0.1,
};

export interface RetrievalResult {
    chunk: Chunk;
    text: string;
    score: number;
    semanticScore: number;
    keywordScore: number;
}

export function computeKeywordScore(query: string, text: string): number {
    const queryTerms = query
        .toLowerCase()
        .split(/\s+/)
        .map((term) => term.replace(/[^a-z0-9]/g, ""))
        .filter((term) => term && !STOPWORDS.has(term));
    if (queryTerms.length === 0) return 0;

    const docTerms = new Set(
        text
            .toLowerCase()
            .split(/\s+/)
            .map((term) => term.replace(/[^a-z0-9]/g, ""))
            .filter(Boolean),
    );

    const matches = queryTerms.filter((term) => docTerms.has(term));
    return matches.length / queryTerms.length;
}

export async function retrieve(
    query: string,
    store: VectorStore,
    config: Partial<RetrievalConfig> = {},
): Promise<RetrievalResult[]> {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const queryVector = await embed(query);
    const candidates = store.search(queryVector, cfg.candidateK);

    const scored = candidates
        .map(({ chunk, score: semanticScore }) => {
            const kw = computeKeywordScore(query, chunk.content);
            const hybrid = semanticScore * cfg.semanticWeight + kw * cfg.keywordWeight;

            return {
                chunk,
                text: chunk.content,
                score: hybrid,
                semanticScore,
                keywordScore: kw,
            };
        })
        .filter((r) => r.score >= cfg.minScore)
        .sort((a, b) => b.score - a.score);

    return await rerank(query, scored, cfg.topK);
}
