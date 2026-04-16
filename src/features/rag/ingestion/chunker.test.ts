import test from "node:test";
import assert from "node:assert/strict";
import { RecursiveChunker } from "./chunker";

test("chunker produces multiple chunks with overlap metadata", () => {
    const chunker = new RecursiveChunker();
    const text = Array.from({ length: 80 }, (_, i) => `token${i}`).join(" ");

    const chunks = chunker.chunk(text, {
        maxTokens: 20,
        overlap: 5,
        docId: "doc-1",
        source: "test.txt",
        heading: "Heading",
    });

    assert.ok(chunks.length > 1);
    assert.equal(chunks[0]?.totalChunks, chunks.length);
    assert.equal(chunks[chunks.length - 1]?.chunkIndex, chunks.length - 1);
});
