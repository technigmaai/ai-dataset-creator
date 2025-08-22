import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.simple.tsx"),
  route("test", "routes/test.tsx"),
  route("upload-test", "routes/upload-test.tsx"),
  route("projects", "routes/projects.tsx"),
  route("projects/:projectId", "routes/projects.$projectId.simple.tsx"),
  route("documents", "routes/documents.tsx"),
  route("datasets", "routes/datasets.tsx"),
  route("templates", "routes/templates.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
