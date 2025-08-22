import type { Route } from "./+types/templates";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Templates - AI Dataset Creator" },
    { name: "description", content: "Manage prompt templates for dataset generation" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { templates: [] }; // TODO: Load from database
}

export default function Templates({ loaderData }: Route.ComponentProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
              <div className="flex items-center space-x-2">
                <Button>New Template</Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>📋 Default Q&A Template</CardTitle>
                  <CardDescription>
                    Generate question-answer pairs from documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Creates diverse questions and accurate answers based on document content.
                  </p>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Instruction Template</CardTitle>
                  <CardDescription>
                    Create instruction-following training data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generates clear instructions and appropriate responses from content.
                  </p>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>🏷️ Classification Template</CardTitle>
                  <CardDescription>
                    Build classification training datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Creates labeled examples for text classification tasks.
                  </p>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>📝 Summary Template</CardTitle>
                  <CardDescription>
                    Generate summarization datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Creates text-summary pairs for training summarization models.
                  </p>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>🎭 Character Template</CardTitle>
                  <CardDescription>
                    Build character/persona datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generates consistent character responses and dialogue.
                  </p>
                  <Button variant="outline" className="w-full">Use Template</Button>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>➕ Custom Template</CardTitle>
                  <CardDescription>
                    Create your own template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build custom prompt templates for specific use cases.
                  </p>
                  <Button className="w-full">Create Template</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
