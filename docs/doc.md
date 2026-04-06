# AI engineering lab

Applied curriculum for building LLM-backed features: APIs and prompts, structured outputs, semantic retrieval and RAG, tools and MCP, agents with guardrails, memory, evaluation, and a single integrated system. Follow in order—later modules assume earlier ones.

---

## Prerequisites

- Comfortable reading and writing in **Python** or **TypeScript** — pick one and stay consistent throughout
- Familiarity with REST APIs and `async`/`await`
- Basic command-line usage (running scripts, installing packages)
- No prior ML or LLM experience required

## Setup

1. **API access** — Obtain a key from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys). Either works for most modules; differences are called out in references.
2. **Environment** — Store keys in a `.env` file and load them via `dotenv` (Python: `python-dotenv`, TypeScript: `dotenv`). Never hard-code credentials.
3. **Runtime** — Python 3.10+ or Node 18+.
4. **Package manager** — `pip` / `venv` for Python; `npm` or `pnpm` for TypeScript.
5. **Smoke test** — After setup, make one API call that prints the model's response. If that works, the environment is ready.

> **Note on library names:** Examples throughout this doc name specific libraries (Zod, Pydantic, pgvector, Pinecone) to give a concrete target. The concepts apply to any equivalent tool — substitute freely for your stack.

---

## Part I — Foundations

### Model basics (tokens and inference)

**Objective:** Reason about cost, limits, and sampling behavior.

- **Concepts:** input vs output tokens, inference, `temperature`, `max_tokens`
- **Practice:** Integrate OpenAI or Anthropic. Run three prompt types (factual, creative, instruction). Sweep temperature from 0 to 1 and compare outputs.
- **Success criteria:** Predictable effect of temperature; truncation addressed via `max_tokens`.

