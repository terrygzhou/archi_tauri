import { LLM_CONFIG_KEY, LLM_MAX_TOKENS, LLM_TEMPERATURE, LLM_MODEL_KEY } from '../utils/constants';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// LLM service — Tauri IPC bridge for LLM integration
// ============================================================================

export interface LLMProvider {
  /** Provider name (e.g., 'openai', 'anthropic', 'ollama') */
  name: string;
  /** API URL */
  baseUrl: string;
  /** API key */
  apiKey?: string;
  /** Model name */
  model: string;
  /** Temperature */
  temperature: number;
  /** Max tokens */
  maxTokens: number;
  /** Provider type */
  type: 'openai' | 'anthropic' | 'ollama' | 'custom';
}

export interface LLMRequest {
  /** System prompt */
  systemPrompt?: string;
  /** User message */
  prompt: string;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Streaming response */
  streaming?: boolean;
}

export interface LLMResponse {
  /** Generated text */
  text: string;
  /** Tokens used */
  tokensUsed?: number;
  /** Model used */
  model: string;
  /** Response time in ms */
  responseTime: number;
  /** Raw response */
  raw?: unknown;
}

export interface MappingResult {
  elements: MappedElement[];
  confidence: number;
  notes?: string;
}

export interface MappedElement {
  elementType: string;
  elementName: string;
  elementDescription?: string;
  mappedCapabilities: string[];
  mappedServices: string[];
  confidence: number;
}

export interface LLMConfig {
  provider: LLMProvider;
  enabled: boolean;
  lastUsed?: string;
}

export class LLMService {
  private config: LLMConfig | null = null;

  /**
   * Load LLM configuration
   */
  async loadConfig(): Promise<LLMConfig | null> {
    try {
      this.config = await invoke<LLMConfig>('get_llm_config');
      return this.config;
    } catch (error) {
      console.error('[LLMService] Failed to load config:', error);
      return null;
    }
  }

  /**
   * Save LLM configuration
   */
  async saveConfig(config: LLMConfig): Promise<boolean> {
    try {
      await invoke('save_llm_config', { config });
      this.config = config;
      return true;
    } catch (error) {
      console.error('[LLMService] Failed to save config:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig | null {
    return this.config;
  }

  /**
   * Send a prompt to the LLM
   */
  async generate(request: LLMRequest): Promise<LLMResponse | null> {
    if (!this.config?.enabled) {
      console.warn('[LLMService] LLM is not enabled');
      return null;
    }

    const startTime = Date.now();

    try {
      const response = await invoke<LLMResponse>('llm_generate', {
        request: {
          ...request,
          temperature: request.temperature ?? LLM_TEMPERATURE,
          maxTokens: request.maxTokens ?? LLM_MAX_TOKENS,
        },
      });

      return {
        ...response,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[LLMService] Generation failed:', error);
      return null;
    }
  }

  /**
   * Map application components to capabilities using LLM
   */
  async mapToCapabilities(
    applications: string[],
    capabilities: string[],
  ): Promise<MappingResult | null> {
    const prompt = `Map the following application components to capabilities:

Applications: ${applications.join(', ')}
Capabilities: ${capabilities.join(', ')}

For each application, determine which business capabilities it supports. Return a JSON array with the following structure:
{
  "elements": [
    {
      "elementType": "ApplicationComponent",
      "elementName": "...",
      "mappedCapabilities": ["..."],
      "mappedServices": ["..."],
      "confidence": 0.9
    }
  ],
  "confidence": 0.85,
  "notes": "..."
}`;

    const response = await this.generate({
      systemPrompt: 'You are an ArchiMate modeling assistant that maps applications to business capabilities.',
      prompt,
      maxTokens: LLM_MAX_TOKENS,
    });

    if (!response) return null;

    try {
      const result: MappingResult = JSON.parse(response.text);
      return result;
    } catch {
      console.error('[LLMService] Failed to parse mapping result:', response.text);
      return null;
    }
  }

  /**
   * Generate element documentation using LLM
   */
  async generateDocumentation(
    elementName: string,
    elementType: string,
    context?: string,
  ): Promise<string | null> {
    const response = await this.generate({
      systemPrompt: 'You are an ArchiMate modeling assistant.',
      prompt: `Generate documentation for a(n) ${elementType} element named "${elementName}".${context ? ` Context: ${context}` : ''}`,
      maxTokens: 512,
    });

    return response?.text ?? null;
  }

  /**
   * Suggest names for elements
   */
  async suggestNames(
    elementType: string,
    description: string,
    count: number = 5,
  ): Promise<string[] | null> {
    const response = await this.generate({
      systemPrompt: 'You are an ArchiMate modeling assistant.',
      prompt: `Suggest ${count} names for a(n) ${elementType} element with description: "${description}". Return only the names, one per line.`,
      maxTokens: 256,
    });

    if (!response?.text) return null;

    return response.text
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .slice(0, count);
  }

  /**
   * Health check for LLM provider
   */
  async healthCheck(): Promise<boolean> {
    if (!this.config?.enabled) return false;

    try {
      await invoke('llm_health_check');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Singleton instance
// ============================================================================
export const llmService = new LLMService();
