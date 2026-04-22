import OpenAI from "openai";
import { z } from "zod";
import { RetrievalResult } from "./retriever";
import { withRetry } from "../shared/retry";

const RankedIdsSchema = z.array(z.string());

export function normalizeChunkId(id: string): string {
    return id.replace(/\s*::\s*/g, "::").trim();
}

function resolveRankedId(
    id: string,
    candidates: RetrievalResult[],
    exactMap: Map<string, RetrievalResult>,
    normalizedMap: Map<string, RetrievalResult>,
): RetrievalResult | undefined {
    const exact = exactMap.get(id);
    if (exact) return exact;

    const normalized = normalizeChunkId(id);
    const normalizedExact = normalizedMap.get(normalized);
    if (normalizedExact) return normalizedExact;

    // Model sometimes strips chunk index suffix (e.g. "doc-1" vs "doc-1::0").
    const byBase = candidates.find((r) => normalizeChunkId(r.chunk.id).startsWith(`${normalized}::`));
    if (byBase) return byBase;

    return undefined;
}

function parseRankedIds(raw: string): string[] | null {
    try {
        const parsed = JSON.parse(raw);
        const result = RankedIdsSchema.safeParse(parsed);
        if (!result.success) return null;
        return result.data;
    } catch {
        return null;
    }
}

export function resolveRankedIds(
    rankedIds: string[],
    candidates: RetrievalResult[],
): RetrievalResult[] {
    const idToResult = new Map(candidates.map((r) => [r.chunk.id, r]));
    const normalizedIdToResult = new Map(
        candidates.map((r) => [normalizeChunkId(r.chunk.id), r]),
    );

    const resolved = rankedIds
        .map((id) => resolveRankedId(id, candidates, idToResult, normalizedIdToResult))
        .filter((r): r is RetrievalResult => r !== undefined);

    return resolved;
}


export async function rerank(
    query: string,
    candidates: RetrievalResult[],
    topK: number = 3,
): Promise<RetrievalResult[]> {
    if (candidates.length === 0) return [];
    // Lazily construct client so importing this module doesn't require OPENAI_API_KEY
    const openai = new OpenAI();

    const candidateList = candidates
        .map((r, i) => `[${i}] chunk_id="${r.chunk.id}"\n${r.text}`)
        .join("\n\n");

    const res = await withRetry(() =>
        openai.chat.completions.create({
            model: "gpt-4.1-mini",
            max_tokens: 200,
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a relevance judge. " +
                        "Given a query and candidate text chunks, " +
                        "return ONLY a JSON array of chunk_id values that answer the query. " +
                        "Most relevant first. Exclude chunks that do not answer the query. " +
                        "Return chunk_id values exactly as quoted. No extra text.",
                },
                {
                    role: "user",
                    content: `Query: ${query}\n\nCandidates:\n${candidateList}`,
                },
            ],
        }),
    )

    const raw = res.choices[0]?.message.content?.trim() ?? "[]"


    const rankedIds = parseRankedIds(raw);
    if (!rankedIds) {
        console.warn("Reranker parse failed, falling back to hybrid order:", raw);
        return candidates.slice(0, topK);
    }

    const idToResult = new Map(candidates.map((r) => [r.chunk.id, r]));
    const normalizedIdToResult = new Map(
        candidates.map((r) => [normalizeChunkId(r.chunk.id), r]),
    );
    let exactMatches = 0;
    let recoveredMatches = 0;

    const reranked = rankedIds
        .map((id) => {
            const exact = idToResult.get(id);
            if (exact) {
                exactMatches += 1;
                return exact;
            }
            const recovered = resolveRankedId(id, candidates, idToResult, normalizedIdToResult);
            if (recovered) recoveredMatches += 1;
            return recovered;
        })
        .filter((r): r is RetrievalResult => r !== undefined);

    // Fallback: if LLM returned no valid IDs, use original order
    if (reranked.length === 0) {
        return candidates.slice(0, 1);
    }
    if (recoveredMatches > 0) {
        console.warn(
            `Reranker recovered ${recoveredMatches} IDs via normalization/fallback (${exactMatches} exact)`,
        );
    }

    return reranked.slice(0, topK);
}
