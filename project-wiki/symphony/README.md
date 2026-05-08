# Symphony DeepWiki

> OpenAI Symphony 编码 Agent 编排引擎的中文深度解析

## 项目简介

[Symphony](https://github.com/openai/symphony) 是 OpenAI 开源的自主编码 Agent 编排服务——它将 Issue Tracker（Linear）中的任务自动分配给 AI 编码 Agent（Codex），创建隔离工作区，管理多轮执行、重试与退避，实现全程无人值守的批量代码实现。

项目包含一份语言无关的 2170 行规范（SPEC.md），以及基于 Elixir/OTP 的参考实现，利用 BEAM 虚拟机的并发和容错特性处理大规模并行 Agent 调度。

## 源码信息

| 属性 | 值 |
|------|-----|
| 仓库 | [openai/symphony](https://github.com/openai/symphony) |
| Commit | `58cf97da06d556c019ccea20c67f4f77da124bf3` |
| 生成日期 | 2026-05-08 |
| 文件数 | 102（37 .ex + 22 .exs） |

## Wiki 目录

### 概览

| 页面 | 说明 |
|------|------|
| [项目概览](pages/01-overview.md) | Symphony 的诞生背景、核心问题、设计思路与整体定位 |

### 系统架构

| 页面 | 说明 |
|------|------|
| [系统架构与进程模型](pages/02-system-architecture.md) | OTP 监督树、核心进程拓扑与数据流全景 |

### 编排引擎

| 页面 | 说明 |
|------|------|
| [编排状态机与调度引擎](pages/03-orchestration-state-machine.md) | Issue 生命周期状态机、轮询调度、调和、重试与退避策略 |

### 配置系统

| 页面 | 说明 |
|------|------|
| [工作流定义与配置系统](pages/04-workflow-and-config.md) | WORKFLOW.md 合约、配置解析管线、动态热重载 |

### 工作区管理

| 页面 | 说明 |
|------|------|
| [工作区隔离与生命周期](pages/05-workspace-management.md) | Per-issue 隔离工作区、路径安全、生命周期钩子 |

### Agent 集成

| 页面 | 说明 |
|------|------|
| [Codex Agent 集成协议](pages/06-codex-integration.md) | App-server JSON-RPC 协议、会话管理、多轮续跑、动态工具 |
| [Linear 任务跟踪集成](pages/07-linear-integration.md) | GraphQL 轮询、Issue 规范化、分页、Blocker 检测 |

### 扩展能力

| 页面 | 说明 |
|------|------|
| [SSH Worker 扩展架构](pages/08-ssh-remote-workers.md) | 多主机 Worker 池、负载均衡、远程工作区与端口管理 |

### 可观测性

| 页面 | 说明 |
|------|------|
| [可观测性与实时仪表盘](pages/09-observability.md) | Phoenix LiveView 状态面板、PubSub 事件流、日志系统 |

### 质量保障

| 页面 | 说明 |
|------|------|
| [测试体系与质量门禁](pages/10-testing-and-quality.md) | 测试策略、快照测试、E2E Docker、CI 管线、代码质量门禁 |

## Skills 中文翻译

源仓库包含 6 个 Codex Skills（`.codex/skills/`），已翻译为中文：

| Skill | 说明 |
|-------|------|
| [commit](skills/commit/SKILL.md) | 基于变更和会话历史创建规范 git commit |
| [debug](skills/debug/SKILL.md) | 追踪日志调查卡住的运行和执行故障 |
| [land](skills/land/SKILL.md) | 监控冲突、等待检查、squash-merge PR |
| [linear](skills/linear/SKILL.md) | 通过 linear_graphql 工具执行 Linear GraphQL 操作 |
| [pull](skills/pull/SKILL.md) | 拉取 origin/main 并解决合并冲突 |
| [push](skills/push/SKILL.md) | 推送变更并创建/更新 PR |

## 导出

- [完整 Wiki 单文件导出](exports/full-wiki.md)
