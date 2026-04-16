import test from "node:test";
import assert from "node:assert/strict";
import { computeKeywordScore } from "./retriever";

test("keyword score uses token overlap, not substring overlap", () => {
    const query = "gas fees";
    const text = "Vegas tourism has no fee mention";
    const score = computeKeywordScore(query, text);
    assert.equal(score, 0);
});

test("keyword score rewards exact token matches", () => {
    const query = "gas fees";
    const text = "Gas fees on Ethereum are variable";
    const score = computeKeywordScore(query, text);
    assert.equal(score, 1);
});
