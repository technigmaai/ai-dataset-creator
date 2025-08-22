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
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI Configuration</CardTitle>
                  <CardDescription>
                    Configure your AI model settings and API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">OpenAI API Key</label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      className="font-mono"
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Anthropic API key for Claude models
                    </p>
                  </div>
                  
                  <Button>Save API Keys</Button>
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
                    <label className="text-sm font-medium">Default Model</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option>GPT-4</option>
                      <option>GPT-3.5 Turbo</option>
                      <option>Claude 3 Sonnet</option>
                      <option>Claude 3 Haiku</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Temperature</label>
                    <Input 
                      type="number" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      defaultValue="0.7"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness in AI responses (0-2)
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Examples per Chunk</label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="20" 
                      defaultValue="3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of training examples to generate per text chunk
                    </p>
                  </div>
                  
                  <Button>Save Settings</Button>
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
