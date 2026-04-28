# 7. Agents

Build a multi-step loop: goal → step → optional tool or retrieval → observation → repeat. Enforce a step cap.

## Failure Modes

This is where most systems break. Know the failure modes before you hit them:

- **Tool failure** — the tool errors or times out. Retry once, then move on or surface it — never silently loop.
- **Runaway loop** — the agent revisits the same step repeatedly. A step cap stops it; logging every step makes it diagnosable.
- **Context overflow** — mid-loop, earlier context gets pushed out of the window as the transcript grows. Summarize older steps when the loop runs long.
- **False completion** — the agent declares success without finishing. Your termination condition should verify the output, not trust the model's self-assessment.
- **Provider degradation** — latency spikes and partial outages happen. Use fallbacks and circuit breakers; don't let the agent "thrash" on retries.

!!! info "Key insight"
    Most reliability issues in agents are control flow, not model capability.

## Beyond Single Agents

- **Multi-agent architectures** — orchestrator delegates to specialist sub-agents (researcher, coder, reviewer). Each agent has a focused system prompt and tool set. Adds complexity — only use when a single agent's context or tool set becomes unwieldy.
- **Human-in-the-loop** — some decisions shouldn't be automated. Build approval gates for high-stakes actions (sending emails, modifying data, spending money). Set confidence thresholds that route to human review.

## Agent SDKs

[OpenAI Agents SDK](https://openai.github.io/openai-agents-python/), [Claude Agent SDK](https://docs.anthropic.com/en/docs/agents/claude-agent-sdk), [Vercel AI SDK](https://sdk.vercel.ai/docs). These handle the loop, tool dispatch, and streaming for you — evaluate whether the abstraction helps or hides.

## Resources

[Anthropic agent overview](https://docs.anthropic.com/en/docs/build-with-claude/agents) · [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) · [ReAct paper](https://arxiv.org/abs/2210.03629)
