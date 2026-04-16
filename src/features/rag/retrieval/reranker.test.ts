import test from "node:test";
import assert from "node:assert/strict";
import type { Chunk } from "../shared/types/chunk";
import { normalizeChunkId, resolveRankedIds } from "./reranker";
import type { RetrievalResult } from "./retriever";

function mkChunk(id: string, content: string): Chunk {
    return {
        id,
        docId: id,
        content,
        embeddingText: content,
        tokens: 1,
        chunkIndex: 0,
        totalChunks: 1,
        startChar: 0,
        endChar: content.length,
        source: "test",
        createdAt: new Date().toISOString(),
        vector: [],
    };
}

test("resolveRankedIds handles stripped and spaced chunk IDs", () => {
    const candidates: RetrievalResult[] = [
        {
            chunk: mkChunk("defi-gas::0", "gas fees on ethereum"),
            text: "gas fees on ethereum",
            score: 0.2,
            semanticScore: 0.2,
            keywordScore: 0.2,
        },
        {
            chunk: mkChunk("defi-uniswap::0", "random unrelated sentence"),
            text: "random unrelated sentence",
            score: 0.9,
            semanticScore: 0.9,
            keywordScore: 0,
        },
    ];

    const resolved = resolveRankedIds(
        ["defi-uniswap", "defi-gas :: 0"],
        candidates,
    );

    assert.equal(resolved[0]?.chunk.id, "defi-uniswap::0");
    assert.equal(resolved[1]?.chunk.id, "defi-gas::0");
});

test("normalizeChunkId removes spacing around separator", () => {
    assert.equal(normalizeChunkId("defi-gas :: 0"), "defi-gas::0");
});
