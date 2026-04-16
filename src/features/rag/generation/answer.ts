import OpenAI from "openai";
import type { RetrievalResult } from "../retrieval/retriever";
import "../shared/env";

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

export async function answer(
    query: string,
    results: RetrievalResult[],
    config: Partial<AnswerConfig> = {},
): Promise<void> {
    const cfg = { ...DEFAULT_ANSWER_CONFIG, ...config };
    if (!results.length || results[0]!.score < cfg.noAnswerThreshold) {
        console.log("Answer: I don't know!");
        return;
    }

    const context = results
        .map((r) => {
            const heading = r.chunk.heading ? `[${r.chunk.heading}]` : "";
            return heading ? `${heading} ${r.text}` : r.text;
        })
        .join("\n");

    const res = await openai.chat.completions.create({
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
    });

    const output = res.choices[0]?.message?.content ?? "No response generated.";
    console.log(`Answer: ${output}\n`);
}
