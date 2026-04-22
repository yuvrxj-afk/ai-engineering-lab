import type { Chunk } from "../shared/types/chunk";
import { Pool } from "pg";
import { env } from "../shared/env";

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        magA += (a[i] ?? 0) ** 2;
        magB += (b[i] ?? 0) ** 2;
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom === 0) return 0;
    return dot / denom;
}

export interface VectorStore {
    add(chunk: Chunk): Promise<void>;
    addMany(chunks: Chunk[]): Promise<void>;
    deleteByDocId(docId: string): Promise<void>;
    search(queryVector: number[], topK?: number): Promise<Array<{ chunk: Chunk; score: number }>>;
    size(): Promise<number>;
    close?(): Promise<void>;
}

export class MemoryVectorStore implements VectorStore {
    private chunks: Chunk[] = [];

    async add(chunk: Chunk): Promise<void> {
        this.chunks.push(chunk);
    }

    async addMany(chunks: Chunk[]): Promise<void> {
        this.chunks.push(...chunks);
    }

    async deleteByDocId(docId: string): Promise<void> {
        this.chunks = this.chunks.filter((c) => c.docId !== docId);
    }

    async search(queryVector: number[], topK = 3): Promise<Array<{ chunk: Chunk; score: number }>> {
        return this.chunks
            .map((chunk) => ({
                chunk,
                score: cosineSimilarity(queryVector, chunk.vector),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    async size(): Promise<number> {
        return this.chunks.length;
    }
}

function toVectorLiteral(vector: number[]): string {
    // pgvector accepts a text format like: '[0.1,0.2,0.3]'
    return `[${vector.join(",")}]`;
}

export class PgVectorStore implements VectorStore {
    private ready: Promise<void>;

    constructor(private pool: Pool, private dim: number) {
        this.ready = this.ensureSchema();
    }

    private async ensureSchema(): Promise<void> {
        // Note: CREATE EXTENSION requires sufficient privileges; for local dev in docker it’s fine.
        // If users point at a managed Postgres without privileges, they'll need to pre-create it.
        await this.pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await this.pool.query(
            `CREATE TABLE IF NOT EXISTS rag_chunks (
                id TEXT PRIMARY KEY,
                doc_id TEXT NOT NULL,
                source TEXT NOT NULL,
                heading TEXT,
                content TEXT NOT NULL,
                embedding_text TEXT NOT NULL,
                tokens INT NOT NULL,
                chunk_index INT NOT NULL,
                total_chunks INT NOT NULL,
                start_char INT NOT NULL,
                end_char INT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL,
                embedding VECTOR(${this.dim}) NOT NULL
            )`,
        );
        await this.pool.query(`CREATE INDEX IF NOT EXISTS rag_chunks_doc_id_idx ON rag_chunks(doc_id)`);
        // Optional ANN index (kept simple): exact search is fine for small corpora.
    }

    async add(chunk: Chunk): Promise<void> {
        await this.addMany([chunk]);
    }

    async addMany(chunks: Chunk[]): Promise<void> {
        await this.ready;
        if (chunks.length === 0) return;

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            for (const c of chunks) {
                if (c.vector.length !== this.dim) {
                    throw new Error(
                        `Embedding dim mismatch for chunk ${c.id}: expected ${this.dim}, got ${c.vector.length}`,
                    );
                }
                await client.query(
                    `INSERT INTO rag_chunks (
                        id, doc_id, source, heading, content, embedding_text,
                        tokens, chunk_index, total_chunks, start_char, end_char, created_at, embedding
                    ) VALUES (
                        $1,$2,$3,$4,$5,$6,
                        $7,$8,$9,$10,$11,$12,$13::vector
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        doc_id = EXCLUDED.doc_id,
                        source = EXCLUDED.source,
                        heading = EXCLUDED.heading,
                        content = EXCLUDED.content,
                        embedding_text = EXCLUDED.embedding_text,
                        tokens = EXCLUDED.tokens,
                        chunk_index = EXCLUDED.chunk_index,
                        total_chunks = EXCLUDED.total_chunks,
                        start_char = EXCLUDED.start_char,
                        end_char = EXCLUDED.end_char,
                        created_at = EXCLUDED.created_at,
                        embedding = EXCLUDED.embedding`,
                    [
                        c.id,
                        c.docId,
                        c.source,
                        c.heading ?? null,
                        c.content,
                        c.embeddingText,
                        c.tokens,
                        c.chunkIndex,
                        c.totalChunks,
                        c.startChar,
                        c.endChar,
                        c.createdAt,
                        toVectorLiteral(c.vector),
                    ],
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    }

    async deleteByDocId(docId: string): Promise<void> {
        await this.ready;
        await this.pool.query(`DELETE FROM rag_chunks WHERE doc_id = $1`, [docId]);
    }

    async search(queryVector: number[], topK = 3): Promise<Array<{ chunk: Chunk; score: number }>> {
        await this.ready;
        if (queryVector.length !== this.dim) {
            throw new Error(`Query embedding dim mismatch: expected ${this.dim}, got ${queryVector.length}`);
        }

        type SearchRow = {
            id: string;
            doc_id: string;
            source: string;
            heading: string | null;
            content: string;
            embedding_text: string;
            tokens: number;
            chunk_index: number;
            total_chunks: number;
            start_char: number;
            end_char: number;
            created_at: Date | string;
            score: number | string;
        };

        const res = await this.pool.query<SearchRow>(
            `SELECT
                id, doc_id, source, heading, content, embedding_text,
                tokens, chunk_index, total_chunks, start_char, end_char, created_at,
                (1 - (embedding <=> $1::vector)) AS score
             FROM rag_chunks
             ORDER BY embedding <=> $1::vector
             LIMIT $2`,
            [toVectorLiteral(queryVector), topK],
        );

        return res.rows.map((r) => ({
            score: Number(r.score),
            chunk: {
                id: r.id,
                docId: r.doc_id,
                source: r.source,
                ...(r.heading ? { heading: r.heading } : {}),
                content: r.content,
                embeddingText: r.embedding_text,
                tokens: r.tokens,
                chunkIndex: r.chunk_index,
                totalChunks: r.total_chunks,
                startChar: r.start_char,
                endChar: r.end_char,
                createdAt: new Date(r.created_at).toISOString(),
                // Vector isn't needed for downstream; keep empty to reduce bandwidth.
                vector: [] as number[],
            },
        }));
    }

    async size(): Promise<number> {
        await this.ready;
        const res = await this.pool.query(`SELECT COUNT(*)::int AS n FROM rag_chunks`);
        return res.rows[0]?.n ?? 0;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export async function createVectorStore(): Promise<VectorStore> {
    if (env.RAG_VECTOR_BACKEND === "memory") return new MemoryVectorStore();
    const url = env.DATABASE_URL;
    if (!url) {
        throw new Error(`DATABASE_URL is required when RAG_VECTOR_BACKEND=pgvector`);
    }
    const pool = new Pool({ connectionString: url });
    return new PgVectorStore(pool, env.RAG_EMBED_DIM);
}
