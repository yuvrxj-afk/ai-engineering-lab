import OpenAI from "openai";
import "./env";
import { withRetry } from "./retry";

const openai = new OpenAI();

export interface CorpusDoc {
    id: string;
    source: string;
    heading?: string;
    text: string;
}

export async function embed(text: string): Promise<number[]> {
    const res = await withRetry(() =>
        openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        }),
    );
    const vector = res.data[0]?.embedding;
    if (!vector) throw new Error(`No embedding returned for: "${text}"`);
    return vector;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const res = await withRetry(() =>
        openai.embeddings.create({
            model: "text-embedding-3-small",
            input: texts,
        }),
    );
    return res.data.map((d) => d.embedding);
}
