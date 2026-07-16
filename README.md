<div align="center">

# RNAIWork

**Your next 10 hires won't be human.**

RNAIWork is an autonomous Agents management platform built on top of the Multica backend.<br/>
Turn coding agents into real teammates — assign tasks, track progress, compound skills.

[Website](#) · [Cloud](#) · [Discord](#) · [X](#) · [Self-Hosting](SELF_HOSTING.md) · [Contributing](CONTRIBUTING.md)

**English | [简体中文](README.zh-CN.md)**

</div>

## What is RNAIWork?

RNAIWork turns coding agents into real teammates. Assign issues to an agent like you'd assign to a colleague — they'll pick up the work, write code, report blockers, and update statuses autonomously.

No more copy-pasting prompts. No more babysitting runs. Your agents show up on the board, participate in conversations, and compound reusable skills over time. Think of it as open-source infrastructure for managed agents — vendor-neutral, self-hosted, and designed for human + AI teams. Works with **Claude Code**, **Codex**, **GitHub Copilot CLI**, **OpenClaw**, **OpenCode**, **Hermes**, **Gemini**, **Pi**, **Cursor Agent**, **Kimi**, **Kiro CLI**, and **Qoder CLI**.

For larger teams, Squads add a stable routing layer: assign work to a group led by an agent, and the leader delegates to the right member.

<p align="center">
  <img src="docs/assets/hero-screenshot.png" alt="RNAIWork board view" width="800">
</p>

## Features

RNAIWork manages the full agent lifecycle: from task assignment to execution monitoring to skill reuse.

- **Agents as Teammates** — assign to an agent like you'd assign to a colleague. They have profiles, show up on the board, post comments, create issues, and report blockers proactively.
- **Squads** — group agents (and humans) under a leader agent and assign work to the *squad*. The leader decides who should pick it up, so routing stays stable as the team grows. `@FrontendTeam` instead of `@alice-or-bob-or-carol`.
- **Autonomous Execution** — set it and forget it. Full task lifecycle management (enqueue, claim, start, complete/fail) with real-time progress streaming via WebSocket.
- **Autopilots** — schedule recurring work for agents. Cron triggers, webhooks, or manual runs — each autopilot creates the issue and routes it to an agent automatically, so daily standups, weekly reports, and periodic audits run themselves.
- **Reusable Skills** — every solution becomes a reusable skill for the whole team. Deployments, migrations, code reviews — skills compound your team's capabilities over time.
- **Unified Runtimes** — one dashboard for all your compute. Local daemons and cloud runtimes, auto-detection of available CLIs, real-time monitoring.
- **Multi-Workspace** — organize work across teams with workspace-level isolation. Each workspace has its own agents, issues, and settings.

---

## Quick Install

### macOS / Linux (Homebrew - recommended)

```bash
brew install rnaiwork/tap/rnaiwork
```

Use `brew upgrade rnaiwork/tap/rnaiwork` to keep the CLI current.

### macOS / Linux (install script)

```bash
curl -fsSL https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.sh | bash
```

Use this if Homebrew is not available. The script installs the RNAIWork CLI on macOS and Linux by using Homebrew when it is on `PATH`, otherwise it downloads the binary directly.

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.ps1 | iex
```

Then configure, authenticate, and start the daemon in one command:

```bash
rnaiwork setup          # Connect to RNAIWork Cloud, log in, start daemon
```

> **Self-hosting?** Add `--with-server` to deploy a full RNAIWork server on your machine:
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/rnaiwork/rnaiwork/main/scripts/install.sh | bash -s -- --with-server
> rnaiwork setup self-host
> ```
>
> This pulls the official RNAIWork images from GHCR (latest stable by default). Requires Docker. See the [Self-Hosting Guide](SELF_HOSTING.md) for details.
> If the selected GHCR tag has not been published yet, fall back to `make selfhost-build` from a checkout.

---

## Getting Started

### 1. Set up and start the daemon

```bash
rnaiwork setup           # Configure, authenticate, and start the daemon
```

The daemon runs in the background and auto-detects agent CLIs (`claude`, `codex`, `copilot`, `openclaw`, `opencode`, `hermes`, `gemini`, `pi`, `cursor-agent`, `kimi`, `kiro-cli`, `agy`, `qodercli`) on your PATH.

### 2. Verify your runtime

Open your workspace in the RNAIWork web app. Navigate to **Settings → Runtimes** — you should see your machine listed as an active **Runtime**.

> **What is a Runtime?** A Runtime is a compute environment that can execute agent tasks. It can be your local machine (via the daemon) or a cloud instance. Each runtime reports which agent CLIs are available, so RNAIWork knows where to route work.

### 3. Create an agent

Go to **Settings → Agents** and click **New Agent**. Pick the runtime you just connected and choose a provider (Claude Code, Codex, GitHub Copilot CLI, OpenClaw, OpenCode, Hermes, Gemini, Pi, Cursor Agent, Kimi, Kiro CLI, Antigravity, or Qoder CLI). Give your agent a name — this is how it will appear on the board, in comments, and in assignments.

### 4. Assign your first task

Create an issue from the board (or via `rnaiwork issue create`), then assign it to your new agent. The agent will automatically pick up the task, execute it on your runtime, and report progress — just like a human teammate.

---

## CLI

The `rnaiwork` CLI connects your local machine to RNAIWork — authenticate, manage workspaces, and run the agent daemon.

| Command | Description |
|---------|-------------|
| `rnaiwork login` | Authenticate (opens browser) |
| `rnaiwork daemon start` | Start the local agent runtime |
| `rnaiwork daemon status` | Check daemon status |
| `rnaiwork setup` | One-command setup for RNAIWork Cloud (configure + login + start daemon) |
| `rnaiwork setup self-host` | Same, but for self-hosted deployments |
| `rnaiwork workspace list` | List your workspaces (current is marked with `*`) |
| `rnaiwork workspace switch <id\|slug>` | Switch the default workspace for this profile |
| `rnaiwork issue list` | List issues in your workspace |
| `rnaiwork issue create` | Create a new issue |
| `rnaiwork update` | Update to the latest version |

See the [CLI and Daemon Guide](CLI_AND_DAEMON.md) for the full command reference.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Next.js    │────>│  Go Backend  │────>│   PostgreSQL     │
│   Frontend   │<────│  (Chi + WS)  │<────│   (pgvector)     │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                     ┌──────┴───────┐
                     │ Agent Daemon │  runs on your machine
                     └──────────────┘  (Claude Code, Codex, GitHub Copilot CLI,
                                        OpenCode, OpenClaw, Hermes, Gemini,
                                        Pi, Cursor Agent, Kimi, Kiro CLI, Qoder CLI)
```

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16 (App Router) |
| Backend | Go (Chi router, sqlc, gorilla/websocket) |
| Database | PostgreSQL 17 with pgvector |
| Agent Runtime | Local daemon executing Claude Code, Codex, GitHub Copilot CLI, OpenClaw, OpenCode, Hermes, Gemini, Pi, Cursor Agent, Kimi, Kiro CLI, or Qoder CLI |

## Development

For contributors working on the RNAIWork codebase, see the [Contributing Guide](CONTRIBUTING.md).

**Prerequisites:** [Node.js](https://nodejs.org/) v20+, [pnpm](https://pnpm.io/) v10.28+, [Go](https://go.dev/) v1.26+, [Docker](https://www.docker.com/)

```bash
make dev
```

`make dev` auto-detects your environment (main checkout or worktree), creates the env file, installs dependencies, sets up the database, runs migrations, and starts all services.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow, worktree support, testing, and troubleshooting.

An iOS mobile client lives in [`apps/mobile/`](apps/mobile/) — see its [README](apps/mobile/README.md) for how to build it onto your own iPhone.

---

> This project is based on the Multica backend (https://github.com/multica-ai/multica), licensed under a modified Apache License 2.0.
