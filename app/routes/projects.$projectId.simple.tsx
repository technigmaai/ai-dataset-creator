import { useState, useEffect } from "react";
import type { Route } from "./+types/projects.$projectId.simple";
import { DatasetGenerator } from "../components/datasets/dataset-generator";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Project ${params.projectId} - AI Dataset Creator` },
    { name: "description", content: "Manage your AI dataset project" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return { projectId: params.projectId };
}

export default function ProjectDetailSimple({ loaderData, params }: Route.ComponentProps) {
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: "", description: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showDatasetGenerator, setShowDatasetGenerator] = useState(false);
  const [selectedDocumentForGeneration, setSelectedDocumentForGeneration] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project data
        const projectResponse = await fetch(`/api/projects/${params.projectId}`);
        if (projectResponse.ok) {
          const projectResult = await projectResponse.json();
          if (projectResult.success) {
            setProject(projectResult.data);
            setSettingsForm({
              name: projectResult.data.name || "",
              description: projectResult.data.description || ""
            });
          }
        }

        // Load documents
        const docsResponse = await fetch(`/api/projects/${params.projectId}/documents`);
        if (docsResponse.ok) {
          const docsResult = await docsResponse.json();
          if (docsResult.success) {
            setDocuments(docsResult.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${params.projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocuments(prev => [...prev, result.data]);
          alert('Document uploaded successfully!');
          // Reset file input
          e.target.value = '';
        } else {
          alert('Upload failed: ' + result.error);
        }
      } else {
        alert('Upload failed: ' + response.statusText);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/projects/${params.projectId}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        alert('Document deleted successfully!');
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  const handleEditSettings = () => {
    setSettingsForm({
      name: project?.name || "",
      description: project?.description || ""
    });
    setIsEditingSettings(true);
  };

  const handleCancelSettings = () => {
    setSettingsForm({
      name: project?.name || "",
      description: project?.description || ""
    });
    setIsEditingSettings(false);
  };

  const handleSaveSettings = async () => {
    if (!settingsForm.name.trim()) {
      alert('Project name is required');
      return;
    }

    setSavingSettings(true);
    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settingsForm.name.trim(),
          description: settingsForm.description.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const updatedProject = result.data || {
            ...project,
            name: settingsForm.name.trim(),
            description: settingsForm.description.trim(),
            updated_at: new Date().toISOString()
          };
          setProject(updatedProject);
          setIsEditingSettings(false);
          alert('Project settings updated successfully!');
        } else {
          alert('Failed to update settings: ' + (result.error || 'Unknown error'));
        }
      } else {
        alert('Failed to update settings: Server error');
      }
    } catch (error) {
      console.error('Settings save error:', error);
      alert('Failed to update settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmMessage = `Are you sure you want to DELETE this entire project?\n\nProject: ${project?.name}\nThis will delete:\n- All uploaded documents\n- All generated datasets\n- All project data\n\nThis action CANNOT be undone!`;
    
    if (!confirm(confirmMessage)) return;

    // Double confirmation for safety
    const finalConfirm = prompt('To confirm deletion, type the project name exactly as shown:\n\n' + (project?.name || ''));
    if (finalConfirm !== (project?.name || '')) {
      alert('Project name did not match. Deletion cancelled.');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Project deleted successfully. Redirecting to projects list...');
        window.location.href = '/projects';
      } else {
        alert('Failed to delete project: Server error');
      }
    } catch (error) {
      console.error('Project deletion error:', error);
      alert('Failed to delete project: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleGenerateDataset = (document: any) => {
    setSelectedDocumentForGeneration(document);
    setShowDatasetGenerator(true);
  };

  const handleGenerationComplete = (dataset: any) => {
    setShowDatasetGenerator(false);
    setSelectedDocumentForGeneration(null);
    alert(`Dataset "${dataset.name}" generated successfully with ${dataset.total_examples} examples!`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Project Details</h1>
      <p className="text-gray-600 mb-4">Project ID: {params.projectId}</p>
      
      {project && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900">{project.name}</h3>
          <p className="text-blue-700">{project.description}</p>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📄 Documents</h2>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showUpload ? 'Hide Upload' : '📤 Upload Documents'}
          </button>
        </div>
        
        {showUpload && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">Upload Document</h3>
            <p className="text-gray-600 mb-4">Select a document to upload (PDF, Word, Text, Markdown)</p>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            
            <label 
              htmlFor="file-upload"
              className={`inline-block px-4 py-2 rounded cursor-pointer ${
                uploading 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {uploading ? '⏳ Uploading...' : '📤 Choose File'}
            </label>
          </div>
        )}
        
        {/* Document List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Uploaded Documents ({documents.length})
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600">No documents uploaded yet</p>
              <p className="text-sm text-gray-500">Upload a document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {document.file_type === 'pdf' ? '📄' : 
                         document.file_type === 'doc' || document.file_type === 'docx' ? '📝' : '📋'}
                      </div>
                      <div>
                        <h4 className="font-medium">{document.filename}</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Size: {Math.round(document.file_size / 1024)} KB</p>
                          <p>Type: {document.file_type.toUpperCase()}</p>
                          <p>Status: 
                            <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              ✅ {document.processing_status || 'Ready'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGenerateDataset(document)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        🤖 Generate Dataset
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🗂️ Generated Datasets</h3>
          <p className="text-gray-600">No datasets generated yet</p>
          <button className="mt-3 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            Generate Dataset
          </button>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">📊 Analytics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Documents:</span>
              <span className="font-medium">{documents.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Generated Examples:</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Total Size:</span>
              <span className="font-medium">
                {Math.round(documents.reduce((sum, doc) => sum + doc.file_size, 0) / 1024)} KB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Settings Section */}
      <div className="bg-white border rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">⚙️ Project Settings</h3>
          <div className="flex space-x-2">
            {!isEditingSettings ? (
              <>
                <button 
                  onClick={handleEditSettings}
                  className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                >
                  ✏️ Edit Settings
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                >
                  🗑️ Delete Project
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className={`px-3 py-2 rounded text-sm ${
                    savingSettings 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {savingSettings ? '⏳ Saving...' : '💾 Save Settings'}
                </button>
                <button 
                  onClick={handleCancelSettings}
                  disabled={savingSettings}
                  className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  ❌ Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {isEditingSettings ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name *</label>
              <input
                type="text"
                value={settingsForm.name}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
                disabled={savingSettings}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={settingsForm.description}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
                rows={3}
                disabled={savingSettings}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Project Name:</span>
              <p className="text-gray-900 font-medium">{project?.name || 'Unnamed Project'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Description:</span>
              <p className="text-gray-700">{project?.description || 'No description provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Created:</span>
              <p className="text-gray-700">
                {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Last Updated:</span>
              <p className="text-gray-700">
                {project?.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <button 
          onClick={() => window.history.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          ← Back to Projects
        </button>
      </div>
    </div>
  );
}
