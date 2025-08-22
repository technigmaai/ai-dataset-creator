import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete: (documents: any[]) => void;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export function DocumentUpload({ projectId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.md'
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return supportedTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      alert(`Some files were skipped. Supported formats: ${supportedTypes.join(', ')}`);
    }

    // Initialize upload progress for each file
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files one by one
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        await uploadFile(file, i + uploads.length);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploads(prev => prev.map((upload, idx) => 
          idx === i + uploads.length 
            ? { ...upload, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : upload
        ));
      }
    }
  };

  const uploadFile = async (file: File, uploadIndex: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    try {
      // Update progress to show processing
      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex 
          ? { ...upload, progress: 50, status: 'processing' }
          : upload
      ));

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update progress to completed
      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex 
          ? { ...upload, progress: 100, status: 'completed' }
          : upload
      ));

      // Notify parent component
      onUploadComplete([result.data]);

    } catch (error) {
      throw error;
    }
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt':
      case 'md': return '📋';
      default: return '📎';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">
            Drop your documents here
          </h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Drag and drop files or click to browse. Supported formats: PDF, Word, Text, Markdown
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={supportedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Progress</CardTitle>
                <CardDescription>
                  {uploads.filter(u => u.status === 'completed').length} of {uploads.length} files processed
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                Clear Completed
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xl">
                    {getFileIcon(upload.file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {upload.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {upload.status === 'uploading' && 'Uploading...'}
                        {upload.status === 'processing' && 'Processing...'}
                        {upload.status === 'completed' && '✅ Complete'}
                        {upload.status === 'error' && '❌ Error'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          upload.status === 'error' ? 'bg-destructive' : 'bg-primary'
                        }`}
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                    {upload.error && (
                      <p className="text-xs text-destructive mt-1">{upload.error}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
