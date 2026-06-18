# ⚡ Quick Start - Setup All Free AI Providers (5 Minutes)

## 🎯 Fastest Way

### Run the automated setup:
```bash
node scripts/setup-all-providers.js
```

This script will:
1. Guide you through getting 4 API keys (copy-paste)
2. Auto-detect Ollama
3. Configure everything in `.env`
4. Show fallback priority

---

## 📋 Manual Alternative (If Script Doesn't Work)

### 1. HuggingFace (Main Provider - Production)
```bash
# Visit: https://huggingface.co/settings/tokens
# Sign up → New token → Copy

# Add to .env:
HUGGINGFACE_API_KEY=hf_xxxxx
```

### 2. Together AI (Backup)
```bash
# Visit: https://www.together.ai
# Sign up → Get API key → Copy

# Add to .env:
TOGETHER_API_KEY=xxxxx
```

### 3. Replicate (Backup)
```bash
# Visit: https://replicate.com/api
# Sign up → Get token → Copy

# Add to .env:
REPLICATE_API_KEY=xxxxx
```

### 4. Mistral (Backup)
```bash
# Visit: https://console.mistral.ai
# Sign up → Generate key → Copy

# Add to .env:
MISTRAL_API_KEY=xxxxx
```

### 5. Ollama (Local - No API Key)
```bash
# Download: https://ollama.ai
# Run:
ollama pull neural-chat
ollama serve

# Add to .env (already there):
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
```

### 6. Enable Auto-Detection
```bash
# In .env:
AI_PROVIDER=auto
```

---

## ✅ Verification

After setup:

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Check which provider is active:
# Browser console:
fetch('/api/coach/health')
  .then(r => r.json())
  .then(d => console.log(d.aiProvider.active))
```

Expected output: `huggingface` (or whichever you configured)

---

## 🔄 Auto-Fallback Priority

If one provider fails, tries next:

1. ✅ HuggingFace
2. ✅ Together AI  
3. ✅ Replicate
4. ✅ Mistral
5. ✅ Ollama
6. ✅ Claude
7. ✅ OpenAI
8. ✅ Echo Mode

---

## 💰 Cost

**$0.00 forever** - all completely free!

| Provider | Limit | Cost |
|----------|-------|------|
| HuggingFace | Unlimited | FREE |
| Together | Free credits | FREE |
| Replicate | Free tier | FREE |
| Mistral | Free tier | FREE |
| Ollama | Unlimited | FREE |

---

## 🆘 Troubleshooting

### "Script not running"
```bash
# Make sure you're in project root:
ls scripts/setup-all-providers.js

# If file doesn't exist:
node scripts/setup-ai-coach.js  # Use individual setup
```

### "Coach says no AI available"
```bash
# Check .env has at least one:
cat .env | grep HUGGINGFACE_API_KEY
cat .env | grep AI_PROVIDER

# Verify Ollama is running (if using it):
curl http://localhost:11434/api/tags
```

### "API key error"
- Copy token fully (no spaces)
- Verify token is still valid on provider website
- Restart the app after saving .env

### "Which one should I use?"
- **Production (Vercel)**: HuggingFace
- **Development (Local)**: Ollama
- **Backup**: Any other (they auto-fallback)

---

## 🚀 You're Done!

Your app now has:
- ✅ 5 completely free AI providers
- ✅ Automatic provider detection
- ✅ Seamless fallback (no errors)
- ✅ Zero cost forever

**Go to Coach section and start chatting!** 💬

---

## 📚 More Info

- Full setup guide: `AI_SETUP_GUIDE.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Provider info: `.env` (comments)

---

**Questions?** All providers are completely free and setup takes 5 minutes! 🎉
