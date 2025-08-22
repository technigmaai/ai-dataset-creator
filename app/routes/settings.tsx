import { useState, useEffect } from "react";
import type { Route } from "./+types/settings";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - AI Dataset Creator" },
    { name: "description", content: "Configure your AI Dataset Creator settings" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { settings: {} }; // TODO: Load from database
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  // State for all settings
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    customEndpointUrl: '',
    customApiKey: '',
    defaultModel: 'gpt-3.5-turbo',
    defaultProvider: 'openai',
    temperature: 0.7,
    examplesPerChunk: 3,
    maxTokens: 1500
  });
  
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load from localStorage first (client-side storage)
      const stored = localStorage.getItem('ai-dataset-creator-settings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
      
      // TODO: Also load from server/database in the future
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (settingsType: 'ai' | 'defaults') => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      // Save to localStorage (client-side)
      localStorage.setItem('ai-dataset-creator-settings', JSON.stringify(settings));
      
      // TODO: Save to server/database in the future
      
      setSaveMessage(`${settingsType === 'ai' ? 'AI' : 'Default'} settings saved successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-4">⚙️</div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            
            <div className="grid gap-6">
              {/* Success/Error Message */}
              {saveMessage && (
                <div className={`p-4 rounded-lg ${
                  saveMessage.includes('success') 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {saveMessage}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Configuration</CardTitle>
                  <CardDescription>
                    Configure your AI model settings and API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Standard API Keys */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-gray-700">Standard Providers</h4>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">OpenAI API Key</label>
                      <Input 
                        type="password" 
                        placeholder="sk-..." 
                        className="font-mono"
                        value={settings.openaiApiKey}
                        onChange={(e) => updateSetting('openaiApiKey', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your OpenAI API key for GPT models
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Anthropic API Key</label>
                      <Input 
                        type="password" 
                        placeholder="sk-ant-..." 
                        className="font-mono"
                        value={settings.anthropicApiKey}
                        onChange={(e) => updateSetting('anthropicApiKey', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your Anthropic API key for Claude models
                      </p>
                    </div>
                  </div>

                  {/* Custom OpenAI Compatible Endpoint */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm text-gray-700">Custom OpenAI Compatible Endpoint</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure custom endpoints for Ollama, LocalAI, or other OpenAI-compatible services
                    </p>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Custom Endpoint URL</label>
                      <Input 
                        type="url" 
                        placeholder="http://localhost:11434/v1" 
                        value={settings.customEndpointUrl}
                        onChange={(e) => updateSetting('customEndpointUrl', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Base URL for your custom OpenAI-compatible API
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Custom API Key (Optional)</label>
                      <Input 
                        type="password" 
                        placeholder="your-custom-api-key" 
                        className="font-mono"
                        value={settings.customApiKey}
                        onChange={(e) => updateSetting('customApiKey', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        API key for your custom endpoint (leave empty if not required)
                      </p>
                    </div>
                    
                    {settings.customEndpointUrl && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Endpoint configured:</strong> {settings.customEndpointUrl}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This endpoint will be available when selecting "Custom OpenAI Compatible" in dataset generation
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => saveSettings('ai')}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save AI Configuration'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Default Settings</CardTitle>
                  <CardDescription>
                    Configure default generation parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Default AI Provider</label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={settings.defaultProvider}
                      onChange={(e) => updateSetting('defaultProvider', e.target.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="custom">Custom OpenAI Compatible</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Default Model</label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={settings.defaultModel}
                      onChange={(e) => updateSetting('defaultModel', e.target.value)}
                    >
                      {settings.defaultProvider === 'openai' && (
                        <>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </>
                      )}
                      {settings.defaultProvider === 'anthropic' && (
                        <>
                          <option value="claude-3-haiku">Claude 3 Haiku</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                        </>
                      )}
                      {settings.defaultProvider === 'custom' && (
                        <>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo Compatible</option>
                          <option value="llama-3-8b">Llama 3 8B</option>
                          <option value="llama-3-70b">Llama 3 70B</option>
                          <option value="mistral-7b">Mistral 7B</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Temperature ({settings.temperature})</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Conservative (0)</span>
                      <span>Balanced (1)</span>
                      <span>Creative (2)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Controls randomness in AI responses
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Examples per Chunk</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="20" 
                      value={settings.examplesPerChunk}
                      onChange={(e) => updateSetting('examplesPerChunk', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of training examples to generate per text chunk
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Max Tokens</label>
                    <Input 
                      type="number" 
                      min="100" 
                      max="4000" 
                      value={settings.maxTokens}
                      onChange={(e) => updateSetting('maxTokens', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum tokens per AI response
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => saveSettings('defaults')}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Default Settings'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>📊 Usage & Billing</CardTitle>
                  <CardDescription>
                    Monitor your API usage and costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">$0.00</div>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-muted-foreground">API calls</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-sm text-muted-foreground">Tokens used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
