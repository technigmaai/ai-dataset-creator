// Database repositories for managing data access
import { BaseRepository, DatabaseManager } from './database';
import type { 
  User, 
  Project, 
  Document, 
  DocumentChunk, 
  Dataset, 
  DatasetExample, 
  GenerationJob,
  PaginatedResponse 
} from './types';

/**
 * User repository
 */
class UserRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.db.queryFirst<User>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    return await super.create<User>('users', userData);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    return await super.update<User>('users', id, userData);
  }
}

/**
 * Project repository
 */
class ProjectRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByUserId(userId: string, limit?: number, offset?: number): Promise<Project[]> {
    return await this.findMany<Project>('projects', { user_id: userId }, limit, offset);
  }

  async create(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    return await super.create<Project>('projects', projectData);
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project | null> {
    return await super.update<Project>('projects', id, projectData);
  }

  async delete(id: string): Promise<boolean> {
    return await super.delete('projects', id);
  }

  async findById(id: string): Promise<Project | null> {
    return await super.findById<Project>('projects', id);
  }
}

/**
 * Document repository
 */
class DocumentRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByProjectId(projectId: string): Promise<Document[]> {
    return await this.findMany<Document>('documents', { project_id: projectId });
  }

  async findByStatus(status: string): Promise<Document[]> {
    return await this.findMany<Document>('documents', { processing_status: status });
  }

  async create(documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    // Convert metadata object to JSON string
    const data = {
      ...documentData,
      metadata: documentData.metadata ? JSON.stringify(documentData.metadata) : null
    };
    
    const result = await super.create<any>('documents', data);
    
    // Parse metadata back to object
    return {
      ...result,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }

  async update(id: string, documentData: Partial<Document>): Promise<Document | null> {
    // Convert metadata object to JSON string if present
    const data = documentData.metadata 
      ? { ...documentData, metadata: JSON.stringify(documentData.metadata) }
      : documentData;
    
    const result = await super.update<any>('documents', id, data);
    
    if (!result) return null;
    
    // Parse metadata back to object
    return {
      ...result,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }

  async delete(id: string): Promise<boolean> {
    return await super.delete('documents', id);
  }

  async findById(id: string): Promise<Document | null> {
    const result = await super.findById<any>('documents', id);
    
    if (!result) return null;
    
    return {
      ...result,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }

  async updateProcessingStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    await this.db.execute(
      'UPDATE documents SET processing_status = ?, error_message = ?, updated_at = ? WHERE id = ?',
      [status, errorMessage || null, new Date().toISOString(), id]
    );
  }
}

/**
 * Document chunk repository
 */
class DocumentChunkRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    return await this.db.query<DocumentChunk>(
      'SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index',
      [documentId]
    );
  }

  async create(chunkData: Omit<DocumentChunk, 'id' | 'created_at'>): Promise<DocumentChunk> {
    return await super.create<DocumentChunk>('document_chunks', chunkData);
  }

  async createBatch(chunks: Omit<DocumentChunk, 'id' | 'created_at'>[]): Promise<void> {
    const statements = chunks.map(chunk => ({
      sql: `INSERT INTO document_chunks (id, document_id, chunk_index, content, word_count, char_count, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        crypto.randomUUID(),
        chunk.document_id,
        chunk.chunk_index,
        chunk.content,
        chunk.word_count,
        chunk.char_count,
        new Date().toISOString()
      ]
    }));

    await this.db.batch(statements);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.db.execute('DELETE FROM document_chunks WHERE document_id = ?', [documentId]);
  }

  async createBatch(chunksData: Omit<DocumentChunk, 'id' | 'created_at'>[]): Promise<void> {
    for (const chunkData of chunksData) {
      await this.create(chunkData);
    }
  }
}

/**
 * Dataset repository
 */
class DatasetRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByProjectId(projectId: string): Promise<Dataset[]> {
    const results = await this.findMany<any>('datasets', { project_id: projectId });
    
    return results.map(dataset => ({
      ...dataset,
      source_documents: JSON.parse(dataset.source_documents),
      generation_config: JSON.parse(dataset.generation_config)
    }));
  }

  async create(datasetData: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>): Promise<Dataset> {
    const data = {
      ...datasetData,
      source_documents: JSON.stringify(datasetData.source_documents),
      generation_config: JSON.stringify(datasetData.generation_config)
    };
    
    const result = await super.create<any>('datasets', data);
    
    return {
      ...result,
      source_documents: JSON.parse(result.source_documents),
      generation_config: JSON.parse(result.generation_config)
    };
  }

  async update(id: string, datasetData: Partial<Dataset>): Promise<Dataset | null> {
    const data: any = { ...datasetData };
    
    if (datasetData.source_documents) {
      data.source_documents = JSON.stringify(datasetData.source_documents);
    }
    
    if (datasetData.generation_config) {
      data.generation_config = JSON.stringify(datasetData.generation_config);
    }
    
    const result = await super.update<any>('datasets', id, data);
    
    if (!result) return null;
    
    return {
      ...result,
      source_documents: JSON.parse(result.source_documents),
      generation_config: JSON.parse(result.generation_config)
    };
  }

  async findById(id: string): Promise<Dataset | null> {
    const result = await super.findById<any>('datasets', id);
    
    if (!result) return null;
    
    return {
      ...result,
      source_documents: JSON.parse(result.source_documents),
      generation_config: JSON.parse(result.generation_config)
    };
  }

  async delete(id: string): Promise<boolean> {
    return await super.delete('datasets', id);
  }

  async updateProgress(id: string, generatedExamples: number, status?: string): Promise<void> {
    const params = [generatedExamples, new Date().toISOString(), id];
    let sql = 'UPDATE datasets SET generated_examples = ?, updated_at = ?';
    
    if (status) {
      sql += ', status = ?';
      params.splice(-1, 0, status);
    }
    
    sql += ' WHERE id = ?';
    
    await this.db.execute(sql, params);
  }
}

/**
 * Dataset example repository
 */
class DatasetExampleRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByDatasetId(
    datasetId: string, 
    limit?: number, 
    offset?: number
  ): Promise<PaginatedResponse<DatasetExample>> {
    const countResult = await this.db.queryFirst<{ count: number }>(
      'SELECT COUNT(*) as count FROM dataset_examples WHERE dataset_id = ?',
      [datasetId]
    );
    
    const total = countResult?.count || 0;
    
    let sql = 'SELECT * FROM dataset_examples WHERE dataset_id = ? ORDER BY created_at DESC';
    const params = [datasetId];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
      
      if (offset) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    const items = await this.db.query<any>(sql, params);
    
    const examples: DatasetExample[] = items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : undefined
    }));
    
    return {
      items: examples,
      total,
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      limit: limit || total,
      pages: limit ? Math.ceil(total / limit) : 1
    };
  }

  async create(exampleData: Omit<DatasetExample, 'id' | 'created_at'>): Promise<DatasetExample> {
    const data = {
      ...exampleData,
      metadata: exampleData.metadata ? JSON.stringify(exampleData.metadata) : null
    };
    
    const result = await super.create<any>('dataset_examples', data);
    
    return {
      ...result,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    };
  }

  async createBatch(examples: Omit<DatasetExample, 'id' | 'created_at'>[]): Promise<void> {
    const statements = examples.map(example => ({
      sql: `INSERT INTO dataset_examples (id, dataset_id, source_chunk_id, input, output, example_type, quality_score, validation_status, metadata, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        crypto.randomUUID(),
        example.dataset_id,
        example.source_chunk_id || null,
        example.input,
        example.output,
        example.example_type,
        example.quality_score || null,
        example.validation_status,
        example.metadata ? JSON.stringify(example.metadata) : null,
        new Date().toISOString()
      ]
    }));

    await this.db.batch(statements);
  }

  async updateValidationStatus(id: string, status: string, qualityScore?: number): Promise<void> {
    await this.db.execute(
      'UPDATE dataset_examples SET validation_status = ?, quality_score = ?, updated_at = ? WHERE id = ?',
      [status, qualityScore || null, new Date().toISOString(), id]
    );
  }

  async getQualityStats(datasetId: string): Promise<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    averageQuality: number;
  }> {
    const stats = await this.db.queryFirst<{
      total: number;
      approved: number;
      rejected: number;
      pending: number;
      avg_quality: number;
    }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN validation_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN validation_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN validation_status = 'pending' THEN 1 ELSE 0 END) as pending,
        AVG(quality_score) as avg_quality
      FROM dataset_examples 
      WHERE dataset_id = ?
    `, [datasetId]);

    return {
      total: stats?.total || 0,
      approved: stats?.approved || 0,
      rejected: stats?.rejected || 0,
      pending: stats?.pending || 0,
      averageQuality: stats?.avg_quality || 0
    };
  }
}

/**
 * Generation job repository
 */
class GenerationJobRepository extends BaseRepository {
  constructor(db: DatabaseManager) {
    super(db);
  }

  async findByDatasetId(datasetId: string): Promise<GenerationJob[]> {
    return await this.findMany<GenerationJob>('generation_jobs', { dataset_id: datasetId });
  }

  async findActiveJobs(): Promise<GenerationJob[]> {
    return await this.db.query<GenerationJob>(
      'SELECT * FROM generation_jobs WHERE status IN (?, ?) ORDER BY created_at',
      ['queued', 'processing']
    );
  }

  async create(jobData: Omit<GenerationJob, 'id' | 'created_at'>): Promise<GenerationJob> {
    return await super.create<GenerationJob>('generation_jobs', jobData);
  }

  async updateProgress(id: string, progress: number, processedChunks: number): Promise<void> {
    await this.db.execute(
      'UPDATE generation_jobs SET progress = ?, processed_chunks = ? WHERE id = ?',
      [progress, processedChunks, id]
    );
  }

  async updateStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const now = new Date().toISOString();
    
    if (status === 'processing') {
      await this.db.execute(
        'UPDATE generation_jobs SET status = ?, started_at = ? WHERE id = ?',
        [status, now, id]
      );
    } else if (status === 'completed' || status === 'failed') {
      await this.db.execute(
        'UPDATE generation_jobs SET status = ?, completed_at = ?, error_message = ? WHERE id = ?',
        [status, now, errorMessage || null, id]
      );
    } else {
      await this.db.execute(
        'UPDATE generation_jobs SET status = ?, error_message = ? WHERE id = ?',
        [status, errorMessage || null, id]
      );
    }
  }

  async updateTokenUsage(id: string, tokensUsed: number, costEstimate: number): Promise<void> {
    await this.db.execute(
      'UPDATE generation_jobs SET tokens_used = ?, cost_estimate = ? WHERE id = ?',
      [tokensUsed, costEstimate, id]
    );
  }
}

// Export all repositories for easy importing
export {
  UserRepository,
  ProjectRepository,
  DocumentRepository,
  DocumentChunkRepository,
  DatasetRepository,
  DatasetExampleRepository,
  GenerationJobRepository
};
