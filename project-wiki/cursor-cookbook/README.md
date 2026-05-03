# Cursor Cookbook DeepWiki

> **Cursor 官方提供的用于学习、测试与集成 Cursor SDK 及相关工具链的实战示例集合**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、核心示例与学习路线 |
| 概览 | [仓库结构与运行模式](pages/repository-structure.md) | medium | Monorepo 结构与 Cursor SDK 工作模式（Local/Cloud） |
| 核心功能与示例 | [CLI 与基础接入](pages/coding-agent-cli.md) | high | Node.js/Bun 环境下的基础 Agent 接入示例 |
| 核心功能与示例 | [App Builder 原型构建器](pages/app-builder.md) | high | 利用 Cursor Agent 在沙盒环境中快速构建 React 应用预览 |
| 核心功能与示例 | [Agent Kanban 看板](pages/agent-kanban.md) | high | 云端 Agent 任务状态管理与可视化前端 |
| 复杂流编排 | [DAG 任务流运行器](pages/dag-task-runner.md) | high | 基于拓扑排序的子智能体并发任务编排 |
| 复杂流编排 | [Canvas 动态渲染集成](pages/canvas-rendering.md) | medium | 如何将 Agent 状态流式写入 Cursor Canvas 实时展示 |
| 扩展与定制 | [Cursor 技能封装](pages/cursor-skills.md) | high | 以 dag-task-runner 为例的本地 Skill 封装与分发机制 |

## 仓库快照

```text
cursor-cookbook/
├── .cursor/
│   └── skills/
│       └── dag-task-runner/     # 可复制的 Cursor 技能实例
├── sdk/
│   ├── quickstart/              # 极简 SDK 入门示例
│   ├── app-builder/             # AI 驱动的原型生成器
│   ├── agent-kanban/            # 智能体任务看板
│   ├── coding-agent-cli/        # 终端中的 Cursor Agent 客户端
│   └── dag-task-runner/         # DAG 并发任务运行器
└── README.md
```

## 核心入口

| 模块 | 入口文件 | 作用 |
|------|----------|------|
| Quickstart | `sdk/quickstart/package.json` | 基础 Node.js 示例，演示创建 Agent、提示词与流式返回 |
| DAG Task Runner | `sdk/dag-task-runner/src/run_dag.ts` | DAG 任务并发调度、上下文注入与状态更新的核心生命周期 |
| Kanban App | `sdk/agent-kanban/src/components/agent-kanban-app.tsx` | Agent Kanban 核心前端组件，实现任务流转与 Artifact 预览 |
| Canvas Writer | `.cursor/skills/dag-task-runner/scripts/canvas_writer.ts` | 拦截 Agent 事件，生成 `.canvas.tsx` 供 Cursor IDE 实时预览 |

## 快速导航

- **如何将 Cursor SDK 接入我的代码？** → 阅读 [CLI 与基础接入](pages/coding-agent-cli.md)
- **如何并发执行复杂的长任务？** → 阅读 [DAG 任务流运行器](pages/dag-task-runner.md)
- **想在可视化看板里管理 Agent？** → 阅读 [Agent Kanban 看板](pages/agent-kanban.md)

---
*Source: `https://github.com/cursor/cookbook.git` @ `2f326663d3be5a3a86a4d11b679dbe8355259a36`*
