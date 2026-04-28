# 8. Memory

Persist exchanges and retrieve relevant ones on each new turn. Inject above retrieved chunks, below the system prompt. Unbounded history increases noise — retrieval must be selective.

!!! warning "Memory is retrieval"
    Treat memory like retrieval: if you wouldn't blindly pass all documents to the model, don't blindly pass all prior turns either. A wrong or low-quality exchange stored as memory will contaminate future turns.

## Memory Types

| Type | What it is | Storage |
|------|-----------|---------|
| **Working memory** | The current conversation's context window | Finite and expensive |
| **Episodic memory** | Stored past conversations, retrieved by relevance | This is what you build in this module |
| **Semantic memory** | Long-term facts about the user or domain | Often a simple key-value store, not vector search |

## Multi-Turn UX

Summarise older turns rather than dropping them. A good conversation summary preserves decisions and facts while discarding filler. Context window management is a design problem, not just an engineering one.

## Resources

[Anthropic memory patterns](https://docs.anthropic.com/en/docs/build-with-claude/memory) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/)
