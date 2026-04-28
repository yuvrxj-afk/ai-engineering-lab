# 2. Prompting

Write prompts that reliably steer the model. Take unstructured text and produce a structured summary — first vague, then explicit. Move the same instructions from user turn to system prompt and observe the difference.

## Canonical Techniques

Learn the canonical techniques by name — you'll use all of them:

- **Zero-shot** — task description only, no examples. Start here; add complexity only when it fails.
- **Few-shot** — include 2–5 examples in the prompt. Example selection matters more than example count.
- **Chain-of-thought (CoT)** — ask the model to reason step by step before answering. Dramatically improves accuracy on math, logic, and multi-step problems. "Let's think step by step" is the simplest form; structured CoT with explicit reasoning fields is more reliable.
- **ReAct** (Reasoning + Acting) — interleave thinking and tool use. The model reasons about what to do, acts, observes the result, then reasons again. This is the pattern behind most agent loops ([Module 7](../systems/07-agents.md)).
- **Self-consistency** — run the same prompt multiple times with temperature > 0 and take the majority answer. Expensive but effective for high-stakes decisions.
- **Prompt chaining** — break complex tasks into a sequence of simpler prompts, each feeding into the next. More reliable than one mega-prompt.

## Failure Modes

Know the failure modes: hallucination (confident wrong answers), refusals, and output variance at non-zero temperature.

!!! warning "The 9/10 trap"
    A prompt that works 9 out of 10 times is not a good prompt.

## Resources

[OpenAI prompt engineering](https://platform.openai.com/docs/guides/prompt-engineering) · [Anthropic prompt engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) · [DAIR.AI Prompt Engineering Guide](https://www.promptingguide.ai/) · [ReAct paper](https://arxiv.org/abs/2210.03629) · [Chain-of-Thought paper](https://arxiv.org/abs/2201.11903)
