/**
 * AI Dataset Generation Service
 * 
 * This module handles the generation of training datasets from document chunks
 * using AI providers and prompt templates.
 */

import { AIServiceManager, AIProvider } from './ai-service';
import { PromptTemplateManager, DatasetType, GenerationContext } from './prompt-templates';

export interface GenerationRequest {
  documentId: string;
  projectId: string;
  templateId: string;
  chunkIds?: string[]; // If not provided, use all chunks
  config?: GenerationConfig;
}

export interface GenerationConfig {
  aiProvider?: AIProvider;
  model?: string;
  maxConcurrentRequests?: number;
  retryAttempts?: number;
  qualityThreshold?: number;
}

export interface GenerationResult {
  success: boolean;
  generatedExamples: DatasetExample[];
  errors: GenerationError[];
  statistics: GenerationStatistics;
}

export interface DatasetExample {
  id: string;
  type: DatasetType;
  input: string;
  output: string;
  metadata: ExampleMetadata;
  sourceChunkId: string;
  qualityScore?: number;
}

export interface ExampleMetadata {
  questionType?: string;
  taskType?: string;
  difficulty?: string;
  confidence?: number;
  traitsDemo nstrated?: string[];
  keyPoints?: string[];
  [key: string]: any;
}

export interface GenerationError {
  chunkId: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface GenerationStatistics {
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  totalExamples: number;
  averageQualityScore: number;
  processingTimeMs: number;
  tokensUsed: number;
  estimatedCost: number;
}

/**
 * Main dataset generation service
 */
export class DatasetGenerator {
  private aiService: AIServiceManager;
  private templateManager: PromptTemplateManager;

  constructor(aiService: AIServiceManager) {
    this.aiService = aiService;
    this.templateManager = new PromptTemplateManager();
  }

