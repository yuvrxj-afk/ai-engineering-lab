# 5. RAG and Retrieval Tuning

Build the full retrieve → filter → generate pipeline. Iterate on chunk size, overlap, top-k, and query rewriting. Poor results almost always trace to chunking or embedding choice — not the model.

## Document Preprocessing

Before you chunk, you need clean data. **Document preprocessing** is where most RAG pipelines quietly fail:

- **PDFs**: use `unstructured`, `PyMuPDF`, or `pdfplumber` — not every PDF parser handles tables and headers
- **HTML**: strip navigation and boilerplate; keep semantic structure
- **Tables**: flatten to text or extract as structured data — embeddings don't understand grid layouts
- **Code**: chunk by function/class, not by token count

## Production Essentials

Three things that matter in production but rarely appear in tutorials:

- **Reranking** — retrieve more candidates than needed, then use a cross-encoder or LLM to reorder before passing to the model. Significantly improves precision.
- **No-answer handling** — when nothing relevant is retrieved, the model will fabricate. Detect low retrieval confidence and return "I don't know" explicitly.
- **Stale data** — know how you'll re-index when documents change. A static corpus is fine for learning; it breaks in prod.

## Advanced Patterns

- **Graph RAG** — combine vector retrieval with knowledge graphs. Entities and relationships give the model structural context that flat chunks miss. See Microsoft's GraphRAG.
- **Agentic RAG** — the agent decides *when* and *what* to retrieve instead of always-retrieve. Reduces noise and cost on queries that don't need context.
- **RAG vs. fine-tuning** — RAG for facts that change, fine-tuning for behaviour that doesn't. Most teams need RAG; fewer need fine-tuning. Know the tradeoff before reaching for either.

## Frameworks

[LangChain](https://python.langchain.com/docs/tutorials/rag/) and [LlamaIndex](https://docs.llamaindex.ai/en/stable/) are the dominant RAG frameworks. [Haystack](https://haystack.deepset.ai/) and [RAGFlow](https://ragflow.io/) are alternatives. Learn to build RAG from scratch first, then evaluate whether a framework saves you time or hides problems.

## Resources

[Pinecone semantic search](https://www.pinecone.io/learn/series/nlp/semantic-search/) · [LlamaIndex RAG guide](https://docs.llamaindex.ai/en/stable/) · [Anthropic contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) · [Microsoft GraphRAG](https://github.com/microsoft/graphrag)
