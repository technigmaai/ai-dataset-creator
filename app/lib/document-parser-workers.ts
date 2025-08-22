// Workers-compatible document parsing utilities
// This version doesn't use Node.js-specific libraries like fs or Buffer

import type { DocumentMetadata } from './types';

export interface ParseResult {
  text: string;
  metadata: DocumentMetadata;
  wordCount: number;
  charCount: number;
}

export class WorkersDocumentParser {
  /**
   * Parse a document based on its file type (Workers-compatible version)
   */
  static async parse(file: File): Promise<ParseResult> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'txt':
      case 'md':
        return await this.parseText(file);
      case 'pdf':
      case 'doc':
      case 'docx':
        // For now, return placeholder - will implement with Workers-compatible libraries
        return await this.parsePlaceholder(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse plain text files (Works in Workers)
   */
  private static async parseText(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const wordCount = this.countWords(text);
      const charCount = text.length;
      
      const metadata: DocumentMetadata = {
        title: file.name,
        word_count: wordCount,
        language: this.detectLanguage(text)
      };
      
      return {
        text: this.cleanText(text),
        metadata,
        wordCount,
        charCount
      };
    } catch (error) {
      throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Placeholder parser for PDF and Word documents
   * TODO: Implement with Workers-compatible libraries like:
   * - @react-pdf/renderer for PDF
   * - pizzip + docxtemplater for Word
   */
  private static async parsePlaceholder(file: File): Promise<ParseResult> {
    const metadata: DocumentMetadata = {
      title: file.name,
      word_count: 0,
      language: 'en'
    };
    
    return {
      text: `[Document parsing for ${file.type} files will be implemented with Workers-compatible libraries]`,
      metadata,
      wordCount: 0,
      charCount: 0
    };
  }

  /**
   * Determine file type from filename
   */
  private static getFileType(filename: string): 'pdf' | 'doc' | 'docx' | 'txt' | 'md' {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
        return 'doc';
      case 'docx':
        return 'docx';
      case 'txt':
        return 'txt';
      case 'md':
        return 'md';
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  /**
   * Clean and normalize text content
   */
  private static cleanText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim()
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Normalize dashes
      .replace(/[–—]/g, '-');
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Basic language detection (simplified)
   */
  private static detectLanguage(text: string): string {
    const sample = text.substring(0, 1000).toLowerCase();
    
    // English indicators
    if (sample.includes('the ') && sample.includes(' and ') && sample.includes(' of ')) {
      return 'en';
    }
    
    // Spanish indicators
    if (sample.includes(' el ') && sample.includes(' de ') && sample.includes(' que ')) {
      return 'es';
    }
    
    // French indicators
    if (sample.includes(' le ') && sample.includes(' de ') && sample.includes(' que ')) {
      return 'fr';
    }
    
    // Default to English
    return 'en';
  }

  /**
   * Validate file before parsing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check file type
    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (!allowedExtensions.includes(extension || '')) {
      return { valid: false, error: 'Unsupported file type. Please upload PDF, Word, Text, or Markdown files.' };
    }

    return { valid: true };
  }
}

/**
 * Text chunking utility (Works in Workers)
 */
export class WorkersTextChunker {
  /**
   * Split text into semantic chunks
   */
  static chunkText(
    text: string, 
    options: {
      maxChunkSize?: number;
      overlapSize?: number;
      preserveParagraphs?: boolean;
    } = {}
  ): string[] {
    const {
      maxChunkSize = 1000,
      overlapSize = 100,
      preserveParagraphs = true
    } = options;

    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    
    if (preserveParagraphs) {
      // Split by paragraphs first
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size
        if (currentChunk.length + paragraph.length > maxChunkSize) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            
            // Start new chunk with overlap from previous chunk
            const words = currentChunk.trim().split(/\s+/);
            const overlapWords = words.slice(-Math.floor(overlapSize / 10)); // Approximate overlap
            currentChunk = overlapWords.join(' ') + '\n\n' + paragraph;
          } else {
            // Single paragraph is too large, split by sentences
            const sentences = this.splitBySentences(paragraph);
            currentChunk = this.chunkSentences(sentences, maxChunkSize, overlapSize, chunks);
          }
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
      }
      
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    } else {
      // Simple word-based chunking
      const words = text.split(/\s+/);
      let currentChunk = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        if (currentChunk.length + word.length + 1 > maxChunkSize) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            
            // Create overlap
            const chunkWords = currentChunk.trim().split(/\s+/);
            const overlapWords = chunkWords.slice(-Math.floor(overlapSize / 10));
            currentChunk = overlapWords.join(' ') + ' ' + word;
          } else {
            currentChunk = word;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    }
    
    return chunks.filter(chunk => chunk.trim().length > 0);
  }

  /**
   * Split text by sentences
   */
  private static splitBySentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + '.');
  }

  /**
   * Chunk sentences into appropriately sized chunks
   */
  private static chunkSentences(
    sentences: string[], 
    maxChunkSize: number, 
    overlapSize: number, 
    chunks: string[]
  ): string {
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          
          // Create overlap
          const words = currentChunk.trim().split(/\s+/);
          const overlapWords = words.slice(-Math.floor(overlapSize / 10));
          currentChunk = overlapWords.join(' ') + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    return currentChunk;
  }
}
