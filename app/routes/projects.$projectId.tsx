import { useState, useEffect } from "react";
import type { Route } from "./+types/projects.$projectId";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SimpleDocumentUpload } from "../components/documents/simple-document-upload";
import { SimpleDocumentList } from "../components/documents/simple-document-list";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Project ${params.projectId} - AI Dataset Creator` },
    { name: "description", content: "Manage your AI dataset project" },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  // For now, return empty project data - will be loaded client-side to avoid SSR issues
  return { 
    project: { 
      id: params.projectId, 
      name: "",
      description: "",
      created_at: "",
      updated_at: ""
    },
    documents: []
  };
}

export default function ProjectDetail({ loaderData, params }: Route.ComponentProps) {
  const [project, setProject] = useState(loaderData.project);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: loaderData.project.name || "", 
    description: loaderData.project.description || "" 
  });
  const [saving, setSaving] = useState(false);
  
  // Document management state
  const [documents, setDocuments] = useState(loaderData.documents || []);
  const [showUpload, setShowUpload] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Load project data when component mounts
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.projectId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProject(result.data);
            setEditForm({ name: result.data.name, description: result.data.description });
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      }
    };

    loadProject();
    loadDocuments();
  }, [params.projectId]);

  // Initialize edit form when project data changes
  useEffect(() => {
    setEditForm({ 
      name: project.name || "", 
      description: project.description || "" 
    });
  }, [project]);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch(`/api/projects/${params.projectId}/documents`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleUploadComplete = (newDocuments: any[]) => {
    setDocuments(prev => [...prev, ...newDocuments]);
    // Optionally close upload area after successful upload
    // setShowUpload(false);
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.projectId}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert('Document deleted successfully');
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDocumentProcess = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${params.projectId}/documents/${documentId}/process`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Reload documents to get updated status
          await loadDocuments();
          alert('Document processing started successfully');
        } else {
          alert('Failed to process document: ' + (result.error || 'Unknown error'));
        }
      } else {
        alert('Failed to process document');
      }
    } catch (error) {
      console.error('Failed to process document:', error);
      alert('Failed to process document');
    }
  };

  const handleEditStart = () => {
    setEditForm({ name: project.name || "", description: project.description || "" });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setEditForm({ name: project.name, description: project.description });
    setIsEditing(false);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) {
      alert('Project name is required');
      return;
    }

    console.log('💾 Starting save process...', { editForm, projectId: params.projectId });
    setSaving(true);
    try {
      const url = `/api/projects/${params.projectId}`;
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim()
      };
      
      console.log('🌐 Making PUT request to:', url, 'with payload:', payload);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status, response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 API result:', result);
        
        if (result.success) {
          // Update project state with new data - handle case where result.data might be null
          const updatedProject = result.data || { ...project, ...payload, updated_at: new Date().toISOString() };
          console.log('✅ Setting updated project:', updatedProject);
          setProject(updatedProject);
          setIsEditing(false);
          alert('Project updated successfully!');
        } else {
          console.log('❌ API response not successful:', result);
          alert('Failed to update project: ' + (result.error || 'Unknown error'));
        }
      } else {
        console.log('❌ Response not ok:', response.status);
        const errorText = await response.text();
        console.log('Error details:', errorText);
        alert('Failed to update project: Server error');
      }
    } catch (error) {
      console.error('💥 Failed to save project:', error);
      alert('Failed to update project: ' + error.message);
    } finally {
      console.log('🏁 Setting saving to false');
      setSaving(false);
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
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Project Details</h2>
                <p className="text-muted-foreground">
                  Project ID: {params.projectId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => window.history.back()}>
                  ← Back to Projects
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>📄 Documents</CardTitle>
                      <CardDescription>
                        Upload and manage your source documents
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShowUpload(!showUpload)}
                      disabled={loadingDocuments}
                    >
                      {showUpload ? 'Hide Upload' : '📤 Upload Documents'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showUpload && (
                    <div className="mb-6">
                      <SimpleDocumentUpload 
                        projectId={params.projectId}
                        onUploadComplete={handleUploadComplete}
                      />
                    </div>
                  )}
                  
                  {loadingDocuments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-4xl mb-4">⏳</div>
                        <p className="text-muted-foreground">Loading documents...</p>
                      </div>
                    </div>
                  ) : (
                    <SimpleDocumentList 
                      documents={documents}
                      onDocumentDelete={handleDocumentDelete}
                      onDocumentProcess={handleDocumentProcess}
                    />
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">

              <Card>
                <CardHeader>
                  <CardTitle>🗂️ Generated Datasets</CardTitle>
                  <CardDescription>
                    View and download your AI training datasets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-muted-foreground mb-4">No datasets generated yet</p>
                    <Button>Generate Dataset</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Analytics</CardTitle>
                  <CardDescription>
                    Project statistics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Documents:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generated Examples:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tokens:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>⚙️ Project Settings</CardTitle>
                      <CardDescription>
                        Configure your project preferences
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={handleEditStart}>
                        ✏️ Edit Settings
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Project Name *</label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter project description"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleEditSave}
                          disabled={saving || !editForm.name.trim()}
                        >
                          {saving ? "💾 Saving..." : "💾 Save Changes"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleEditCancel}
                          disabled={saving}
                        >
                          ❌ Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Project Name</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.name || "Untitled Project"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