  /**
   * Generate a complete dataset from document chunks
   */
  async generateDataset(
    request: GenerationRequest,
    documentChunks: DocumentChunk[],
    documentMetadata: any
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const template = this.templateManager.getTemplate(request.templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    const config = this.getDefaultConfig(request.config);
    const results: DatasetExample[] = [];
    const errors: GenerationError[] = [];
    let totalTokensUsed = 0;

    // Filter chunks if specific chunk IDs provided
    const chunksToProcess = request.chunkIds 
      ? documentChunks.filter(chunk => request.chunkIds!.includes(chunk.id))
      : documentChunks;

    console.log(`Starting dataset generation for ${chunksToProcess.length} chunks using template: ${template.name}`);

    // Process chunks in batches to respect rate limits
    const batchSize = config.maxConcurrentRequests || 3;
    const batches = this.createBatches(chunksToProcess, batchSize);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} chunks)`);

      const batchPromises = batch.map(chunk => 
        this.processChunk(chunk, template, documentMetadata, config)
          .catch(error => ({ chunk, error: error.message, examples: [], tokensUsed: 0 }))
      );

      const batchResults = await Promise.all(batchPromises);

      // Process batch results
      for (const result of batchResults) {
        totalTokensUsed += result.tokensUsed || 0;

        if (result.error) {
          errors.push({
            chunkId: result.chunk.id,
            error: result.error,
            timestamp: new Date(),
            retryCount: 0
          });
        } else {
          results.push(...result.examples);
        }
      }

      // Add delay between batches to respect rate limits
      if (batchIndex < batches.length - 1) {
        await this.delay(1000); // 1 second delay between batches
      }
    }

    // Calculate statistics
    const processingTime = Date.now() - startTime;
    const statistics: GenerationStatistics = {
      totalChunks: chunksToProcess.length,
      processedChunks: chunksToProcess.length - errors.length,
      failedChunks: errors.length,
      totalExamples: results.length,
      averageQualityScore: this.calculateAverageQuality(results),
      processingTimeMs: processingTime,
      tokensUsed: totalTokensUsed,
      estimatedCost: this.estimateCost(totalTokensUsed, config.aiProvider || 'openai')
    };

    console.log(`Dataset generation completed: ${results.length} examples generated from ${statistics.processedChunks} chunks`);

    return {
      success: errors.length < chunksToProcess.length, // Success if at least some chunks processed
      generatedExamples: results,
      errors,
      statistics
    };
  }

  /**
   * Process a single document chunk
   */
  private async processChunk(
    chunk: DocumentChunk,
    template: any,
    documentMetadata: any,
    config: GenerationConfig
  ): Promise<{ chunk: DocumentChunk; examples: DatasetExample[]; tokensUsed: number; error?: string }> {
    try {
      // Create generation context
      const context: GenerationContext = {
        documentTitle: documentMetadata.title || documentMetadata.original_filename,
        documentType: documentMetadata.file_type,
        chunkContent: chunk.content,
        chunkIndex: chunk.chunk_index,
        totalChunks: documentMetadata.totalChunks || 1,
        metadata: documentMetadata
      };

      // Render template with context
      const renderedTemplate = this.templateManager.renderTemplate(template.id, context);
      if (!renderedTemplate) {
        throw new Error('Failed to render template');
      }

      // Generate content using AI service
      const aiResponse = await this.aiService.generateContent({
        provider: config.aiProvider || 'openai',
        model: config.model || 'gpt-3.5-turbo',
        systemPrompt: renderedTemplate.systemPrompt,
        userPrompt: renderedTemplate.userPrompt,
        maxTokens: template.config.maxTokens,
        temperature: template.config.temperature,
        topP: template.config.topP,
        responseFormat: template.config.responseFormat
      });

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI generation failed');
      }

      // Parse the AI response
      const examples = await this.parseAIResponse(
        aiResponse.content!,
        template.type,
        chunk.id,
        template.config.responseFormat
      );

      // Apply quality filtering if threshold is set
      const filteredExamples = config.qualityThreshold 
        ? examples.filter(ex => (ex.qualityScore || 0) >= config.qualityThreshold!)
        : examples;

      return {
        chunk,
        examples: filteredExamples,
        tokensUsed: aiResponse.tokensUsed || 0
      };

    } catch (error) {
      return {
        chunk,
        examples: [],
        tokensUsed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse AI response into structured dataset examples
   */
  private async parseAIResponse(
    content: string,
    type: DatasetType,
    sourceChunkId: string,
    responseFormat: 'text' | 'json'
  ): Promise<DatasetExample[]> {
    const examples: DatasetExample[] = [];

    try {
      if (responseFormat === 'json') {
        const parsed = JSON.parse(content);
        
        switch (type) {
          case 'qa':
            if (parsed.pairs && Array.isArray(parsed.pairs)) {
              for (const pair of parsed.pairs) {
                examples.push({
                  id: this.generateId(),
                  type: 'qa',
                  input: pair.question,
                  output: pair.answer,
                  metadata: {
                    questionType: pair.question_type,
                    confidence: pair.confidence
                  },
                  sourceChunkId,
                  qualityScore: this.calculateQualityScore(pair)
                });
              }
            }
            break;

          case 'instruction':
            if (parsed.pairs && Array.isArray(parsed.pairs)) {
              for (const pair of parsed.pairs) {
                examples.push({
                  id: this.generateId(),
                  type: 'instruction',
                  input: pair.instruction,
                  output: pair.response,
                  metadata: {
                    taskType: pair.task_type,
                    difficulty: pair.difficulty
                  },
                  sourceChunkId,
                  qualityScore: this.calculateQualityScore(pair)
                });
              }
            }
            break;

          case 'character':
            if (parsed.conversations && Array.isArray(parsed.conversations)) {
              for (const conv of parsed.conversations) {
                examples.push({
                  id: this.generateId(),
                  type: 'character',
                  input: conv.human,
                  output: conv.character,
                  metadata: {
                    scenario: conv.scenario,
                    traitsDemo nstrated: conv.traits_demonstrated,
                    characterProfile: parsed.character_profile
                  },
                  sourceChunkId,
                  qualityScore: this.calculateQualityScore(conv)
                });
              }
            }
            break;

          case 'summarization':
            if (parsed.summaries && Array.isArray(parsed.summaries)) {
              for (const summary of parsed.summaries) {
                examples.push({
                  id: this.generateId(),
                  type: 'summarization',
                  input: `Summarize the following text (${summary.type} summary):`,
                  output: summary.summary,
                  metadata: {
                    summaryType: summary.type,
                    lengthTarget: summary.length_target,
                    keyPoints: summary.key_points
                  },
                  sourceChunkId,
                  qualityScore: this.calculateQualityScore(summary)
                });
              }
            }
            break;
        }
      } else {
        // Handle text format responses (fallback)
        examples.push({
          id: this.generateId(),
          type,
          input: 'Generated from text response',
          output: content,
          metadata: {},
          sourceChunkId,
          qualityScore: 0.5 // Default score for text responses
        });
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, using as text:', error);
      // Fallback to text format
      examples.push({
        id: this.generateId(),
        type,
        input: 'Generated from unparseable response',
        output: content,
        metadata: { parseError: true },
        sourceChunkId,
        qualityScore: 0.3 // Lower score for unparseable responses
      });
    }

    return examples;
  }

  /**
   * Calculate quality score for an example
   */
  private calculateQualityScore(example: any): number {
    let score = 0.5; // Base score

    // Check for confidence if provided
    if (example.confidence && typeof example.confidence === 'number') {
      score = Math.max(score, example.confidence);
    }

    // Boost score based on content length (longer responses often indicate more detail)
    const outputLength = example.answer?.length || example.response?.length || example.summary?.length || 0;
    if (outputLength > 100) score += 0.1;
    if (outputLength > 300) score += 0.1;

    // Boost score if specific metadata is present
    if (example.question_type || example.task_type || example.summary_type) score += 0.1;

    return Math.min(1.0, score); // Cap at 1.0
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(config?: GenerationConfig): Required<GenerationConfig> {
    return {
      aiProvider: config?.aiProvider || 'openai',
      model: config?.model || 'gpt-3.5-turbo',
      maxConcurrentRequests: config?.maxConcurrentRequests || 3,
      retryAttempts: config?.retryAttempts || 2,
      qualityThreshold: config?.qualityThreshold || 0.0
    };
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate average quality score
   */
  private calculateAverageQuality(examples: DatasetExample[]): number {
    if (examples.length === 0) return 0;
    const sum = examples.reduce((acc, ex) => acc + (ex.qualityScore || 0), 0);
    return sum / examples.length;
  }

  /**
   * Estimate cost based on tokens used
   */
  private estimateCost(tokensUsed: number, provider: AIProvider): number {
    const costPerToken = {
      openai: 0.000002, // Rough estimate for GPT-3.5-turbo
      anthropic: 0.000008 // Rough estimate for Claude
    };
    
    return tokensUsed * (costPerToken[provider] || costPerToken.openai);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): any[] {
    return this.templateManager.getAllTemplates();
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: DatasetType): any[] {
    return this.templateManager.getTemplatesByType(type);
  }
}

// Type definitions for document chunks (should match your existing types)
export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  word_count: number;
  char_count: number;
}
