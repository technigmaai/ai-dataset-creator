// AI service integration for OpenAI and Anthropic APIs
import type { GenerationConfig, DatasetType } from './types';

export interface AIProvider {
  name: 'openai' | 'anthropic';
  generateDatasetExamples(
    text: string,
    config: GenerationConfig,
    datasetType: DatasetType
  ): Promise<GeneratedExample[]>;
}

export interface GeneratedExample {
  input: string;
  output: string;
  metadata?: {
    confidence_score?: number;
    generation_time?: number;
    tokens_used?: number;
  };
}

export interface AIResponse {
  examples: GeneratedExample[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_estimate: number;
}

/**
 * OpenAI API integration
 */
export class OpenAIProvider implements AIProvider {
  name: 'openai' = 'openai';
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDatasetExamples(
    text: string,
    config: GenerationConfig,
    datasetType: DatasetType
  ): Promise<GeneratedExample[]> {
    const prompt = this.buildPrompt(text, config, datasetType);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(datasetType)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, datasetType);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate examples: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(text: string, config: GenerationConfig, datasetType: DatasetType): string {
    const basePrompt = config.prompt_template || this.getDefaultPrompt(datasetType);
    const customInstructions = config.custom_instructions ? `\n\nAdditional instructions: ${config.custom_instructions}` : '';
    
    return `${basePrompt}

Text to process:
"""
${text}
"""

Generate ${config.examples_per_chunk} high-quality examples.${customInstructions}

Return your response as a JSON object with an "examples" array. Each example should have "input" and "output" fields.`;
  }

  private getSystemPrompt(datasetType: DatasetType): string {
    const prompts = {
      qa: 'You are an expert at creating high-quality question-answer pairs for training language models. Generate diverse, accurate questions and answers based on the provided text.',
      instruction: 'You are an expert at creating instruction-following datasets. Generate clear instructions and appropriate responses based on the provided text.',
      classification: 'You are an expert at creating classification datasets. Generate text examples with appropriate category labels based on the provided content.',
      summarization: 'You are an expert at creating summarization datasets. Generate text passages with accurate, concise summaries.',
      character: 'You are an expert at creating character/persona training data. Generate consistent character responses based on the provided character information.'
    };
    
    return prompts[datasetType] || prompts.qa;
  }

  private getDefaultPrompt(datasetType: DatasetType): string {
    const prompts = {
      qa: 'Based on the following text, create question-answer pairs that test comprehension and knowledge. Questions should be diverse (factual, analytical, inferential) and answers should be accurate and complete.',
      instruction: 'Based on the following text, create instruction-response pairs where the instruction asks the model to perform a task related to the content, and the response provides the appropriate completion.',
      classification: 'Based on the following text, create examples for classification training. Each example should include text content and its appropriate category or label.',
      summarization: 'Based on the following text, create examples where the input is a longer text passage and the output is an accurate, concise summary.',
      character: 'Based on the following character information, create dialogue examples that demonstrate the character\'s personality, speaking style, and knowledge.'
    };
    
    return prompts[datasetType] || prompts.qa;
  }

