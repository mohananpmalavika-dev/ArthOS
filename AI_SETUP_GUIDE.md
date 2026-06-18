# AI Coach Setup Guide - Completely Free Options

Your ARTH.OS app now supports **6 completely free AI providers** with zero-cost hosting solutions.

## 🎯 Quick Decision Matrix

| Your Situation | Recommended | Setup Time |
|---|---|---|
| **Production (Vercel)** | HuggingFace | 2 min |
| **Development (Local)** | Ollama | 10 min |
| **Want simplest setup** | HuggingFace | 2 min |
| **Want best privacy** | Ollama | 10 min |
| **Want backup provider** | Any free option | 3 min |

---

## 🆓 FREE OPTIONS (No Credit Card Ever)

### Option 1: HuggingFace (RECOMMENDED FOR PRODUCTION) ⭐

**Perfect for:** Vercel, production deployments, serverless

**Setup (2 minutes):**
1. Go to https://huggingface.co/settings/tokens
2. Sign up (free, no credit card)
3. Click "New token"
4. Copy the token
5. Run: `node scripts/setup-ai-coach.js` → Select option 1

**Why use it:**
- ✅ Completely free
- ✅ No credit card ever
- ✅ Works on Vercel serverless
- ✅ Instant setup
- ✅ Production-ready

**Configuration:**
```bash
HUGGINGFACE_API_KEY=hf_xxxxx
AI_PROVIDER=huggingface
```

---

### Option 2: Ollama (RECOMMENDED FOR DEVELOPMENT) 🏠

**Perfect for:** Local development, complete privacy, learning

**Setup (10 minutes):**
1. Download from https://ollama.ai
2. Install the app
3. Run in terminal:
   ```bash
   ollama pull neural-chat
   ollama serve
   ```
4. App auto-detects at `http://localhost:11434`

**Why use it:**
- ✅ 100% free forever
- ✅ No internet required
- ✅ Complete privacy (data stays local)
- ✅ No rate limits
- ✅ Perfect for testing

**Model options:**
- `neural-chat` (1.1GB) - **RECOMMENDED**
- `mistral` (4GB)
- `llama2` (3.8GB)
- `orca-mini` (1.3GB)

**Configuration:**
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
AI_PROVIDER=ollama
```

---

### Option 3: Together AI 

**Perfect for:** Backup provider, free credits

**Setup (3 minutes):**
1. Go to https://www.together.ai
2. Sign up for free
3. Get your API key
4. Run: `node scripts/setup-ai-coach.js` → Select option 2

**Why use it:**
- ✅ Free credits for new users
- ✅ No credit card initially
- ✅ Good model quality
- ✅ Easy integration

---

### Option 4: Replicate

**Perfect for:** Free tier access, LLaMA 2

**Setup (3 minutes):**
1. Go to https://replicate.com/api
2. Sign up for free
3. Get your API token
4. Run: `node scripts/setup-ai-coach.js` → Select option 3

**Why use it:**
- ✅ Free tier available
- ✅ No credit card for free tier
- ✅ LLaMA 2 available
- ✅ Easy to use

---

### Option 5: Mistral

**Perfect for:** Free tier, open source model

**Setup (3 minutes):**
1. Go to https://console.mistral.ai
2. Sign up for free
3. Generate API key
4. Run: `node scripts/setup-ai-coach.js` → Select option 5

**Why use it:**
- ✅ Free tier available
- ✅ No credit card
- ✅ Open source Mistral model
- ✅ Good quality

---

## 🚀 QUICK START BY DEPLOYMENT TYPE

### For Vercel Production

```bash
# Step 1: Get HuggingFace token (free, no credit card)
# https://huggingface.co/settings/tokens

# Step 2: Add to Vercel environment variables
HUGGINGFACE_API_KEY=hf_xxxxx

# Step 3: Deploy
# App automatically uses HuggingFace
```

### For Local Development

```bash
# Step 1: Download Ollama
# https://ollama.ai

# Step 2: Run
ollama pull neural-chat
ollama serve

# Step 3: In .env (optional, auto-detected):
AI_PROVIDER=auto
# or explicitly:
AI_PROVIDER=ollama

