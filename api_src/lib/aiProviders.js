/**
 * AI Provider Abstraction Layer
 * Supports multiple AI providers: Claude, Ollama, HuggingFace, Replicate, Together AI, Mistral, OpenAI
 * Priority: HuggingFace (free) → Together AI (free) → Replicate (free) → Ollama (local) → OpenAI
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

// API Keys
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Ollama config
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'neural-chat';

const AI_PROVIDER = process.env.AI_PROVIDER || 'auto';

function isPlaceholderValue(value) {
  if (!value) return true;
  const lower = String(value).toLowerCase();
  return lower.includes('your-') || lower.includes('xxx') || lower.includes('replace') || lower.includes('sk-');
}

/**
 * Detect which AI provider is available and configured
 */
function detectAvailableProvider() {
  if (AI_PROVIDER !== 'auto') {
    return AI_PROVIDER;
  }

  // Priority: Free APIs first → Local → Paid APIs
  if (HUGGINGFACE_API_KEY && !isPlaceholderValue(HUGGINGFACE_API_KEY)) {
    console.log('✓ HuggingFace API key detected - using HuggingFace (FREE)');
    return 'huggingface';
  }

  if (TOGETHER_API_KEY && !isPlaceholderValue(TOGETHER_API_KEY)) {
    console.log('✓ Together AI API key detected - using Together AI (FREE)');
    return 'together';
  }

  if (REPLICATE_API_KEY && !isPlaceholderValue(REPLICATE_API_KEY)) {
    console.log('✓ Replicate API key detected - using Replicate (FREE)');
    return 'replicate';
  }

  if (MISTRAL_API_KEY && !isPlaceholderValue(MISTRAL_API_KEY)) {
    console.log('✓ Mistral API key detected - using Mistral (FREE)');
    return 'mistral';
  }

  // Try local Ollama
  console.log('⚠ Checking for local Ollama at', OLLAMA_BASE_URL);
  return 'ollama';
}

const activeProvider = detectAvailableProvider();

/**
 * HuggingFace Provider (FREE)
 */
class HuggingFaceProvider {
  constructor() {
    this.apiKey = HUGGINGFACE_API_KEY;
    this.model = 'mistralai/Mistral-7B-Instruct-v0.1';
    this.name = 'HuggingFace';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/' + this.model, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nassistant:`,
          parameters: { max_new_tokens: 500 }
        })
      });

      if (!response.ok) {
        throw new Error(`HuggingFace error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = Array.isArray(data) ? data[0]?.generated_text || '' : data?.generated_text || '';

      return {
        success: true,
        message: text.split('assistant:').pop()?.trim() || 'Unable to generate response',
        provider: this.name
      };
    } catch (error) {
      throw new Error(`HuggingFace error: ${error.message}`);
    }
  }
}

/**
 * Together AI Provider (FREE)
 */
class TogetherProvider {
  constructor() {
    this.apiKey = TOGETHER_API_KEY;
    this.model = 'mistralai/Mistral-7B-Instruct-v0.1';
    this.name = 'Together AI';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch('https://api.together.xyz/inference', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nassistant:`,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Together AI error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.output?.choices?.[0]?.text?.trim() || 'Unable to generate response',
        provider: this.name
      };
    } catch (error) {
      throw new Error(`Together AI error: ${error.message}`);
    }
  }
}

/**
 * Replicate Provider (FREE)
 */
