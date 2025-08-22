import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface DatasetViewerProps {
  projectId: string;
  datasetId: string;
  onClose: () => void;
}

interface DatasetExample {
  id: string;
  input: string;
  output: string;
  metadata: any;
  quality_score: number;
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
  dataset_type: string;
  status: string;
  total_examples: number;
  generated_examples: number;
  quality_score: number;
  created_at: string;
  examples: DatasetExample[];
}

export function DatasetViewer({ projectId, datasetId, onClose }: DatasetViewerProps) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const examplesPerPage = 10;

  useEffect(() => {
    loadDataset();
  }, [projectId, datasetId]);

  const loadDataset = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}`);
      const data = await response.json();

      if (data.success) {
        console.log('Dataset loaded:', data.data);
        console.log('Examples type:', typeof data.data.examples, 'Is array:', Array.isArray(data.data.examples));
        setDataset(data.data);
      } else {
        setError(data.error || 'Failed to load dataset');
      }
    } catch (error) {
      console.error('Error loading dataset:', error);
      setError('Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      setExporting(format);
      
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}/export/${format}`);
      
      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `dataset.${format}`;
          
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to export as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the dataset "${dataset?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${projectId}/datasets/${datasetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Dataset deleted successfully');
        onClose(); // Close the viewer
      } else {
        setError(data.error || 'Failed to delete dataset');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete dataset');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="animate-spin text-2xl">⏳</span>
            <span>Loading dataset...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold mb-4">Error</h3>
          <p className="text-red-600 mb-4">{error || 'Dataset not found'}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  const examples = Array.isArray(dataset.examples) ? dataset.examples : [];
  const totalPages = Math.ceil(examples.length / examplesPerPage);
  const startIndex = (currentPage - 1) * examplesPerPage;
  const endIndex = startIndex + examplesPerPage;
  const currentExamples = examples.slice(startIndex, endIndex);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{dataset.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded text-xs ${
                dataset.status === 'completed' ? 'bg-green-100 text-green-800' : 
                dataset.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {dataset.status}
              </span>
              <span>Type: {dataset.dataset_type}</span>
              <span>Examples: {dataset.total_examples}</span>
              <span>Quality: {(dataset.quality_score * 100).toFixed(0)}%</span>
            </div>
            {dataset.description && (
              <p className="text-gray-700 mt-2">{dataset.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex space-x-3">
            <Button
              onClick={() => handleExport('json')}
              disabled={exporting === 'json'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {exporting === 'json' ? '⏳ Exporting...' : '📄 Export JSON'}
            </Button>
            <Button
              onClick={() => handleExport('jsonl')}
              disabled={exporting === 'jsonl'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {exporting === 'jsonl' ? '⏳ Exporting...' : '📝 Export JSONL'}
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              disabled={exporting === 'csv'}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {exporting === 'csv' ? '⏳ Exporting...' : '📊 Export CSV'}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 ml-auto"
            >
              {deleting ? '⏳ Deleting...' : '🗑️ Delete Dataset'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800">❌ {error}</p>
            <Button 
              onClick={() => setError('')} 
              className="mt-2 bg-red-100 text-red-800 hover:bg-red-200"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Examples */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Training Examples</h3>
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, examples.length)} of {examples.length}
            </div>
          </div>

          {examples.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p>No examples found in this dataset</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentExamples.map((example, index) => (
                <Card key={example.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Example #{startIndex + index + 1}
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        Quality: {(example.quality_score * 100).toFixed(0)}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                      <div className="bg-gray-50 p-3 rounded border text-sm">
                        {example.input}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                      <div className="bg-green-50 p-3 rounded border text-sm">
                        {example.output}
                      </div>
                    </div>
                    {example.metadata && Object.keys(example.metadata).length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Metadata:</div>
                        <div className="bg-blue-50 p-3 rounded border text-xs font-mono">
                          {JSON.stringify(example.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 ${
                      page === currentPage 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
