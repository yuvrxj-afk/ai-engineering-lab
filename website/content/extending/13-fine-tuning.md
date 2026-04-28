# 13. Fine-Tuning

Fine-tuning changes model weights so it behaves differently by default — without needing the instructions in every prompt. It's the third tool alongside prompting and RAG for customising model behaviour. Most teams don't need it, but you need to know when you do.

## When to Fine-Tune vs. Not

| Approach | Use when |
|----------|----------|
| **Prompting** | Handles most tasks. Try it first. |
| **RAG** | Knowledge that changes. Don't fine-tune facts into the model. |
| **Fine-tuning** | Model needs to *consistently* adopt a style, format, or domain behaviour that's hard to prompt reliably — or you need to shrink a large model's capability into a smaller, cheaper one. |

## How It Works

1. **Prepare a training dataset**: input-output pairs in the format your provider expects (JSONL with messages). Quality > quantity — 50 excellent examples beat 5000 sloppy ones.
2. **Upload and train**. OpenAI and Anthropic offer hosted fine-tuning. For open models, use Hugging Face Transformers + PEFT.
3. **Evaluate** the fine-tuned model against your base model on a held-out test set. If it's not measurably better, revert.

## Parameter-Efficient Fine-Tuning (PEFT)

Full fine-tuning is expensive. **LoRA** (Low-Rank Adaptation) and **QLoRA** (quantised LoRA) train a small number of adapter weights instead of the full model. This is how you fine-tune a 70B model on a single GPU. Learn these if you're working with open models.

## Pitfalls

!!! danger "Things that go wrong"
    - **Bad data** makes the model confidently worse
    - **Overfitting** on small datasets — the model memorises instead of generalising
    - **Catastrophic forgetting** — the model loses general capabilities. Evaluate broadly, not just on your task.
    - **Cost**: training runs cost money and time. Budget for multiple iterations.

## Resources

[OpenAI fine-tuning](https://platform.openai.com/docs/guides/fine-tuning) · [Hugging Face PEFT](https://huggingface.co/docs/peft) · [QLoRA paper](https://arxiv.org/abs/2305.14314) · [Anthropic fine-tuning](https://docs.anthropic.com/en/docs/build-with-claude/fine-tuning) · [Axolotl](https://github.com/axolotl-ai-cloud/axolotl)
