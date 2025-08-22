import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import type { Document } from "../../lib/types";

interface SimpleDocumentListProps {
  documents: Document[];
  onDocumentDelete: (documentId: string) => void;
  onDocumentProcess: (documentId: string) => void;
}

export function SimpleDocumentList({ documents, onDocumentDelete, onDocumentProcess }: SimpleDocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
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
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✅ {document.processing_status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(document.file_size)}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {document.file_type.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDocumentProcess(document.id)}
                  >
                    🔄 Reprocess
                  </Button>
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
