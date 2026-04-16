import type { Chunk } from "../shared/types/chunk";
import { countTokens } from "../shared/tokenizer";

export interface ChunkingOptions {
    maxTokens: number;
    overlap: number;
    docId: string;
    source: string;
    heading?: string;
}

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export class RecursiveChunker {
    chunk(text: string, options: ChunkingOptions): Chunk[] {
        const raw = this.splitRecursive(text.trim(), options, 0);
        let charOffset = 0;

        const chunks: Chunk[] = raw.map((content: string, index: number) => {
            const startChar = text.indexOf(content, charOffset);
            charOffset = Math.max(charOffset, startChar + content.length);
            const embeddingText = options.heading
                ? `${options.heading}\n\n${content}`
                : content;

            return {
                id: `${options.docId}::${index}`,
                docId: options.docId,
                content,
                embeddingText,
                tokens: countTokens(content),
                chunkIndex: index,
                totalChunks: 0,
                startChar: startChar === -1 ? charOffset : startChar,
                endChar: startChar === -1 ? charOffset : startChar + content.length,
                ...(options.heading !== undefined ? { heading: options.heading } : {}),
                source: options.source,
                createdAt: new Date().toISOString(),
                vector: [],
            };
        });

        chunks.forEach((c) => {
            c.totalChunks = chunks.length;
        });
        return chunks;
    }

    private splitRecursive(text: string, options: ChunkingOptions, sepIndex: number): string[] {
        if (countTokens(text) <= options.maxTokens) return text.trim() ? [text.trim()] : [];

        const sep = SEPARATORS[sepIndex];
        if (sep === undefined || sep === "") {
            return this.hardSplit(text, options.maxTokens, options.overlap);
        }

        const parts = text.split(sep).filter((p) => p.trim().length > 0);
        if (parts.length === 1) return this.splitRecursive(text, options, sepIndex + 1);

        const results: string[] = [];
        let current = "";

        for (const part of parts) {
            const candidate = current ? `${current}${sep}${part}` : part;
            if (countTokens(candidate) <= options.maxTokens) {
                current = candidate;
            } else if (current) {
                if (countTokens(current) > options.maxTokens) {
                    results.push(...this.splitRecursive(current, options, sepIndex + 1));
                } else {
                    results.push(current.trim());
                }

                const overlapText = this.getOverlapTail(current, options.overlap);
                current = overlapText ? `${overlapText}${sep}${part}` : part;
            } else {
                results.push(...this.splitRecursive(part, options, sepIndex + 1));
            }
        }

        if (current.trim()) results.push(current.trim());
        return results.filter(Boolean);
    }

    private hardSplit(text: string, maxTokens: number, overlap: number): string[] {
        const words = text.split(" ");
        const chunks: string[] = [];
        let current: string[] = [];
        let tokenCount = 0;

        for (const word of words) {
            const wt = countTokens(`${word} `);
            if (tokenCount + wt > maxTokens && current.length > 0) {
                chunks.push(current.join(" "));
                const tail = this.getOverlapWords(current, overlap);
                current = [...tail, word];
                tokenCount = countTokens(current.join(" "));
            } else {
                current.push(word);
                tokenCount += wt;
            }
        }

        if (current.length) chunks.push(current.join(" "));
        return chunks;
    }

    private getOverlapTail(text: string, overlapTokens: number): string {
        return this.getOverlapWords(text.split(" "), overlapTokens).join(" ");
    }

    private getOverlapWords(words: string[], overlapTokens: number): string[] {
        const result: string[] = [];
        let tokens = 0;
        for (let i = words.length - 1; i >= 0; i--) {
            tokens += countTokens(`${words[i]!} `);
            if (tokens > overlapTokens) break;
            result.unshift(words[i]!);
        }
        return result;
    }
}
