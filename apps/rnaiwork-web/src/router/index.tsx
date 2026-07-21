/**
 * Route tree for the RNAIWork web app.
 *
 * Top-level routes (/, /login, /invitations) are eagerly imported — they're
 * the entry surfaces a user hits cold, so avoiding a chunk round-trip there
 * matters more than keeping the initial bundle tiny. The workspace pages
 * are lazy-loaded via React.lazy and resolved inside WorkspaceLayout's
 * <Suspense> boundary, so each section ships in its own chunk.
 *
 * React Router v7 createBrowserRouter is used (data-router API). The router
 * is created once at module scope and consumed by App via <RouterProvider>.
 */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import InvitationsPage from "@/pages/invitations";
import NewWorkspacePage from "@/pages/new-workspace";

const DashboardPage = lazy(() => import("@/pages/workspace/dashboard"));
const IssuesListPage = lazy(() => import("@/pages/workspace/issues"));
const IssuesDetailPage = lazy(() => import("@/pages/workspace/issues/detail"));
const AgentsPage = lazy(() => import("@/pages/workspace/agents"));
const AgentDetailPage = lazy(() => import("@/pages/workspace/agents/detail"));
const ProjectsPage = lazy(() => import("@/pages/workspace/projects"));
const RuntimesPage = lazy(() => import("@/pages/workspace/runtimes"));
const SkillsPage = lazy(() => import("@/pages/workspace/skills"));
const SettingsPage = lazy(() => import("@/pages/workspace/settings"));
const AutopilotsPage = lazy(() => import("@/pages/workspace/autopilots"));
const SquadsPage = lazy(() => import("@/pages/workspace/squads"));
const LabelsPage = lazy(() => import("@/pages/workspace/labels"));
const InboxPage = lazy(() => import("@/pages/workspace/inbox"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/invitations",
    element: <InvitationsPage />,
  },
  {
    path: "/new-workspace",
    element: <NewWorkspacePage />,
  },
  {
    path: "/:workspaceSlug",
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "issues", element: <IssuesListPage /> },
      { path: "issues/:issueId", element: <IssuesDetailPage /> },
      { path: "agents", element: <AgentsPage /> },
      { path: "agents/:agentId", element: <AgentDetailPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "runtimes", element: <RuntimesPage /> },
      { path: "skills", element: <SkillsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "autopilots", element: <AutopilotsPage /> },
      { path: "squads", element: <SquadsPage /> },
      { path: "labels", element: <LabelsPage /> },
      { path: "inbox", element: <InboxPage /> },
    ],
  },
]);
