# Backend API Configuration

## Environment Variables

Configure the following environment variables in your `.env` file:

### AI Provider Selection

```env
# Choose which AI provider to use: 'gemini', 'zai', or 'openrouter'
AI_PROVIDER=gemini
```

### Gemini (Google's Free Tier)

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

- **Model**: `gemini-1.5-flash`
- **Get API Key**: https://ai.google.dev
- **Free Tier**: 15 requests/minute, limited to 1.5M tokens/day
- **Features**: Text, Image, Audio support

### Z.AI (Free Tier - GLM-4-Flash)

```env
ZAI_API_KEY=your_zai_api_key_here
```

- **Model**: `glm-4-flash`
- **Get API Key**: https://z.ai
- **Free Tier**: Very generous free tier, no rate limits initially
- **Features**: Text processing
- **Speed**: Fast and lightweight

### OpenRouter (Multiple Models, Free Tier Available)

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-lite
```

- **Default Model**: `google/gemini-2.0-flash-lite` (free tier)
- **Get API Key**: https://openrouter.ai
- **Free Tier**: $5 monthly free credits
- **Features**: Access to 200+ models from different providers
- **Alternative Models**:
  - `meta-llama/llama-3-70b-instruct` (free)
  - `mistralai/mistral-7b-instruct` (free)
  - `nousresearch/nous-hermes-2-mixtral-8x7b-dpo` (free)

## API Endpoints

### Provider Management

- `GET /api/settings/provider` - Get current provider and available providers
- `POST /api/settings/provider` - Switch to a different provider
  ```json
  { "provider": "zai" }
  ```
- `GET /api/settings/providers-info` - Get detailed info about all providers

### Existing Job Evaluation

- `POST /api/evaluate` - Evaluate job fit against CV
- `POST /api/tailor` - Tailor CV for a specific job
- `POST /api/assistant` - Vera AI assistant (chat/voice)
- `POST /api/match-stories` - Match stories to job requirements
- `POST /api/agent/discover` - Generate job search queries
- `POST /api/extract-cv` - Extract text from CV documents

## Quick Start

1. **Copy environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Add your API keys** to the `.env` file

3. **Choose your primary provider**:

   ```bash
   echo "AI_PROVIDER=zai" >> .env
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Start the backend**:
   ```bash
   npm start
   ```

## Switching Providers at Runtime

You can switch providers on the fly without restarting:

```bash
# Get current provider
curl http://localhost:3000/api/settings/provider

# Switch to Z.AI
curl -X POST http://localhost:3000/api/settings/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "zai"}'

# Switch to OpenRouter
curl -X POST http://localhost:3000/api/settings/provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "openrouter"}'
```

## Cost Comparison

| Provider       | Cost                        | Best For                     | Speed     |
| -------------- | --------------------------- | ---------------------------- | --------- |
| **Gemini**     | Free (15 req/min)           | Production, Images/Audio     | Fast      |
| **Z.AI**       | Free (Generous)             | High volume, Budget-friendly | Very Fast |
| **OpenRouter** | Free + Paid ($5/month free) | Model variety, Testing       | Varies    |

## Troubleshooting

### "API Key not configured" error

- Verify the API key is in your `.env` file
- Check that the env var name matches (e.g., `GEMINI_API_KEY` vs `ZAI_API_KEY`)
- Restart the server after changing `.env`

### Slow responses

- Check your provider's rate limits
- Try switching to a different provider
- Verify network connectivity

### No available providers

- Make sure at least one API key is configured
- Check the logs: `npm start` will show which providers are available on startup
