-- AI Dataset Creator Database Schema
-- Phase 1: MVP Foundation

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table for organizing user work
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table for uploaded source files
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, docx, txt
  file_size INTEGER NOT NULL,
  storage_key TEXT NOT NULL, -- R2 storage key
  content_preview TEXT, -- First 500 chars of extracted text
  processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  metadata TEXT, -- JSON string with document metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Document chunks table for processed text segments
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Datasets table for generated training data
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dataset_type TEXT NOT NULL, -- qa, instruction, classification, summarization, character
  source_documents TEXT NOT NULL, -- JSON array of document IDs
  generation_config TEXT NOT NULL, -- JSON with AI generation parameters
  status TEXT DEFAULT 'pending', -- pending, generating, completed, failed
  total_examples INTEGER DEFAULT 0,
  generated_examples INTEGER DEFAULT 0,
  quality_score REAL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Dataset examples table for individual training examples
CREATE TABLE IF NOT EXISTS dataset_examples (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  source_chunk_id TEXT, -- Optional reference to source chunk
  input TEXT NOT NULL, -- Question, instruction, or input text
  output TEXT NOT NULL, -- Answer, response, or expected output
  example_type TEXT NOT NULL, -- matches dataset_type
  quality_score REAL,
  validation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  metadata TEXT, -- JSON with additional example data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (source_chunk_id) REFERENCES document_chunks(id) ON DELETE SET NULL
);

-- AI generation jobs table for tracking processing
CREATE TABLE IF NOT EXISTS generation_jobs (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  progress INTEGER DEFAULT 0, -- Percentage complete
  total_chunks INTEGER NOT NULL,
  processed_chunks INTEGER DEFAULT 0,
  ai_provider TEXT NOT NULL, -- openai, anthropic
  model_name TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate REAL DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_dataset_examples_dataset_id ON dataset_examples(dataset_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_dataset_id ON generation_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
