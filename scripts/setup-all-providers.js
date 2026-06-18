#!/usr/bin/env node

/**
 * Complete AI Coach Setup - All Free Providers
 * Gets API keys for all providers and auto-configures .env
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
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   ARTH.OS AI Coach - Complete Free Setup              ║');
  console.log('║   Configure all 5 free providers (2 minutes!)          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('This will help you set up ALL free providers:\n');
  console.log('  1️⃣  HuggingFace (Production)');
  console.log('  2️⃣  Together AI (Backup)');
  console.log('  3️⃣  Replicate (Backup)');
  console.log('  4️⃣  Mistral (Backup)');
  console.log('  5️⃣  Ollama (Local Development)\n');

  console.log('⏱️  Estimated time: 5-10 minutes (mostly copy-paste)\n');

  const proceed = await question('Ready to set up all providers? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSkipping setup.\n');
    rl.close();
    return;
  }

  console.log('\n');
  let config = {
    huggingface: null,
    together: null,
    replicate: null,
    mistral: null,
    ollama: true
  };

  // HuggingFace
  console.log('📍 STEP 1/5: HuggingFace Setup');
  console.log('─────────────────────────────────');
  console.log('This is PRODUCTION ready. No credit card needed.\n');
  console.log('🔗 Open: https://huggingface.co/settings/tokens');
  console.log('   1. Sign up (free, no credit card)');
  console.log('   2. Click "New token"');
  console.log('   3. Copy the token\n');
  const hfToken = await question('Paste HuggingFace token (or press Enter to skip): ');
  if (hfToken && hfToken.length > 10) {
    config.huggingface = hfToken;
    console.log('✅ HuggingFace configured!\n');
  } else {
    console.log('⏭️  Skipped HuggingFace\n');
  }

  // Together AI
  console.log('📍 STEP 2/5: Together AI Setup');
  console.log('──────────────────────────────');
  console.log('Free credits for new users. No credit card needed.\n');
  console.log('🔗 Open: https://www.together.ai');
  console.log('   1. Sign up (free)');
  console.log('   2. Get your API key from dashboard');
  console.log('   3. Copy the key\n');
  const togetherToken = await question('Paste Together AI API key (or press Enter to skip): ');
  if (togetherToken && togetherToken.length > 10) {
    config.together = togetherToken;
    console.log('✅ Together AI configured!\n');
  } else {
    console.log('⏭️  Skipped Together AI\n');
  }

  // Replicate
  console.log('📍 STEP 3/5: Replicate Setup');
  console.log('─────────────────────────────');
  console.log('Free tier available. LLaMA 2 included. No credit card needed.\n');
  console.log('🔗 Open: https://replicate.com/api');
  console.log('   1. Sign up (free)');
  console.log('   2. Get your API token');
  console.log('   3. Copy the token\n');
  const replicateToken = await question('Paste Replicate API key (or press Enter to skip): ');
  if (replicateToken && replicateToken.length > 10) {
    config.replicate = replicateToken;
    console.log('✅ Replicate configured!\n');
  } else {
    console.log('⏭️  Skipped Replicate\n');
  }

  // Mistral
  console.log('📍 STEP 4/5: Mistral Setup');
  console.log('───────────────────────────');
  console.log('Open source model. Free tier. No credit card needed.\n');
  console.log('🔗 Open: https://console.mistral.ai');
  console.log('   1. Sign up (free)');
  console.log('   2. Generate API key');
  console.log('   3. Copy the key\n');
  const mistralToken = await question('Paste Mistral API key (or press Enter to skip): ');
  if (mistralToken && mistralToken.length > 10) {
    config.mistral = mistralToken;
    console.log('✅ Mistral configured!\n');
  } else {
    console.log('⏭️  Skipped Mistral\n');
  }

  // Ollama
  console.log('📍 STEP 5/5: Ollama Setup');
  console.log('──────────────────────────');
  console.log('Complete privacy. Local. No API key needed.\n');
  console.log('🔗 Download: https://ollama.ai\n');
  const hasOllama = await question('Do you have Ollama installed? (y/n): ');
  if (hasOllama.toLowerCase() === 'y') {
    config.ollama = true;
    console.log('✅ Ollama configured!\n');
  } else {
    config.ollama = false;
    console.log('ℹ️  After installing Ollama, run: ollama pull neural-chat && ollama serve\n');
  }

  // Write to .env
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Writing configuration to .env...      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (config.huggingface) {
      envContent = updateEnvVar(envContent, 'HUGGINGFACE_API_KEY', config.huggingface);
    }
    if (config.together) {
      envContent = updateEnvVar(envContent, 'TOGETHER_API_KEY', config.together);
    }
    if (config.replicate) {
      envContent = updateEnvVar(envContent, 'REPLICATE_API_KEY', config.replicate);
    }
    if (config.mistral) {
      envContent = updateEnvVar(envContent, 'MISTRAL_API_KEY', config.mistral);
    }

    // Always set Ollama config
    envContent = updateEnvVar(envContent, 'OLLAMA_BASE_URL', 'http://localhost:11434');
    envContent = updateEnvVar(envContent, 'OLLAMA_MODEL', 'neural-chat');

    // Set to auto-detect
    envContent = updateEnvVar(envContent, 'AI_PROVIDER', 'auto');

    fs.writeFileSync(envPath, envContent);

    console.log('✅ Configuration saved to .env!\n');

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Configuration Summary                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('Configured Providers:');
    console.log('─────────────────────');
    if (config.huggingface) console.log('✅ HuggingFace');
    if (config.together) console.log('✅ Together AI');
    if (config.replicate) console.log('✅ Replicate');
    if (config.mistral) console.log('✅ Mistral');
    if (config.ollama) console.log('✅ Ollama (local)');

    const totalConfigured = [
      config.huggingface,
      config.together,
      config.replicate,
      config.mistral
    ].filter(Boolean).length;

    console.log(`\n📊 Total Providers: ${totalConfigured + 1} (cloud + local)\n`);

    console.log('Auto-Fallback Order:');
    console.log('──────────────────');
    let order = 1;
    if (config.huggingface) console.log(`${order++}. HuggingFace`);
    if (config.together) console.log(`${order++}. Together AI`);
    if (config.replicate) console.log(`${order++}. Replicate`);
    if (config.mistral) console.log(`${order++}. Mistral`);
    console.log(`${order}. Ollama (local)`);
    console.log(`${order + 1}. Echo Mode (fallback)`);

    console.log('\n🚀 Next Steps:');
    console.log('─────────────');
    console.log('1. npm install');
    console.log('2. npm run dev');
    console.log('3. Go to Coach section and chat!');

    if (config.ollama) {
      console.log('\n💡 Remember: Keep Ollama running in another terminal:');
      console.log('   ollama serve');
    }

    console.log('\n✨ You now have ZERO-COST AI coaching with automatic fallback!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

function updateEnvVar(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${value}`);
  }

  return content + `${key}=${value}\n`;
}

main().catch(console.error);
