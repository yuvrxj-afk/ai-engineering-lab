# 6. Tool Calling

Let the model pick and invoke tools. Build at least three: a calculator, a live HTTP call (e.g. [Open-Meteo](https://open-meteo.com), no key needed), and a text formatter. The model must route correctly and handle a tool error gracefully.

## Watch For

- Tool output too large to fit in context — truncate before returning
- The model picking the wrong tool on ambiguous queries
- External providers fail in ways your model can't "reason" around

## Reliability Patterns

Apply these immediately:

| Pattern | Purpose |
|---------|---------|
| **Retries with backoff + jitter** | Transient errors (timeouts, 429s, some 5xx) |
| **Fallback chains** | Cheaper → stronger, or Provider A → Provider B |
| **Circuit breakers** | Prevent a failing provider from cascading into an incident |

## Resources

[OpenAI function calling](https://platform.openai.com/docs/guides/function-calling) · [Claude tool use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
