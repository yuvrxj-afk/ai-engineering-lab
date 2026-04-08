Applied curriculum for building LLM-backed features: APIs, structured outputs, RAG, tools, agents, memory, and evaluation. Follow in order — later modules build on earlier ones.

[View on GitHub](https://github.com/yuvrxj-afk/ai-engineering-lab)

---

## Prerequisites

- Python or TypeScript — pick one and stay consistent
- Comfortable with REST APIs and `async`/`await`
- No prior ML or LLM experience required

## Setup

- Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
- Store in `.env`, load with `dotenv` — never hard-code credentials
- Python 3.10+ or Node 18+
- Smoke test: one API call that prints a response

---

## Part I — Foundations

### 1. Model Basics

Understand tokens, inference, and sampling. Call the API with factual, creative, and instruction prompts. Sweep `temperature` and compare outputs.

Also learn: the context window limit for your model, how to handle 429 rate-limit errors (exponential backoff), and when a smaller/cheaper model is good enough. You'll hit all three on day one.

[OpenAI docs](https://platform.openai.com/docs) · [Anthropic docs](https://docs.anthropic.com) · [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) · [Tiktokenizer](https://tiktokenizer.vercel.app/)

---

### 2. Prompting

Write prompts that reliably steer the model. Take unstructured text and produce a structured summary — first vague, then explicit. Move the same instructions from user turn to system prompt and observe the difference.

Know the failure modes: hallucination (confident wrong answers), refusals, and output variance at non-zero temperature. A prompt that works 9 out of 10 times is not a good prompt.

[OpenAI prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [DAIR.AI Prompt Engineering Guide](https://www.promptingguide.ai/)

---

### 3. Structured Output

Get the model to return validated JSON every time. Map a query to a `{ title, summary, tags[] }` shape, validate with Zod or Pydantic, and implement a retry that feeds the validation error back to the model.

Decide what happens when retry also fails: surface the error or accept partial output. Either is valid — pick one and be explicit. Silent schema failures are how bad data reaches your database.

> Start keeping a list of 5–10 inputs and whether each produces the right output. That list is the beginning of an eval set. Every module from here builds on this habit.

[OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Claude structured output](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/increase-consistency) · [Instructor](https://python.useinstructor.com/)

---

### 4. Embeddings, Storage, and Search

Embed sentences, store in a vector DB, and query by meaning. Implement `search(query)` over a small corpus — results should rank by semantic similarity, not keyword overlap.

Pure semantic search often fails on short queries and proper nouns. Hybrid search (dense vectors + BM25 keyword scoring) is the production standard. Know it exists even if you start semantic-only.

[OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/) · [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)

---

### 5. RAG and Retrieval Tuning

Build the full retrieve → filter → generate pipeline. Iterate on chunk size, overlap, top-k, and query rewriting. Poor results almost always trace to chunking or embedding choice — not the model.

Three things that matter in production but rarely appear in tutorials:
- **Reranking** — retrieve more candidates than needed, then use a cross-encoder or LLM to reorder before passing to the model. Significantly improves precision.
- **No-answer handling** — when nothing relevant is retrieved, the model will fabricate. Detect low retrieval confidence and return "I don't know" explicitly.
- **Stale data** — know how you'll re-index when documents change. A static corpus is fine for learning; it breaks in prod.

[Pinecone semantic search](https://www.pinecone.io/learn/series/nlp/semantic-search/) · [LlamaIndex RAG guide](https://docs.llamaindex.ai/en/stable/) · [Anthropic contextual retrieval](https://www.anthropic.com/news/contextual-retrieval)

---

## Part II — Systems

### 6. Tool Calling

Let the model pick and invoke tools. Build at least three: a calculator, a live HTTP call (e.g. [Open-Meteo](https://open-meteo.com), no key needed), and a text formatter. The model must route correctly and handle a tool error gracefully.

Watch for: tool output too large to fit in context (truncate before returning), and the model picking the wrong tool on ambiguous queries.

[OpenAI function calling](https://platform.openai.com/docs/guides/function-calling) · [Claude tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

---

### 7. Agents

Build a multi-step loop: goal → step → optional tool or retrieval → observation → repeat. Enforce a step cap.

This is where most systems break. Know the failure modes before you hit them:

- **Tool failure** — the tool errors or times out. Retry once, then move on or surface it — never silently loop.
- **Runaway loop** — the agent revisits the same step repeatedly. A step cap stops it; logging every step makes it diagnosable.
- **Context overflow** — mid-loop, earlier context gets pushed out of the window as the transcript grows. Summarize older steps when the loop runs long.
- **False completion** — the agent declares success without finishing. Your termination condition should verify the output, not trust the model's self-assessment.

Most reliability issues in agents are control flow, not model capability.

[Anthropic agent overview](https://docs.anthropic.com/en/docs/build-with-claude/agents) · [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) · [ReAct paper](https://arxiv.org/abs/2210.03629)

---

### 8. Memory

Persist exchanges and retrieve relevant ones on each new turn. Inject above retrieved chunks, below the system prompt. Unbounded history increases noise — retrieval must be selective.

Treat memory like retrieval: if you wouldn't blindly pass all documents to the model, don't blindly pass all prior turns either. A wrong or low-quality exchange stored as memory will contaminate future turns.

[Anthropic memory patterns](https://docs.anthropic.com/en/docs/build-with-claude/memory) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/)

---

### 9. Model Context Protocol (MCP)

Connect to an existing MCP server (filesystem or GitHub) and exercise a tool through a supported client. Same mental model as tool calling — just with a client–server boundary.

Use this to understand the pattern, not as a default architecture. MCP makes sense when tools need to be shared across multiple agents or clients — for a single system, in-process tools are simpler.

[MCP docs](https://modelcontextprotocol.io/) · [Claude MCP](https://docs.anthropic.com/en/docs/build-with-claude/mcp)

---

### 10. Evaluation and Integration

Build a golden set of 10–20 queries. Score an early RAG baseline with manual review and an LLM-as-judge. Re-score the full stack and track changes — regressions should be visible before you ship, not after.

LLM-as-judge is fast but has known failure modes: it favors longer answers, and the same model scoring its own output has self-serving bias. Cross-check scores against your manual judgements before trusting it.

Then wire everything into one path: query rewriting → retrieval → agent loop → tools → memory → validated structured output → response.

[OpenAI Evals](https://github.com/openai/evals) · [RAGAS](https://docs.ragas.io/) · [LangSmith](https://docs.smith.langchain.com/) · [Anthropic eval guide](https://docs.anthropic.com/en/docs/test-and-evaluate/eval-overview)

---

## Study Path

Each phase draws from the best parts of the most focused course for that topic.

```
Phase 1 — Foundations (Modules 1–3)
  Karpathy Zero to Hero          Videos 1–4 (tokenization through attention)
                                 Skip training optimization — optional if focused on building
  Anthropic Prompt Engineering   All 9 chapters — best resource for Modules 2–3

Phase 2 — Retrieval (Modules 4–5)
  DeepLearning.AI Vector DBs     Full course — covers Module 4
  DeepLearning.AI Advanced RAG   Full course — focus on chunking and eval patterns
                                 Skip LlamaIndex-specific abstractions

Phase 3 — Systems (Modules 6–9)
  AI Agents in LangGraph         Full course — covers tool calling, agents, and memory together
                                 Skip the standalone memory course (heavy overlap)
  MCP with Anthropic             Full course — do after the agents course

Phase 4 — Evaluation (Module 10)
  Intro to LangSmith             Full course — pair with RAGAS docs for scoring
```

**Certification:** [Anthropic Claude Academy](https://academy.anthropic.com/)

---

## Capstone: Research Oracle

Build a multi-turn agent that answers questions about a document corpus, pulls in live data when needed, cites every claim, and evaluates its own outputs. Build it incrementally — by Module 10 all layers should be live.

**Constraints (these are the point):**
- Target cost ≤ $0.10 per query end-to-end — model selection and caching matter
- `web_search` returns empty results 20% of the time — your system must not hallucinate in those cases
- Two documents in your corpus contradict each other — surface the conflict, don't silently pick one

### System

```
User question
  │
  ├─ Query rewriting      Restate to improve retrieval recall
  │
  ├─ Retrieval            Embed → search → rerank → return top-k
  │                       Index at least 20–30 documents
  │                       Return "I don't know" if confidence is below threshold
  │
  ├─ Agent loop           Max 5 steps. Tools:
  │                         web_search(query)
  │                         calculator(expression)
  │                         summarise_doc(url)
  │                       Truncate tool output > 500 tokens before injecting
  │                       Cite which tool produced which context
  │
  ├─ Memory               Retrieve 3 most relevant prior exchanges for the session
  │                       Inject above chunks, below system prompt
  │                       Persist after responding
  │
  ├─ Critic               A second model call before returning:
  │                       Does every citation exist in the retrieved context?
  │                       Does the confidence level match the evidence?
  │                       Revise or flag — don't return unverified claims
  │
  ├─ Structured output    Validate against:
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

Score each iteration: manual pass/fail on accuracy, LLM-as-judge on citation quality (0–2), schema first-pass validity. Track in a CSV — a regression in Tier 1 while improving Tier 3 is signal.

Minimum bar: Tier 1 ≥ 4/5 · Tier 2 ≥ 3/5 · Tier 3 ≥ 2/5 · Schema validity ≥ 85%

### Stretch

- Expose corpus search as an MCP server consumed by the agent
- Instrument every layer with LangSmith — per-layer latency and failure rate
- Add semantic caching: near-identical queries skip the full pipeline

---

## Production References

Real systems and frameworks worth studying once the capstone is done.

| System | What to look for |
|--------|-----------------|
| [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) | Orchestrator–subagent patterns, task decomposition, handoffs |
| [LinkedIn RAG at Scale](https://engineering.linkedin.com/blog/2023/retrieval-augmented-generation-with-linkedin-data) | Hybrid search, retrieval monitoring in production |
| [Uber LLM Gateway](https://www.uber.com/en-US/blog/from-predictive-to-generative-ai/) | Model routing, cost attribution, fallback across providers |
| [Replit AI Agent](https://blog.replit.com/ai) | Long-horizon agent with persistent state and sandboxed tool execution |
| [Lilian Weng — LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) | The most complete survey of agent patterns: planning, memory, tool use |

**Frameworks** — study as reference implementations, not mandatory dependencies:

| Framework | What to study |
|-----------|--------------|
| [LangGraph](https://langchain-ai.github.io/langgraph/) | Stateful graph-based orchestration |
| [AutoGen](https://microsoft.github.io/autogen/) | Multi-agent conversations: planner, executor, and critic |
| [CrewAI](https://docs.crewai.com/) | Role-based agent teams with task delegation |
| [Anthropic Agent Patterns](https://docs.anthropic.com/en/docs/build-with-claude/agents) | Orchestrator–worker, parallelisation, routing — no framework lock-in |

---

*Maintained by [yuvrxj-afk](https://github.com/yuvrxj-afk).*
