// Database utilities and connection management for Cloudflare D1

import type { D1Database } from '@cloudflare/workers-types';

export class DatabaseManager {
  constructor(private db: D1Database) {}

  // Generic query helper with error handling
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  // Get single row
  async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const result = await this.db.prepare(sql).bind(...params).first();
      return result as T | null;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  // Execute non-query statements (INSERT, UPDATE, DELETE)
  async execute(sql: string, params: any[] = []): Promise<{ success: boolean; meta: any }> {
    try {
      const result = await this.db.prepare(sql).bind(...params).run();
      return { success: result.success, meta: result.meta };
    } catch (error) {
      console.error('Database execute error:', error);
      throw new Error(`Database execute failed: ${error}`);
    }
  }

  // Batch operations
  async batch(statements: { sql: string; params?: any[] }[]): Promise<any[]> {
    try {
      const prepared = statements.map(stmt => 
        this.db.prepare(stmt.sql).bind(...(stmt.params || []))
      );
      const results = await this.db.batch(prepared);
      return results;
    } catch (error) {
      console.error('Database batch error:', error);
      throw new Error(`Database batch failed: ${error}`);
    }
  }

  // Transaction helper
  async transaction<T>(callback: (db: DatabaseManager) => Promise<T>): Promise<T> {
    // Note: D1 doesn't support explicit transactions yet
    // This is a placeholder for future transaction support
    return await callback(this);
  }

  // Migration helper
  async runMigration(migrationSql: string): Promise<void> {
    try {
      // Split migration into individual statements
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await this.execute(statement);
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.queryFirst('SELECT 1 as health');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Utility functions for common database operations
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Query builders for common patterns
export class QueryBuilder {
  private query: string = '';
  private params: any[] = [];

  static select(columns: string = '*'): QueryBuilder {
    const builder = new QueryBuilder();
    builder.query = `SELECT ${columns}`;
    return builder;
  }

  static insert(table: string): QueryBuilder {
    const builder = new QueryBuilder();
    builder.query = `INSERT INTO ${table}`;
    return builder;
  }

  static update(table: string): QueryBuilder {
    const builder = new QueryBuilder();
    builder.query = `UPDATE ${table}`;
    return builder;
  }

  static delete(): QueryBuilder {
    const builder = new QueryBuilder();
    builder.query = 'DELETE';
    return builder;
  }

  from(table: string): QueryBuilder {
    this.query += ` FROM ${table}`;
    return this;
  }

  where(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` WHERE ${condition}`;
    this.params.push(...params);
    return this;
  }

  and(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` AND ${condition}`;
    this.params.push(...params);
    return this;
  }

  or(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` OR ${condition}`;
    this.params.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.query += ` LIMIT ${count}`;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.query += ` OFFSET ${count}`;
    return this;
  }

  values(data: Record<string, any>): QueryBuilder {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    this.query += ` (${columns.join(', ')}) VALUES (${placeholders})`;
    this.params.push(...Object.values(data));
    return this;
  }

  set(data: Record<string, any>): QueryBuilder {
    const assignments = Object.keys(data).map(key => `${key} = ?`).join(', ');
    this.query += ` SET ${assignments}`;
    this.params.push(...Object.values(data));
    return this;
  }

  build(): { sql: string; params: any[] } {
    return { sql: this.query, params: this.params };
  }
}

// Common database operations
export class BaseRepository {
  constructor(protected db: DatabaseManager) {}

  protected async findById<T>(table: string, id: string): Promise<T | null> {
    const { sql, params } = QueryBuilder
      .select()
      .from(table)
      .where('id = ?', id)
      .build();
    
    return await this.db.queryFirst<T>(sql, params);
  }

  protected async findMany<T>(
    table: string, 
    conditions: Record<string, any> = {},
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    let builder = QueryBuilder.select().from(table);
    
    const conditionEntries = Object.entries(conditions);
    if (conditionEntries.length > 0) {
      const [key, value] = conditionEntries[0];
      builder = builder.where(`${key} = ?`, value);
      
      for (let i = 1; i < conditionEntries.length; i++) {
        const [key, value] = conditionEntries[i];
        builder = builder.and(`${key} = ?`, value);
      }
    }
    
    if (limit) builder = builder.limit(limit);
    if (offset) builder = builder.offset(offset);
    
    const { sql, params } = builder.build();
    return await this.db.query<T>(sql, params);
  }

  protected async create<T>(table: string, data: Record<string, any>): Promise<T> {
    const id = generateId();
    const now = getCurrentTimestamp();
    
    const insertData = {
      id,
      ...data,
      created_at: now,
      updated_at: now
    };
    
    const { sql, params } = QueryBuilder
      .insert(table)
      .values(insertData)
      .build();
    
    const result = await this.db.execute(sql, params);
    
    // Return the inserted data directly instead of querying back
    return insertData as T;
  }

  protected async update<T>(
    table: string, 
    id: string, 
    data: Record<string, any>
  ): Promise<T | null> {
    // First, get the current record to merge with updates
    const currentRecord = await this.findById<T>(table, id);
    if (!currentRecord) {
      return null;
    }
    
    const updateData = {
      ...data,
      updated_at: getCurrentTimestamp()
    };
    
    const { sql, params } = QueryBuilder
      .update(table)
      .set(updateData)
      .where('id = ?', id)
      .build();
    
    const result = await this.db.execute(sql, params);
    
    // Return the merged data directly instead of querying again
    return {
      ...currentRecord,
      ...updateData,
      id  // Ensure ID is preserved
    } as T;
  }

  protected async delete(table: string, id: string): Promise<boolean> {
    const { sql, params } = QueryBuilder
      .delete()
      .from(table)
      .where('id = ?', id)
      .build();
    
    const result = await this.db.execute(sql, params);
    return result.success;
  }
}
