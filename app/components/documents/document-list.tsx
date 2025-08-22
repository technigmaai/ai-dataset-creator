import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { formatDate } from "../../lib/utils";
import type { Document } from "../../lib/types";

interface DocumentListProps {
  documents: Document[];
  onDocumentDelete: (documentId: string) => void;
  onDocumentProcess: (documentId: string) => void;
}

export function DocumentList({ documents, onDocumentDelete, onDocumentProcess }: DocumentListProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const getFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt':
      case 'md': return '📋';
      default: return '📎';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploading': return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📤 Uploading</span>;
      case 'processing': return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚙️ Processing</span>;
      case 'completed': return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Ready</span>;
      case 'failed': return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">❌ Failed</span>;
      default: return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">❓ Unknown</span>;
    }
  };

  const handleProcess = async (documentId: string) => {
    setProcessingIds(prev => new Set([...prev, documentId]));
    try {
      await onDocumentProcess(documentId);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
          <p className="text-muted-foreground">
            Upload some documents to start creating your AI training dataset
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Uploaded Documents</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''} • {' '}
            {documents.filter(d => d.processing_status === 'completed').length} processed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            📊 View Analytics
          </Button>
          <Button variant="outline" size="sm">
            🗂️ Generate Dataset
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {getFileIcon(document.file_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium truncate">{document.filename}</h4>
                    {getStatusBadge(document.processing_status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(document.file_size)}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {document.file_type.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">Chunks:</span> {0}
                    </div>
                    <div>
                      <span className="font-medium">Uploaded:</span> {formatDate(document.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {document.processing_status === 'completed' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProcess(document.id)}
                        disabled={processingIds.has(document.id)}
                      >
                        {processingIds.has(document.id) ? '⚙️ Processing...' : '🔄 Reprocess'}
                      </Button>
                      <Button size="sm" variant="outline">
                        👁️ Preview
                      </Button>
                    </>
                  )}
                  
                  {document.processing_status === 'failed' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleProcess(document.id)}
                      disabled={processingIds.has(document.id)}
                    >
                      {processingIds.has(document.id) ? '⚙️ Retrying...' : '🔄 Retry'}
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onDocumentDelete(document.id)}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
