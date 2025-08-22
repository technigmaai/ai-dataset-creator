import type { Route } from "./+types/home";
import { Header } from "../components/layout/header";
import { Sidebar } from "../components/layout/sidebar";
import { Dashboard } from "../components/dashboard/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Dataset Creator - Dashboard" },
    { name: "description", content: "Transform documents into high-quality AI training datasets" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
