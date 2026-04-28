# 12. Multimodal AI

Most production AI systems in 2026 handle more than text. If you've only built text-in-text-out, this module fills the gap.

## Vision — Image Understanding

Send an image to the model alongside a text prompt. GPT-4o, Claude, and Gemini all accept images natively. Use cases: document extraction (receipts, forms, diagrams), visual QA, image classification without training a custom model. Start by sending a screenshot and asking the model to describe it — then try structured extraction.

## Image Generation

DALL-E 3 (via API), Stable Diffusion (open-source, run locally), and Midjourney (no API). For programmatic use: DALL-E API or Stability AI's API. Understand that generation is a separate model from understanding — the same system prompt patterns don't apply.

## Audio — Speech-to-Text and Text-to-Speech

[OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text) (API or local) is the standard for transcription. Handle long audio by chunking into segments. Text-to-speech: OpenAI TTS API, ElevenLabs, or open-source Bark/Coqui.

!!! warning "Voice cloning"
    Voice cloning raises ethical and legal questions — know the boundaries.

## Video Understanding

Extract frames, send as image sequence with timestamps. Gemini handles long video natively. For others, sample keyframes and process as images. Video is expensive in tokens — be selective about what you send.

## Multimodal RAG

Embed images alongside text using multimodal embedding models (Cohere Multimodal, Jina CLIP). Store in the same vector DB. Retrieve across modalities — a text query can surface relevant images, and vice versa.

## Resources

[OpenAI Vision](https://platform.openai.com/docs/guides/vision) · [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text) · [OpenAI TTS](https://platform.openai.com/docs/guides/text-to-speech) · [DALL-E API](https://platform.openai.com/docs/guides/images) · [Gemini multimodal](https://ai.google.dev/gemini-api/docs/vision) · [Stable Diffusion](https://stability.ai/) · [Hugging Face multimodal models](https://huggingface.co/models?pipeline_tag=image-to-text)
