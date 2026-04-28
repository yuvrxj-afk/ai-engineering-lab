# 14. AI Safety and Guardrails

If your system faces users, it faces adversaries. This isn't theoretical — it's engineering.

## Prompt Injection

The primary attack surface. **Direct injection**: user inputs instructions that override your system prompt. **Indirect injection**: retrieved documents contain hidden instructions. Defences: input sanitisation, instruction hierarchy (system > user), separate parsing from execution, and never trust user input as instructions.

## Input Guardrails

Filter before the model sees it:

- **PII detection and redaction** (names, emails, SSNs) — use regex + NER models
- **Content moderation APIs** (OpenAI Moderation, Anthropic guardrails, Perspective API) to block toxic or harmful input
- **Topic classifiers** to reject out-of-scope queries
- **Rate limiting per user** to prevent abuse

## Output Guardrails

Filter before the user sees it:

- **Schema validation** (you learned this in [Module 3](../foundations/03-structured-output.md) — now apply it for safety)
- **Output classifiers** for harmful, biased, or off-topic content
- **Citation verification** — don't return claims without sources
- **Confidence thresholds** — low-confidence answers get flagged or blocked

## Guardrail Frameworks

| Framework | Approach |
|-----------|----------|
| [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) (NVIDIA) | Define conversational rails in a config file |
| [Guardrails AI](https://www.guardrailsai.com/) | Validators for specific output properties |
| [Anthropic constitutional AI](https://www.anthropic.com/index/constitutional-ai) | The model critiques its own output against principles |

## Bias and Fairness

LLMs inherit biases from training data. Test your system across demographic groups. Compare outputs for equivalent queries with different names, genders, or cultural contexts. This is testing, not philosophy.

## Regulatory Awareness

The EU AI Act classifies AI systems by risk level. Know which tier your application falls into. Data privacy laws (GDPR, CCPA) apply to LLM inputs and outputs — especially if you're storing conversations or fine-tuning on user data. End-user IDs in API calls help with audit trails and abuse detection.

## Resources

[OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) · [Guardrails AI](https://www.guardrailsai.com/) · [OpenAI Moderation](https://platform.openai.com/docs/guides/moderation) · [Anthropic safety](https://docs.anthropic.com/en/docs/build-with-claude/safety) · [EU AI Act overview](https://artificialintelligenceact.eu/)
