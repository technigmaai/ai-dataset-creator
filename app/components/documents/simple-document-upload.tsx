import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface SimpleDocumentUploadProps {
  projectId: string;
  onUploadComplete: (documents: any[]) => void;
}

export function SimpleDocumentUpload({ projectId, onUploadComplete }: SimpleDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onUploadComplete([result.data]);
          alert('Document uploaded successfully!');
        } else {
          alert('Upload failed: ' + result.error);
        }
      } else {
        alert('Upload failed: ' + response.statusText);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
          <p className="text-muted-foreground mb-4">
            Select a document to upload (PDF, Word, Text, Markdown)
          </p>
          
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          
          <label htmlFor="file-upload">
            <Button asChild disabled={isUploading}>
              <span>
                {isUploading ? '⏳ Uploading...' : '📤 Choose File'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
