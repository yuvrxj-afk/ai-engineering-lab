# 4. Embeddings, Storage, and Search

Embed sentences, store in a vector DB, and query by meaning. Implement `search(query)` over a small corpus — results should rank by semantic similarity, not keyword overlap.

## Embedding Providers

Pick an embedding provider — they're not interchangeable. OpenAI `text-embedding-3-small` is the default. Cohere Embed v3 handles multilingual well. Jina and Voyage offer specialised models. For open-source: Sentence Transformers (all-MiniLM-L6-v2 for speed, BGE/GTE for quality) run locally with no API cost. Try at least two — embedding quality is the single biggest lever in retrieval.

## Vector Databases

Pick a vector DB. Start with one:

| Database | Best for |
|----------|----------|
| **pgvector** | Already have Postgres — add a column. Zero new infrastructure. |
| **Chroma** | Embeds in-process, good for prototypes |
| **FAISS** | Meta's library, fastest local similarity search |
| **Pinecone / Weaviate / Qdrant** | Managed services with filtering and metadata |
| **LanceDB** | Embedded, columnar, good for multimodal |
| **Supabase / MongoDB Atlas** | Vector search added to databases you may already use |

## Hybrid Search

Pure semantic search often fails on short queries and proper nouns. Hybrid search (dense vectors + BM25 keyword scoring) is the production standard. Know it exists even if you start semantic-only.

## Resources

[OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) · [Cohere Embed](https://docs.cohere.com/docs/embeddings) · [Sentence Transformers](https://www.sbert.net/) · [Jina Embeddings](https://jina.ai/embeddings/) · [pgvector](https://github.com/pgvector/pgvector) · [Chroma](https://docs.trychroma.com/) · [FAISS](https://github.com/facebookresearch/faiss) · [Pinecone](https://docs.pinecone.io/) · [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)
