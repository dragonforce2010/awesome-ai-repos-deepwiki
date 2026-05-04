# Superpowers DeepWiki

> **Superpowers 是一个 AI 编码智能体的完整开发方法论，通过 14 个可组合的技能（TDD、系统化调试、子任务分派等）让 AI 智能体在动手写代码之前先探索需求、设计方案、制定计划——从根本上解决 AI 编程工具"直接跳进代码"导致的返工和质量问题。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| **概览** | [项目概览](pages/overview.md) | 定位、核心能力、与同类方案的差异 |
| **概览** | [设计哲学](pages/philosophy.md) | TDD、系统化、证据优先的工程价值观 |
| **架构** | [系统架构](pages/system-architecture.md) | 三层架构、插件层、Hook 机制 |
| **架构** | [插件系统](pages/plugin-system.md) | 多平台插件的注册机制 |
| **架构** | [Hook 机制](pages/hook-system.md) | SessionStart 上下文注入详解 |
| **工作流** | [Brainstorming](pages/brainstorming.md) | Socratic 设计探索与分阶段确认 |
| **工作流** | [Git Worktrees](pages/git-worktrees.md) | 隔离工作区的创建与安全验证 |
| **工作流** | [Writing Plans](pages/writing-plans.md) | 原子化任务卡片的编写规范 |
| **执行** | [Subagent-Driven Dev](pages/subagent-driven-development.md) | 子任务分派 + 两阶段评审 |
| **执行** | [TDD](pages/test-driven-development.md) | RED-GREEN-REFACTOR 铁律详解 |
| **执行** | [验证与调试](pages/verification.md) | 四阶段根因分析与修复验证 |
| **质量** | [代码评审](pages/code-review.md) | 评审发起与接收的双人机协作 |
| **质量** | [结束分支](pages/finishing-branch.md) | 测试验证与整合选项 |
| **技能** | [技能框架](pages/skills-system.md) | SKILL.md 结构与 TDD 驱动开发 |
| **技能** | [技能目录](pages/skills-catalog.md) | 14 个技能的分类索引 |
| **平台** | [多平台支持](pages/multi-platform.md) | 6 大平台的安装与配置 |

## 仓库全景

```text
superpowers/
├── skills/                          # 14 个技能子目录
│   ├── brainstorming/               # 设计前 Socratic 探索
│   ├── test-driven-development/     # RED-GREEN-REFACTOR
│   ├── systematic-debugging/        # 四阶段根因分析
│   ├── writing-plans/               # 原子化任务卡片
│   ├── subagent-driven-development/ # 子任务分派 + 两阶段评审
│   ├── requesting-code-review/      # 评审发起
│   ├── receiving-code-review/       # 评审接收
│   ├── finishing-a-development-branch/  # 分支收尾
│   ├── using-git-worktrees/        # Git Worktree 隔离
│   ├── verification-before-completion/  # 修复验证
│   ├── executing-plans/            # 批量执行（备选）
│   ├── dispatching-parallel-agents/ # 并行分派
│   ├── writing-skills/             # 技能编写规范
│   └── using-superpowers/         # 技能加载规范
├── hooks/                           # SessionStart Hook 脚本
├── .claude-plugin/                  # Claude Code 插件
├── .codex-plugin/                   # Copilot CLI / Codex 插件
├── .cursor-plugin/                  # Cursor 插件
├── gemini-extension.json             # Gemini CLI 扩展
└── .opencode/plugins/              # OpenCode 插件
```

## 核心入口

| 文件 | 作用 |
|------|------|
| `hooks/session-start` | 会话启动时注入技能上下文的 Bash 脚本 |
| `hooks/hooks.json` | 平台无关的 Hook 配置 |
| `skills/using-superpowers/SKILL.md` | 强制技能触发检查的入口技能 |
| `skills/subagent-driven-development/SKILL.md` | 主流执行模式的核心流程 |
| `skills/writing-skills/SKILL.md` | TDD 驱动的技能编写方法论 |

## 你想了解什么？

- **Superpowers 是什么，解决了什么问题？** → [项目概览](pages/overview.md)
- **它背后的工程哲学是什么？** → [设计哲学](pages/philosophy.md)
- **系统是怎么组织的？** → [系统架构](pages/system-architecture.md)
- **如何实现多平台支持的？** → [插件系统](pages/plugin-system.md) + [Hook 机制](pages/hook-system.md)
- **智能体怎么被强制要求先设计再写代码？** → [Brainstorming](pages/brainstorming.md)
- **Subagent-Driven Development 具体怎么运作？** → [Subagent-Driven Dev](pages/subagent-driven-development.md)
- **TDD 铁律具体怎么执行？** → [TDD](pages/test-driven-development.md)
- **如何调试而不是修症状？** → [验证与调试](pages/verification.md)
- **14 个技能全览** → [技能目录](pages/skills-catalog.md)
- **如何在各平台安装？** → [多平台支持](pages/multi-platform.md)

## 源码信息

- **仓库**：[obra/superpowers](https://github.com/obra/superpowers)
- **当前版本**：5.0.7
- **提交 hash**：`e7a2d16476bf042e9add4699c9d018a90f86e4a6`
- **依赖**：零外部依赖（纯 JSON + Markdown + Bash）
- **平台支持**：Claude Code、GitHub Copilot CLI、OpenAI Codex、Cursor、 Gemini CLI、OpenCode

---

*本 DeepWiki 由 [DeepWiki-it](https://github.com/obra/deepwiki-it) 自动生成，基于 `e7a2d164` 提交。*
