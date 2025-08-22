import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface DatasetGeneratorProps {
  projectId: string;
  documentId: string;
  documentName: string;
  onGenerationComplete?: (dataset: any) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  config: {
    maxTokens: number;
    temperature: number;
  };
}

interface GenerationConfig {
  aiProvider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export function DatasetGenerator({ 
  projectId, 
  documentId, 
  documentName, 
  onGenerationComplete 
}: DatasetGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [config, setConfig] = useState<GenerationConfig>({
    aiProvider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1500
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTemplates(data.data);
            if (data.data.length > 0) {
              setSelectedTemplate(data.data[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          config
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (onGenerationComplete) {
          onGenerationComplete(data.data.dataset);
        }
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to generate dataset. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  if (loadingTemplates) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🤖 Generate AI Training Dataset</CardTitle>
          <p className="text-sm text-gray-600">
            Generate training data from: <strong>{documentName}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Dataset Type & Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isGenerating}
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
            
            {selectedTemplateData && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Description:</strong> {selectedTemplateData.description}
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  <span className="inline-block bg-blue-100 px-2 py-1 rounded mr-2">
                    Type: {selectedTemplateData.type}
                  </span>
                  <span className="inline-block bg-blue-100 px-2 py-1 rounded mr-2">
                    Max Tokens: {selectedTemplateData.config.maxTokens}
                  </span>
                  <span className="inline-block bg-blue-100 px-2 py-1 rounded">
                    Temperature: {selectedTemplateData.config.temperature}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AI Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                AI Provider
              </label>
              <select
                value={config.aiProvider}
                onChange={(e) => setConfig({...config, aiProvider: e.target.value})}
                className="w-full p-2 border rounded-md"
                disabled={isGenerating}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Model
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({...config, model: e.target.value})}
                className="w-full p-2 border rounded-md"
                disabled={isGenerating}
              >
                {config.aiProvider === 'openai' ? (
                  <>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature ({config.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                className="w-full"
                disabled={isGenerating}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                value={config.maxTokens}
                onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplate || isGenerating}
              className="px-8 py-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating Dataset...
                </>
              ) : (
                <>
                  🚀 Generate Dataset
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">❌ {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Generation Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {result.statistics.totalExamples}
                  </div>
                  <div className="text-sm text-green-800">Examples</div>
                </div>
                <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.statistics.processedChunks}
                  </div>
                  <div className="text-sm text-blue-800">Chunks</div>
                </div>
                <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {(result.statistics.averageQualityScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-800">Quality</div>
                </div>
                <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {(result.statistics.processingTimeMs / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-orange-800">Time</div>
                </div>
              </div>

              {/* Dataset Info */}
              <div className="p-4 bg-gray-50 border rounded-md">
                <h4 className="font-medium mb-2">Dataset Created:</h4>
                <p><strong>Name:</strong> {result.dataset.name}</p>
                <p><strong>Type:</strong> {result.dataset.dataset_type}</p>
                <p><strong>Status:</strong> {result.dataset.status}</p>
                <p><strong>ID:</strong> <code className="text-xs bg-gray-200 px-1 rounded">{result.dataset.id}</code></p>
              </div>

              {/* Example Preview */}
              {result.examples && result.examples.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">📋 Example Preview (First 3):</h4>
                  <div className="space-y-3">
                    {result.examples.slice(0, 3).map((example: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-white">
                        <div className="mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                            {example.type}
                          </span>
                          {example.qualityScore && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Quality: {(example.qualityScore * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                            <div className="text-sm bg-gray-50 p-2 rounded border">
                              {example.input}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                            <div className="text-sm bg-gray-50 p-2 rounded border">
                              {example.output}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => window.open(`/projects/${projectId}/datasets`, '_blank')}
                >
                  📊 View All Datasets
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement export functionality
                    alert('Export functionality coming soon!');
                  }}
                >
                  💾 Export Dataset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
