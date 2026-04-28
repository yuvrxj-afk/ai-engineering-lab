# 16. Observability and LLMOps

You can't fix what you can't see. Production LLM systems need the same observability as any backend service — plus LLM-specific signals.

## What to Trace

- Every LLM call: model, input tokens, output tokens, latency, cost, status
- Every retrieval: query, results returned, reranking scores
- Every tool call: which tool, input, output, duration, success/failure
- Every guardrail check: what was flagged and why
- End-to-end traces that link all of the above for a single user request

## What to Alert On

- Latency spikes (p50, p95, p99)
- Error rate increases
- Cost per query trending up
- Eval score regressions (run evals on a schedule, not just in CI)
- Guardrail trigger rate changes — a spike means something changed

## Prompt Management

Version prompts in code (same repo, same PR). Tag each LLM call with the prompt version. When quality drops, you need to know which prompt change caused it. Some teams use prompt registries — only adopt one if git isn't enough.

## A/B Testing

Route a percentage of traffic to a new prompt or model. Compare quality scores, latency, and cost. Don't A/B test without evals — you'll have data but no signal.

## Tools

| Tool | Strengths |
|------|-----------|
| [LangSmith](https://docs.smith.langchain.com/) | Tracing, evals, prompt playground |
| [Langfuse](https://langfuse.com/) | Open-source alternative |
| [Arize Phoenix](https://phoenix.arize.com/) | Open-source, strong on retrieval analysis |
| [Portkey](https://portkey.ai/) | Gateway with built-in observability |
| [Weights & Biases](https://wandb.ai/) | Experiment tracking, extends to LLM eval |

## Resources

[LangSmith docs](https://docs.smith.langchain.com/) · [Langfuse docs](https://langfuse.com/docs) · [Arize Phoenix](https://phoenix.arize.com/) · [Portkey docs](https://portkey.ai/docs)
