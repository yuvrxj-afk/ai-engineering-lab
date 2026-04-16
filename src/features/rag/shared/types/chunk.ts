export interface Chunk {
    id: string;
    docId: string;

    content: string;
    embeddingText: string;
    tokens: number;

    chunkIndex: number;
    totalChunks: number;
    startChar: number;
    endChar: number;

    heading?: string;
    section?: string;

    source: string;
    createdAt: string;

    vector: number[];
}
