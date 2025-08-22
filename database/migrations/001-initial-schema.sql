-- Migration 001: Initial Schema
-- This file contains the initial database schema for the AI Dataset Creator

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS generation_jobs;
DROP TABLE IF EXISTS dataset_examples;
DROP TABLE IF EXISTS datasets;
DROP TABLE IF EXISTS document_chunks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- Create tables with proper schema
-- (Content identical to schema.sql for initial migration)

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  content_preview TEXT,
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Document chunks table
CREATE TABLE document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Datasets table
CREATE TABLE datasets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dataset_type TEXT NOT NULL,
  source_documents TEXT NOT NULL,
  generation_config TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_examples INTEGER DEFAULT 0,
  generated_examples INTEGER DEFAULT 0,
  quality_score REAL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Dataset examples table
CREATE TABLE dataset_examples (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  source_chunk_id TEXT,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  example_type TEXT NOT NULL,
  quality_score REAL,
  validation_status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (source_chunk_id) REFERENCES document_chunks(id) ON DELETE SET NULL
);

-- AI generation jobs table
CREATE TABLE generation_jobs (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  total_chunks INTEGER NOT NULL,
  processed_chunks INTEGER DEFAULT 0,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_estimate REAL DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_datasets_project_id ON datasets(project_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_dataset_examples_dataset_id ON dataset_examples(dataset_id);
CREATE INDEX idx_generation_jobs_dataset_id ON generation_jobs(dataset_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
