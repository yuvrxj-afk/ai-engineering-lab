# 10. Evaluation, Testing, and Integration

Build a golden set of 10–20 queries. Score an early RAG baseline with manual review and an LLM-as-judge. Re-score the full stack and track changes — regressions should be visible before you ship, not after.

## LLM-as-Judge

LLM-as-judge is fast but has known failure modes: it favors longer answers, and the same model scoring its own output has self-serving bias. Cross-check scores against your manual judgements before trusting it.

## Testing Without Burning Credits

Add "no surprise engineering" tests so you can iterate without burning credits:

- **Unit tests**: `pytest` basics (assertions, fixtures) or your TS equivalent
- **Integration tests without paid calls**: mock providers + monkeypatch/stubs; record/replay only when needed
- **Rate limit realism**: your limiter working can look like "failures" unless you interpret 429 correctly (especially in load tests)

## CI/CD for AI Apps

- Run evals in CI — a failing eval blocks merge just like a failing test
- Version your prompts alongside code (same repo, same PR)
- Track eval scores over time — a dashboard or CSV that shows trends across commits
- Separate fast tests (unit, mocked integration) from slow tests (live API evals) in your pipeline

## Integration

Then wire everything into one path:

```
query rewriting → retrieval → agent loop → tools → memory → validated structured output → response
```

## Resources

[OpenAI Evals](https://github.com/openai/evals) · [RAGAS](https://docs.ragas.io/) · [LangSmith](https://docs.smith.langchain.com/) · [Anthropic eval guide](https://docs.anthropic.com/en/docs/test-and-evaluate/eval-overview) · [Braintrust](https://www.braintrustdata.com/)
