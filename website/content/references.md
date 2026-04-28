# Production References

Real systems and frameworks worth studying once the capstone is done.

## Real Systems

| System | What to look for |
|--------|-----------------|
| [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | Orchestrator–subagent patterns, task decomposition, handoffs |
| [LinkedIn RAG at Scale](https://engineering.linkedin.com/blog/2023/retrieval-augmented-generation-with-linkedin-data) | Hybrid search, retrieval monitoring in production |
| [Uber LLM Gateway](https://www.uber.com/en-US/blog/from-predictive-to-generative-ai/) | Model routing, cost attribution, fallback across providers |
| [Replit AI Agent](https://blog.replit.com/ai) | Long-horizon agent with persistent state and sandboxed tool execution |
| [Lilian Weng — LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) | The most complete survey of agent patterns: planning, memory, tool use |
| [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | Security risks specific to LLM systems — prompt injection, data leakage, supply chain |

## Frameworks

Study as reference implementations, not mandatory dependencies.

| Framework | What to study |
|-----------|--------------|
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful graph-based orchestration |
| [LangChain](https://python.langchain.com/) | RAG, tool calling, and chain abstractions — large ecosystem, use selectively |
| [LlamaIndex](https://docs.llamaindex.ai/) | Data ingestion, indexing, and retrieval — strongest RAG-specific framework |
| [AutoGen](https://microsoft.github.io/autogen/) | Multi-agent conversations: planner, executor, and critic |
| [CrewAI](https://docs.crewai.com/) | Role-based agent teams with task delegation |
| [Anthropic Agent Patterns](https://docs.anthropic.com/en/docs/build-with-claude/agents) | Orchestrator–worker, parallelisation, routing — no framework lock-in |
| [Vercel AI SDK](https://sdk.vercel.ai/) | Streaming, tool calling, and UI integration for TypeScript/Next.js |
| [Haystack](https://haystack.deepset.ai/) | Modular RAG and agent pipelines — good for custom retrieval workflows |
