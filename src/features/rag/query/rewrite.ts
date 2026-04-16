import OpenAI from "openai";
import "../shared/env";
import { RewrittenQuerySchema } from "./schema";

export async function rewriteQuery(query: string, openai: OpenAI): Promise<string> {
    try {
        const res = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            max_tokens: 100,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a query rewriting assistant. " +
                        "Rewrite the user's question to be more specific and retrieval-friendly. " +
                        "Return ONLY the rewritten question as a single sentence. " +
                        "Do not answer the question. Do not add explanations. " +
                        "Do not assume specific technologies or platforms " +
                        "unless explicitly mentioned in the original query.",
                },
                { role: "user", content: query },
            ],
        });



        const raw = res.choices[0]?.message?.content?.trim() ?? "";

        const result = RewrittenQuerySchema.safeParse(raw);
        if (!result.success) {
            console.warn("Rewrite validation failed:", result.error.issues[0]?.message);
            return query; // fallback to original
        }
        return result.data;
    } catch {
        return query;
    }
}
