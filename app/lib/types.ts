// Shared types for the AI Dataset Creator application

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentType = 'pdf' | 'docx' | 'txt';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  project_id: string;
  filename: string;
  original_filename: string;
  file_type: DocumentType;
  file_size: number;
  storage_key: string;
  content_preview?: string;
  processing_status: ProcessingStatus;
  error_message?: string;
  metadata?: DocumentMetadata;
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadata {
  author?: string;
  title?: string;
  creation_date?: string;
  page_count?: number;
  word_count?: number;
  language?: string;
  [key: string]: any;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  word_count: number;
  char_count: number;
  created_at: string;
}

export type DatasetType = 'qa' | 'instruction' | 'classification' | 'summarization' | 'character';
export type DatasetStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  dataset_type: DatasetType;
  source_documents: string[]; // Array of document IDs
  generation_config: GenerationConfig;
  status: DatasetStatus;
  total_examples: number;
  generated_examples: number;
  quality_score?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationConfig {
  ai_provider: 'openai' | 'anthropic';
  model: string;
  temperature: number;
  max_tokens: number;
  examples_per_chunk: number;
  prompt_template?: string;
  custom_instructions?: string;
  quality_threshold?: number;
}

export type ValidationStatus = 'pending' | 'approved' | 'rejected';

export interface DatasetExample {
  id: string;
  dataset_id: string;
  source_chunk_id?: string;
  input: string;
  output: string;
  example_type: DatasetType;
  quality_score?: number;
  validation_status: ValidationStatus;
  metadata?: ExampleMetadata;
  created_at: string;
}

export interface ExampleMetadata {
  source_text?: string;
  confidence_score?: number;
  generation_time?: number;
  tokens_used?: number;
  [key: string]: any;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  dataset_id: string;
  status: JobStatus;
  progress: number;
  total_chunks: number;
  processed_chunks: number;
  ai_provider: string;
  model_name: string;
  tokens_used: number;
  cost_estimate: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Upload types
export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Export types
export type ExportFormat = 'jsonl' | 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  include_metadata: boolean;
  quality_threshold?: number;
  validation_status?: ValidationStatus[];
}

// Prompt template types
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  dataset_type: DatasetType;
  template: string;
  variables: string[];
  is_default: boolean;
}

// Quality metrics
export interface QualityMetrics {
  accuracy_score?: number;
  relevance_score?: number;
  diversity_score?: number;
  fluency_score?: number;
  overall_score: number;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}
