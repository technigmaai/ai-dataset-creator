// Export service for generating different dataset formats
import type { DatasetExample, ExportFormat, ExportOptions } from './types';

export class ExportService {
  /**
   * Export dataset examples in the specified format
   */
  static async exportDataset(
    examples: DatasetExample[],
    options: ExportOptions
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    // Filter examples based on options
    const filteredExamples = this.filterExamples(examples, options);

    switch (options.format) {
      case 'jsonl':
        return this.exportAsJSONL(filteredExamples, options);
      case 'json':
        return this.exportAsJSON(filteredExamples, options);
      case 'csv':
        return this.exportAsCSV(filteredExamples, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as JSONL format (one JSON object per line)
   */
  private static exportAsJSONL(
    examples: DatasetExample[],
    options: ExportOptions
  ): { content: string; filename: string; mimeType: string } {
    const lines = examples.map(example => {
      const exportItem: any = {
        input: example.input,
        output: example.output,
        type: example.example_type
      };

      if (options.include_metadata && example.metadata) {
        exportItem.metadata = example.metadata;
      }

      if (example.quality_score !== undefined) {
        exportItem.quality_score = example.quality_score;
      }

      return JSON.stringify(exportItem);
    });

    return {
      content: lines.join('\n'),
      filename: `dataset_${new Date().toISOString().split('T')[0]}.jsonl`,
      mimeType: 'application/jsonl'
    };
  }

  /**
   * Export as JSON format
   */
  private static exportAsJSON(
    examples: DatasetExample[],
    options: ExportOptions
  ): { content: string; filename: string; mimeType: string } {
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_examples: examples.length,
        format: 'json',
        include_metadata: options.include_metadata
      },
      examples: examples.map(example => {
        const exportItem: any = {
          id: example.id,
          input: example.input,
          output: example.output,
          type: example.example_type,
          validation_status: example.validation_status,
          created_at: example.created_at
        };

        if (options.include_metadata && example.metadata) {
          exportItem.metadata = example.metadata;
        }

        if (example.quality_score !== undefined) {
          exportItem.quality_score = example.quality_score;
        }

        return exportItem;
      })
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `dataset_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Export as CSV format
   */
  private static exportAsCSV(
    examples: DatasetExample[],
    options: ExportOptions
  ): { content: string; filename: string; mimeType: string } {
    if (examples.length === 0) {
      return {
        content: 'input,output,type,quality_score,validation_status\n',
        filename: `dataset_${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv'
      };
    }

    // Define CSV headers
    const headers = ['input', 'output', 'type', 'quality_score', 'validation_status'];
    
    if (options.include_metadata) {
      headers.push('metadata');
    }

    // Create CSV content
    const csvLines = [headers.join(',')];
    
    examples.forEach(example => {
      const row = [
        this.escapeCsvField(example.input),
        this.escapeCsvField(example.output),
        example.example_type,
        example.quality_score || '',
        example.validation_status
      ];

      if (options.include_metadata) {
        row.push(this.escapeCsvField(JSON.stringify(example.metadata || {})));
      }

      csvLines.push(row.join(','));
    });

    return {
      content: csvLines.join('\n'),
      filename: `dataset_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Filter examples based on export options
   */
  private static filterExamples(
    examples: DatasetExample[],
    options: ExportOptions
  ): DatasetExample[] {
    let filtered = [...examples];

    // Filter by quality threshold
    if (options.quality_threshold !== undefined) {
      filtered = filtered.filter(example => 
        example.quality_score !== undefined && 
        example.quality_score >= options.quality_threshold!
      );
    }

    // Filter by validation status
    if (options.validation_status && options.validation_status.length > 0) {
      filtered = filtered.filter(example => 
        options.validation_status!.includes(example.validation_status)
      );
    }

    return filtered;
  }

  /**
   * Escape CSV field (handle quotes and commas)
   */
  private static escapeCsvField(field: string): string {
    if (typeof field !== 'string') {
      field = String(field);
    }

    // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
  }

  /**
   * Generate export statistics
   */
  static generateExportStats(examples: DatasetExample[]): {
    total: number;
    by_type: Record<string, number>;
    by_validation: Record<string, number>;
    avg_quality: number;
  } {
    const stats = {
      total: examples.length,
      by_type: {} as Record<string, number>,
      by_validation: {} as Record<string, number>,
      avg_quality: 0
    };

    let totalQuality = 0;
    let qualityCount = 0;

    examples.forEach(example => {
      // Count by type
      stats.by_type[example.example_type] = (stats.by_type[example.example_type] || 0) + 1;
      
      // Count by validation status
      stats.by_validation[example.validation_status] = (stats.by_validation[example.validation_status] || 0) + 1;
      
      // Calculate average quality
      if (example.quality_score !== undefined) {
        totalQuality += example.quality_score;
        qualityCount++;
      }
    });

    stats.avg_quality = qualityCount > 0 ? totalQuality / qualityCount : 0;

    return stats;
  }

  /**
   * Validate export options
   */
  static validateExportOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.format) {
      errors.push('Export format is required');
    }

    if (!['jsonl', 'json', 'csv'].includes(options.format)) {
      errors.push('Export format must be one of: jsonl, json, csv');
    }

    if (options.quality_threshold !== undefined) {
      if (options.quality_threshold < 0 || options.quality_threshold > 1) {
        errors.push('Quality threshold must be between 0 and 1');
      }
    }

    if (options.validation_status && options.validation_status.length === 0) {
      errors.push('Validation status filter cannot be empty if provided');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get format-specific information
   */
  static getFormatInfo(format: ExportFormat): {
    name: string;
    description: string;
    extension: string;
    mimeType: string;
    useCase: string;
  } {
    const formatInfo = {
      jsonl: {
        name: 'JSONL',
        description: 'JSON Lines format - one JSON object per line',
        extension: 'jsonl',
        mimeType: 'application/jsonl',
        useCase: 'Perfect for training most AI models (OpenAI, Hugging Face, etc.)'
      },
      json: {
        name: 'JSON',
        description: 'Standard JSON format with metadata',
        extension: 'json',
        mimeType: 'application/json',
        useCase: 'Good for data analysis and custom processing pipelines'
      },
      csv: {
        name: 'CSV',
        description: 'Comma-separated values format',
        extension: 'csv',
        mimeType: 'text/csv',
        useCase: 'Ideal for spreadsheet analysis and traditional ML workflows'
      }
    };

    return formatInfo[format];
  }
}
