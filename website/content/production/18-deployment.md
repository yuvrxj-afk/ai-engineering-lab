# 18. Deployment and Infrastructure

Your system works locally. Now make it accessible, reliable, and scalable.

## Containerisation

Package your app with Docker. Include your application code, dependencies, and configuration. Don't include model weights in the image — load them at startup or serve from a separate inference endpoint.

## Deployment Options

Pick based on your scale:

| Option | When to use |
|--------|------------|
| **Serverless** (AWS Lambda, Google Cloud Functions, Vercel, Modal) | Low-to-medium traffic. Zero infra management. Cold starts can hurt TTFT. |
| **Container platforms** (Cloud Run, ECS, Fly.io, Railway) | More control, persistent processes. Better for streaming and WebSockets. |
| **GPU instances** (AWS/GCP/Lambda Labs/RunPod) | Self-hosted models. Use vLLM or TGI as the serving layer. |

## API Design for LLM Backends

- Expose your agent as an API with clear input/output contracts
- Rate limit your own endpoints — don't let a single user exhaust your provider budget
- Use API keys or auth tokens — LLM calls cost money; unauthenticated endpoints are a billing risk
- Return streaming responses via SSE ([Module 15](15-streaming.md)) — not just final results

## Load Testing

LLM backends have different bottlenecks than traditional APIs — latency is dominated by inference time, not your code. Test with realistic payloads. Know your throughput limit before users find it.

## Infrastructure Monitoring

Combine LLMOps ([Module 16](16-observability.md)) with traditional infrastructure metrics: CPU/GPU utilisation, memory, request queue depth, error rates. Set up alerts before launch, not after the first incident.

## Resources

[Docker docs](https://docs.docker.com/) · [Modal](https://modal.com/) · [Fly.io](https://fly.io/) · [vLLM](https://docs.vllm.ai/) · [TGI](https://huggingface.co/docs/text-generation-inference) · [LitServe](https://github.com/Lightning-AI/LitServe)
