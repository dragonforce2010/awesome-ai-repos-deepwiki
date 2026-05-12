# Agent Flow（patoles-agent-flow）DeepWiki

> **Agent Flow 把 Claude Code 与 Codex 的黑盒执行过程拉成可观看的节点图：工具调用链、子代理分支、上下文消耗与时间线并排呈现；同一代码库同时支撑 VS Code 扩展、`pnpm dev` 本地站与 `npx agent-flow-app` 独立二进制。**

**源码：** [https://github.com/patoles/agent-flow](https://github.com/patoles/agent-flow) · **Commit：** `59ccf4e3c5134a3cc56580ca0babd71f201ac47c`

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 为何存在、双运行时、能力全景、阅读路线 |
| 架构与数据流 | [系统架构与仓库布局](pages/system-architecture.md) | pnpm 工作区、包边界、依赖关系 |
| 架构与数据流 | [中继层与 SSE 流](pages/event-relay-and-sse.md) | `createRelay`、缓冲、会话广播 |
| 架构与数据流 | [Claude Hooks 与转录](pages/claude-hooks-and-transcripts.md) | HTTP Hook、settings 合并、JSONL 解析 |
| 架构与数据流 | [Codex Rollout 解析](pages/codex-rollout.md) | `rollout-*.jsonl`、去重与事件映射 |
| 产品与界面 | [可视化前端](pages/visualization-ui.md) | `processEvent`、画布、Bridge |
| 产品与界面 | [VS Code 扩展](pages/vscode-extension.md) | 激活、双 runtime、`webview` 协议 |
| 产品与界面 | [独立应用与 npx](pages/standalone-npx-app.md) | `agent-flow-app`、静态站、Telemetry 接入点 |
| 质量与开发 | [遥测与隐私](pages/telemetry-security.md) | 默认开关、环境变量、数据字段 |
| 质量与开发 | [开发构建测试](pages/development-quality.md) | 脚本、测试文件入口 |

## 仓库全景

```text
agent-flow/
├── app/                 # npx 独立应用（HTTP + 静态 UI）
├── extension/           # VS Code 扩展：hook server、watchers、webview 宿主
├── web/                 # Next.js + Vite webview：可视化 React 应用
├── scripts/             # relay 打包、telemetry、setup
└── pnpm-workspace.yaml  # workspace: agent-flow-web, agent-flow, ...
```

## 核心入口

| 文件 | 为何重要 |
|------|----------|
| `extension/src/extension.ts` | 扩展激活与 Claude / Codex 双 runtime 启动 |
| `scripts/relay.ts` | 开发与中继共用的 SSE、会话扫描、Hook 集成 |
| `extension/src/protocol.ts` | Webview 与 `AgentEvent` 类型契约 |
| `web/hooks/simulation/process-event.ts` | 把事件流折叠成画布状态的归约器 |
| `app/src/server.ts` | 独立模式：HTTP 服务 + `createRelay` + 静态资源 |

## 你想了解什么？

- **它到底解决什么痛点？** → [项目概览](pages/overview.md)
- **事件从 Hook 怎么进到浏览器？** → [中继层与 SSE 流](pages/event-relay-and-sse.md)
- **Codex 和 Claude 数据源差在哪？** → [Codex Rollout](pages/codex-rollout.md) 与 [Claude 转录](pages/claude-hooks-and-transcripts.md)
- **怎么本地跑或打包扩展？** → [开发构建测试](pages/development-quality.md)

## 可继续追问的主题

- **Hook 与 JSONL 双通道是否会重复发事件？** 可读 `scripts/relay.ts` 里 `HookServer` 与 `TranscriptParser` 的衔接，以及 Codex 侧生命周期广播注释。
- **子代理节点如何成对出现？** 从 `emitSubagentDispatch`（`protocol.ts`）一路跟到 `handle-subagent-events`。
- **1M context 相关 UI 开关** 在扩展配置与 `hooks-config` / `isDisable1MContext` 的交叉引用。

## 导出

单机全文 Markdown：[exports/full-wiki.md](exports/full-wiki.md)
