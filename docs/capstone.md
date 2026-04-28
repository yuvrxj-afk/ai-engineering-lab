# Capstone: Research Oracle

Build a multi-turn agent that answers questions about a document corpus, pulls in live data when needed, cites every claim, and evaluates its own outputs. Build it incrementally — by Module 10 all layers should be live. Extend with Modules 11–18 for production hardening.

## Constraints

These are the point:

- Target cost **<= $0.10 per query** end-to-end — model selection and caching matter
- `web_search` returns empty results **20% of the time** — your system must not hallucinate in those cases
- Two documents in your corpus **contradict each other** — surface the conflict, don't silently pick one

## System

### 1. Query Rewriting

Restate the question to improve retrieval recall before searching.

### 2. Retrieval

Embed → search corpus → rerank → return top-k chunks. Index at least 20–30 documents. Return "I don't know" explicitly if retrieval confidence is below threshold — don't pass weak context to the model.

### 3. Agent Loop

Max 5 steps. Available tools:

| Tool | Signature |
|------|-----------|
| `web_search` | `web_search(query)` |
| `calculator` | `calculator(expression)` |
| `summarise_doc` | `summarise_doc(url)` |

Truncate tool output above 500 tokens before injecting. Cite which tool produced which context.

### 4. Memory

Retrieve the 3 most relevant prior exchanges for the session. Inject above retrieved chunks, below the system prompt. Persist the new exchange after responding.

### 5. Critic

A second model call before returning: does every citation exist in the retrieved context? Does the confidence level match the evidence? Revise or flag low-confidence answers — don't return unverified claims.

### 6. Structured Output

Validate every response against:

```json
{
  "answer": "string",
  "citations": ["string"],
  "confidence": "number",
  "follow_up_questions": ["string"]
}
```

Retry once on schema failure.

### 7. Response to User

Stream the response ([Module 15](production/15-streaming.md)). Show tool activity during the agent loop.

---

## Evaluation

Build a golden set of **15 questions** across three tiers:

| Tier | Description | Count |
|------|------------|-------|
| **Tier 1** | Answerable from the corpus, no tools needed | 5 |
| **Tier 2** | Require a tool call | 5 |
| **Tier 3** | Multi-hop: retrieval + tool + memory from a prior turn | 5 |

Score each iteration: manual pass/fail on accuracy, LLM-as-judge on citation quality (0–2), schema first-pass validity. Track in a CSV — a regression in Tier 1 while improving Tier 3 is signal.

**Minimum bar:** Tier 1 >= 4/5 · Tier 2 >= 3/5 · Tier 3 >= 2/5 · Schema validity >= 85%

---

## Stretch Goals

- [ ] Expose corpus search as an MCP server consumed by the agent
- [ ] Instrument every layer with LangSmith — per-layer latency and failure rate
- [ ] Add semantic caching: near-identical queries skip the full pipeline
- [ ] Accept image uploads: extract text via vision model, index alongside documents ([Module 12](extending/12-multimodal.md))
- [ ] Deploy behind an API with auth, rate limiting, and cost tracking ([Module 18](production/18-deployment.md))
- [ ] Add input/output guardrails: PII redaction, content moderation, prompt injection detection ([Module 14](production/14-safety.md))
- [ ] Run evals in CI — block merges that regress quality below the minimum bar ([Module 10](systems/10-evaluation.md))