**References:** [OpenAI docs](https://platform.openai.com/docs) · [Anthropic docs](https://docs.anthropic.com) · [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) (Jay Alammar — visual walk-through of how tokens flow through a transformer) · [Tiktokenizer](https://tiktokenizer.vercel.app) (interactive token counter)

---

### Prompting

**Objective:** Steer model behavior with clear instructions.

- **Concepts:** system vs user prompts; zero-shot and few-shot prompting; explicit instructions; role framing
- **Practice:** From unstructured text, produce a structured summary. Repeat with vague, semi-structured, and explicit prompts; compare results. Then move the same instructions from the user turn into the system prompt and observe the difference.
- **Success criteria:** Stronger prompts yield more consistent structure and fewer misses. System-prompt instructions are more reliably followed than equivalent user-turn instructions.

**References:** [OpenAI prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) (comprehensive, model-agnostic, community-maintained)

---

### Structured output

**Objective:** Produce machine-readable output and enforce it at the boundary.

- **Concepts:** JSON responses from the API; schema validation (TypeScript: Zod · Python: Pydantic); retry-on-failure (re-send with the validation error appended so the model can self-correct)
- **Practice:** Map a user query to a strict `{ title, summary, tags[] }` shape; validate every response before use. Deliberately trigger a schema failure and implement one retry that includes the error message in context.
- **Success criteria:** No silent schema failures; unvalidated strings are not trusted downstream; the system recovers from at least one class of malformed output.

**References:** [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Claude structured output](https://docs.anthropic.com/en/docs/build-with-claude/structured-output) · [Instructor](https://python.useinstructor.com) (Python library that wraps validation + retry logic around any LLM — good reference implementation)

---

### Embeddings, storage, and search

**Objective:** End-to-end semantic retrieval: embed, persist, query.

- **Concepts:** embeddings, cosine similarity; vector storage (e.g. pgvector, Pinecone); metadata alongside vectors; embedding model choice matters (e.g. `text-embedding-3-small` vs `text-embedding-3-large` — smaller is often sufficient and cheaper)
- **Practice:** Embed several sentences; compare similar vs unrelated pairs. Persist vectors and implement `search(query)` returning top matches over a small indexed corpus (on the order of tens of chunks or documents).
- **Success criteria:** Meaning-based ranking, not keyword overlap alone. Weak results usually trace to data, chunking, or embedding choice.

**References:** [OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io) · [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/) (Jay Alammar — builds the intuition for what embeddings represent before touching the API)

---

### Retrieval-augmented generation (RAG) and retrieval tuning

**Objective:** Ground generation in retrieved context and improve retrieval quality.

- **Concepts:** RAG pipeline (retrieve → filter → generate); chunking strategy (size, overlap); query rewriting (restate the user query to better match indexed text); retrieve-then-select (retrieve more candidates than needed, then filter to the most relevant before passing to the model)
- **Practice:** Feed retrieved chunks to the model for answering. Iterate on chunk size, top-k, and how much context is passed; validate with a representative set of questions.
- **Success criteria:** Answers attributable to retrieved material; bloated or irrelevant context degrades quality.

**References:** [Pinecone semantic search](https://docs.pinecone.io/guides/search/semantic-search) · [LlamaIndex RAG guide](https://docs.llamaindex.ai/en/stable/understanding/rag/) · [Anthropic contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) (technique for improving chunk relevance at index time)

---

## Part II — Systems

### Tool calling

**Objective:** Let the model select and invoke first-party tools with validated arguments.

- **Concepts:** function calling flow (decide → call → return); argument validation; parallel tool calls (model may invoke multiple tools in one turn)
- **Practice:** Implement at least three tools — a calculator, a live HTTP call (e.g. [Open-Meteo](https://open-meteo.com) weather API, no key required), and a text formatter. The model must choose the correct tool, supply valid arguments, and produce a final answer. Add a case where the tool returns an error and verify the model handles it gracefully.
- **Success criteria:** Correct tool routing for unambiguous queries; tool errors surface as informative responses, not crashes; failures drive prompt and schema refinement.

**References:** [Function calling](https://platform.openai.com/docs/guides/function-calling) · [Claude tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

---

### Model Context Protocol (MCP)

**Objective:** Expose tools through a standard client–server model for reusable integrations.

- **Concepts:** MCP vs ad hoc in-process tools; when server-based tools justify the operational cost
- **Practice:** Connect to an existing MCP server (e.g. filesystem, GitHub); exercise at least one tool through a supported client.
- **Success criteria:** The same conceptual model as tool calling, with clear separation between host and tool implementations.

**References:** [MCP](https://modelcontextprotocol.io) · [Claude MCP](https://docs.anthropic.com/en/docs/build-with-claude/mcp)

---

### Agents: loops and operational control

**Objective:** Multi-step workflows with explicit limits and failure handling.

- **Concepts:** iterative reasoning and action (e.g. ReAct-style patterns); maximum steps; error handling; termination conditions
- **Practice:** Build a loop: goal → step → optional tool or retrieval → observation → repeat. Enforce step caps, fallbacks, and tests for invalid inputs and tool errors.
- **Success criteria:** The system completes or stops safely; reliability issues are most often control and instrumentation, not model size alone.

**References:** [Anthropic agent overview](https://docs.anthropic.com/en/docs/build-with-claude/agent-overview) · [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) (Lilian Weng — the definitive survey of agent patterns: memory, planning, tool use) · [ReAct paper](https://arxiv.org/abs/2210.03629) (the reasoning + acting pattern most agent loops are based on)

---

### Memory

**Objective:** Retain useful context across turns without passing full transcripts.

- **Concepts:** short-term vs long-term memory; vector-backed recall of prior turns
- **Practice:** Persist exchanges; on new input, retrieve relevant prior segments and inject into context (reusing the embedding and storage patterns from Part I).
- **Success criteria:** Coherent multi-turn behavior; retrieval is selective—unbounded history increases noise.

**References:** [Anthropic memory patterns](https://docs.anthropic.com/en/docs/build-with-claude/memory) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io)

---

### Evaluation and system integration

**Objective:** Quantify behavior and assemble one production-shaped pipeline.

**Evaluation**

- **Concepts:** relevance and correctness; limits of informal review; LLM-as-judge (use a model to score outputs against a rubric — fast but requires calibration); golden datasets (a fixed set of inputs with known-good outputs used for regression testing)
- **Practice:** Build a golden set of 10–20 test queries with expected properties. Score an early RAG baseline with both manual review and an LLM judge. Then re-score the full stack (memory + tools included) and compare. Track scores in a simple table so regressions are visible.
- **Success criteria:** Regressions and weak spots are visible and repeatable; the LLM judge's scores correlate with your manual judgements before you trust it.

**Integration**

- **Concepts:** composing independently built components into a single request path; failure propagation across layers; logging and observability at each stage
- **Practice:** Wire one end-to-end path covering every layer built so far:
  ```
  user input
    → agent loop (goal decomposition, step cap)
    → retrieval (embeddings + vector store)
    → tool calls (including MCP server if integrated)
    → structured output validation
    → response to user
  ```
  A minimal but complete example: a research assistant that takes a question, retrieves relevant chunks from an indexed corpus, optionally calls a live tool (e.g. web search or calculator), and returns a cited, schema-validated answer. Keep scope narrow — one happy path plus two error cases is enough.
- **Success criteria:** A single demonstrable system, not only isolated exercises. Each layer is independently testable; the full path runs without manual intervention.

**References:** [OpenAI Evals](https://platform.openai.com/docs/guides/evals) · [RAGAS](https://docs.ragas.io) · [LangSmith](https://docs.smith.langchain.com) · [Anthropic evaluation guide](https://docs.anthropic.com/en/docs/build-with-claude/evals)

---


## Courses & Resources


| Module | Resource |
|---|---|
| Token mechanics | [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) — Karpathy builds a GPT from scratch; the deepest possible intuition |
| Prompting | [Anthropic Prompt Engineering Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial) — 9-chapter Jupyter course, hands-on |
| Structured output | [Instructor](https://python.useinstructor.com) — Python library; read the docs as a reference implementation |
| Embeddings | [Vector Databases: from Embeddings to Applications](https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/) — DeepLearning.AI |
| RAG | [Building & Evaluating Advanced RAG](https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/) — DeepLearning.AI / LlamaIndex |
| Tool calling | [OpenAI Cookbook](https://cookbook.openai.com) — runnable notebooks covering every function-calling pattern |
| MCP | [MCP with Anthropic](https://www.deeplearning.ai/short-courses/mcp-build-rich-context-ai-apps-with-anthropic/) — DeepLearning.AI / Anthropic |
| Agents | [AI Agents in LangGraph](https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/) — builds a ReAct agent from scratch |
| Memory | [Long-Term Agentic Memory with LangGraph](https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/) — DeepLearning.AI |
| Evaluation | [Intro to LangSmith](https://academy.langchain.com/courses/intro-to-langsmith) — tracing, LLM-as-judge, eval runs |

**Certification:** [Anthropic Claude Academy](https://anthropic.skilljar.com)

---