// query/schema.ts
// Why: rewriter returns a string from LLM
// You need to ensure it's a real question, not an essay, not empty
// This is the bug you just fixed — rewriter returned a full answer
// Zod won't fix bad LLM output but it catches it explicitly

import { z } from "zod";

export const RewrittenQuerySchema = z.string()
    .min(10, "Rewritten query too short")
    .max(300, "Rewritten query too long — likely returned an answer, not a question")
    .refine(
        (q) => !q.includes("\n"),
        "Rewritten query must be a single line — got multi-line response"
    );