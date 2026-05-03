<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [sdk/agent-kanban/README.md](../../sdk/agent-kanban/README.md)
- [sdk/agent-kanban/src/components/agent-kanban-app.tsx](../../sdk/agent-kanban/src/components/agent-kanban-app.tsx)
- [sdk/agent-kanban/src/app/api/agents/route.ts](../../sdk/agent-kanban/src/app/api/agents/route.ts)

</details>

# Agent Kanban 看板

`sdk/agent-kanban` 是 Cursor Cookbook 提供的一个非常具备实用价值的进阶示例。在现代的多智能体（Multi-agent）编排场景中，开发者往往需要让几十甚至几百个 Agent 跑在后台。对于这种场景，一个能够直观、全局统揽任务状态的 Kanban UI 显得尤为重要。

## 核心产品功能

这个 Kanban Board 的目标是**将云端执行的代码 Agent 具象化**，它提供了以下核心功能：
1. **列表拉取与视图分组**：查询所有当前账户下的 Cursor Cloud Agents，并允许用户按照“状态（Status）”或“代码仓库（Repository）”将其分组排列在不同的 Kanban 列中。
2. **预览 Artifacts（生成产物）**：点击某个具体的 Agent 卡片，可以快速预览它生成的代码文件或资源文件，而无需进入深度的 IDE。
3. **新建任务分发**：支持直接在看板页面上选择一个绑定的代码仓库，输入一段 Prompt 指令，从而生成（Spawn）一个新的云端 Agent 投入运行。

## 前端组件与架构设计

根据 `src/components/agent-kanban-app.tsx` 展现出的架构逻辑，该看板采用了 React 经典的组件树与状态管理方案。

### 关键组件树设计

```mermaid
graph TD
    App[AgentKanbanApp (主容器)]
    Sidebar[Sidebar栏 - 控制过滤与GroupBy]
    Board[Kanban面板区]
    
    App --> Sidebar
    App --> Board
    
    Board --> Col1[BoardColumn: PENDING]
    Board --> Col2[BoardColumn: RUNNING]
    Board --> Col3[BoardColumn: FINISHED]
    
    Col1 --> AgentCardPreview[Agent 状态卡片]
    Col2 --> AgentCardPreview
    Col3 --> AgentCardPreview
    
    App --> CreateDialog[CreateAgentDialog - 新建任务弹窗]
    AgentCardPreview --> ArtifactTile[生成产物预览切片]
```

### 状态流转机制

1. **轮询与刷新 (Polling / Refresh)**：
   看板需要在运行时保持实时性，因此底层会有定期的心跳或用户手动触发的 `handleRefresh` 方法，调用后端的 `/api/agents` 接口以获取最新的 Agent 状态。
2. **状态映射字典**：
   系统会将 SDK 返回的抽象状态映射成对前端友好的徽章与颜色（例如 PENDING 灰色，RUNNING 蓝色跑马灯，ERROR 红色警告，FINISHED 绿色打勾），并通过 `StatusBadge` 组件进行渲染。

## 后端 API 与路由设计

在 `src/app/api/` 目录下暴露了一系列 RESTful 路由。这些路由充当了前端 React UI 与 Cursor 官方服务器之间的桥梁层（BFF 架构）：

| 路由地址 | HTTP 方法 | 作用说明 |
|---------|----------|---------|
| `/api/agents` | GET | 返回当前所有 Cloud Agent 及其当前元数据列表。 |
| `/api/agents` | POST | 接收 `repo` 和 `prompt` 参数，通过 SDK 创建一个新的 Agent 任务下发到云端。 |
| `/api/agents/[id]/artifacts` | GET | 获取特定 Agent 完成后产生的文件变更和生成的静态资产。 |
| `/api/repositories` | GET | 获取当前关联的 GitHub 仓库列表，用于作为新建任务时下拉框的选项源。 |
| `/api/session` | POST/DELETE | 用于校验及存储 API Key 等授权敏感信息，管理生命周期。 |

通过这种隔离设计，前端页面不会直接将用户的 API Key 暴露给外部，而是通过内部 API Route 进行鉴权透传。

## 相关页面

- [App Builder 原型构建器](app-builder.md)
