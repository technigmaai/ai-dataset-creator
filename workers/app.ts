import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRequestHandler } from "react-router";
import { DatabaseManager } from "../app/lib/database";
import { AIServiceManager } from "../app/lib/ai-service";
import { 
  UserRepository, 
  ProjectRepository, 
  DocumentRepository, 
  DocumentChunkRepository,
  DatasetRepository,
  DatasetExampleRepository,
  GenerationJobRepository 
} from "../app/lib/repositories";
import { WorkersDocumentParser, WorkersTextChunker } from "../app/lib/document-parser-workers";
import type { Env } from "../worker-configuration";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://ai-dataset-creator.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize services
app.use('*', async (c, next) => {
  // Initialize database
  c.set('db', new DatabaseManager(c.env.DB));
  
  // Initialize AI service
  const aiService = new AIServiceManager();
  aiService.initializeProviders({
    OPENAI_API_KEY: c.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: c.env.ANTHROPIC_API_KEY
  });
  c.set('ai', aiService);
  
  // Initialize repositories
  const db = c.get('db');
  c.set('userRepo', new UserRepository(db));
  c.set('projectRepo', new ProjectRepository(db));
  c.set('documentRepo', new DocumentRepository(db));
  c.set('chunkRepo', new DocumentChunkRepository(db));
  c.set('datasetRepo', new DatasetRepository(db));
  c.set('exampleRepo', new DatasetExampleRepository(db));
  c.set('jobRepo', new GenerationJobRepository(db));
  
  await next();
});

