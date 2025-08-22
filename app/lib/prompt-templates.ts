/**
 * Prompt Template System for AI Dataset Generation
 * 
 * This module provides flexible prompt templates for generating different types
 * of training datasets from source documents.
 */

export type DatasetType = 'qa' | 'instruction' | 'character' | 'summarization' | 'classification';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  systemPrompt: string;
  userPrompt: string;
  variables: string[];
  examples?: TemplateExample[];
  config: TemplateConfig;
}

export interface TemplateExample {
  input: Record<string, string>;
  expectedOutput: string;
}

export interface TemplateConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
  responseFormat: 'text' | 'json';
}

export interface GenerationContext {
  documentTitle?: string;
  documentType?: string;
  chunkContent: string;
  chunkIndex: number;
  totalChunks: number;
  metadata?: Record<string, any>;
}

/**
 * Built-in prompt templates for common dataset types
 */
export const BUILT_IN_TEMPLATES: Record<string, PromptTemplate> = {
  // Question-Answer Generation Template
  qa_generation: {
    id: 'qa_generation',
    name: 'Question-Answer Generation',
    description: 'Generate question-answer pairs from document content for training conversational AI',
    type: 'qa',
    systemPrompt: `You are an expert at creating high-quality question-answer pairs from document content for AI training datasets.

Your task is to:
1. Analyze the provided text content carefully
2. Generate diverse, meaningful questions that can be answered from the content
3. Provide accurate, complete answers based strictly on the source material
4. Ensure questions test different types of understanding (factual, conceptual, analytical)
5. Maintain consistency with the source document's facts and context

Guidelines:
- Generate 3-5 question-answer pairs per text chunk
- Questions should be natural and conversational
- Answers should be comprehensive but concise
- Avoid questions that can't be answered from the provided content
- Include a mix of question types: factual, explanatory, comparative, and analytical
- Ensure answers are factually accurate and directly supported by the source text`,

    userPrompt: `Based on the following document content, generate high-quality question-answer pairs:

**Document Title:** {{documentTitle}}
**Content:**
{{chunkContent}}

**Instructions:**
1. Generate 3-5 diverse question-answer pairs
2. Questions should be natural and conversational
3. Answers must be accurate and based solely on the provided content
4. Include different question types (who, what, when, where, why, how)

**Output Format (JSON):**
{
  "pairs": [
    {
      "question": "Your question here",
      "answer": "Your detailed answer here",
      "question_type": "factual|explanatory|comparative|analytical",
      "confidence": 0.9
    }
  ]
}`,

    variables: ['documentTitle', 'chunkContent'],
    config: {
      maxTokens: 1500,
      temperature: 0.7,
      topP: 0.9,
      responseFormat: 'json'
    }
  },

  // Instruction-Following Dataset Template
  instruction_following: {
    id: 'instruction_following',
    name: 'Instruction-Following',
    description: 'Generate instruction-response pairs for training models to follow specific tasks',
    type: 'instruction',
    systemPrompt: `You are an expert at creating instruction-following training data from document content.

Your task is to:
1. Extract actionable procedures, processes, or guidelines from the content
2. Convert these into clear, specific instructions
3. Provide detailed responses showing how to follow the instructions
4. Focus on practical, executable tasks that can be learned from

Guidelines:
- Instructions should be clear, specific, and actionable
- Responses should be step-by-step and comprehensive
- Focus on procedures, processes, guidelines, or how-to information
- Ensure instructions are realistic and achievable
- Include context and background information when helpful`,

    userPrompt: `Based on the following document content, create instruction-following training pairs:

**Document Title:** {{documentTitle}}
**Content:**
{{chunkContent}}

**Instructions:**
1. Identify procedures, processes, or actionable information in the content
2. Create 2-4 instruction-response pairs
3. Instructions should be clear and specific
4. Responses should be detailed and step-by-step

**Output Format (JSON):**
{
  "pairs": [
    {
      "instruction": "Clear, specific instruction or task",
      "response": "Detailed step-by-step response",
      "task_type": "procedure|guideline|process|explanation",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}`,

    variables: ['documentTitle', 'chunkContent'],
    config: {
      maxTokens: 2000,
      temperature: 0.6,
      topP: 0.8,
      responseFormat: 'json'
    }
  },

  // Character/Persona Training Template
  character_persona: {
    id: 'character_persona',
    name: 'Character/Persona Training',
    description: 'Generate character-consistent responses for persona-based AI training',
    type: 'character',
    systemPrompt: `You are an expert at creating character-based training data from document content.

Your task is to:
1. Extract personality traits, speaking patterns, and characteristics from the content
2. Generate conversations that demonstrate consistent character voice
3. Ensure responses match the character's knowledge, personality, and speaking style
4. Create diverse scenarios that showcase the character's traits

Guidelines:
- Maintain consistent character voice and personality
- Responses should reflect the character's knowledge base and expertise
- Include emotional responses and personality quirks when appropriate
- Generate varied conversation scenarios
- Ensure character consistency across all responses`,

    userPrompt: `Based on the following content about a character or person, create persona training data:

**Document Title:** {{documentTitle}}
**Content:**
{{chunkContent}}

**Instructions:**
1. Identify key personality traits, knowledge areas, and speaking patterns
2. Generate 2-3 conversation scenarios showing character consistency
3. Each scenario should demonstrate different aspects of the character
4. Maintain consistent voice and personality throughout

**Output Format (JSON):**
{
  "character_profile": {
    "name": "Character name",
    "key_traits": ["trait1", "trait2", "trait3"],
    "expertise": ["area1", "area2"],
    "speaking_style": "Description of how they communicate"
  },
  "conversations": [
    {
      "scenario": "Brief description of the situation",
      "human": "What someone might say to the character",
      "character": "How the character would respond",
      "traits_demonstrated": ["trait1", "trait2"]
    }
  ]
}`,

    variables: ['documentTitle', 'chunkContent'],
    config: {
      maxTokens: 1800,
      temperature: 0.8,
      topP: 0.9,
      responseFormat: 'json'
    }
  },

  // Summarization Training Template
  summarization: {
    id: 'summarization',
    name: 'Summarization Training',
    description: 'Generate text summarization training pairs at different levels of detail',
    type: 'summarization',
    systemPrompt: `You are an expert at creating summarization training data from document content.

Your task is to:
1. Create summaries at different levels of detail and abstraction
2. Preserve key information while reducing length
3. Maintain accuracy and factual consistency with the source
4. Generate both extractive and abstractive summary styles

Guidelines:
- Create multiple summary lengths (brief, medium, detailed)
- Preserve the most important information and key points
- Use clear, concise language
- Maintain factual accuracy with the source content
- Include different summary styles and approaches`,

    userPrompt: `Create summarization training data from the following content:

**Document Title:** {{documentTitle}}
**Content:**
{{chunkContent}}

**Instructions:**
1. Generate summaries at 3 different levels of detail
2. Ensure each summary captures the key information accurately
3. Use different summarization approaches (extractive vs abstractive)
4. Maintain consistency with the source material

**Output Format (JSON):**
{
  "summaries": [
    {
      "type": "brief",
      "length_target": "1-2 sentences",
      "summary": "Very concise summary",
      "key_points": ["point1", "point2"]
    },
    {
      "type": "medium", 
      "length_target": "3-4 sentences",
      "summary": "Medium-length summary",
      "key_points": ["point1", "point2", "point3"]
    },
    {
      "type": "detailed",
      "length_target": "5-7 sentences", 
      "summary": "Comprehensive summary",
      "key_points": ["point1", "point2", "point3", "point4"]
    }
  ]
}`,

    variables: ['documentTitle', 'chunkContent'],
    config: {
      maxTokens: 1200,
      temperature: 0.5,
      topP: 0.8,
      responseFormat: 'json'
    }
  }
};

