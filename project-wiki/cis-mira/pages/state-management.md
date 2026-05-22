<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/store/atoms/chat-stream-state.ts](../../../project-repos/cis-mira/src/store/atoms/chat-stream-state.ts)
- [src/store/atoms/chat-input.ts](../../../project-repos/cis-mira/src/store/atoms/chat-input.ts)
- [src/store/entities/message/index.ts](../../../project-repos/cis-mira/src/store/entities/message/index.ts)
- [src/store/entities/chat/index.ts](../../../project-repos/cis-mira/src/store/entities/chat/index.ts)
- [src/lib/query.ts](../../../project-repos/cis-mira/src/lib/query.ts)
- [src/lib/session-config.ts](../../../project-repos/cis-mira/src/lib/session-config.ts)

</details>

# 状态管理

Mira 同时用 **Jotai** 和 **TanStack React Query**，不是重复建设：前者管「这一屏的交互态」，后者管「服务端数据的缓存与失效」。流式聊天如果全走 Query invalidate，长推理阶段会把列表打爆；所以 delta 路径优先写 atom + message entity 的局部 patch。

## 分工表

| 场景 | 机制 | 典型 atom/query |
|------|------|-----------------|
| 是否正在流式输出 | Jotai | `chat-stream-state` |
| 输入框内容、附件 | Jotai | `chat-input`、`attachments-column` |
| 当前 LLM、模型列表 | Jotai | `llm`、`fetchModelsAtom` |
| 会话列表 CRUD | React Query | `store/entities/chat` |
| 消息列表、加载更多 | React Query | `store/entities/message` |
| 按 session 的配置 | 内存 + sessionStorage | `session-config.ts` |

Sources: [src/store/atoms/index.ts:1-30](../../../project-repos/pages/src/store/atoms/index.ts#L1-L30), [src/lib/query.ts:1-25](../../../project-repos/pages/src/lib/query.ts#L1-L25)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/store/atoms/index.ts:1-30`

> 未找到引用文件：`src/store/atoms/index.ts`

#### `src/lib/query.ts:1-25`

> 未找到引用文件：`src/lib/query.ts`

<!-- source-snippets:end -->
</details>

## Session 配置模型

`getSessionConfig` / `getDefaultSessionConfig` 把 agent、模型、skill 等选择绑定在 sessionId 上。`TEMP_SESSION_ID` 是首页占位会话，首条消息发送时迁移到真实 ID（见 [首页、Agent 与模板](templates-agents-home.md)）。

Sources: [src/lib/session-config.ts:1-50](../../../project-repos/pages/src/lib/session-config.ts#L1-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/lib/session-config.ts:1-50`

> 未找到引用文件：`src/lib/session-config.ts`

<!-- source-snippets:end -->
</details>

## Message Entity 与流式 patch

`store/entities/message` 封装 queries（拉历史）、mutations（发送后插入）、以及流式过程中的 **load-state**（是否还有更早消息）。与 `stream-service` 回调配合时，往往只更新当前 answer 消息 id 对应缓存，而不是 refetch 全列表。

Sources: [src/store/entities/message/index.ts:1-40](../../../project-repos/pages/src/store/entities/message/index.ts#L1-L40), [src/store/entities/message/load-state.ts:1-30](../../../project-repos/pages/src/store/entities/message/load-state.ts#L1-L30)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/store/entities/message/index.ts:1-40`

> 未找到引用文件：`src/store/entities/message/index.ts`

#### `src/store/entities/message/load-state.ts:1-30`

> 未找到引用文件：`src/store/entities/message/load-state.ts`

<!-- source-snippets:end -->
</details>

## 相关页面

- [SSE 流式聊天链路](streaming-chat-pipeline.md)
- [系统架构与分层](system-architecture.md)
