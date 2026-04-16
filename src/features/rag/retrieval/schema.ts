// retrieval/schema.ts  
// Why: reranker does JSON.parse on LLM output
// You already have try/catch — Zod replaces that with explicit shape validation

import { z } from "zod";

export const RankedIdsSchema = z.array(z.string().min(1))
    .min(0)   // empty array is valid — means nothing relevant
    .max(20); // sanity ceiling