#!/usr/bin/env node

/**
 * AI Coach Quick Setup Script
 * Helps users configure free AI providers
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const envPath = path.join(__dirname, '..', '.env');

async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   ARTH.OS AI Coach Setup (Completely Free!)    ║');
  console.log('║   Choose your AI provider                      ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log('🎯 RECOMMENDED FOR PRODUCTION (Vercel):\n');
  console.log('  1) HuggingFace (FREE - No credit card)');
  console.log('  2) Together AI (FREE - Free credits)');
  console.log('  3) Replicate (FREE - Free tier)\n');

  console.log('🏠 RECOMMENDED FOR LOCAL DEVELOPMENT:\n');
  console.log('  4) Ollama (FREE - Runs on your machine)\n');

  console.log('💻 OTHER OPTIONS:\n');
  console.log('  5) Mistral (FREE - Free tier)');
  console.log('  6) Skip for now\n');

  const choice = await question('Choose option (1-6): ');

  if (choice === '1') {
    await setupHuggingFace();
  } else if (choice === '2') {
    await setupTogether();
  } else if (choice === '3') {
    await setupReplicate();
  } else if (choice === '4') {
    await setupOllama();
  } else if (choice === '5') {
    await setupMistral();
  } else {
    console.log('\n✓ Skipping setup. You can configure later in .env\n');
  }

  rl.close();
}

async function setupHuggingFace() {
  console.log('\n╔════ HuggingFace Setup (RECOMMENDED) ════╗\n');
  console.log('HuggingFace is completely free and perfect for production.\n');

  const hasKey = await question('Do you have a HuggingFace API key? (y/n): ');

  if (hasKey.toLowerCase() !== 'y') {
    console.log('\n📥 To get a HuggingFace API key:');
    console.log('   1. Go to https://huggingface.co/settings/tokens');
    console.log('   2. Sign up for free (no credit card)');
    console.log('   3. Create a new token (read access is fine)');
    console.log('   4. Copy the token\n');
    console.log('Then run this script again.\n');
    return;
  }

  const apiKey = await question('\nPaste your HuggingFace token: ');

  if (!apiKey || apiKey.length < 10) {
    console.log('❌ Invalid token\n');
    return;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = updateEnvVar(envContent, 'HUGGINGFACE_API_KEY', apiKey);
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'huggingface');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ HuggingFace configured!\n');
    console.log('   Config:');
    console.log('   - HUGGINGFACE_API_KEY=' + apiKey.substring(0, 20) + '...');
    console.log('   - AI_PROVIDER=huggingface');
    console.log('\n✓ Done! Restart your app.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function setupTogether() {
  console.log('\n╔════ Together AI Setup ════╗\n');
  console.log('Together AI offers free credits for new users.\n');

  const hasKey = await question('Do you have a Together AI API key? (y/n): ');

  if (hasKey.toLowerCase() !== 'y') {
    console.log('\n📥 To get a Together AI API key:');
    console.log('   1. Go to https://www.together.ai');
    console.log('   2. Sign up for free');
    console.log('   3. Get your API key from dashboard');
    console.log('   4. Copy the key\n');
    console.log('Then run this script again.\n');
    return;
  }

  const apiKey = await question('\nPaste your Together AI API key: ');

  if (!apiKey || apiKey.length < 10) {
    console.log('❌ Invalid API key\n');
    return;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = updateEnvVar(envContent, 'TOGETHER_API_KEY', apiKey);
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'together');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Together AI configured!\n');
    console.log('   Config:');
    console.log('   - TOGETHER_API_KEY=' + apiKey.substring(0, 20) + '...');
    console.log('   - AI_PROVIDER=together');
    console.log('\n✓ Done! Restart your app.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function setupReplicate() {
  console.log('\n╔════ Replicate Setup ════╗\n');
  console.log('Replicate offers a free tier for testing.\n');

  const hasKey = await question('Do you have a Replicate API key? (y/n): ');

  if (hasKey.toLowerCase() !== 'y') {
    console.log('\n📥 To get a Replicate API key:');
    console.log('   1. Go to https://replicate.com/api');
    console.log('   2. Sign up for free');
    console.log('   3. Get your API token');
    console.log('   4. Copy the token\n');
    console.log('Then run this script again.\n');
    return;
  }

  const apiKey = await question('\nPaste your Replicate API key: ');

  if (!apiKey || apiKey.length < 10) {
    console.log('❌ Invalid API key\n');
    return;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = updateEnvVar(envContent, 'REPLICATE_API_KEY', apiKey);
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'replicate');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Replicate configured!\n');
    console.log('   Config:');
    console.log('   - REPLICATE_API_KEY=' + apiKey.substring(0, 20) + '...');
    console.log('   - AI_PROVIDER=replicate');
    console.log('\n✓ Done! Restart your app.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function setupOllama() {
  console.log('\n╔════ Ollama Setup ════╗\n');
  console.log('Ollama is completely free and runs on your machine.\n');

  const hasOllama = await question('Do you have Ollama installed? (y/n): ');

  if (hasOllama.toLowerCase() !== 'y') {
    console.log('\n📥 To install Ollama:');
    console.log('   1. Go to https://ollama.ai');
    console.log('   2. Download and install');
    console.log('   3. Run: ollama pull neural-chat');
    console.log('   4. Run: ollama serve');
    console.log('\nThen run this script again.\n');
    return;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = updateEnvVar(envContent, 'OLLAMA_BASE_URL', 'http://localhost:11434');
    envContent = updateEnvVar(envContent, 'OLLAMA_MODEL', 'neural-chat');
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'ollama');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Ollama configured!\n');
    console.log('   Config:');
    console.log('   - OLLAMA_BASE_URL=http://localhost:11434');
    console.log('   - OLLAMA_MODEL=neural-chat');
    console.log('   - AI_PROVIDER=ollama');
    console.log('\n📝 Make sure Ollama is running:');
    console.log('   Terminal: ollama serve');
    console.log('\n✓ Done! Restart your app.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function setupMistral() {
  console.log('\n╔════ Mistral Setup ════╗\n');
  console.log('Mistral offers a free tier.\n');

  const hasKey = await question('Do you have a Mistral API key? (y/n): ');

  if (hasKey.toLowerCase() !== 'y') {
    console.log('\n📥 To get a Mistral API key:');
    console.log('   1. Go to https://console.mistral.ai');
    console.log('   2. Sign up for free');
    console.log('   3. Generate an API key');
    console.log('   4. Copy the key\n');
    console.log('Then run this script again.\n');
    return;
  }

  const apiKey = await question('\nPaste your Mistral API key: ');

  if (!apiKey || apiKey.length < 10) {
    console.log('❌ Invalid API key\n');
    return;
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = updateEnvVar(envContent, 'MISTRAL_API_KEY', apiKey);
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'mistral');
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Mistral configured!\n');
    console.log('   Config:');
    console.log('   - MISTRAL_API_KEY=' + apiKey.substring(0, 20) + '...');
    console.log('   - AI_PROVIDER=mistral');
    console.log('\n✓ Done! Restart your app.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function updateEnvVar(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`);
  }

  return content + `${key}=${value}\n`;
}

main().catch(console.error);
