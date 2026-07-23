/* ------------------------------------------------------------------
   Sample content seeded into a brand-new workspace so first-time users
   see a populated board instead of an empty screen. The shapes mirror
   `CreateProjectInput` / `CreateIssueInput` and stay self-contained —
   no @multica/* imports.
------------------------------------------------------------------- */

import type {
  CreateIssueInput,
  CreateProjectInput,
} from "@/lib/api/types";

/** Single demo project shown in the projects page and sidebar filter. */
export const SAMPLE_PROJECT: CreateProjectInput = {
  title: "示例项目 / Demo Project",
  description:
    "这是一个示例项目，演示 RNAIWork 的基本功能。This is a sample project demonstrating RNAIWork's core features.",
};

/**
 * Five sample issues covering distinct statuses and priorities so the kanban
 * board looks alive on first paint. `project_id` is filled in at seed time
 * once the project has been created and we know its id.
 */
export const SAMPLE_ISSUES: Omit<CreateIssueInput, "project_id">[] = [
  {
    title: "欢迎使用 RNAIWork 任务看板",
    description:
      "这是一个示例任务，演示看板的拖拽功能。\n\n你可以：\n- 拖拽任务卡片到不同列改变状态\n- 点击任务查看详情\n- 添加评论\n- 设置优先级和指派人\n\nWelcome to RNAIWork! This sample issue demonstrates the drag-and-drop board.\n\nYou can:\n- Drag cards between columns to change status\n- Click to view details\n- Add comments\n- Set priority and assignee",
    status: "todo",
    priority: "high",
  },
  {
    title: "试试拖拽这个任务",
    description:
      "把这个任务拖到「进行中」列，体验看板工作流。\n\nDrag this card to the 'In Progress' column to experience the kanban workflow.",
    status: "backlog",
    priority: "medium",
  },
  {
    title: "示例：调用智能体创建任务",
    description:
      "进入「智能体」页面，选择一个 agent，点击「创建任务」按钮，让 AI 帮你创建 Issue。\n\nGo to the 'Agents' page, select an agent, and click 'Create issue' to let AI create issues for you.",
    status: "in_review",
    priority: "low",
  },
  {
    title: "示例：项目协作",
    description:
      "这个任务属于示例项目，展示项目与任务的关联。\n\nThis issue belongs to the demo project, showing project-issue association.",
    status: "done",
    priority: "urgent",
  },
  {
    title: "下一步：自定义你的工作区",
    description:
      "前往「设置」修改工作区名称、邀请成员。\n\nGo to 'Settings' to rename your workspace and invite team members.",
    status: "in_progress",
    priority: "medium",
  },
];
