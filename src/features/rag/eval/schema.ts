// eval/schema.ts
// Why: golden.ts is data you wrote, but schema documents the contract
// and catches mistakes when you add new entries

import { z } from "zod";

export const GoldenQuerySchema = z.object({
    id: z.string().min(1),
    query: z.string().min(5),
    expectedDocIds: z.array(z.string()),
});

export const CorpusDocSchema = z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    heading: z.string().optional(),
    text: z.string().min(1),
});

export const GroundednessJudgementSchema = z.object({
    grounded: z.boolean(),
    ungrounded_claims: z.array(z.string()),
});

export const GoldenSetSchema = z.array(GoldenQuerySchema);
export const CorpusSchema = z.array(CorpusDocSchema);