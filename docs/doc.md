# AI Engineering Lab

Applied curriculum for building LLM-backed features: APIs, structured outputs, RAG, tools, agents, memory, and evaluation. Follow in order — later modules build on earlier ones.

[View on GitHub](https://github.com/yuvrxj-afk/ai-engineering-lab)

---

## Prerequisites

- Python or TypeScript — pick one and stay consistent
- Comfortable with REST APIs and `async`/`await`
- No prior ML or LLM experience required

## Setup

- Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
- Store it in `.env`, load with `dotenv` — never hard-code credentials
- Python 3.10+ or Node 18+
- Smoke test: one API call that prints a response

---

## Part I — Foundations

### 1. Model Basics

Understand tokens, inference, and sampling. Call the API with factual, creative, and instruction prompts. Sweep `temperature` from 0 to 1 and compare outputs — you should be able to predict what changes.

[OpenAI docs](https://platform.openai.com/docs) · [Anthropic docs](https://docs.anthropic.com) · [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) · [Tiktokenizer](https://tiktokenizer.vercel.app/)

---

### 2. Prompting

Write prompts that reliably steer the model. Take unstructured text and produce a structured summary — first with vague instructions, then explicit ones. Move the same instructions from user turn to system prompt and observe the difference.

[OpenAI prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [DAIR.AI Prompt Engineering Guide](https://www.promptingguide.ai/)

---

### 3. Structured Output

Get the model to return validated JSON every time. Map a query to a `{ title, summary, tags[] }` shape, validate with Zod or Pydantic, and implement one retry that feeds the validation error back to the model.

[OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Claude structured output](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/increase-consistency) · [Instructor](https://python.useinstructor.com/)

---

### 4. Embeddings, Storage, and Search

Embed sentences, store them in a vector database, and query by meaning. Implement `search(query)` over a small indexed corpus — results should rank by semantic similarity, not keyword overlap.

[OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/) · [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)

---

### 5. RAG and Retrieval Tuning

Build the full retrieve → filter → generate pipeline. Experiment with chunk size, top-k, and query rewriting. Answers should be attributable to retrieved material — if they're not, the problem is usually chunking or embedding choice, not the model.

[Pinecone semantic search](https://www.pinecone.io/learn/series/nlp/semantic-search/) · [LlamaIndex RAG guide](https://docs.llamaindex.ai/en/stable/) · [Anthropic contextual retrieval](https://www.anthropic.com/news/contextual-retrieval)

---

## Part II — Systems

### 6. Tool Calling

Let the model pick and invoke tools. Build at least three: a calculator, a live HTTP call (e.g. [Open-Meteo](https://open-meteo.com), no key needed), and a text formatter. The model must route correctly and handle a tool error gracefully.

[OpenAI function calling](https://platform.openai.com/docs/guides/function-calling) · [Claude tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

---

### 7. Model Context Protocol (MCP)

Connect to an existing MCP server (filesystem or GitHub) and exercise a tool through a supported client. Same mental model as tool calling — just with a proper client–server boundary.

[MCP docs](https://modelcontextprotocol.io/) · [Claude MCP](https://docs.anthropic.com/en/docs/build-with-claude/mcp)

---

### 8. Agents

Build a multi-step loop: goal → step → optional tool or retrieval → observation → repeat. Enforce a step cap and handle failures — most reliability issues come from poor control flow, not model size.

[Anthropic agent overview](https://docs.anthropic.com/en/docs/build-with-claude/agents) · [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) · [ReAct paper](https://arxiv.org/abs/2210.03629)

---

### 9. Memory

Persist exchanges and retrieve relevant ones on each new turn. Inject them into context above the retrieved chunks. Unbounded history increases noise — retrieval should be selective.

[Anthropic memory patterns](https://docs.anthropic.com/en/docs/build-with-claude/memory) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/)

---

### 10. Evaluation and Integration

Build a golden set of 10–20 queries. Score an early RAG baseline with manual review and an LLM-as-judge. Re-score the full stack and track changes in a table — regressions should be visible.

Then wire everything into one path: query rewriting → retrieval → agent loop → tools → memory → validated structured output → response. One happy path plus two error cases is enough.

[OpenAI Evals](https://github.com/openai/evals) · [RAGAS](https://docs.ragas.io/) · [LangSmith](https://docs.smith.langchain.com/) · [Anthropic eval guide](https://docs.anthropic.com/en/docs/test-and-evaluate/eval-overview)

---

## Study Path

Each phase draws from the best parts of the most focused course for that topic — no single course covers everything well.

```
Phase 1 — Foundations (Modules 1–3)
  Karpathy Zero to Hero          Videos 1–4 (tokenization through attention)
  Anthropic Prompt Engineering   All 9 chapters — best single resource for prompting

Phase 2 — Retrieval (Modules 4–5)
  DeepLearning.AI Vector DBs     Full course — covers Module 4 end-to-end
  DeepLearning.AI Advanced RAG   Full course — focus on chunking and eval patterns
                                 Skip the LlamaIndex-specific abstractions

Phase 3 — Systems (Modules 6–9)
  AI Agents in LangGraph         Full course — covers tool calling, agents, and memory together
                                 No need to also do the standalone memory course (heavy overlap)
  MCP with Anthropic             Full course — do this after the agents course

Phase 4 — Evaluation (Module 10)
  Intro to LangSmith             Full course — pair with RAGAS docs for scoring patterns
```

**Certification:** [Anthropic Claude Academy](https://academy.anthropic.com/)

---

## Capstone: Research Oracle

Build a multi-turn agent that answers questions about a document corpus, pulls in live data when needed, cites every claim, and evaluates its own outputs. Build it incrementally — by Module 10 all layers should be live.

### System

```
User question
  │
  ├─ Query rewriting      Restate the question to improve retrieval recall
  │
  ├─ Retrieval            Embed → search corpus → return top-k chunks
  │                       Index at least 20–30 documents
  │
  ├─ Agent loop           Max 5 steps. Tools available:
  │                         web_search(query)
  │                         calculator(expression)
  │                         summarise_doc(url)
  │                       Cite which tool produced which context
  │
  ├─ Memory               Retrieve 3 most relevant prior exchanges for the session
  │                       Inject above chunks, below system prompt
  │                       Persist the new exchange after responding
  │
  ├─ Structured output    Validate every response against:
  │                         { answer, citations[], confidence, follow_up_questions[] }
  │                       Retry once on schema failure
  │
  └─ Response to user
```

### Evaluation

Build a golden set of 15 questions across three tiers:
- **Tier 1** — answerable from the corpus, no tools needed (5 questions)
- **Tier 2** — require a tool call (5 questions)
- **Tier 3** — multi-hop: retrieval + tool + memory from a prior turn (5 questions)

Score each iteration: manual pass/fail on accuracy, LLM-as-judge on citation quality (0–2), and schema first-pass validity rate. Track in a CSV — a regression in Tier 1 while improving Tier 3 is signal.

Minimum bar: Tier 1 ≥ 4/5 · Tier 2 ≥ 3/5 · Tier 3 ≥ 2/5 · Schema validity ≥ 85%

### Stretch

- Expose corpus search as an MCP server consumed by the agent
- Instrument every layer with LangSmith — per-layer latency and failure rate
- Add a critic agent that reviews the draft before it's returned

---

## Production References

Real systems and frameworks worth studying once the capstone is done.

| System | What to look for |
|--------|-----------------|
| [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | Orchestrator–subagent patterns, task decomposition, handoffs |
| [LinkedIn RAG at Scale](https://engineering.linkedin.com/blog/2023/retrieval-augmented-generation-with-linkedin-data) | Hybrid dense + sparse search, retrieval monitoring in production |
| [Uber LLM Gateway](https://www.uber.com/en-US/blog/from-predictive-to-generative-ai/) | Model routing, rate limiting, cost attribution across providers |
| [Replit AI Agent](https://blog.replit.com/ai) | Long-horizon agent with persistent state and sandboxed tool execution |
| [Lilian Weng — LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) | Comprehensive survey of agent patterns: planning, memory, tool use |

| Framework | What to study |
|-----------|--------------|
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful graph-based orchestration — best for understanding agent state flow |
| [AutoGen](https://microsoft.github.io/autogen/) | Multi-agent conversations: planner, executor, and critic cooperating |
| [CrewAI](https://docs.crewai.com/) | Role-based agent teams with explicit task delegation |
| [Anthropic Agent Patterns](https://docs.anthropic.com/en/docs/build-with-claude/agents) | Orchestrator–worker, parallelisation, and routing without framework lock-in |

---

*Maintained by [yuvrxj-afk](https://github.com/yuvrxj-afk).*
