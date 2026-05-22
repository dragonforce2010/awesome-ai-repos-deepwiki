<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/features/skill/api/skill.ts](../../../project-repos/cis-mira/src/features/skill/api/skill.ts)
- [src/routes/skill-management/index.tsx](../../../project-repos/cis-mira/src/routes/skill-management/index.tsx)
- [src/features/tools/components/skill-menu-dropdown.tsx](../../../project-repos/cis-mira/src/features/tools/components/skill-menu-dropdown.tsx)
- [src/api/mcp.ts](../../../project-repos/cis-mira/src/api/mcp.ts)
- [src/claude/components/ToolRendering/tools/SkillTool.tsx](../../../project-repos/cis-mira/src/claude/components/ToolRendering/tools/SkillTool.tsx)
- [src/claude/components/ToolRendering/tools/McpAppView.tsx](../../../project-repos/cis-mira/src/claude/components/ToolRendering/tools/McpAppView.tsx)

</details>

# Skills、Tools 与 MCP

Skills 在 Mira 里既是 **可运营的能力商品**（市场、分类、我的技能），也是 **聊天会话里的可选能力包**（`skill_names` 写入 completion 请求）。MCP 则走独立 API 与 `McpAppView` 工具 UI，和 Claude SDK 的 tool_use 块对齐。

## 路由与页面

`/customize/skills` 下分市场、我的技能、详情等子路由；`skill-management/index.tsx` 用 Tab 切换 Market / MySkills。聊天侧通过 `SkillMenuDropdown`、单技能开关按钮等组件把选择反映到 session 配置。

Sources: [src/routes/skill-management/index.tsx:16-40](../../../project-repos/pages/src/routes/skill-management/index.tsx#L16-L40), [src/features/skill/api/skill.ts:5-20](../../../project-repos/pages/src/features/skill/api/skill.ts#L5-L20)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/routes/skill-management/index.tsx:16-40`

> 未找到引用文件：`src/routes/skill-management/index.tsx`

#### `src/features/skill/api/skill.ts:5-20`

> 未找到引用文件：`src/features/skill/api/skill.ts`

<!-- source-snippets:end -->
</details>

## API 边界

技能 REST 前缀：`/mira/api/v1/skill`（`features/skill/api/skill.ts`）。顶层 `src/api/skill.ts` 与 feature API 并存，页面应优先走 feature 封装。

发送消息时 `stream-service` 的 `buildRequestConfig` 把 `skill_names` 并入 request config，与 agent_name 同级。

Sources: [src/features/stream/services/stream-service.ts:45-55](../../../project-repos/pages/src/features/stream/services/stream-service.ts#L45-L55)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/features/stream/services/stream-service.ts:45-55`

> 未找到引用文件：`src/features/stream/services/stream-service.ts`

<!-- source-snippets:end -->
</details>

## 工具渲染

| 工具 UI | 场景 |
|---------|------|
| `SkillTool` | 模型调用已注册 Skill |
| `SkillCreateTool` | 创建/更新技能类工具 |
| `McpAppView` | MCP App 扩展可视化 |

工具埋点在 `claude/utils/tool-tracking.ts`，与 Tea/Slardar 报表联动。

Sources: [src/claude/components/ToolRendering/tools/SkillTool.tsx:1-40](../../../project-repos/pages/src/claude/components/ToolRendering/tools/SkillTool.tsx#L1-L40), [src/claude/components/ToolRendering/tools/McpAppView.tsx:1-40](../../../project-repos/pages/src/claude/components/ToolRendering/tools/McpAppView.tsx#L1-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/claude/components/ToolRendering/tools/SkillTool.tsx:1-40`

> 未找到引用文件：`src/claude/components/ToolRendering/tools/SkillTool.tsx`

#### `src/claude/components/ToolRendering/tools/McpAppView.tsx:1-40`

> 未找到引用文件：`src/claude/components/ToolRendering/tools/McpAppView.tsx`

<!-- source-snippets:end -->
</details>

## 相关页面

- [消息适配与工具渲染](message-adapter-rendering.md)
- [首页、Agent 与模板](templates-agents-home.md) — 模板编辑里的 Skill 选择
- [Project 工作区](project-workspace.md) — 项目级技能绑定
