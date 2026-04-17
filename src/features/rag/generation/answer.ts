import OpenAI from "openai";
import type { RetrievalResult } from "../retrieval/retriever";
import "../shared/env";
import { withRetry } from "../shared/retry";

const openai = new OpenAI();

export interface AnswerConfig {
    model: string;
    noAnswerThreshold: number;
    maxTokens: number;
}

const DEFAULT_ANSWER_CONFIG: AnswerConfig = {
    model: "gpt-4.1-mini",
    noAnswerThreshold: 0.2,
    maxTokens: 512,
};

export async function generateAnswer(
    query: string,
    results: RetrievalResult[],
    config: Partial<AnswerConfig> = {},
): Promise<string> {
    const cfg = { ...DEFAULT_ANSWER_CONFIG, ...config };
    if (!results.length || results[0]!.score < cfg.noAnswerThreshold) {
        return "I don't know!";
    }

    const context = results
        .map((r) => {
            const heading = r.chunk.heading ? `[${r.chunk.heading}]` : "";
            return heading ? `${heading} ${r.text}` : r.text;
        })
        .join("\n");

    const res = await withRetry(() =>
        openai.chat.completions.create({
            model: cfg.model,
            max_tokens: cfg.maxTokens,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a precise assistant. Answer only using the provided context. " +
                        "If the context does not contain enough information, say so explicitly. " +
                        "Be concise.",
                },
                {
                    role: "user",
                    content: `Context:\n${context}\n\nQuestion: ${query}`,
                },
            ],
        }),
    );

    return res.choices[0]?.message?.content ?? "No response generated.";
}

export async function answer(
    query: string,
    results: RetrievalResult[],
    config: Partial<AnswerConfig> = {},
): Promise<void> {
    const output = await generateAnswer(query, results, config);
    console.log(`Answer: ${output}\n`);
}
