# 17. Caching and Cost Optimisation

LLM calls are slow and expensive. Caching is the single highest-leverage optimisation for both.

## Caching Strategies

| Strategy | How it works | Best for |
|----------|-------------|----------|
| **Exact-match** | Hash the prompt, store the response, return on cache hit | Deterministic queries (extraction, classification) |
| **Semantic** | Embed the query, match against cached embeddings by similarity | Paraphrased questions |
| **Prompt caching** (provider-level) | Anthropic/OpenAI cache repeated prefixes server-side at reduced rates | Large system prompts, repeated context |
| **KV-cache reuse** | Reuse attention key-value cache for shared prefixes (self-hosting) | High-throughput serving with vLLM |

For exact-match: use Redis, memcached, or a simple database table.

For semantic: libraries like [GPTCache](https://github.com/zilliztech/GPTCache) provide this out of the box.

For prompt caching: no code change needed beyond structuring your prompts so the static parts come first.

## Other Cost Levers

- **Model tiering** — route simple queries to cheap models, complex ones to expensive models. A classifier or heuristic at the edge decides.
- **Batching** — OpenAI Batch API runs requests asynchronously at 50% cost. Use for offline processing, evals, bulk classification.
- **Output length control** — set `max_tokens` appropriately. Don't pay for 4000 tokens when 200 will do.
- **Distillation** — fine-tune a small model to mimic a large model's behaviour on your specific task. Significant cost reduction at scale.

!!! info "Track everything"
    Track cost per feature, per user, per query tier. If you can't attribute cost, you can't optimise it.
