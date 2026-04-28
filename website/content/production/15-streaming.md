# 15. Streaming and Real-Time UX

Users see a blank screen for 3 seconds and assume it's broken. Streaming changes that — tokens appear as they're generated. Every production LLM app uses streaming. If yours doesn't, fix that.

## Server-Sent Events (SSE)

The standard transport for token streaming. The API sends one event per token (or small chunk). Your frontend renders incrementally. OpenAI and Anthropic both support `stream: true` — the SDK returns an async iterator.

## Implementing Streaming End-to-End

1. **Backend**: set `stream: true` on the API call. Iterate over chunks and forward each via SSE or WebSocket to the client.
2. **Frontend**: consume the stream and append to the UI. Handle connection drops — reconnect and resume gracefully.
3. **Structured output + streaming**: you can't validate JSON until the stream completes. Parse incrementally (partial JSON parsing) or validate after completion and display a loading state for the structured fields.

## Key Metrics

| Metric | What it measures |
|--------|------------------|
| **Time to first token (TTFT)** | How long before the user sees anything. Optimise this. |
| **Tokens per second** | Throughput. Varies by model and provider. Smaller models stream faster. |

!!! tip "Optimising TTFT"
    Prompt caching, smaller first-pass models, and edge routing all help reduce time to first token.

## Tool Calls During Streaming

The model pauses generation to call a tool. Show the user what's happening — "Searching...", "Calculating..." — rather than a frozen stream. Most SDKs emit tool-call events you can surface in the UI.

## Resources

[OpenAI streaming](https://platform.openai.com/docs/api-reference/streaming) · [Anthropic streaming](https://docs.anthropic.com/en/api/messages-streaming) · [Vercel AI SDK](https://sdk.vercel.ai/docs) — handles streaming, tool calls, and UI integration out of the box
