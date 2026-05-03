# Superpowers DeepWiki

> **面向编码代理的完整软件开发方法论——基于 14 个可组合技能的结构化工作流框架**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、核心能力、设计哲学与阅读路线 |
| 系统架构 | [系统架构](pages/system-architecture.md) | high | 插件系统、技能发现与加载、Hook 机制、会话引导流程 |
| 系统架构 | [多平台集成](pages/multi-platform-integration.md) | high | Claude Code、Cursor、Codex、OpenCode、Copilot CLI、Gemini CLI 的适配方式 |
| 核心工作流 | [核心工作流](pages/core-workflow.md) | high | 从头脑风暴到分支完成的完整开发流程 |
| 核心工作流 | [子代理驱动开发](pages/subagent-driven-development.md) | high | SDD 流程详解：子代理调度、两阶段审查、模型选择策略 |
| 技能体系 | [技能体系](pages/skills-system.md) | high | 14 个技能的分类、设计哲学、SKILL.md 规范、CSO 优化策略 |
| 技能体系 | [测试驱动与系统化调试](pages/tdd-and-debugging.md) | high | TDD 铁律与 RED-GREEN-REFACTOR 循环、四阶段系统化调试法、验证先行原则 |
| 可视化组件 | [可视化头脑风暴伴侣](pages/visual-companion.md) | medium | WebSocket 服务器架构、交互协议、内容模板系统 |
| 质量与扩展 | [测试与质量保障](pages/testing-and-quality.md) | medium | 集成测试框架、技能触发测试、Token 分析工具 |
| 质量与扩展 | [扩展与贡献](pages/extension-and-contribution.md) | medium | 编写新技能、版本管理、贡献规范与 PR 要求 |

## 仓库快照

```text
superpowers/
├── .claude-plugin/        # Claude Code 插件清单
├── .codex-plugin/         # Codex 插件清单
├── .cursor-plugin/        # Cursor 插件清单
├── .opencode/             # OpenCode 插件与安装指南
├── agents/                # 代理定义（code-reviewer）
├── commands/              # 已弃用的命令（迁移至技能）
├── docs/                  # 设计文档、规格、计划
├── hooks/                 # SessionStart 钩子（引导注入）
├── scripts/               # 版本管理与 Codex 同步脚本
├── skills/                # 14 个技能目录
├── tests/                 # 集成测试与技能触发测试
├── CLAUDE.md              # Claude Code 贡献者指南
├── GEMINI.md              # Gemini CLI 引导文件
└── package.json           # v5.0.7
```

## 核心入口

| 文件 | 职责 |
|------|------|
| `hooks/session-start` | 会话启动钩子，注入 using-superpowers 引导上下文 |
| `skills/using-superpowers/SKILL.md` | 技能系统入口，定义触发规则和优先级 |
| `.opencode/plugins/superpowers.js` | OpenCode ES 模块插件，config + messages.transform |
| `.codex-plugin/plugin.json` | Codex 插件清单，含完整 interface 定义 |
| `skills/brainstorming/SKILL.md` | 核心工作流入口，需求探索与设计 |
| `skills/subagent-driven-development/SKILL.md` | SDD 流程，子代理调度与两阶段审查 |

## 快速导航

- **想了解项目是什么？** → 阅读 [项目概览](pages/overview.md)
- **想理解技能如何被发现和加载？** → 阅读 [系统架构](pages/system-architecture.md)
- **想了解完整开发流程？** → 阅读 [核心工作流](pages/core-workflow.md)
- **想了解子代理驱动开发？** → 阅读 [子代理驱动开发](pages/subagent-driven-development.md)
- **想了解 TDD 和调试方法论？** → 阅读 [测试驱动与系统化调试](pages/tdd-and-debugging.md)
- **想在特定平台上安装使用？** → 阅读 [多平台集成](pages/multi-platform-integration.md)
- **想了解可视化伴侣？** → 阅读 [可视化头脑风暴伴侣](pages/visual-companion.md)
- **想编写自定义技能？** → 阅读 [扩展与贡献](pages/extension-and-contribution.md)

## 技能翻译

所有 14 个技能的 SKILL.md 已翻译为中文，位于 `skills/` 目录：

| 技能 | 翻译文件 |
|------|----------|
| using-superpowers | [skills/using-superpowers/SKILL.md](skills/using-superpowers/SKILL.md) |
| brainstorming | [skills/brainstorming/SKILL.md](skills/brainstorming/SKILL.md) |
| writing-plans | [skills/writing-plans/SKILL.md](skills/writing-plans/SKILL.md) |
| subagent-driven-development | [skills/subagent-driven-development/SKILL.md](skills/subagent-driven-development/SKILL.md) |
| test-driven-development | [skills/test-driven-development/SKILL.md](skills/test-driven-development/SKILL.md) |
| systematic-debugging | [skills/systematic-debugging/SKILL.md](skills/systematic-debugging/SKILL.md) |
| verification-before-completion | [skills/verification-before-completion/SKILL.md](skills/verification-before-completion/SKILL.md) |
| requesting-code-review | [skills/requesting-code-review/SKILL.md](skills/requesting-code-review/SKILL.md) |
| receiving-code-review | [skills/receiving-code-review/SKILL.md](skills/receiving-code-review/SKILL.md) |
| dispatching-parallel-agents | [skills/dispatching-parallel-agents/SKILL.md](skills/dispatching-parallel-agents/SKILL.md) |
| executing-plans | [skills/executing-plans/SKILL.md](skills/executing-plans/SKILL.md) |
| finishing-a-development-branch | [skills/finishing-a-development-branch/SKILL.md](skills/finishing-a-development-branch/SKILL.md) |
| using-git-worktrees | [skills/using-git-worktrees/SKILL.md](skills/using-git-worktrees/SKILL.md) |
| writing-skills | [skills/writing-skills/SKILL.md](skills/writing-skills/SKILL.md) |

## 可继续追问的主题

- `技能触发精度`：CSO 描述字段的 A/B 测试结果，如何优化技能发现率
- `SDD 成本模型`：子代理数量与 Token 消耗的关系，模型选择对成本的影响
- `跨平台行为差异`：同一技能在不同编码代理上的行为差异及适配策略
- `可视化伴侣协议`：WebSocket 消息格式的扩展可能性，多用户协作场景

## 来源信息

- 仓库：https://github.com/obra/superpowers
- 提交：e7a2d16476bf042e9add4699c9d018a90f86e4a6
- 生成时间：2025 年
