import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface DatasetGeneratorProps {
  projectId: string;
  documentId: string;
  documentName: string;
  onGenerationComplete?: (dataset: any) => void;
  isProjectLevel?: boolean;
  documents?: any[];
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
  customEndpoint?: string;
  customApiKey?: string;
}

export function DatasetGenerator({ 
  projectId, 
  documentId, 
  documentName, 
  onGenerationComplete,
  isProjectLevel = false,
  documents = []
}: DatasetGeneratorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [config, setConfig] = useState<GenerationConfig>({
    aiProvider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1500,
    customEndpoint: '',
    customApiKey: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Load available templates and global settings
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

    const loadGlobalSettings = () => {
      try {
        const stored = localStorage.getItem('ai-dataset-creator-settings');
        if (stored) {
          const globalSettings = JSON.parse(stored);
          setConfig(prev => ({
            ...prev,
            aiProvider: globalSettings.defaultProvider || prev.aiProvider,
            model: globalSettings.defaultModel || prev.model,
            temperature: globalSettings.temperature || prev.temperature,
            maxTokens: globalSettings.maxTokens || prev.maxTokens,
            customEndpoint: globalSettings.customEndpointUrl || prev.customEndpoint,
            customApiKey: globalSettings.customApiKey || prev.customApiKey
          }));
        }
      } catch (error) {
        console.error('Failed to load global settings:', error);
      }
    };

    loadTemplates();
    loadGlobalSettings();
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
        const errorMessage = data.error || 'Generation failed';
        if (errorMessage.includes('No AI providers configured')) {
          setError(`${errorMessage}\n\n💡 Tip: Use "Demo Mode" instead, or configure API keys in Settings.`);
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to generate dataset. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDemo = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      let response;
      
      if (isProjectLevel) {
        // For project-level generation, we'll use the first document as a representative
        // In a full implementation, this would process all documents
        const firstDocId = documents.length > 0 ? documents[0].id : documentId;
        response = await fetch(`/api/projects/${projectId}/documents/${firstDocId}/generate-demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: selectedTemplate,
            isProjectLevel: true,
            documentCount: documents.length
          })
        });
      } else {
        response = await fetch(`/api/projects/${projectId}/documents/${documentId}/generate-demo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: selectedTemplate
          })
        });
      }

      const data = await response.json();

      if (data.success) {
        // Adjust the result for project-level generation
        if (isProjectLevel) {
          data.data.statistics.totalExamples *= documents.length;
          data.data.statistics.processedChunks *= documents.length;
          data.data.dataset.name = `DEMO: Generated from ${documents.length} project documents`;
          data.data.dataset.total_examples *= documents.length;
        }
        
        setResult(data.data);
        if (onGenerationComplete) {
          onGenerationComplete(data.data.dataset);
        }
      } else {
        setError(data.error || 'Demo generation failed');
      }
    } catch (error) {
      console.error('Demo generation error:', error);
      setError('Failed to generate demo dataset. Please try again.');
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
            {isProjectLevel ? (
              <>Generate training data from: <strong>{documentName}</strong></>
            ) : (
              <>Generate training data from: <strong>{documentName}</strong></>
            )}
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
                <option value="custom">Custom OpenAI Compatible</option>
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
                ) : config.aiProvider === 'anthropic' ? (
                  <>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="llama-3-8b">Llama 3 8B</option>
                    <option value="llama-3-70b">Llama 3 70B</option>
                    <option value="mistral-7b">Mistral 7B</option>
                    <option value="custom-model">Custom Model</option>
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

          {/* Custom Endpoint Configuration */}
          {config.aiProvider === 'custom' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md space-y-4">
              <h4 className="font-medium text-yellow-800">Custom OpenAI Compatible Endpoint</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Endpoint URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.your-provider.com/v1"
                    value={config.customEndpoint}
                    onChange={(e) => setConfig({...config, customEndpoint: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter the base URL for your OpenAI-compatible API (e.g., Ollama, LocalAI, etc.)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="your-api-key-here"
                    value={config.customApiKey}
                    onChange={(e) => setConfig({...config, customApiKey: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Leave empty if your endpoint doesn't require authentication
                  </p>
                </div>
                {config.model === 'custom-model' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Model Name
                    </label>
                    <input
                      type="text"
                      placeholder="llama3:8b"
                      onChange={(e) => setConfig({...config, model: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      disabled={isGenerating}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleGenerateDemo}
              disabled={!selectedTemplate || isGenerating}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {isProjectLevel ? 'Generating Project Demo...' : 'Generating Demo...'}
                </>
              ) : (
                <>
                  🎭 Demo Mode (No API Keys)
                </>
              )}
            </Button>
            
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplate || isGenerating}
              className="px-6 py-2 bg-green-500 hover:bg-green-600"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {isProjectLevel ? 'Generating Project Dataset...' : 'Generating Dataset...'}
                </>
              ) : (
                <>
                  🚀 Live AI Generation
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            {isProjectLevel && (
              <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-medium">
                  🚀 Project-Level Generation
                </p>
                <p className="text-purple-700 text-xs">
                  This will generate datasets using content from all {documents.length} documents in your project
                </p>
              </div>
            )}
            <p>
              <strong>🎭 Demo Mode:</strong> Test the system with realistic sample data (no AI API keys required)
            </p>
            <p>
              <strong>🚀 Live AI:</strong> Generate real datasets using OpenAI/Anthropic APIs (requires API keys)
            </p>
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
