import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { WorkspaceLayout } from "./workspace-layout";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { NewWorkspacePage } from "@/pages/new-workspace";

/* Workspace-scoped pages are code-split. */
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const IssuesPage = lazy(() =>
  import("@/pages/issues").then((m) => ({ default: m.IssuesPage })),
);
const IssueDetailPage = lazy(() =>
  import("@/pages/issue-detail").then((m) => ({
    default: m.IssueDetailPage,
  })),
);
const AgentsPage = lazy(() =>
  import("@/pages/agents").then((m) => ({ default: m.AgentsPage })),
);
const AgentDetailPage = lazy(() =>
  import("@/pages/agent-detail").then((m) => ({
    default: m.AgentDetailPage,
  })),
);
const ChatPage = lazy(() =>
  import("@/pages/chat").then((m) => ({ default: m.ChatPage })),
);
const ProjectsPage = lazy(() =>
  import("@/pages/projects").then((m) => ({ default: m.ProjectsPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/settings").then((m) => ({ default: m.SettingsPage })),
);

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/new-workspace", element: <NewWorkspacePage /> },
  {
    path: "/:workspaceSlug",
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "issues", element: <IssuesPage /> },
      { path: "issues/:issueId", element: <IssueDetailPage /> },
      { path: "agents", element: <AgentsPage /> },
      { path: "agents/:agentId", element: <AgentDetailPage /> },
      { path: "chat", element: <ChatPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
