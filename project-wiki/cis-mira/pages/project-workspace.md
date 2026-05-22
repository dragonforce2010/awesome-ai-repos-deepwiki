<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/routes/project/detail.tsx](../../../project-repos/cis-mira/src/routes/project/detail.tsx)
- [src/features/project/components/project-chat-input.tsx](../../../project-repos/cis-mira/src/features/project/components/project-chat-input.tsx)
- [src/lib/agent-config.ts](../../../project-repos/cis-mira/src/lib/agent-config.ts)
- [src/features/project/api/project.ts](../../../project-repos/cis-mira/src/features/project/api/project.ts)
- [src/features/project/hooks/use-project-skills.ts](../../../project-repos/cis-mira/src/features/project/hooks/use-project-skills.ts)

</details>

# Project 工作区

Project 把「长期上下文」从单次聊天里抽出来：指令、文件、技能、MCP、数据源等模块在详情页分卡片管理，聊天输入走 `project-chat-input`，发送链路自动带上 **内部 Agent** `project_agent`（对用户不可见为可选 Agent）。

## 详情页模块

`project/detail.tsx` 组合 instruction、文件列表、技能、MCP、数据源等子模块；升级 Banner、可见性设置等运营向 UI 也在此层。

Sources: [src/routes/project/detail.tsx:17-50](../../../project-repos/pages/src/routes/project/detail.tsx#L17-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/routes/project/detail.tsx:17-50`

> 未找到引用文件：`src/routes/project/detail.tsx`

<!-- source-snippets:end -->
</details>

## project_agent 约束

`PROJECT_INTERNAL_AGENT = 'project_agent'` 用于发送时归一化 agent，但 **不能** 作为用户可选 agent 出现在选择器——否则 UI 会出现「选中了内部占位 Agent」的幽灵状态。注释在 `agent-config.ts` 里写得很直白，属于前后端契约的一部分。

Sources: [src/lib/agent-config.ts:17-27](../../../project-repos/pages/src/lib/agent-config.ts#L17-L27), [src/features/stream/hooks/use-send-message.ts:42-70](../../../project-repos/pages/src/features/stream/hooks/use-send-message.ts#L42-L70)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/lib/agent-config.ts:17-27`

> 未找到引用文件：`src/lib/agent-config.ts`

#### `src/features/stream/hooks/use-send-message.ts:42-70`

> 未找到引用文件：`src/features/stream/hooks/use-send-message.ts`

<!-- source-snippets:end -->
</details>

## 技能与模块 Hook

`use-project-skills`、`use-project-modules`、`use-project-mutations` 把列表拉取与变更收口在 feature 层；notes 目录下有集成说明 markdown（给 PM/设计协同用，不是运行时配置）。

Sources: [src/features/project/hooks/use-project-skills.ts:1-40](../../../project-repos/pages/src/features/project/hooks/use-project-skills.ts#L1-L40), [src/features/project/api/project.ts:1-30](../../../project-repos/pages/src/features/project/api/project.ts#L1-L30)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/features/project/hooks/use-project-skills.ts:1-40`

> 未找到引用文件：`src/features/project/hooks/use-project-skills.ts`

#### `src/features/project/api/project.ts:1-30`

> 未找到引用文件：`src/features/project/api/project.ts`

<!-- source-snippets:end -->
</details>

## 相关页面

- [SSE 流式聊天链路](streaming-chat-pipeline.md)
- [Skills、Tools 与 MCP](skills-tools-mcp.md)
