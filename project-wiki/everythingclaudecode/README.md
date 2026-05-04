# Everything Claude Code DeepWiki

> **Everything Claude Code (ECC) 是 Anthropic 黑客马拉松获胜者维护的生产级 Claude Code 配置集合——81 个技能、16 个专业代理、40+ 命令、跨平台钩子系统，覆盖 TypeScript/Go/Python/Perl/Kotlin/Swift 等多语言开发场景，经历 10+ 月密集日常使用演化而来。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 诞生背景、核心能力全景、与同类方案的差异 |
| 代理 | [代理体系](pages/agents.md) | 16 个专业代理的职责划分与编排模式 |
| 技能 | [技能系统](pages/skills.md) | 81 个技能分类索引、持续学习机制 |
| 命令 | [命令系统](pages/commands.md) | 40+ 斜杠命令的用法与编排 |
| 钩子 | [钩子与自动化](pages/hooks.md) | 6 种触发类型、核心钩子脚本详解 |
| 规则 | [规则系统](pages/rules.md) | 不可绕过的质量约束、immutability 原则 |
| 平台 | [多语言支持](pages/platforms.md) | 7 种语言的专属规则与编码标准 |
| 扩展 | [MCP 与集成](pages/mcp.md) | MCP 服务器配置、插件架构 |
| 脚本 | [核心脚本](pages/scripts.md) | claw.js、session-manager、codemaps 生成 |
| 工作流 | [典型工作流](pages/workflows.md) | TDD、E2E、持续学习、评测工作流 |

## 仓库全景

```text
everythingclaudecode/
├── agents/              # 16 个专业代理（planner, code-reviewer, tdd-guide...）
├── skills/              # 81 个技能（tdd-workflow, security-review, golang-patterns...）
├── commands/            # 40+ 斜杠命令（/tdd, /e2e, /plan, /learn...）
├── hooks/               # 钩子配置（hooks.json + JS 钩子脚本）
├── rules/               # 规则集（common + typescript/python/golang/kotlin...）
├── scripts/             # 核心脚本（claw.js, session-manager, codemaps...）
├── mcp-configs/         # 14 个 MCP 服务器配置
├── .claude-plugin/      # Claude Code 插件元数据
└── .opencode/           # OpenCode 平台插件
```

## 你想了解什么？

- **这个项目解决什么问题？** → [项目概览](pages/overview.md)
- **16 个代理各自负责什么？** → [代理体系](pages/agents.md)
- **81 个技能怎么分类的？** → [技能系统](pages/skills.md)
- **如何快速上手日常工作流？** → [典型工作流](pages/workflows.md)
- **ECC 的不可变原则和安全红线是什么？** → [规则系统](pages/rules.md)
- **多语言项目怎么接入？** → [多语言支持](pages/platforms.md)
- **session 持久化和上下文压缩怎么做？** → [钩子与自动化](pages/hooks.md)
- **如何从 git 历史生成技能？** → [命令系统](pages/commands.md)
- **ECC 的插件和 MCP 集成怎么做？** → [MCP 与集成](pages/mcp.md)
- **会话管理和代码地图生成原理？** → [核心脚本](pages/scripts.md)

## 核心入口

| 文件 | 为什么重要 |
|------|-----------|
| `AGENTS.md` | 16 个代理的完整行为定义和编排原则 |
| `skills/configure-ecc/SKILL.md` | ECC 自身配置指南 |
| `skills/continuous-learning-v2/SKILL.md` | 从会话中自动提取可复用知识的机制 |
| `commands/tdd.md` | TDD 工作流的完整流程定义 |
| `hooks/hooks.json` | 钩子系统的中央配置 |
| `rules/common/coding-style.md` | 不可变原则等通用编码约束 |
| `scripts/claw.js` | 会话交互核心（468 行） |

## 源码信息

- **仓库**：`https://github.com/marshall0524/everythingclaudecode`
- **上游原始仓库**：`https://github.com/affaan-m/everything-claude-code`
- **npm 包**：`ecc-universal@1.8.0`
- **作者**：Affaan Mustafa（Anthropic 黑客马拉松获胜者）
- **Commit**：`da4db99c94cf272d3341910bc8c8a26d2e6e6960`