// Health check endpoint
app.get('/api/health', async (c) => {
  const db = c.get('db') as DatabaseManager;
  const isHealthy = await db.healthCheck();
  
  return c.json({ 
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Project endpoints
app.get('/api/projects', async (c) => {
  try {
    const projectRepo = c.get('projectRepo') as ProjectRepository;
    // For now, return all projects (in production, filter by authenticated user)
    const projects = await projectRepo.findMany('projects', {});
    return c.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ success: false, error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/projects', async (c) => {
  try {
    const { name, description } = await c.req.json();
    
    if (!name) {
      return c.json({ success: false, error: 'Project name is required' }, 400);
    }
    
    const projectRepo = c.get('projectRepo') as ProjectRepository;
    const project = await projectRepo.create({
      user_id: 'default-user', // In production, get from authenticated user
      name,
      description
    });
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ success: false, error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Get single project
app.get('/api/projects/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const projectRepo = c.get('projectRepo') as ProjectRepository;
    
    const project = await projectRepo.findById(projectId);
    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ success: false, error: 'Failed to fetch project' }, 500);
  }
});

// Update project
app.put('/api/projects/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { name, description } = await c.req.json();
    
    if (!name) {
      return c.json({ success: false, error: 'Project name is required' }, 400);
    }
    
    const projectRepo = c.get('projectRepo') as ProjectRepository;
    
    // Check if project exists
    const existingProject = await projectRepo.findById(projectId);
    if (!existingProject) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }
    
    // Update project
    const updatedProject = await projectRepo.update(projectId, {
      name,
      description
    });
    
    return c.json({ success: true, data: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ success: false, error: 'Failed to update project' }, 500);
  }
});

// Delete project
app.delete('/api/projects/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const projectRepo = c.get('projectRepo') as ProjectRepository;
    const documentRepo = c.get('documentRepo') as DocumentRepository;
    const chunkRepo = c.get('chunkRepo') as DocumentChunkRepository;
    const datasetRepo = c.get('datasetRepo') as DatasetRepository;
    
    // First, check if project exists
    const project = await projectRepo.findById(projectId);
    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }
    
    // Get all documents for this project
    const documents = await documentRepo.findByProjectId(projectId);
    
    // Delete all document files from R2 storage
    for (const document of documents) {
      try {
        await c.env.STORAGE.delete(document.storage_key || document.filename);
      } catch (error) {
        console.warn(`Failed to delete file ${document.filename} from R2:`, error);
      }
    }
    
    // Delete all document chunks
    for (const document of documents) {
      await chunkRepo.deleteByDocumentId(document.id);
    }
    
    // Delete all documents
    for (const document of documents) {
      await documentRepo.delete(document.id);
    }
    
    // Delete all datasets for this project
    const datasets = await datasetRepo.findByProjectId(projectId);
    for (const dataset of datasets) {
      await datasetRepo.delete(dataset.id);
    }
    
    // Finally, delete the project itself
    await projectRepo.delete(projectId);
    
    return c.json({ 
      success: true, 
      message: `Project "${project.name}" and all associated data deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ success: false, error: 'Failed to delete project' }, 500);
  }
});

// Get documents for a project - placeholder
app.get('/api/projects/:projectId/documents', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const documentRepo = c.get('documentRepo') as DocumentRepository;
    
    // Fetch documents for this project
    const documents = await documentRepo.findByProjectId(projectId);
    
    return c.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return c.json({ success: false, error: 'Failed to fetch documents' }, 500);
  }
});

// Document upload endpoint
app.post('/api/projects/:projectId/documents', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    // Validate file
    const validation = WorkersDocumentParser.validateFile(file);
    if (!validation.valid) {
      return c.json({ success: false, error: validation.error }, 400);
    }
    
    const documentRepo = c.get('documentRepo') as DocumentRepository;
    const chunkRepo = c.get('chunkRepo') as DocumentChunkRepository;
    
    // Generate storage key
    const storageKey = `documents/${projectId}/${Date.now()}-${file.name}`;
    
    // Store file in R2
    await c.env.STORAGE.put(storageKey, file.stream());
    
    // Parse document with Workers-compatible parser
    const parseResult = await WorkersDocumentParser.parse(file);
    
    // Create document record
    const document = await documentRepo.create({
      project_id: projectId,
      filename: storageKey,
      original_filename: file.name,
      file_type: file.name.split('.').pop()?.toLowerCase() as any,
      file_size: file.size,
      storage_key: storageKey,
      content_preview: parseResult.text.substring(0, 500),
      processing_status: 'processing',
      metadata: parseResult.metadata
    });
    
    // Chunk the text
    const chunks = WorkersTextChunker.chunkText(parseResult.text, {
      maxChunkSize: 1000,
      overlapSize: 100,
      preserveParagraphs: true
    });
    
    // Create chunk records
    const chunkData = chunks.map((content, index) => ({
      document_id: document.id,
      chunk_index: index,
      content,
      word_count: content.split(/\s+/).length,
      char_count: content.length
    }));
    
    await chunkRepo.createBatch(chunkData);
    
    // Update document status
    await documentRepo.updateProcessingStatus(document.id, 'completed');
    
    return c.json({ success: true, data: document });
  } catch (error) {
    console.error('Error uploading document:', error);
    return c.json({ success: false, error: 'Failed to upload document' }, 500);
  }
});

// Delete document - placeholder
app.delete('/api/projects/:projectId/documents/:documentId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const documentId = c.req.param('documentId');
    const documentRepo = c.get('documentRepo') as DocumentRepository;
    const chunkRepo = c.get('chunkRepo') as DocumentChunkRepository;
    
    // First, check if document exists
    const document = await documentRepo.findById(documentId);
    if (!document) {
      return c.json({ success: false, error: 'Document not found' }, 404);
    }
    
    // Verify document belongs to the specified project
    if (document.project_id !== projectId) {
      return c.json({ success: false, error: 'Document does not belong to this project' }, 403);
    }
    
    // Delete the file from R2 storage
    try {
      await c.env.STORAGE.delete(document.storage_key || document.filename);
    } catch (error) {
      console.warn(`Failed to delete file ${document.filename} from R2:`, error);
    }
    
    // Delete all document chunks
    await chunkRepo.deleteByDocumentId(documentId);
    
    // Delete the document record
    const deleted = await documentRepo.delete(documentId);
    
    if (deleted) {
      return c.json({ 
        success: true, 
        message: `Document "${document.original_filename}" deleted successfully` 
      });
    } else {
      return c.json({ success: false, error: 'Failed to delete document from database' }, 500);
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ success: false, error: 'Failed to delete document' }, 500);
  }
});

// Process/reprocess document - placeholder
app.post('/api/projects/:projectId/documents/:documentId/process', async (c) => {
  try {
    return c.json({ success: true, message: 'Document processing not yet implemented' });
  } catch (error) {
    console.error('Error processing document:', error);
    return c.json({ success: false, error: 'Failed to process document' }, 500);
  }
});

// Create dataset
app.post('/api/projects/:projectId/datasets', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { name, description, dataset_type, source_documents, generation_config } = await c.req.json();
    
    if (!name || !dataset_type || !source_documents || !generation_config) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    
    const datasetRepo = c.get('datasetRepo') as DatasetRepository;
    const dataset = await datasetRepo.create({
      project_id: projectId,
      name,
      description,
      dataset_type,
      source_documents,
      generation_config,
      status: 'pending',
      total_examples: 0,
      generated_examples: 0
    });
    
    return c.json({ success: true, data: dataset });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return c.json({ success: false, error: 'Failed to create dataset' }, 500);
  }
});

// Get datasets for a project
app.get('/api/projects/:projectId/datasets', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const datasetRepo = c.get('datasetRepo') as DatasetRepository;
    
    const datasets = await datasetRepo.findByProjectId(projectId);
    return c.json({ success: true, data: datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return c.json({ success: false, error: 'Failed to fetch datasets' }, 500);
  }
});

// Get AI providers
app.get('/api/ai/providers', async (c) => {
  try {
    const aiService = c.get('ai') as AIServiceManager;
    const providers = aiService.getAvailableProviders();
    return c.json({ success: true, data: providers });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    return c.json({ success: false, error: 'Failed to fetch AI providers' }, 500);
  }
});

// Get available prompt templates
app.get('/api/templates', async (c) => {
  try {
    const { DatasetGenerator } = await import('../app/lib/dataset-generator');
    
    const aiService = c.get('ai') as AIServiceManager;
    const generator = new DatasetGenerator(aiService);
    const templates = generator.getAvailableTemplates();
    
    return c.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json({ success: false, error: 'Failed to fetch templates' }, 500);
  }
});

// Get templates by type
app.get('/api/templates/:type', async (c) => {
  try {
    const type = c.req.param('type') as any;
    const { DatasetGenerator } = await import('../app/lib/dataset-generator');
    
    const aiService = c.get('ai') as AIServiceManager;
    const generator = new DatasetGenerator(aiService);
    const templates = generator.getTemplatesByType(type);
    
    return c.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates by type:', error);
    return c.json({ success: false, error: 'Failed to fetch templates' }, 500);
  }
});

// Generate dataset from document
app.post('/api/projects/:projectId/documents/:documentId/generate', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const documentId = c.req.param('documentId');
    const { templateId, config } = await c.req.json();
    
    if (!templateId) {
      return c.json({ success: false, error: 'Template ID is required' }, 400);
    }

    const documentRepo = c.get('documentRepo') as DocumentRepository;
    const chunkRepo = c.get('chunkRepo') as DocumentChunkRepository;
    const datasetRepo = c.get('datasetRepo') as DatasetRepository;
    const exampleRepo = c.get('exampleRepo') as DatasetExampleRepository;
    
    // Get document
    const document = await documentRepo.findById(documentId);
    if (!document || document.project_id !== projectId) {
      return c.json({ success: false, error: 'Document not found' }, 404);
    }

    // Get document chunks
    const chunks = await chunkRepo.findByDocumentId(documentId);
    if (chunks.length === 0) {
      return c.json({ success: false, error: 'No chunks found for document' }, 400);
    }

    // Import and create dataset generator
    const { DatasetGenerator } = await import('../app/lib/dataset-generator');
    const aiService = c.get('ai') as AIServiceManager;
    const generator = new DatasetGenerator(aiService);

    // Generate dataset
    const generationRequest = {
      documentId,
      projectId,
      templateId,
      config
    };

    const result = await generator.generateDataset(
      generationRequest,
      chunks,
      document
    );

    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Dataset generation failed',
        details: result.errors 
      }, 500);
    }

    // Create dataset record
    const template = generator.getAvailableTemplates().find(t => t.id === templateId);
    const dataset = await datasetRepo.create({
      project_id: projectId,
      name: `Generated from ${document.original_filename}`,
      description: `Generated using ${template?.name || templateId} template`,
      dataset_type: template?.type || 'qa',
      source_documents: [documentId],
      generation_config: {
        ai_provider: config?.aiProvider || 'openai',
        model: config?.model || 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1500,
        examples_per_chunk: result.generatedExamples.length / chunks.length,
        prompt_template: templateId
      },
      status: 'completed',
      total_examples: result.generatedExamples.length,
      generated_examples: result.generatedExamples.length,
      quality_score: result.statistics.averageQualityScore
    });

    // Save generated examples
    const exampleData = result.generatedExamples.map(example => ({
      dataset_id: dataset.id,
      source_chunk_id: example.sourceChunkId,
      input: example.input,
      output: example.output,
      example_type: example.type,
      quality_score: example.qualityScore,
      validation_status: 'pending' as const,
      metadata: example.metadata
    }));

    await exampleRepo.createBatch(exampleData);

    return c.json({ 
      success: true, 
      data: {
        dataset,
        statistics: result.statistics,
        examples: result.generatedExamples.slice(0, 5) // Return first 5 examples as preview
      }
    });

  } catch (error) {
    console.error('Error generating dataset:', error);
    return c.json({ success: false, error: 'Failed to generate dataset' }, 500);
  }
});

// Catch-all for React Router
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