/**
 * Template Manager for handling prompt templates
 */
export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    // Load built-in templates
    Object.values(BUILT_IN_TEMPLATES).forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all templates of a specific type
   */
  getTemplatesByType(type: DatasetType): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Add a custom template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Render a template with provided context
   */
  renderTemplate(templateId: string, context: GenerationContext): { systemPrompt: string; userPrompt: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    const variables = {
      documentTitle: context.documentTitle || 'Untitled Document',
      documentType: context.documentType || 'document',
      chunkContent: context.chunkContent,
      chunkIndex: context.chunkIndex.toString(),
      totalChunks: context.totalChunks.toString(),
      ...context.metadata
    };

    const systemPrompt = this.interpolateVariables(template.systemPrompt, variables);
    const userPrompt = this.interpolateVariables(template.userPrompt, variables);

    return { systemPrompt, userPrompt };
  }

  /**
   * Replace template variables with actual values
   */
  private interpolateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Validate template configuration
   */
  validateTemplate(template: PromptTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.id || template.id.trim() === '') {
      errors.push('Template ID is required');
    }

    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.systemPrompt || template.systemPrompt.trim() === '') {
      errors.push('System prompt is required');
    }

    if (!template.userPrompt || template.userPrompt.trim() === '') {
      errors.push('User prompt is required');
    }

    if (!['qa', 'instruction', 'character', 'summarization', 'classification'].includes(template.type)) {
      errors.push('Invalid template type');
    }

    if (!template.config.maxTokens || template.config.maxTokens < 1) {
      errors.push('Max tokens must be a positive number');
    }

    if (template.config.temperature < 0 || template.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
