<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/routes/root-page/mira.tsx](../../../project-repos/cis-mira/src/routes/root-page/mira.tsx)
- [src/routes/root-page/components/template-section.tsx](../../../project-repos/cis-mira/src/routes/root-page/components/template-section.tsx)
- [src/routes/create-template/index.tsx](../../../project-repos/cis-mira/src/routes/create-template/index.tsx)
- [src/lib/template-cache.ts](../../../project-repos/cis-mira/src/lib/template-cache.ts)
- [src/lib/session-config.ts](../../../project-repos/cis-mira/src/lib/session-config.ts)
- [src/hooks/use-chat-manager.ts](../../../project-repos/cis-mira/src/hooks/use-chat-manager.ts)

</details>

# 首页、Agent 与模板

`/mira` 首页是 **发起会话前的配置枢纽**：选 Agent、选模板、选数据源，再进入 `MiraChatEntryPromptInput`。模板不仅是静态文案，而是通过 Slate `EntryEditor` 支持变量与 mention；配置在首条消息前挂在 `TEMP_SESSION_ID` 上。

## 首页结构

`root-page/mira.tsx` 组装 `TemplateSection`、`AgentSection`、推荐 Prompt 轮播、数据源选择等。`auto-start-chat-from-query` 支持 URL 预填直接开聊。

Sources: [src/routes/root-page/mira.tsx:1-50](../../../project-repos/pages/src/routes/root-page/mira.tsx#L1-L50), [src/routes/root-page/components/template-section.tsx:1-40](../../../project-repos/pages/src/routes/root-page/components/template-section.tsx#L1-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/routes/root-page/mira.tsx:1-50`

> 未找到引用文件：`src/routes/root-page/mira.tsx`

#### `src/routes/root-page/components/template-section.tsx:1-40`

> 未找到引用文件：`src/routes/root-page/components/template-section.tsx`

<!-- source-snippets:end -->
</details>

## 模板创建与缓存

`create-template/index.tsx` 使用 `EntryEditor` + 模型配置 + `SkillMenuDropdown`。`template-cache.ts` 做本地草稿/列表缓存，减少重复拉取。

`save-template` 路由支持从已有会话反存为模板。

Sources: [src/routes/create-template/index.tsx:31-80](../../../project-repos/pages/src/routes/create-template/index.tsx#L31-L80), [src/lib/template-cache.ts:1-40](../../../project-repos/pages/src/lib/template-cache.ts#L1-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/routes/create-template/index.tsx:31-80`

> 未找到引用文件：`src/routes/create-template/index.tsx`

#### `src/lib/template-cache.ts:1-40`

> 未找到引用文件：`src/lib/template-cache.ts`

<!-- source-snippets:end -->
</details>

## TEMP_SESSION 迁移（关键路径）

用户在首页选的 agent/model/skills 存在临时 session 配置；`use-chat-manager` 在 `submitMessage` 时若检测到真实 session 已创建，会把配置 **复制** 过去而不删除 TEMP——否则用户回到首页再开聊会丢选择。

Sources: [src/hooks/use-chat-manager.ts:115-133](../../../project-repos/pages/src/hooks/use-chat-manager.ts#L115-L133)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/hooks/use-chat-manager.ts:115-133`

> 未找到引用文件：`src/hooks/use-chat-manager.ts`

<!-- source-snippets:end -->
</details>

## 相关页面

- [项目概览](overview.md)
- [Skills、Tools 与 MCP](skills-tools-mcp.md)
- [SSE 流式聊天链路](streaming-chat-pipeline.md)