  private parseResponse(data: any, datasetType: DatasetType): GeneratedExample[] {
    try {
      const content = JSON.parse(data.choices[0].message.content);
      
      if (!content.examples || !Array.isArray(content.examples)) {
        throw new Error('Invalid response format: missing examples array');
      }

      return content.examples.map((example: any) => ({
        input: example.input || example.question || '',
        output: example.output || example.answer || example.response || '',
        metadata: {
          tokens_used: data.usage?.total_tokens || 0,
          generation_time: Date.now()
        }
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}

/**
 * Anthropic API integration
 */
export class AnthropicProvider implements AIProvider {
  name: 'anthropic' = 'anthropic';
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDatasetExamples(
    text: string,
    config: GenerationConfig,
    datasetType: DatasetType
  ): Promise<GeneratedExample[]> {
    const prompt = this.buildPrompt(text, config, datasetType);
    
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data, datasetType);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error(`Failed to generate examples: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(text: string, config: GenerationConfig, datasetType: DatasetType): string {
    const basePrompt = config.prompt_template || this.getDefaultPrompt(datasetType);
    const customInstructions = config.custom_instructions ? `\n\nAdditional instructions: ${config.custom_instructions}` : '';
    
    return `${basePrompt}

Text to process:
"""
${text}
"""

Generate ${config.examples_per_chunk} high-quality examples.${customInstructions}

Return your response as a JSON object with an "examples" array. Each example should have "input" and "output" fields.`;
  }

  private getDefaultPrompt(datasetType: DatasetType): string {
    // Same as OpenAI for now, could be customized for Anthropic's strengths
    const prompts = {
      qa: 'Based on the following text, create question-answer pairs that test comprehension and knowledge. Questions should be diverse (factual, analytical, inferential) and answers should be accurate and complete.',
      instruction: 'Based on the following text, create instruction-response pairs where the instruction asks the model to perform a task related to the content, and the response provides the appropriate completion.',
      classification: 'Based on the following text, create examples for classification training. Each example should include text content and its appropriate category or label.',
      summarization: 'Based on the following text, create examples where the input is a longer text passage and the output is an accurate, concise summary.',
      character: 'Based on the following character information, create dialogue examples that demonstrate the character\'s personality, speaking style, and knowledge.'
    };
    
    return prompts[datasetType] || prompts.qa;
  }

  private parseResponse(data: any, datasetType: DatasetType): GeneratedExample[] {
    try {
      const content = JSON.parse(data.content[0].text);
      
      if (!content.examples || !Array.isArray(content.examples)) {
        throw new Error('Invalid response format: missing examples array');
      }

      return content.examples.map((example: any) => ({
        input: example.input || example.question || '',
        output: example.output || example.answer || example.response || '',
        metadata: {
          tokens_used: data.usage?.input_tokens + data.usage?.output_tokens || 0,
          generation_time: Date.now()
        }
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}

/**
 * AI Service Manager - orchestrates different providers
 */
export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Providers will be initialized when API keys are available
  }

  /**
   * Initialize providers with API keys
   */
  initializeProviders(env: { OPENAI_API_KEY?: string; ANTHROPIC_API_KEY?: string }) {
    if (env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider(env.OPENAI_API_KEY));
    }

    if (env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider(env.ANTHROPIC_API_KEY));
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Generate dataset examples using specified provider
   */
  async generateExamples(
    text: string,
    config: GenerationConfig,
    datasetType: DatasetType
  ): Promise<AIResponse> {
    const provider = this.providers.get(config.ai_provider);
    
    if (!provider) {
      throw new Error(`AI provider '${config.ai_provider}' not available. Available providers: ${this.getAvailableProviders().join(', ')}`);
    }

    const startTime = Date.now();
    
    try {
      const examples = await provider.generateDatasetExamples(text, config, datasetType);
      
      // Calculate cost estimate (simplified)
      const totalTokens = examples.reduce((sum, ex) => sum + (ex.metadata?.tokens_used || 0), 0);
      const costEstimate = this.estimateCost(config.ai_provider, config.model, totalTokens);
      
      return {
        examples,
        usage: {
          prompt_tokens: Math.floor(totalTokens * 0.7), // Rough estimate
          completion_tokens: Math.floor(totalTokens * 0.3),
          total_tokens: totalTokens
        },
        cost_estimate: costEstimate
      };
    } catch (error) {
      console.error(`Error generating examples with ${config.ai_provider}:`, error);
      throw error;
    }
  }

  /**
   * Estimate cost for API usage (simplified pricing)
   */
  private estimateCost(provider: string, model: string, tokens: number): number {
    // Simplified cost estimation - in production, use actual pricing
    const pricing = {
      openai: {
        'gpt-4': 0.00003 * tokens, // $0.03/1K tokens
        'gpt-4-turbo': 0.00001 * tokens, // $0.01/1K tokens
        'gpt-3.5-turbo': 0.000002 * tokens, // $0.002/1K tokens
      },
      anthropic: {
        'claude-3-opus': 0.000015 * tokens, // $0.015/1K tokens
        'claude-3-sonnet': 0.000003 * tokens, // $0.003/1K tokens
        'claude-3-haiku': 0.00000025 * tokens, // $0.00025/1K tokens
      }
    };

    return pricing[provider as keyof typeof pricing]?.[model as keyof typeof pricing['openai']] || 0;
  }

  /**
   * Validate generation configuration
   */
  validateConfig(config: GenerationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.providers.has(config.ai_provider)) {
      errors.push(`AI provider '${config.ai_provider}' is not available`);
    }

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (config.max_tokens < 1 || config.max_tokens > 4000) {
      errors.push('Max tokens must be between 1 and 4000');
    }

    if (config.examples_per_chunk < 1 || config.examples_per_chunk > 20) {
      errors.push('Examples per chunk must be between 1 and 20');
    }

    return { valid: errors.length === 0, errors };
  }
}
