# Setup

1. **Get an API key** from [OpenAI](https://platform.openai.com/api-keys) or [Anthropic](https://console.anthropic.com/settings/keys)
2. **Store in `.env`**, load with `dotenv` — never hard-code credentials
3. **Python 3.10+** or **Node 18+**
4. **Smoke test**: one API call that prints a response

!!! warning "Never commit API keys"
    Add `.env` to your `.gitignore`. Leaked keys get scraped within minutes.
