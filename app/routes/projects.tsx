import { useState } from "react";
import * as React from "react";
import type { Route } from "./+types/projects";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CreateProjectForm } from "../components/projects/create-project-form";
import { formatDate } from "../lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Projects - AI Dataset Creator" },
    { name: "description", content: "Manage your AI dataset projects" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  // For now, return empty and load on client side
  return { projects: [] };
}

export default function Projects({ loaderData }: Route.ComponentProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState(loaderData.projects);
  const [loading, setLoading] = useState(true);

  // Load projects from API
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const result = await response.json();
          setProjects(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProjects();
  }, []);

  // Debug logging (can be removed in production)
  console.log('Projects component rendered. showCreateForm:', showCreateForm, 'loading:', loading, 'projects:', projects.length);

  const handleCreateProject = async (data: { name: string; description: string }) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProjects([result.data, ...projects]);
          setShowCreateForm(false);
        } else {
          alert('Failed to create project: ' + result.error);
        }
      } else {
        alert('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
              <div className="flex items-center space-x-2">
                <Button onClick={() => {
                  console.log('New Project button clicked!');
                  setShowCreateForm(true);
                }}>
                  New Project
                </Button>
                {/* Debug indicator */}
                <span className="text-xs text-gray-500">
                  Form: {showCreateForm ? 'OPEN' : 'CLOSED'} | Projects: {projects.length}
                </span>
              </div>
            </div>
            
            {showCreateForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <CreateProjectForm
                    onSubmit={handleCreateProject}
                    onCancel={() => setShowCreateForm(false)}
                    isLoading={isCreating}
                  />
                </div>
              </div>
            )}
            
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loading Projects...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12">
                    <div className="text-4xl">⏳</div>
                  </div>
                </CardContent>
              </Card>
            ) : projects.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Projects</CardTitle>
                  <CardDescription>
                    Create and manage your AI dataset projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Create your first project to start generating AI training datasets from your documents.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      Create Your First Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project: any) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">📁</span>
                        {project.name}
                      </CardTitle>
                      <CardDescription>
                        {project.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        Created: {formatDate(project.created_at)}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.location.href = `/projects/${project.id}`}
                        >
                          Open Project
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert(`Settings for ${project.name} - Coming soon!`)}
                        >
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
