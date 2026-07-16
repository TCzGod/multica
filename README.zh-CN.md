<div align="center">

# RNAIWork

**你的下一批员工，不是人类。**

RNAIWork 是基于 Multica 后端开发的自主 Agents 管理平台。<br/>
将编码 Agent 变成真正的队友——分配任务、跟踪进度、积累技能。

[官网](#) · [云服务](#) · [Discord](#) · [X](#) · [自部署指南](SELF_HOSTING.md) · [参与贡献](CONTRIBUTING.md)

**[English](README.md) | 简体中文**

</div>

## RNAIWork 是什么？

RNAIWork 将编码 Agent 变成真正的队友。像分配给同事一样分配给 Agent——它们会自主接手工作、编写代码、报告阻塞问题、更新状态。

不再需要复制粘贴 prompt，不再需要盯着运行过程。你的 Agent 出现在看板上、参与对话、随着时间积累可复用的技能。可以理解为开源的 Managed Agents 基础设施——厂商中立、可自部署、专为人类 + AI 团队设计。支持 **Claude Code**、**Codex**、**GitHub Copilot CLI**、**OpenClaw**、**OpenCode**、**Hermes**、**Gemini**、**Pi**、**Cursor Agent**、**Kimi**、**Kiro CLI** 与 **Qoder CLI**。

面向更大的团队，Squads（小队）提供稳定的路由层：把任务分给由 Agent 带队的小队，由队长判断谁最适合接手。

<p align="center">
  <img src="docs/assets/hero-screenshot.png" alt="RNAIWork 看板视图" width="800">
</p>

## 功能特性

RNAIWork 管理完整的 Agent 生命周期：从任务分配到执行监控再到技能复用。

- **Agent 即队友** — 像分配给同事一样分配给 Agent。它们有个人档案、出现在看板上、发表评论、创建 Issue、主动报告阻塞问题。
- **Squads（小队）** — 把多个 Agent（以及人类成员）组合成由 leader agent 带队的小队，直接把任务分配给小队本身。Leader 会判断谁最适合接手，团队扩容时路由方式保持不变。用 `@前端组` 代替 `@小张或小李或小王`。
- **自主执行** — 设置后无需管理。完整的任务生命周期管理（排队、认领、执行、完成/失败），通过 WebSocket 实时推送进度。
- **自动化（Autopilots）** — 为 Agent 安排周期性工作。定时（Cron）、Webhook 或手动触发，自动化会自动创建 Issue 并分配给 Agent——日报、周报、定期巡检都能让它自己跑起来。
- **可复用技能** — 每个解决方案都成为全团队可复用的技能。部署、数据库迁移、代码审查——技能让团队能力随时间持续增长。
- **统一运行时** — 一个控制台管理所有算力。本地 daemon 和云端运行时，自动检测可用 CLI，实时监控。
- **多工作区** — 按团队组织工作，工作区级别隔离。每个工作区有独立的 Agent、Issue 和设置。

---

## 快速安装

### macOS / Linux（推荐 Homebrew）

```bash
brew install rnaiwork/tap/rnaiwork
```

后续可用 `brew upgrade rnaiwork/tap/rnaiwork` 更新 CLI。

### macOS / Linux（安装脚本）

```bash
curl -fsSL https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.sh | bash
```

如果没有 Homebrew，可以使用安装脚本。脚本会安装 RNAIWork CLI：检测到 `brew` 时通过 Homebrew 安装，否则直接下载二进制。

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.ps1 | iex
```

安装完成后，一条命令完成配置、认证和启动：

```bash
rnaiwork setup          # 连接 RNAIWork Cloud，登录，启动 daemon
```

> **自部署？** 加上 `--with-server` 在本地部署完整的 RNAIWork 服务：
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.sh | bash -s -- --with-server
> rnaiwork setup self-host
> ```
>
> 需要 Docker。详见 [自部署指南](SELF_HOSTING.md)。

---

## 快速上手

安装好 CLI（或注册 RNAIWork 云服务）后，按以下步骤将第一个任务分配给 Agent：

### 1. 配置并启动 daemon

```bash
rnaiwork setup           # 配置、认证、启动 daemon（一条命令搞定）
```

daemon 在后台运行，保持你的机器与 RNAIWork 的连接。它会自动检测 PATH 中可用的 Agent CLI（`claude`、`codex`、`copilot`、`openclaw`、`opencode`、`hermes`、`gemini`、`pi`、`cursor-agent`、`kimi`、`kiro-cli`、`qodercli`）。

### 2. 确认运行时已连接

在 RNAIWork Web 端打开你的工作区，进入 **设置 → 运行时（Runtimes）**，你应该能看到你的机器已作为一个活跃的 **Runtime** 出现在列表中。

> **什么是 Runtime（运行时）？** Runtime 是可以执行 Agent 任务的计算环境。它可以是你的本地机器（通过 daemon 连接），也可以是云端实例。每个 Runtime 会上报可用的 Agent CLI，RNAIWork 据此决定将任务路由到哪里执行。

### 3. 创建 Agent

进入 **设置 → Agents**，点击 **新建 Agent**。选择你刚连接的 Runtime，选择 Provider（Claude Code、Codex、GitHub Copilot CLI、OpenClaw、OpenCode、Hermes、Gemini、Pi、Cursor Agent、Kimi、Kiro CLI 或 Qoder CLI），并为 Agent 起个名字——它将以这个名字出现在看板、评论和任务分配中。

### 4. 分配你的第一个任务

在看板上创建一个 Issue（或通过 `rnaiwork issue create` 命令创建），然后将其分配给你的新 Agent。Agent 会自动接手任务、在你的 Runtime 上执行、并实时汇报进度——就像一个真正的队友一样。

大功告成！你的 Agent 现在是团队的一员了。 🎉

---

## 架构

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Next.js    │────>│  Go 后端     │────>│   PostgreSQL     │
│   前端       │<────│  (Chi + WS)  │<────│   (pgvector)     │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                     ┌──────┴───────┐
                     │ Agent Daemon │  运行在你的机器上
                     └──────────────┘  （Claude Code、Codex、GitHub Copilot CLI、
                                        OpenCode、OpenClaw、Hermes、Gemini、
                                        Pi、Cursor Agent、Kimi、Kiro CLI、Qoder CLI）
```

| 层级 | 技术栈 |
|------|--------|
| 前端 | Next.js 16 (App Router) |
| 后端 | Go (Chi router, sqlc, gorilla/websocket) |
| 数据库 | PostgreSQL 17 with pgvector |
| Agent 运行时 | 本地 daemon 执行 Claude Code、Codex、GitHub Copilot CLI、OpenClaw、OpenCode、Hermes、Gemini、Pi、Cursor Agent、Kimi、Kiro CLI 或 Qoder CLI |

## 开发

参与 RNAIWork 代码贡献，请参阅 [贡献指南](CONTRIBUTING.md)。

**环境要求：** [Node.js](https://nodejs.org/) v20+, [pnpm](https://pnpm.io/) v10.28+, [Go](https://go.dev/) v1.26+, [Docker](https://www.docker.com/)

```bash
pnpm install
cp .env.example .env
make setup
make start
```

完整的开发流程、worktree 支持、测试和问题排查请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

iOS 移动端代码位于 [`apps/mobile/`](apps/mobile/)，自己编译装到手机的方法见 [README](apps/mobile/README.md)。

## 开源协议

[Modified Apache 2.0 (with commercial restrictions)](LICENSE)

---

> 本项目基于 Multica 后端（https://github.com/multica-ai/multica）开发，采用修改版 Apache License 2.0 许可证。
