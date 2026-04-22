// shared/configSchema.ts
// Why: process.env is Record<string, string | undefined> at runtime
// If OPENAI_API_KEY is missing, you want a clear error at startup
// not a cryptic "Cannot read property of undefined" mid-pipeline

import { z } from "zod";

export const EnvSchema = z.object({
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    // Vector store / DB
    RAG_VECTOR_BACKEND: z.enum(["memory", "pgvector"]).default("memory"),
    DATABASE_URL: z.string().min(1).optional(),
    // text-embedding-3-small is 1536-dim today; keep configurable for experiments.
    RAG_EMBED_DIM: z.coerce.number().int().positive().default(1536),
    RAG_MIN_P3: z.coerce.number().min(0).max(1).default(0.5),
    RAG_MIN_R3: z.coerce.number().min(0).max(1).default(0.5),
});

export type Env = z.infer<typeof EnvSchema>;

// Call this once in env.ts — fails fast at startup if config is wrong
export function validateEnv() {
    return EnvSchema.parse(process.env);
}