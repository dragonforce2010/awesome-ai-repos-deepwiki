<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/routes/task-center/index.tsx](../../../project-repos/cis-mira/src/routes/task-center/index.tsx)
- [src/features/task-center/api/scheduler.ts](../../../project-repos/cis-mira/src/features/task-center/api/scheduler.ts)
- [src/features/task-center/components/task-dashboard.tsx](../../../project-repos/cis-mira/src/features/task-center/components/task-dashboard.tsx)
- [src/store/atoms/task-center.ts](../../../project-repos/cis-mira/src/store/atoms/task-center.ts)
- [src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx](../../../project-repos/cis-mira/src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx)

</details>

# 任务中心

任务中心承接 **定时/计划任务** 的产品面：用户在 `/task` 查看今日与全部任务，在 `/task/add`、`/task/edit/:taskId` 编辑调度。聊天里模型也可通过 `ScheduleTaskTool` 创建任务，形成「对话 → 任务」闭环。

## 路由

`routes.tsx` 挂载 `TASK_ROUTE_BASE` 子树：列表、新增、编辑页懒加载。Jotai `task-center` atom 保存 Tab、筛选等 UI 态。

Sources: [src/routes/task-center/index.tsx:1-40](../../../project-repos/pages/src/routes/task-center/index.tsx#L1-L40), [src/store/atoms/task-center.ts:1-25](../../../project-repos/pages/src/store/atoms/task-center.ts#L1-L25)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/routes/task-center/index.tsx:1-40`

> 未找到引用文件：`src/routes/task-center/index.tsx`

#### `src/store/atoms/task-center.ts:1-25`

> 未找到引用文件：`src/store/atoms/task-center.ts`

<!-- source-snippets:end -->
</details>

## Scheduler API

`features/task-center/api/scheduler.ts` 对接后端调度接口；`api.md` 在同目录记录字段约定（给联调用）。

仪表盘组件 `task-dashboard`、今日/全部 Tab 视图在 `features/task-center/components/`。

Sources: [src/features/task-center/api/scheduler.ts:1-50](../../../project-repos/pages/src/features/task-center/api/scheduler.ts#L1-L50), [src/features/task-center/components/task-dashboard.tsx:1-40](../../../project-repos/pages/src/features/task-center/components/task-dashboard.tsx#L1-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/features/task-center/api/scheduler.ts:1-50`

> 未找到引用文件：`src/features/task-center/api/scheduler.ts`

#### `src/features/task-center/components/task-dashboard.tsx:1-40`

> 未找到引用文件：`src/features/task-center/components/task-dashboard.tsx`

<!-- source-snippets:end -->
</details>

## 与流式聊天交叉

`stream-service` 处理 `onCreatAsyncTask`、`onAsyncTaskCount` 等 SSE 事件，把后端异步任务进度反映到当前消息状态栏/计数器——任务中心是持久化视图，聊天页是实时反馈视图。

Sources: [src/features/stream/services/stream-service.ts:67-94](../../../project-repos/pages/src/features/stream/services/stream-service.ts#L67-L94), [src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx:1-35](../../../project-repos/pages/src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx#L1-L35)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/features/stream/services/stream-service.ts:67-94`

> 未找到引用文件：`src/features/stream/services/stream-service.ts`

#### `src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx:1-35`

> 未找到引用文件：`src/claude/components/ToolRendering/tools/ScheduleTaskTool.tsx`

<!-- source-snippets:end -->
</details>

## 相关页面

- [SSE 流式聊天链路](streaming-chat-pipeline.md)
- [消息适配与工具渲染](message-adapter-rendering.md)
