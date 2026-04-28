
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

Understand tokens, inference, and sampling. Call the API with factual, creative, and instruction prompts. Sweep `temperature` and compare outputs. Learn `top_p` and `top_k` — know when to adjust each and when to leave them alone.

Count tokens before sending. Every provider charges per token — know your model's pricing, context window limit, and how to estimate cost per call. Use a tokenizer library (tiktoken for OpenAI, Anthropic's token counter) to verify what you're actually sending.

Also learn: how to handle 429 rate-limit errors (exponential backoff), when a smaller/cheaper model is good enough, and how batching API calls (OpenAI Batch API) cuts cost by 50% when latency doesn't matter. You'll hit all three on day one.

Know the landscape: OpenAI (GPT-4o, o-series), Anthropic (Claude), Google (Gemini), Meta (Llama), Mistral, Cohere, and DeepSeek are the providers that matter today. Each has different strengths — don't marry one.

[OpenAI docs](https://platform.openai.com/docs) · [Anthropic docs](https://docs.anthropic.com) · [Google Gemini docs](https://ai.google.dev/docs) · [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) · [Tiktokenizer](https://tiktokenizer.vercel.app/)

---

### 2. Prompting

Write prompts that reliably steer the model. Take unstructured text and produce a structured summary — first vague, then explicit. Move the same instructions from user turn to system prompt and observe the difference.

Learn the canonical techniques by name — you'll use all of them:

- **Zero-shot** — task description only, no examples. Start here; add complexity only when it fails.
- **Few-shot** — include 2–5 examples in the prompt. Example selection matters more than example count.
- **Chain-of-thought (CoT)** — ask the model to reason step by step before answering. Dramatically improves accuracy on math, logic, and multi-step problems. "Let's think step by step" is the simplest form; structured CoT with explicit reasoning fields is more reliable.
- **ReAct** (Reasoning + Acting) — interleave thinking and tool use. The model reasons about what to do, acts, observes the result, then reasons again. This is the pattern behind most agent loops (Module 7).
- **Self-consistency** — run the same prompt multiple times with temperature > 0 and take the majority answer. Expensive but effective for high-stakes decisions.
- **Prompt chaining** — break complex tasks into a sequence of simpler prompts, each feeding into the next. More reliable than one mega-prompt.

Know the failure modes: hallucination (confident wrong answers), refusals, and output variance at non-zero temperature. A prompt that works 9 out of 10 times is not a good prompt.

[OpenAI prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [DAIR.AI Prompt Engineering Guide](https://www.promptingguide.ai/) · [ReAct paper](https://arxiv.org/abs/2210.03629) · [Chain-of-Thought paper](https://arxiv.org/abs/2201.11903)

---

### 3. Structured Output

Get the model to return validated JSON every time. Map a query to a `{ title, summary, tags[] }` shape, validate with Zod or Pydantic, and implement a retry that feeds the validation error back to the model.

Decide what happens when retry also fails: surface the error or accept partial output. Either is valid — pick one and be explicit. Silent schema failures are how bad data reaches your database.

> Start keeping a list of 5–10 inputs and whether each produces the right output. That list is the beginning of an eval set. Every module from here builds on this habit.

[OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs) · [Claude structured output](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/increase-consistency) · [Instructor](https://python.useinstructor.com/)

---

### 4. Embeddings, Storage, and Search

Embed sentences, store in a vector DB, and query by meaning. Implement `search(query)` over a small corpus — results should rank by semantic similarity, not keyword overlap.

Pick an embedding provider — they're not interchangeable. OpenAI `text-embedding-3-small` is the default. Cohere Embed v3 handles multilingual well. Jina and Voyage offer specialised models. For open-source: Sentence Transformers (all-MiniLM-L6-v2 for speed, BGE/GTE for quality) run locally with no API cost. Try at least two — embedding quality is the single biggest lever in retrieval.

Pick a vector DB. Start with one:
- **pgvector** — if you already have Postgres, add a column. Zero new infrastructure.
- **Chroma** — embeds in-process, good for prototypes
- **FAISS** — Meta's library, fastest local similarity search
- **Pinecone / Weaviate / Qdrant** — managed services with filtering and metadata
- **LanceDB** — embedded, columnar, good for multimodal
- **Supabase / MongoDB Atlas** — vector search added to databases you may already use

Pure semantic search often fails on short queries and proper nouns. Hybrid search (dense vectors + BM25 keyword scoring) is the production standard. Know it exists even if you start semantic-only.

[OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings) · [Cohere Embed](https://docs.cohere.com/docs/embeddings) · [Sentence Transformers](https://www.sbert.net/) · [Jina Embeddings](https://jina.ai/embeddings/) · [pgvector](https://github.com/pgvector/pgvector) · [Chroma](https://docs.trychroma.com/) · [FAISS](https://github.com/facebookresearch/faiss) · [Pinecone](https://docs.pinecone.io/) · [The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)

---

### 5. RAG and Retrieval Tuning

Build the full retrieve → filter → generate pipeline. Iterate on chunk size, overlap, top-k, and query rewriting. Poor results almost always trace to chunking or embedding choice — not the model.

Before you chunk, you need clean data. **Document preprocessing** is where most RAG pipelines quietly fail:
- PDFs: use `unstructured`, `PyMuPDF`, or `pdfplumber` — not every PDF parser handles tables and headers
- HTML: strip navigation and boilerplate; keep semantic structure
- Tables: flatten to text or extract as structured data — embeddings don't understand grid layouts
- Code: chunk by function/class, not by token count

Three things that matter in production but rarely appear in tutorials:
- **Reranking** — retrieve more candidates than needed, then use a cross-encoder or LLM to reorder before passing to the model. Significantly improves precision.
- **No-answer handling** — when nothing relevant is retrieved, the model will fabricate. Detect low retrieval confidence and return "I don't know" explicitly.
- **Stale data** — know how you'll re-index when documents change. A static corpus is fine for learning; it breaks in prod.

Advanced patterns worth knowing:
- **Graph RAG** — combine vector retrieval with knowledge graphs. Entities and relationships give the model structural context that flat chunks miss. See Microsoft's GraphRAG.
- **Agentic RAG** — the agent decides *when* and *what* to retrieve instead of always-retrieve. Reduces noise and cost on queries that don't need context.
- **RAG vs. fine-tuning** — RAG for facts that change, fine-tuning for behaviour that doesn't. Most teams need RAG; fewer need fine-tuning. Know the tradeoff before reaching for either.

Frameworks: [LangChain](https://python.langchain.com/docs/tutorials/rag/) and [LlamaIndex](https://docs.llamaindex.ai/en/stable/) are the dominant RAG frameworks. [Haystack](https://haystack.deepset.ai/) and [RAGFlow](https://ragflow.io/) are alternatives. Learn to build RAG from scratch first, then evaluate whether a framework saves you time or hides problems.

[Pinecone semantic search](https://www.pinecone.io/learn/series/nlp/semantic-search/) · [LlamaIndex RAG guide](https://docs.llamaindex.ai/en/stable/) · [Anthropic contextual retrieval](https://www.anthropic.com/news/contextual-retrieval) · [Microsoft GraphRAG](https://github.com/microsoft/graphrag)

---

## Part II — Systems

### 6. Tool Calling

Let the model pick and invoke tools. Build at least three: a calculator, a live HTTP call (e.g. [Open-Meteo](https://open-meteo.com), no key needed), and a text formatter. The model must route correctly and handle a tool error gracefully.

Watch for: tool output too large to fit in context (truncate before returning), the model picking the wrong tool on ambiguous queries, and the reality that external providers fail in ways your model can't "reason" around.

Reliability patterns you should apply immediately:

- **Retries with backoff + jitter** for transient errors (timeouts, 429s, some 5xx)
- **Fallback chains** across models/providers (cheaper → stronger, or Provider A → Provider B)
- **Circuit breakers** so a failing provider doesn't cascade into an incident

[OpenAI function calling](https://platform.openai.com/docs/guides/function-calling) · [Claude tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

---

### 7. Agents

Build a multi-step loop: goal → step → optional tool or retrieval → observation → repeat. Enforce a step cap.

This is where most systems break. Know the failure modes before you hit them:

- **Tool failure** — the tool errors or times out. Retry once, then move on or surface it — never silently loop.
- **Runaway loop** — the agent revisits the same step repeatedly. A step cap stops it; logging every step makes it diagnosable.
- **Context overflow** — mid-loop, earlier context gets pushed out of the window as the transcript grows. Summarize older steps when the loop runs long.
- **False completion** — the agent declares success without finishing. Your termination condition should verify the output, not trust the model's self-assessment.
- **Provider degradation** — latency spikes and partial outages happen. Use fallbacks and circuit breakers; don't let the agent "thrash" on retries.

Most reliability issues in agents are control flow, not model capability.

Beyond single agents:
- **Multi-agent architectures** — orchestrator delegates to specialist sub-agents (researcher, coder, reviewer). Each agent has a focused system prompt and tool set. Adds complexity — only use when a single agent's context or tool set becomes unwieldy.
- **Human-in-the-loop** — some decisions shouldn't be automated. Build approval gates for high-stakes actions (sending emails, modifying data, spending money). Set confidence thresholds that route to human review.

Agent SDKs to know: [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/), [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents/claude-agent-sdk), [Vercel AI SDK](https://sdk.vercel.ai/docs). These handle the loop, tool dispatch, and streaming for you — evaluate whether the abstraction helps or hides.

[Anthropic agent overview](https://docs.anthropic.com/en/docs/build-with-claude/agents) · [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) · [ReAct paper](https://arxiv.org/abs/2210.03629)

---

### 8. Memory

Persist exchanges and retrieve relevant ones on each new turn. Inject above retrieved chunks, below the system prompt. Unbounded history increases noise — retrieval must be selective.

Treat memory like retrieval: if you wouldn't blindly pass all documents to the model, don't blindly pass all prior turns either. A wrong or low-quality exchange stored as memory will contaminate future turns.

Memory types worth distinguishing:
- **Working memory** — the current conversation's context window. Finite and expensive.
- **Episodic memory** — stored past conversations, retrieved by relevance. This is what you build in this module.
- **Semantic memory** — long-term facts about the user or domain (preferences, account info). Often a simple key-value store, not a vector search.

For multi-turn UX: summarise older turns rather than dropping them. A good conversation summary preserves decisions and facts while discarding filler. Context window management is a design problem, not just an engineering one.

[Anthropic memory patterns](https://docs.anthropic.com/en/docs/build-with-claude/memory) · [pgvector](https://github.com/pgvector/pgvector) · [Pinecone](https://docs.pinecone.io/)

---

### 9. Model Context Protocol (MCP)

Connect to an existing MCP server (filesystem or GitHub) and exercise a tool through a supported client. Same mental model as tool calling — just with a client–server boundary.

Understand the architecture: **MCP Host** (your application), **MCP Client** (manages connections), **MCP Server** (exposes tools and resources), **Transport Layer** (stdio or HTTP/SSE). Build at least one MCP server that wraps a capability your agent needs.

Use this to understand the pattern, not as a default architecture. MCP makes sense when tools need to be shared across multiple agents or clients — for a single system, in-process tools are simpler.

[MCP docs](https://modelcontextprotocol.io/) · [Claude MCP](https://docs.anthropic.com/en/docs/build-with-claude/mcp) · [MCP specification](https://spec.modelcontextprotocol.io/)

---

### 10. Evaluation, Testing, and Integration

Build a golden set of 10–20 queries. Score an early RAG baseline with manual review and an LLM-as-judge. Re-score the full stack and track changes — regressions should be visible before you ship, not after.

LLM-as-judge is fast but has known failure modes: it favors longer answers, and the same model scoring its own output has self-serving bias. Cross-check scores against your manual judgements before trusting it.

Add "no surprise engineering" tests so you can iterate without burning credits:

- **Unit tests**: `pytest` basics (assertions, fixtures) or your TS equivalent
- **Integration tests without paid calls**: mock providers + monkeypatch/stubs; record/replay only when needed
- **Rate limit realism**: your limiter working can look like "failures" unless you interpret 429 correctly (especially in load tests)

CI/CD for AI apps:
- Run evals in CI — a failing eval blocks merge just like a failing test
- Version your prompts alongside code (same repo, same PR)
- Track eval scores over time — a dashboard or CSV that shows trends across commits
- Separate fast tests (unit, mocked integration) from slow tests (live API evals) in your pipeline

Then wire everything into one path: query rewriting → retrieval → agent loop → tools → memory → validated structured output → response.

[OpenAI Evals](https://github.com/openai/evals) · [RAGAS](https://docs.ragas.io/) · [LangSmith](https://docs.smith.langchain.com/) · [Anthropic eval guide](https://docs.anthropic.com/en/docs/test-and-evaluate/eval-overview) · [Braintrust](https://www.braintrustdata.com/)

---

## Part III — Extending the Stack

### 11. Open-Source and Local Models

Not every workload should hit a paid API. Open-weight models run on your hardware — no data leaves your network, no per-token cost after setup, no rate limits.

Start with [Ollama](https://ollama.com/) — one command to download and serve Llama, Mistral, Gemma, or DeepSeek locally. Use the OpenAI-compatible API so your existing code works with a URL change. [LM Studio](https://lmstudio.ai/) adds a GUI if you prefer it.

Models to know:
- **Llama 3** (Meta) — the default open-weight choice. Strong general performance. 8B for local dev, 70B+ for production quality.
- **Mistral / Mixtral** — fast, efficient, strong at code. Mixtral is mixture-of-experts — good quality at lower compute.
- **DeepSeek** — competitive with closed models on reasoning tasks
- **Gemma** (Google) — small, efficient, good for edge deployment
- **Qwen** (Alibaba) — strong multilingual and code performance

[Hugging Face Hub](https://huggingface.co/models) is the registry — models, datasets, and spaces. Learn to navigate model cards, understand quantisation levels (Q4, Q5, Q8 — smaller = faster but less accurate), and pick the right model size for your hardware.

For browser and edge: [Transformers.js](https://huggingface.co/docs/transformers.js) runs models in the browser via WebAssembly/WebGPU. Small embedding and classification models work; large generative models don't — yet.

When to go open vs. closed: use closed APIs for best quality and fastest iteration. Use open models when data privacy requires it, latency needs on-premise inference, cost at scale makes per-token pricing unsustainable, or you need to fine-tune (Module 13).

[Ollama](https://ollama.com/) · [LM Studio](https://lmstudio.ai/) · [Hugging Face Hub](https://huggingface.co/) · [vLLM](https://docs.vllm.ai/) · [Transformers.js](https://huggingface.co/docs/transformers.js)

---

### 12. Multimodal AI

Most production AI systems in 2026 handle more than text. If you've only built text-in-text-out, this module fills the gap.

**Vision — image understanding:**
Send an image to the model alongside a text prompt. GPT-4o, Claude, and Gemini all accept images natively. Use cases: document extraction (receipts, forms, diagrams), visual QA, image classification without training a custom model. Start by sending a screenshot and asking the model to describe it — then try structured extraction.

**Image generation:**
DALL-E 3 (via API), Stable Diffusion (open-source, run locally), and Midjourney (no API). For programmatic use: DALL-E API or Stability AI's API. Understand that generation is a separate model from understanding — the same system prompt patterns don't apply.

**Audio — speech-to-text and text-to-speech:**
[OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text) (API or local) is the standard for transcription. Handle long audio by chunking into segments. Text-to-speech: OpenAI TTS API, ElevenLabs, or open-source Bark/Coqui. Voice cloning raises ethical and legal questions — know the boundaries.

**Video understanding:**
Extract frames, send as image sequence with timestamps. Gemini handles long video natively. For others, sample keyframes and process as images. Video is expensive in tokens — be selective about what you send.

**Multimodal RAG:**
Embed images alongside text using multimodal embedding models (Cohere Multimodal, Jina CLIP). Store in the same vector DB. Retrieve across modalities — a text query can surface relevant images, and vice versa.

[OpenAI Vision](https://platform.openai.com/docs/guides/vision) · [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text) · [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech) · [DALL-E API](https://platform.openai.com/docs/guides/images) · [Gemini multimodal](https://ai.google.dev/gemini-api/docs/vision) · [Stable Diffusion](https://stability.ai/) · [Hugging Face multimodal models](https://huggingface.co/models?pipeline_tag=image-to-text)

---

### 13. Fine-Tuning

Fine-tuning changes model weights so it behaves differently by default — without needing the instructions in every prompt. It's the third tool alongside prompting and RAG for customising model behaviour. Most teams don't need it, but you need to know when you do.

**When to fine-tune vs. not:**
- Prompting handles most tasks. Try it first.
- RAG handles knowledge that changes. Don't fine-tune facts into the model.
- Fine-tune when you need the model to *consistently* adopt a style, format, or domain-specific behaviour that's hard to prompt reliably — or when you need to shrink a large model's capability into a smaller, cheaper one.

**How it works:**
1. Prepare a training dataset: input-output pairs in the format your provider expects (JSONL with messages). Quality > quantity — 50 excellent examples beat 5000 sloppy ones.
2. Upload and train. OpenAI and Anthropic offer hosted fine-tuning. For open models, use Hugging Face Transformers + PEFT.
3. Evaluate the fine-tuned model against your base model on a held-out test set. If it's not measurably better, revert.

**Parameter-efficient fine-tuning (PEFT):**
Full fine-tuning is expensive. LoRA (Low-Rank Adaptation) and QLoRA (quantised LoRA) train a small number of adapter weights instead of the full model. This is how you fine-tune a 70B model on a single GPU. Learn these if you're working with open models.

**Pitfalls:**
- Fine-tuning on bad data makes the model confidently worse
- Overfitting on small datasets — the model memorises instead of generalising
- Catastrophic forgetting — the model loses general capabilities. Evaluate broadly, not just on your task.
- Cost: training runs cost money and time. Budget for multiple iterations.

[OpenAI fine-tuning](https://platform.openai.com/docs/guides/fine-tuning) · [Hugging Face PEFT](https://huggingface.co/docs/peft) · [QLoRA paper](https://arxiv.org/abs/2305.14314) · [Anthropic fine-tuning](https://docs.anthropic.com/en/docs/build-with-claude/fine-tuning) · [Axolotl](https://github.com/axolotl-ai-cloud/axolotl)

---

## Part IV — Production Readiness

### 14. AI Safety and Guardrails

If your system faces users, it faces adversaries. This isn't theoretical — it's engineering.

**Prompt injection:**
The primary attack surface. Direct injection: user inputs instructions that override your system prompt. Indirect injection: retrieved documents contain hidden instructions. Defences: input sanitisation, instruction hierarchy (system > user), separate parsing from execution, and never trust user input as instructions.

**Input guardrails — filter before the model sees it:**
- PII detection and redaction (names, emails, SSNs) — use regex + NER models
- Content moderation APIs (OpenAI Moderation, Anthropic guardrails, Perspective API) to block toxic or harmful input
- Topic classifiers to reject out-of-scope queries
- Rate limiting per user to prevent abuse

**Output guardrails — filter before the user sees it:**
- Schema validation (you learned this in Module 3 — now apply it for safety)
- Output classifiers for harmful, biased, or off-topic content
- Citation verification — don't return claims without sources
- Confidence thresholds — low-confidence answers get flagged or blocked

**Guardrail frameworks:**
[NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) (NVIDIA) — define conversational rails in a config file. [Guardrails AI](https://www.guardrailsai.com/) — validators for specific output properties. [Anthropic constitutional AI](https://www.anthropic.com/index/constitutional-ai) — the model critiques its own output against principles.

**Bias and fairness:**
LLMs inherit biases from training data. Test your system across demographic groups. Compare outputs for equivalent queries with different names, genders, or cultural contexts. This is testing, not philosophy.

**Regulatory awareness:**
The EU AI Act classifies AI systems by risk level. Know which tier your application falls into. Data privacy laws (GDPR, CCPA) apply to LLM inputs and outputs — especially if you're storing conversations or fine-tuning on user data. End-user IDs in API calls help with audit trails and abuse detection.

[OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) · [Guardrails AI](https://www.guardrailsai.com/) · [OpenAI Moderation](https://platform.openai.com/docs/guides/moderation) · [Anthropic safety](https://docs.anthropic.com/en/docs/build-with-claude/safety) · [EU AI Act overview](https://artificialintelligenceact.eu/)

---

### 15. Streaming and Real-Time UX

Users see a blank screen for 3 seconds and assume it's broken. Streaming changes that — tokens appear as they're generated. Every production LLM app uses streaming. If yours doesn't, fix that.

**Server-Sent Events (SSE):**
The standard transport for token streaming. The API sends one event per token (or small chunk). Your frontend renders incrementally. OpenAI and Anthropic both support `stream: true` — the SDK returns an async iterator.

**Implementing streaming end-to-end:**
1. Backend: set `stream: true` on the API call. Iterate over chunks and forward each via SSE or WebSocket to the client.
2. Frontend: consume the stream and append to the UI. Handle connection drops — reconnect and resume gracefully.
3. Structured output + streaming: you can't validate JSON until the stream completes. Parse incrementally (partial JSON parsing) or validate after completion and display a loading state for the structured fields.

**Key metrics:**
- **Time to first token (TTFT)** — how long before the user sees anything. Optimise this. Prompt caching, smaller first-pass models, and edge routing all help.
- **Tokens per second** — throughput. Varies by model and provider. Smaller models stream faster.

**Tool calls during streaming:**
The model pauses generation to call a tool. Show the user what's happening — "Searching…", "Calculating…" — rather than a frozen stream. Most SDKs emit tool-call events you can surface in the UI.

[OpenAI streaming](https://platform.openai.com/docs/api-reference/streaming) · [Anthropic streaming](https://docs.anthropic.com/en/api/messages-streaming) · [Vercel AI SDK](https://sdk.vercel.ai/docs) — handles streaming, tool calls, and UI integration out of the box

---

### 16. Observability and LLMOps

You can't fix what you can't see. Production LLM systems need the same observability as any backend service — plus LLM-specific signals.

**What to trace:**
- Every LLM call: model, input tokens, output tokens, latency, cost, status
- Every retrieval: query, results returned, reranking scores
- Every tool call: which tool, input, output, duration, success/failure
- Every guardrail check: what was flagged and why
- End-to-end traces that link all of the above for a single user request

**What to alert on:**
- Latency spikes (p50, p95, p99)
- Error rate increases
- Cost per query trending up
- Eval score regressions (run evals on a schedule, not just in CI)
- Guardrail trigger rate changes — a spike means something changed

**Prompt management:**
Version prompts in code (same repo, same PR). Tag each LLM call with the prompt version. When quality drops, you need to know which prompt change caused it. Some teams use prompt registries — only adopt one if git isn't enough.

**A/B testing:**
Route a percentage of traffic to a new prompt or model. Compare quality scores, latency, and cost. Don't A/B test without evals — you'll have data but no signal.

**Tools:**
[LangSmith](https://docs.smith.langchain.com/) — tracing, evals, prompt playground. [Langfuse](https://langfuse.com/) — open-source alternative. [Arize Phoenix](https://phoenix.arize.com/) — open-source, strong on retrieval analysis. [Portkey](https://portkey.ai/) — gateway with built-in observability. [Weights & Biases](https://wandb.ai/) — experiment tracking, extends to LLM eval.

[LangSmith docs](https://docs.smith.langchain.com/) · [Langfuse docs](https://langfuse.com/docs) · [Arize Phoenix](https://phoenix.arize.com/) · [Portkey docs](https://portkey.ai/docs)

---

### 17. Caching and Cost Optimisation

LLM calls are slow and expensive. Caching is the single highest-leverage optimisation for both.

**Exact-match caching:**
Same input → same output. Hash the prompt, store the response, return it on a cache hit. Works for deterministic queries (structured extraction, classification). Use Redis, memcached, or a simple database table.

**Semantic caching:**
Near-identical inputs → same output. Embed the query, search a cache of previous query embeddings, return the response if similarity is above a threshold. More complex to build but catches paraphrased questions. Libraries like [GPTCache](https://github.com/zilliztech/GPTCache) provide this out of the box.

**Prompt caching (provider-level):**
Anthropic and OpenAI offer prompt caching — repeated prefixes (system prompts, large context) are cached server-side and charged at reduced rates. No code change needed beyond structuring your prompts so the static parts come first.

**KV-cache reuse:**
When self-hosting, the model's key-value cache from the attention layers can be reused for prompts that share a prefix. vLLM handles this automatically. Significant latency reduction for high-throughput serving.

**Other cost levers:**
- **Model tiering** — route simple queries to cheap models, complex ones to expensive models. A classifier or heuristic at the edge decides.
- **Batching** — OpenAI Batch API runs requests asynchronously at 50% cost. Use for offline processing, evals, bulk classification.
- **Output length control** — set `max_tokens` appropriately. Don't pay for 4000 tokens when 200 will do.
- **Distillation** — fine-tune a small model to mimic a large model's behaviour on your specific task. Significant cost reduction at scale.

Track cost per feature, per user, per query tier. If you can't attribute cost, you can't optimise it.

---

### 18. Deployment and Infrastructure

Your system works locally. Now make it accessible, reliable, and scalable.

**Containerisation:**
Package your app with Docker. Include your application code, dependencies, and configuration. Don't include model weights in the image — load them at startup or serve from a separate inference endpoint.

**Deployment options — pick based on your scale:**
- **Serverless** (AWS Lambda, Google Cloud Functions, Vercel, Modal) — zero infra management, pay-per-invocation. Good for low-to-medium traffic. Cold starts can hurt TTFT.
- **Container platforms** (Cloud Run, ECS, Fly.io, Railway) — more control, persistent processes, better for streaming and WebSocket connections.
- **GPU instances** (for self-hosted models) — AWS/GCP/Lambda Labs/RunPod for inference. Use vLLM or TGI (Text Generation Inference) as the serving layer.

**API design for LLM backends:**
- Expose your agent as an API with clear input/output contracts
- Rate limit your own endpoints — don't let a single user exhaust your provider budget
- Use API keys or auth tokens — LLM calls cost money; unauthenticated endpoints are a billing risk
- Return streaming responses via SSE (Module 15) — not just final results

**Load testing:**
LLM backends have different bottlenecks than traditional APIs — latency is dominated by inference time, not your code. Test with realistic payloads. Know your throughput limit before users find it.

**Infrastructure monitoring:**
Combine LLMOps (Module 16) with traditional infrastructure metrics: CPU/GPU utilisation, memory, request queue depth, error rates. Set up alerts before launch, not after the first incident.

[Docker docs](https://docs.docker.com/) · [Modal](https://modal.com/) · [Fly.io](https://fly.io/) · [vLLM](https://docs.vllm.ai/) · [TGI](https://huggingface.co/docs/text-generation-inference) · [LitServe](https://github.com/Lightning-AI/LitServe)

---

## Study Path

No single course covers the full curriculum. This sequences the best parts of each.

**Phase 1 — Foundations** (Modules 1–3)
[Karpathy Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) — videos 1–4 only; optional if you're focused on building, not understanding models from scratch
[Anthropic Prompt Engineering](https://github.com/anthropics/prompt-eng-interactive-tutorial) — all 9 chapters; the best single resource for Modules 2–3

**Phase 2 — Retrieval** (Modules 4–5)
[DeepLearning.AI Vector Databases](https://www.deeplearning.ai/short-courses/vector-databases-embeddings-applications/) — full course, covers Module 4
[DeepLearning.AI Advanced RAG](https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/) — full course; focus on chunking and eval patterns, skip LlamaIndex abstractions

**Phase 3 — Systems** (Modules 6–9)
[AI Agents in LangGraph](https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/) — full course; covers tool calling, agents, and memory together — skip the standalone memory course, heavy overlap
[MCP with Anthropic](https://www.deeplearning.ai/short-courses/mcp-build-rich-context-ai-apps-with-anthropic/) — full course; do this after the agents course

**Phase 4 — Evaluation** (Module 10)
[Intro to LangSmith](https://www.deeplearning.ai/short-courses/intro-to-langsmith/) — full course; pair with RAGAS docs for scoring patterns

**Phase 5 — Open-Source and Multimodal** (Modules 11–12)
[Hugging Face NLP Course](https://huggingface.co/learn/nlp-course) — chapters 1–4; understand transformers, tokenizers, and the Hugging Face ecosystem
[DeepLearning.AI: Building Multimodal Search and RAG](https://www.deeplearning.ai/short-courses/building-multimodal-search-and-rag/) — full course; covers multimodal embeddings and retrieval

**Phase 6 — Fine-Tuning** (Module 13)
[DeepLearning.AI: Finetuning Large Language Models](https://www.deeplearning.ai/short-courses/finetuning-large-language-models/) — full course; covers data prep, training, and evaluation
[Hugging Face PEFT docs](https://huggingface.co/docs/peft) — for LoRA/QLoRA on open models

**Phase 7 — Production** (Modules 14–18)
[OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — read the full list; this is your safety checklist
[DeepLearning.AI: LLMOps](https://www.deeplearning.ai/short-courses/llmops/) — full course; covers deployment, monitoring, and automation pipelines

**Certification:** [Anthropic Claude Academy](https://academy.anthropic.com/)

---

## Capstone: Research Oracle

Build a multi-turn agent that answers questions about a document corpus, pulls in live data when needed, cites every claim, and evaluates its own outputs. Build it incrementally — by Module 10 all layers should be live. Extend with Modules 11–18 for production hardening.

**Constraints (these are the point):**
- Target cost ≤ $0.10 per query end-to-end — model selection and caching matter
- `web_search` returns empty results 20% of the time — your system must not hallucinate in those cases
- Two documents in your corpus contradict each other — surface the conflict, don't silently pick one

### System

1. **Query rewriting** — restate the question to improve retrieval recall before searching

2. **Retrieval** — embed → search corpus → rerank → return top-k chunks. Index at least 20–30 documents. Return "I don't know" explicitly if retrieval confidence is below threshold — don't pass weak context to the model.

3. **Agent loop** — max 5 steps. Available tools: `web_search(query)`, `calculator(expression)`, `summarise_doc(url)`. Truncate tool output above 500 tokens before injecting. Cite which tool produced which context.

4. **Memory** — retrieve the 3 most relevant prior exchanges for the session. Inject above retrieved chunks, below the system prompt. Persist the new exchange after responding.

5. **Critic** — a second model call before returning: does every citation exist in the retrieved context? Does the confidence level match the evidence? Revise or flag low-confidence answers — don't return unverified claims.

6. **Structured output** — validate every response against `{ answer, citations[], confidence, follow_up_questions[] }`. Retry once on schema failure.

7. **Response to user** — stream the response (Module 15). Show tool activity during the agent loop.

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
- Accept image uploads: extract text via vision model, index alongside documents (Module 12)
- Deploy behind an API with auth, rate limiting, and cost tracking (Module 18)
- Add input/output guardrails: PII redaction, content moderation, prompt injection detection (Module 14)
- Run evals in CI — block merges that regress quality below the minimum bar (Module 10)

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
| [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | Security risks specific to LLM systems — prompt injection, data leakage, supply chain |

**Frameworks** — study as reference implementations, not mandatory dependencies:

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

---
