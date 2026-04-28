# 11. Open-Source and Local Models

Not every workload should hit a paid API. Open-weight models run on your hardware — no data leaves your network, no per-token cost after setup, no rate limits.

## Getting Started

Start with [Ollama](https://ollama.com/) — one command to download and serve Llama, Mistral, Gemma, or DeepSeek locally. Use the OpenAI-compatible API so your existing code works with a URL change. [LM Studio](https://lmstudio.ai/) adds a GUI if you prefer it.

## Models to Know

| Model | Strengths |
|-------|-----------|
| **Llama 3** (Meta) | Default open-weight choice. 8B for local dev, 70B+ for production. |
| **Mistral / Mixtral** | Fast, efficient, strong at code. Mixtral is mixture-of-experts. |
| **DeepSeek** | Competitive with closed models on reasoning tasks |
| **Gemma** (Google) | Small, efficient, good for edge deployment |
| **Qwen** (Alibaba) | Strong multilingual and code performance |

## Hugging Face Hub

[Hugging Face Hub](https://huggingface.co/models) is the registry — models, datasets, and spaces. Learn to navigate model cards, understand quantisation levels (Q4, Q5, Q8 — smaller = faster but less accurate), and pick the right model size for your hardware.

## Browser and Edge

[Transformers.js](https://huggingface.co/docs/transformers.js) runs models in the browser via WebAssembly/WebGPU. Small embedding and classification models work; large generative models don't — yet.

## When to Go Open vs. Closed

Use closed APIs for best quality and fastest iteration. Use open models when:

- Data privacy requires it
- Latency needs on-premise inference
- Cost at scale makes per-token pricing unsustainable
- You need to fine-tune ([Module 13](13-fine-tuning.md))

## Resources

[Ollama](https://ollama.com/) · [LM Studio](https://lmstudio.ai/) · [Hugging Face Hub](https://huggingface.co/) · [vLLM](https://docs.vllm.ai/) · [Transformers.js](https://huggingface.co/docs/transformers.js)
