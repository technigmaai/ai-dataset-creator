import { useState } from "react";
import type { Route } from "./+types/upload-test";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload Test - AI Dataset Creator" },
    { name: "description", content: "Test file upload functionality" },
  ];
}

export default function UploadTest() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setResult("");
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Size:', file.size);

      const response = await fetch('/api/projects/8aa906d6-5078-466b-93a6-b6352b028595/documents', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.success) {
          setResult(`✅ SUCCESS: File "${file.name}" uploaded successfully! Document ID: ${result.data.id}`);
          // Reset file input
          e.target.value = '';
        } else {
          setResult(`❌ FAILED: ${result.error}`);
        }
      } else {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setResult(`❌ SERVER ERROR: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult(`❌ NETWORK ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📤 File Upload Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload a Test File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2">Choose File to Upload</h3>
            <p className="text-gray-600 mb-4">Supported: PDF, Word, Text, Markdown</p>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="test-file-upload"
            />
            
            <label 
              htmlFor="test-file-upload"
              className={`inline-block px-6 py-3 rounded cursor-pointer text-white font-medium ${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {uploading ? '⏳ Uploading...' : '📤 Choose File'}
            </label>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Upload Result:</h3>
            <div className={`p-4 rounded ${
              result.includes('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          </div>
        )}

        <div className="mt-8">
          <a 
            href="/projects/8aa906d6-5078-466b-93a6-b6352b028595" 
            className="text-blue-500 hover:text-blue-700"
          >
            ← Back to Project Details
          </a>
        </div>
      </div>
    </div>
  );
}