# Step 4: Start dev server
npm run dev
```

### For Self-Hosted Server

```bash
# Option A: Use HuggingFace (recommended)
HUGGINGFACE_API_KEY=hf_xxxxx
AI_PROVIDER=huggingface

# Option B: Run Ollama on server
ollama serve  # On your server
OLLAMA_BASE_URL=http://your-server:11434
AI_PROVIDER=ollama
```

---

## 🔧 Interactive Setup

For easiest setup, just run:

```bash
node scripts/setup-ai-coach.js
```

This wizard will:
1. Ask which provider you want
2. Guide you to get the API key (if needed)
3. Automatically update your `.env`
4. Confirm setup is complete

---

## 📊 Provider Comparison

| Feature | HuggingFace | Ollama | Together | Replicate | Mistral |
|---------|---|---|---|---|---|
| **Cost** | FREE | FREE | FREE | FREE | FREE |
| **Credit Card** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Setup Time** | 2 min | 10 min | 3 min | 3 min | 3 min |
| **Internet** | Yes | No | Yes | Yes | Yes |
| **Best For** | Production | Development | Backup | Backup | Backup |
| **Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |

---

## 🎯 Recommended Setups

### Production on Vercel
```bash
AI_PROVIDER=auto
HUGGINGFACE_API_KEY=hf_xxxxx
# (Have Together/Replicate as backups)
```

### Development
```bash
AI_PROVIDER=ollama
# (Ollama running locally)
```

### Both (Development + Production)
```bash
# .env (Development)
AI_PROVIDER=ollama

# Environment variables on Vercel
HUGGINGFACE_API_KEY=hf_xxxxx
AI_PROVIDER=auto
```

---

## 🆘 Troubleshooting

### "I don't know which provider to choose"
→ **Use HuggingFace**. It's the simplest and works everywhere.

### "I want to test before using API key"
→ **Use Ollama**. Download it, run `ollama serve`, no keys needed.

### "HuggingFace says API error"
→ Check your token is:
- Copied fully (no spaces)
- Still valid (check at https://huggingface.co/settings/tokens)
- Set correctly in `.env` or environment variables

### "Ollama says connection refused"
→ Make sure Ollama is running:
```bash
ollama serve
```

### "App says no AI available"
→ Check `.env`:
- At least one provider API key is set AND valid
- OR Ollama is running at localhost:11434
- Restart the app

### "Which model should I use with Ollama?"
→ **neural-chat** (1.1GB)
- Good quality
- Small size
- Fast
- Recommended

### "All providers are down, what happens?"
→ App enters "echo mode":
- Repeats what user says
- Still records conversations
- No errors thrown
- Works with network fallback

---

## 🔄 Auto-Fallback

The app tries providers in this order:

1. **HuggingFace** (if key set)
2. **Together** (if key set)
3. **Replicate** (if key set)
4. **Mistral** (if key set)
5. **Ollama** (if running locally)
6. **Claude** (if key set)
7. **OpenAI** (if key set)
8. **Echo Mode** (always available)

If one fails, it automatically tries the next!

---

## 💡 Tips

- **Have 2+ providers configured** = maximum reliability
- **Use HuggingFace + Ollama** = production + development
- **Test with Ollama first** = no API keys, just download
- **Environment variables override .env** = use for production

---

## 📝 Configuration Files

### .env (Local Development)
```bash
# Free providers - pick one or more
HUGGINGFACE_API_KEY=
TOGETHER_API_KEY=
REPLICATE_API_KEY=
MISTRAL_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat

# Auto-detection (tries in order)
AI_PROVIDER=auto
```

### Vercel Environment Variables
```bash
HUGGINGFACE_API_KEY=hf_xxxxx  # Main provider
TOGETHER_API_KEY=              # Backup (optional)
AI_PROVIDER=auto               # Auto-detect
```

---

## 🎉 You're Ready!

All 5 providers are completely free. Choose one:
- **HuggingFace** for production → go to https://huggingface.co/settings/tokens
- **Ollama** for development → download from https://ollama.ai
- **Any other** for backup → visit their site

Then run:
```bash
node scripts/setup-ai-coach.js
```

**Zero-cost AI coaching is ready! 🚀**
