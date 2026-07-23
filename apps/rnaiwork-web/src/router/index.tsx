
import { createBrowserRouter, Navigate } from "react-router-dom";
import { WorkspaceLayout } from "./workspace-layout";
import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { NewWorkspacePage } from "@/pages/new-workspace";
import { DashboardPage } from "@/pages/dashboard";
import { IssuesPage } from "@/pages/issues";
import { IssueDetailPage } from "@/pages/issue-detail";
import { AgentsPage } from "@/pages/agents";
import { AgentDetailPage } from "@/pages/agent-detail";
import { ChatPage } from "@/pages/chat";
import { ProjectsPage } from "@/pages/projects";
import { SettingsPage } from "@/pages/settings";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
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
