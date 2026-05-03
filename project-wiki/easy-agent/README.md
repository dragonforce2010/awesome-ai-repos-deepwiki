# easy-agent DeepWiki

> **一个用 TypeScript 和 Node.js 复刻 Claude Code 风格终端 Agentic Coding CLI 的开源实现主线。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 项目定位、实现状态、仓库结构和阅读路线 |
| 系统架构 | [系统架构](pages/system-architecture.md) | high | CLI、UI、编排、核心循环、工具、模型通信的整体分层 |
| 系统架构 | [CLI 与终端 UI](pages/cli-and-ui.md) | high | 命令行参数、Ink 组件树、输入建议和会话 hook |
| 核心执行链路 | [QueryEngine 与 Agentic Loop](pages/query-engine-agentic-loop.md) | high | 多轮状态、slash command、权限模式和 tool_use 循环 |
| 核心执行链路 | [模型通信与 Streaming](pages/model-streaming.md) | medium | Anthropic 客户端、SSE 事件组装、thinking/tool_use 保留和调试日志 |
| 工具与扩展 | [工具系统与权限模型](pages/tools-permissions.md) | high | Tool 抽象、内置工具、路径边界和权限决策树 |
| 工具与扩展 | [MCP 集成](pages/mcp-integration.md) | medium | mcpServers 配置、连接 registry、tools/list 适配和 `/mcp` 命令 |
| 工具与扩展 | [Skills 系统](pages/skills-system.md) | medium | `SKILL.md` 加载、条件激活、系统提示注入和 Skill 工具 |
| 上下文与状态 | [上下文、记忆与压缩](pages/context-memory-compaction.md) | high | system prompt、AGENT.md、项目记忆、token 预算和 compaction |
| 上下文与状态 | [会话持久化与任务系统](pages/sessions-tasks.md) | high | JSONL transcript、`/resume`、TodoWrite V1 与 Task V2 |
| 安全、部署与质量 | [Sandbox 与安全边界](pages/sandbox-security.md) | high | macOS sandbox-exec、profile 构建、Bash 包装和违规反馈 |
| 安全、部署与质量 | [测试、构建与路线图](pages/testing-and-roadmap.md) | medium | npm scripts、smoke/test 脚本、step 教程线和未完成边界 |

## 仓库快照

```text
easy-agent/
├── README.md
├── README.zh-CN.md
├── package.json
├── tsconfig.json
├── src/
│   ├── entrypoint/      # CLI 启动入口
│   ├── ui/              # React/Ink 终端界面
│   ├── core/            # QueryEngine 与 Agentic Loop
│   ├── tools/           # 内置工具与工具注册表
│   ├── services/        # Anthropic API、MCP、Skills
│   ├── context/         # system prompt、memory、compaction、plan
│   ├── session/         # JSONL 会话持久化
│   ├── state/           # Todo/Task 运行状态
│   ├── sandbox/         # macOS sandbox-exec 封装
│   ├── types/           # 共享类型
│   └── utils/           # 路径、设置、token、日志等工具函数
└── step/                # 教程化里程碑单文件实现
```

## 核心入口

| 源文件 | 角色 |
|--------|------|
| `src/entrypoint/cli.ts` | 解析 CLI 参数，加载 skills/sandbox/MCP，并挂载 Ink UI |
| `src/ui/App.tsx` | 终端 UI 根组件，组合会话、输入、状态栏、任务列表和工具卡片 |
| `src/core/queryEngine.ts` | 多轮会话编排、slash command、权限模式、上下文压缩和 usage 汇总 |
| `src/core/agenticLoop.ts` | 单轮推理循环：streaming、工具执行、tool_result 回传 |
| `src/tools/index.ts` | 内置工具和 MCP 工具的统一注册表 |
| `src/services/api/streaming.ts` | Anthropic streaming API 包装和 content block 组装 |
| `src/services/mcp/bootstrap.ts` | MCP server 非阻塞启动和工具注册 |
| `src/services/skills/bootstrap.ts` | user/project skills 加载和 registry 初始化 |
| `src/sandbox/index.ts` | sandbox 子系统的公共 API 聚合 |

## 快速导航

- **想先理解项目是什么**：读 [项目概览](pages/overview.md)，再读 [系统架构](pages/system-architecture.md)。
- **想追一次用户输入到工具执行**：读 [QueryEngine 与 Agentic Loop](pages/query-engine-agentic-loop.md) 和 [模型通信与 Streaming](pages/model-streaming.md)。
- **想扩展新工具或接入 MCP**：读 [工具系统与权限模型](pages/tools-permissions.md) 和 [MCP 集成](pages/mcp-integration.md)。
- **想理解长期上下文如何控制**：读 [上下文、记忆与压缩](pages/context-memory-compaction.md)。
- **想审安全边界**：读 [Sandbox 与安全边界](pages/sandbox-security.md)。
- **想知道哪些能力还只是路线图**：读 [测试、构建与路线图](pages/testing-and-roadmap.md)。

## 可继续追问的主题

- `一次 agent turn 如何结束？`：从 `src/core/queryEngine.ts`、`src/core/agenticLoop.ts`、`src/services/api/streaming.ts` 追踪 stop reason 和 tool_result。
- `Plan Mode 是否真的只读？`：从 `src/permissions/permissions.ts`、`src/tools/enterPlanModeTool.ts`、`src/tools/exitPlanModeTool.ts` 和 plan attachment 追踪。
- `MCP 工具如何进入模型可见工具列表？`：从 `src/services/mcp/bootstrap.ts`、`src/services/mcp/fetchTools.ts` 和 `src/tools/index.ts` 追踪。
- `Sandbox 的安全边界在哪里失效？`：从 `src/sandbox/macosProfile.ts`、`src/sandbox/shouldUseSandbox.ts` 和 `src/tools/bashTool.ts` 追踪。
- `Task V2 和 TodoWrite V1 有什么行为差异？`：从 `src/state/taskStore.ts`、`src/tools/task*.ts`、`src/tools/todoWriteTool.ts` 追踪。

## Source Note

- Source URL: `https://github.com/ConardLi/easy-agent`
- Local source: `/Users/bytedance/workspace/deepwiki/project-repos/easy-agent`
- Branch: `main`
- Commit: `c24463e07dd136d41f6ab28edb33a3eaf0b209c1`
- Generated output: `/Users/bytedance/workspace/deepwiki/easy-agent`