class ReplicateProvider {
  constructor() {
    this.apiKey = REPLICATE_API_KEY;
    this.model = 'meta/llama-2-7b-chat';
    this.name = 'Replicate';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: 'e951f18578850b3510510860988cc967962612849c192211558bea4114ac2da',
          input: {
            prompt: `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\nassistant:`,
            max_tokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Replicate error: ${response.statusText}`);
      }

      const data = await response.json();
      const output = Array.isArray(data.output) ? data.output.join('') : data.output;

      return {
        success: true,
        message: output?.trim() || 'Unable to generate response',
        provider: this.name
      };
    } catch (error) {
      throw new Error(`Replicate error: ${error.message}`);
    }
  }
}

/**
 * Mistral Provider (FREE)
 */
class MistralProvider {
  constructor() {
    this.apiKey = MISTRAL_API_KEY;
    this.model = 'mistral-tiny';
    this.name = 'Mistral';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Mistral error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.choices?.[0]?.message?.content || 'Unable to generate response',
        provider: this.name
      };
    } catch (error) {
      throw new Error(`Mistral error: ${error.message}`);
    }
  }
}

/**
 * Ollama AI Provider (Local)
 */
class OllamaProvider {
  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.model = OLLAMA_MODEL;
    this.name = 'Ollama';
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...messages
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message.content,
        provider: this.name,
        model: this.model
      };
    } catch (error) {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}

/**
 * Claude AI Provider
 */
class ClaudeProvider {
  constructor() {
    this.client = new Anthropic({
      apiKey: CLAUDE_API_KEY
    });
    this.model = 'claude-3-5-sonnet-20241022';
    this.name = 'Claude';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      return {
        success: true,
        message: response.content[0].text,
        provider: this.name,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}

/**
 * OpenAI AI Provider
 */
class OpenAIProvider {
  constructor() {
    const OpenAI = require('openai').default;
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    this.model = 'gpt-3.5-turbo';
    this.name = 'OpenAI';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ]
      });

      return {
        success: true,
        message: response.choices[0].message.content,
        provider: this.name,
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens
        }
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

/**
 * Get AI provider instance with fallback logic
 */
let providerInstance = null;

async function getAIProvider() {
  if (providerInstance) {
    return providerInstance;
  }

  const provider = activeProvider;

  if (provider === 'huggingface') {
    providerInstance = new HuggingFaceProvider();
  } else if (provider === 'together') {
    providerInstance = new TogetherProvider();
  } else if (provider === 'replicate') {
    providerInstance = new ReplicateProvider();
  } else if (provider === 'mistral') {
    providerInstance = new MistralProvider();
  } else if (provider === 'claude') {
    providerInstance = new ClaudeProvider();
  } else if (provider === 'openai') {
    providerInstance = new OpenAIProvider();
  } else {
    providerInstance = new OllamaProvider();
  }

  return providerInstance;
}

/**
 * Send message with automatic provider selection and fallback
 */
export async function sendAIMessage(messages, systemPrompt) {
  try {
    const provider = await getAIProvider();

    // If using Ollama, check if it's available first
    if (provider instanceof OllamaProvider) {
      const available = await provider.isAvailable();
      if (!available) {
        throw new Error('Ollama is not running. Start Ollama with: ollama serve');
      }
    }

    const response = await provider.sendMessage(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error('AI Provider Error:', error.message);
    throw error;
  }
}

/**
 * Get provider information
 */
export function getProviderInfo() {
  return {
    activeProvider,
    config: {
      huggingfaceConfigured: !isPlaceholderValue(HUGGINGFACE_API_KEY),
      togetherConfigured: !isPlaceholderValue(TOGETHER_API_KEY),
      replicateConfigured: !isPlaceholderValue(REPLICATE_API_KEY),
      mistralConfigured: !isPlaceholderValue(MISTRAL_API_KEY),
      claudeConfigured: !isPlaceholderValue(CLAUDE_API_KEY),
      openaiConfigured: !isPlaceholderValue(OPENAI_API_KEY),
      ollamaUrl: OLLAMA_BASE_URL,
      ollamaModel: OLLAMA_MODEL
    }
  };
}

/**
 * Check if AI is available
 */
export async function isAIAvailable() {
  try {
    const provider = await getAIProvider();

    if (provider instanceof OllamaProvider) {
      return await provider.isAvailable();
    }

    // All cloud providers are always available if configured
    return true;
  } catch {
    return false;
  }
}

/**
 * Claude AI Provider
 */
class ClaudeProvider {
  constructor() {
    this.client = new Anthropic({
      apiKey: CLAUDE_API_KEY
    });
    this.model = 'claude-3-5-sonnet-20241022';
    this.name = 'Claude';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      return {
        success: true,
        message: response.content[0].text,
        provider: this.name,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}

/**
 * Ollama AI Provider (Local)
 */
class OllamaProvider {
  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.model = OLLAMA_MODEL;
    this.name = 'Ollama';
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...messages
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message.content,
        provider: this.name,
        model: this.model
      };
    } catch (error) {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}

/**
 * OpenAI AI Provider
 */
class OpenAIProvider {
  constructor() {
    const OpenAI = require('openai').default;
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    this.model = 'gpt-3.5-turbo';
    this.name = 'OpenAI';
  }

  async sendMessage(messages, systemPrompt) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ]
      });

      return {
        success: true,
        message: response.choices[0].message.content,
        provider: this.name,
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens
        }
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

/**
 * Get AI provider instance with fallback logic
 */
let providerInstance = null;

async function getAIProvider() {
  if (providerInstance) {
    return providerInstance;
  }

  const provider = activeProvider;

  if (provider === 'claude') {
    providerInstance = new ClaudeProvider();
  } else if (provider === 'openai') {
    providerInstance = new OpenAIProvider();
  } else {
    providerInstance = new OllamaProvider();
  }

  return providerInstance;
}

/**
 * Send message with automatic provider selection and fallback
 */
export async function sendAIMessage(messages, systemPrompt) {
  try {
    const provider = await getAIProvider();

    // If using Ollama, check if it's available first
    if (provider instanceof OllamaProvider) {
      const available = await provider.isAvailable();
      if (!available) {
        throw new Error('Ollama is not running. Start Ollama with: ollama serve');
      }
    }

    const response = await provider.sendMessage(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error('AI Provider Error:', error.message);
    throw error;
  }
}

/**
 * Get provider information
 */
export function getProviderInfo() {
  return {
    activeProvider,
    config: {
      claudeConfigured: !isPlaceholderValue(CLAUDE_API_KEY),
      openaiConfigured: !isPlaceholderValue(OPENAI_API_KEY),
      ollamaUrl: OLLAMA_BASE_URL,
      ollamaModel: OLLAMA_MODEL
    }
  };
}

/**
 * Check if AI is available
 */
export async function isAIAvailable() {
  try {
    const provider = await getAIProvider();

    if (provider instanceof OllamaProvider) {
      return await provider.isAvailable();
    }

    // Claude and OpenAI are always available if configured
    return activeProvider === 'claude' || activeProvider === 'openai';
  } catch {
    return false;
  }
}
