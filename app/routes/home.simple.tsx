import type { Route } from "./+types/home.simple";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Dataset Creator - Dashboard" },
    { name: "description", content: "Transform documents into high-quality AI training datasets" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function HomeSimple({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🤖 AI Dataset Creator</h1>
          <p className="text-gray-600">Transform documents into high-quality AI training datasets</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Dashboard</h2>
            <p className="text-gray-600 mb-4">Welcome to your AI Dataset Creator dashboard</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Projects:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Documents:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Datasets:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🚀 Quick Start</h2>
            <p className="text-gray-600 mb-4">Get started with your first dataset</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Create a new project</li>
              <li>Upload your documents</li>
              <li>Configure AI settings</li>
              <li>Generate training data</li>
            </ol>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📁 Supported Formats</h2>
            <p className="text-gray-600 mb-4">File types we can process</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <span className="mr-2">📄</span>
                <span>PDF</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📝</span>
                <span>Word</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📋</span>
                <span>Text</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📋</span>
                <span>Markdown</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <a 
            href="/projects" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🎯 Go to Projects
          </a>
        </div>
      </main>
    </div>
  );
}
