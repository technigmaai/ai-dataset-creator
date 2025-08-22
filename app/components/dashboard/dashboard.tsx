import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>Create Project</Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <span className="text-2xl">📁</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No projects yet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Upload your first document</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets Generated</CardTitle>
            <span className="text-2xl">🗂️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Create your first dataset</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Examples</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Generate AI training data</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Start</CardTitle>
            <CardDescription>
              Get started with your first AI dataset in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              <span>Create a new project</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">2</span>
              <span>Upload your documents</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">3</span>
              <span>Generate AI training data</span>
            </div>
            <Button className="w-full mt-4">Start Now</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📚 Supported Formats</CardTitle>
            <CardDescription>
              Upload documents in various formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-red-500">📄</span>
              <span>PDF Documents</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-500">📝</span>
              <span>Word Documents (.docx)</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">📃</span>
              <span>Plain Text Files</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              More formats coming soon!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤖 AI Models</CardTitle>
            <CardDescription>
              Generate datasets using leading AI models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-500">✨</span>
              <span>OpenAI GPT Models</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-500">🧠</span>
              <span>Anthropic Claude</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-orange-500">⚡</span>
              <span>Custom Templates</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Choose the best model for your needs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest projects and datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start by creating your first project and uploading some documents to generate AI training datasets.
            </p>
            <Button>Create Your First Project</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
