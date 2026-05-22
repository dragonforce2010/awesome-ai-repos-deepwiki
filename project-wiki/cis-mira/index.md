# cis-mira DeepWiki

> **Mira FE（仓库内 package 名 `echo`）是字节 CIS 团队的企业级 AI 助手前端**：用一套 React 应用承载流式对话、Claude Agent 工具可视化、Skills/Project/模板与任务中心，并同时服务 Web、飞书内嵌、Electron 桌面与 Chrome 扩展。

## 源码信息

| 项 | 值 |
|---|---|
| 仓库 | `git@code.byted.org:blade/cis-mira.git` |
| Commit | `e8f059ad72082f0d9f35b78714e30d14e6f1c9e8` |
| 生成时间 | 2026-05-22 |

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 产品定位、能力全景、技术栈与阅读路线 |
| 系统架构 | [系统架构与分层](pages/system-architecture.md) | 入口壳、features、API、store 双层状态 |
| 系统架构 | [路由、布局与认证](pages/routing-layouts-auth.md) | 路由树、MiraLayout、JWT/飞书与 VPN |
| 对话与消息 | [SSE 流式聊天链路](pages/streaming-chat-pipeline.md) | 发消息 → SSE → 本地流式态 |
| 对话与消息 | [消息适配与工具渲染](pages/message-adapter-rendering.md) | Claude 流式块、ToolRendering |
| 系统架构 | [状态管理](pages/state-management.md) | Jotai + React Query 分工 |
| 能力扩展 | [Skills、Tools 与 MCP](pages/skills-tools-mcp.md) | 技能市场、聊天技能、MCP UI |
| 能力扩展 | [Project 工作区](pages/project-workspace.md) | 项目级上下文与 project_agent |
| 能力扩展 | [首页、Agent 与模板](pages/templates-agents-home.md) | 入口页、模板编辑与 TEMP_SESSION |
| 能力扩展 | [任务中心](pages/task-center.md) | 定时/异步任务 |
| 多端与工程 | [多端客户端](pages/multi-platform-clients.md) | Electron、扩展、Flutter |
| 多端与工程 | [构建、部署与质量](pages/build-deploy-quality.md) | Vite 多 region、设计 token |

## 仓库全景

```text
cis-mira/
├── src/                    # React 主应用（routes、features、claude、store）
├── electron-app/           # Electron 桌面壳（BrowserView + 本地能力）
├── chrome-extension/       # MV3 扩展（Sidepanel + Cookie 代理）
├── public/sse/             # 本地 Mock SSE 样例
├── docs/                   # 设计/CoT 等内部文档
├── scripts/                # 颜色 token 检查、staged type-check
└── .claude/skills/         # Mira 组件/设计/Harness 工作流技能
```

## 核心入口

| 文件 | 作用 |
|------|------|
| `index.html` → `src/root.tsx` | 应用 bootstrap：Provider 栈、水印、模型列表、路由 |
| `src/routes/routes.tsx` | 全站路由、VPN loader、懒加载页面 |
| `src/features/stream/services/stream-service.ts` | SSE 发消息/续流、事件分发 |
| `src/lib/message-adapter/utils/parse-streaming-events.ts` | Claude 流式块 → SDKMessage |
| `src/claude/components/ToolRendering/` | Bash/Read/Skill/MCP 等工具 UI |
| `src/api/utils.ts` | `fetchWithJWT` 与统一请求头 |

## 你想了解什么？

- **这个产品解决什么问题？** → [项目概览](pages/overview.md)
- **代码怎么分层？** → [系统架构与分层](pages/system-architecture.md)
- **一条消息从输入到渲染怎么走？** → [SSE 流式聊天链路](pages/streaming-chat-pipeline.md) → [消息适配与工具渲染](pages/message-adapter-rendering.md)
- **Skills / Project / 模板怎么接进聊天？** → [Skills、Tools 与 MCP](pages/skills-tools-mcp.md)、[Project 工作区](pages/project-workspace.md)、[首页、Agent 与模板](pages/templates-agents-home.md)
- **桌面端和浏览器扩展怎么做？** → [多端客户端](pages/multi-platform-clients.md)

## 可继续追问的主题

- **SSE 事件类型与 `stream-service` 的 switch 分支**：对照 `public/sse/messages*.txt` 与 `stream-service.ts` 里 `onReasoningDelta` / `onContentDelta` 的映射，适合问「某类后端事件为何没有 UI」。
- **Answer Shell 单点所有权**：阅读 `pre-created-answer-shell-controller.ts` 与 `manus-message-list.tsx` 的 ViewData 缓存注释，适合排查「流式结束后重复气泡」类问题。
- **公网 `mira.bytedance.com` 与内网域名差异**：从 `vpn-redirect.ts` 与 `routes.tsx` 的 `vpnRedirectLoader` 出发，适合问路径白名单与 `x-mira-internal-net`。

## Skills 中文副本

仓库内 Claude Skills 已翻译至 [skills/](skills/)（共 6 个）：设计系统、组件规范、Harness 项目/任务工作流。

## 导出

- 单文件合集：[exports/full-wiki.md](exports/full-wiki.md)
