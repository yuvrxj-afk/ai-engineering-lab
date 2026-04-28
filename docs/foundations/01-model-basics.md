# 1. Model Basics

Understand tokens, inference, and sampling. Call the API with factual, creative, and instruction prompts. Sweep `temperature` and compare outputs. Learn `top_p` and `top_k` — know when to adjust each and when to leave them alone.

## Token Economics

Count tokens before sending. Every provider charges per token — know your model's pricing, context window limit, and how to estimate cost per call. Use a tokenizer library (tiktoken for OpenAI, Anthropic's token counter) to verify what you're actually sending.

## Day-One Realities

Also learn: how to handle 429 rate-limit errors (exponential backoff), when a smaller/cheaper model is good enough, and how batching API calls (OpenAI Batch API) cuts cost by 50% when latency doesn't matter. You'll hit all three on day one.

## The Provider Landscape

Know the landscape: OpenAI (GPT-4o, o-series), Anthropic (Claude), Google (Gemini), Meta (Llama), Mistral, Cohere, and DeepSeek are the providers that matter today. Each has different strengths — don't marry one.

!!! tip "Start here"
    Pick one provider, make one API call, print the response. That's Module 1 done at the minimum. Everything else in this module is depth.

## Resources

[OpenAI docs](https://platform.openai.com/docs) · [Anthropic docs](https://docs.anthropic.com) · [Google Gemini docs](https://ai.google.dev/docs) · [The Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) · [Tiktokenizer](https://tiktokenizer.vercel.app/)
