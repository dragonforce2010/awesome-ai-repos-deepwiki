# tanbiralam/claude-code DeepWiki

> **这个仓库归档了一个 TypeScript/Bun 版 Claude Code CLI 源码树。它最值得阅读的地方，是一个终端 coding agent 如何把模型会话、工具调用、权限决策、MCP 扩展、Skill、远程 session 和 Ink TUI 组合成完整运行时。**

生成时间：2026-05-19 22:02:12   
源码：[https://github.com/tanbiralam/claude-code](https://github.com/tanbiralam/claude-code)  
Commit：`6f6f12b37f529488b10e53928dd5508bb93535c7`

## 目录导航

| 分区 | 页面 | 内容简介 |
|---|---|---|
| 概览 | [项目概览](pages/overview.md) | 项目定位、核心痛点、能力边界与阅读路线 |
| 运行时主链路 | [启动与 CLI 入口](pages/startup-and-cli.md) | 从 Bun fast path 到 Commander 主命令和模式分流 |
| 运行时主链路 | [QueryEngine 会话运行时](pages/query-runtime.md) | 消息生命周期、上下文注入、转录持久化和 SDK 输出 |
| 运行时主链路 | [工具系统](pages/tool-system.md) | Tool 抽象、内置工具注册、并发调度与执行错误处理 |
| 运行时主链路 | [权限与 Hook](pages/permissions-hooks.md) | 规则、模式、分类器、Hook 与交互弹窗的组合决策 |
| 扩展与协议 | [命令、Skill 与插件](pages/commands-skills-plugins.md) | 斜杠命令注册、Skill 装载、插件能力与 SkillTool 执行路径 |
| 扩展与协议 | [MCP 集成](pages/mcp-integration.md) | MCP 配置来源、连接 transport、工具/资源/Skill 暴露和策略过滤 |
| 扩展与协议 | [Agent、Task 与远程会话](pages/agent-task-remote.md) | 子 Agent、后台任务、remote session 和 WebSocket 控制流 |
| 界面、状态与质量 | [终端 UI 与键位系统](pages/terminal-ui-keybindings.md) | Ink 包装、屏幕渲染池、键位上下文和多键 chord 解析 |
| 界面、状态与质量 | [数据流、状态与持久化](pages/data-flow-and-state.md) | AppState、transcript、file cache、task output 和 session 恢复 |
| 界面、状态与质量 | [配置、构建与质量门禁](pages/settings-build-quality.md) | settings 合并、MCP 配置写入、feature flag、构建脚本和验证路径 |
| 界面、状态与质量 | [安全边界与风险点](pages/security-boundaries.md) | 泄露来源提示、权限绕过、远程连接、密钥和源码引用边界 |

## 仓库全景

```text
claude-code/
├── src/entrypoints/        # CLI bootstrap 与快速路径
├── src/main.tsx            # Commander 主入口、模式分流、REPL/print 初始化
├── src/QueryEngine.ts      # 会话生命周期、消息流、转录与 SDK 输出
├── src/Tool.ts             # Tool 接口、权限上下文、默认行为构建器
├── src/tools/              # Bash/File/MCP/Agent/Skill 等工具实现
├── src/services/mcp/       # MCP 配置、连接、工具/资源/Skill 获取
├── src/hooks/toolPermission/# 权限弹窗、Hook、分类器、桥接处理
├── src/skills/             # Skill 发现、frontmatter 解析、命令化
├── src/remote/             # CCR remote session WebSocket 与权限控制
├── src/keybindings/        # 终端键位上下文与 chord 解析
└── src/ink/                # 自定义 Ink 渲染和 terminal screen buffer
```

## 核心入口

| 文件 | 为什么重要 |
|---|---|
| `src/entrypoints/cli.tsx` | 先处理 `--version`、bridge、daemon、background 等快速路径，再动态进入主 CLI。 |
| `src/main.tsx` | Commander 配置、preAction 初始化、print/REPL/server/ssh/remote 分流都在这里。 |
| `src/QueryEngine.ts` | 会话状态、消息持久化、系统/用户上下文和 SDK 输出的核心运行时。 |
| `src/Tool.ts` | 模型可调用工具的统一合同，包括 schema、权限、并发、只读/破坏性等。 |
| `src/services/tools/toolOrchestration.ts` | 把模型的一组 tool_use 按并发安全性分批执行。 |
| `src/hooks/useCanUseTool.tsx` | 权限决策的交互总入口，串起规则、Hook、分类器和远端响应。 |
| `src/services/mcp/client.ts` | MCP transport 连接、工具/资源获取、会话过期识别和输出处理。 |
| `src/skills/loadSkillsDir.ts` | 把 managed/user/project/plugin/MCP Skill 装载为 prompt command。 |

## 你想了解什么？

- **这个项目到底解决什么架构问题？** → [项目概览](pages/overview.md)
- **一次 `claude -p` 或交互启动经过哪些阶段？** → [启动与 CLI 入口](pages/startup-and-cli.md)
- **模型请求和工具调用怎样循环？** → [QueryEngine 会话运行时](pages/query-runtime.md)
- **工具为什么能并发、有权限、有 Hook？** → [工具系统](pages/tool-system.md) 与 [权限与 Hook](pages/permissions-hooks.md)
- **Skill、MCP、Agent 如何进入同一个系统？** → [命令、Skill 与插件](pages/commands-skills-plugins.md)、[MCP 集成](pages/mcp-integration.md)、[Agent、Task 与远程会话](pages/agent-task-remote.md)

## 可继续追问的主题

- `权限全链路`：从 `hasPermissionsToUseTool` 到 `handleInteractivePermission`，适合继续追踪 allow/deny/ask 的精确分支。
- `MCP tool 暴露`：从 `.mcp.json`、插件 server、claude.ai connector 到 `MCPTool`，适合分析扩展面安全。
- `Agent worktree/remote`：从 `AgentTool.call` 到 `runAgent` 和 `RemoteSessionManager`，适合分析后台任务生命周期。
- `print mode 性能`：从 `entrypoints/cli.tsx` 到 `main.tsx` 的 print-mode skip，适合分析启动延迟优化。

## 来源说明

本 wiki 基于本地检出的 `https://github.com/tanbiralam/claude-code`，commit `6f6f12b37f529488b10e53928dd5508bb93535c7`。仓库 README 自称其内容来自泄露源码；本 wiki 仅生成架构级中文说明、短行号引用和源码路径索引，避免大段复制源码。
