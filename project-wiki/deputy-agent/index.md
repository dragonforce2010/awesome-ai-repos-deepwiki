# Deputy Agent DeepWiki

> **Deputy 是一个面向 1 小时到约 2 天无人值守交付的 TypeScript Agent 框架：你提交任务描述，Meta 角色按需生成 harness（方法论 / SOP / 工具 / 完成检查），Worker 在 workspace 内执行，Watcher 与 Reviewer 作为审计层纠偏——全程以磁盘文件为唯一协作面，而非 peer 多 Agent 闲聊。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 长任务痛点、master–worker 设计、与 coding agent 的差异 |
| 架构与运行时 | [系统架构](pages/system-architecture.md) | 11 个 `src/` 子系统、双入口、依赖方向 |
| 架构与运行时 | [Host 守护进程](pages/host-daemon-runtime.md) | 单实例锁、1s tick、七步调度、watchdog |
| 架构与运行时 | [四角色与阶段机](pages/agent-roles-stage-machine.md) | meta/worker/watcher/reviewer、九阶段、Reviewer 门禁 |
| 数据与通信 | [任务胶囊](pages/task-capsule-data.md) | workspace/control、`manifest.yaml`、原子写入 |
| 数据与通信 | [消息总线](pages/messaging-bus.md) | 三通道 envelope、`state.jsonl` 可恢复投递 |
| Provider 与工具 | [Provider 适配层](pages/provider-adapters.md) | `AgentRuntime`、Claude/Codex 能力矩阵 |
| Provider 与工具 | [Host 工具与 Harness](pages/host-tools-harness.md) | 19 个 `sh_*` 工具、按角色授权 |
| Provider 与工具 | [Watcher 与完成判据](pages/watcher-done-criteria.md) | 180s 窗口、compaction、`done_criteria.yaml` |
| 入口与运维 | [CLI 与 Web GUI](pages/cli-web-gui.md) | loopback :4319、SSE、与 CLI 同写路径 |
| 入口与运维 | [局限性与质量](pages/limitations-quality.md) | 0.1.0 参考实现、无 shipped 测试 |

## 仓库全景

```text
deputy-agent/
├── src/
│   ├── shared/       # 胶囊路径、manifest 状态机、原子 IO、锁
│   ├── wrapper/      # AgentRuntime + claude/codex/stub 适配器
│   ├── messaging/    # envelope 总线、三通道 inbox
│   ├── prompts/      # 四角色 system/first-message 组装（en/zh）
│   ├── host/         # daemon tick、阶段机、tools、watcher、done_criteria
│   ├── cli/          # deputy 命令、config、启动 host
│   └── web/          # Fastify loopback GUI + SSE
├── docs/             # ARCHITECTURE / RUNTIME / DATA / PROVIDERS / WEB / USAGE
└── package.json      # Node >=22，依赖 Claude Agent SDK + Fastify
```

## 核心入口

| 文件 | 为何重要 |
|------|----------|
| `src/host/daemon.ts` | Host 编排中枢：tick 循环、会话生命周期、watchdog 集成 |
| `src/host/stage_machine.ts` | 九阶段合法迁移表 + bootstrap/final Reviewer 门禁 |
| `src/shared/manifest.ts` | `manifest.yaml` 权威状态、CAS 阶段写入 |
| `src/messaging/bus.ts` | 跨进程一致的消息总线（lock + state.jsonl） |
| `src/wrapper/types/runtime.ts` | Provider 中立会话接口 |
| `src/web/routes.ts` | Web GUI REST/SSE 与 CLI 桥接 |
| `docs/ARCHITECTURE.md` | 官方子系统地图与生命周期总览 |

## 你想了解什么？

- **它解决什么、和 Cursor/Codex CLI 有何不同？** → [项目概览](pages/overview.md)
- **代码怎么分层、数据往哪流？** → [系统架构](pages/system-architecture.md)
- **任务如何无人值守跑完？** → [Host 守护进程](pages/host-daemon-runtime.md) + [四角色与阶段机](pages/agent-roles-stage-machine.md)
- **磁盘上到底写了什么？** → [任务胶囊](pages/task-capsule-data.md)
- **怎么本地跑起来？** → [CLI 与 Web GUI](pages/cli-web-gui.md)

## 源码信息

- 仓库：https://github.com/SomeoneKong/deputy-agent
- 分析提交：`d6127c4f23c17e9dc58a5e4431778a96744aa783`
- 版本：0.1.0（Apache-2.0）

## 可继续追问的主题

- **Harness 生成逻辑**：重点读 `src/host/tools/harness.ts`、`workspace/harness/` 布局与 meta 角色 prompt（`src/prompts/assets/roles/meta.*.md`）。
- **Claude vs Codex 行为差异**：对照 `docs/PROVIDERS.md` 与 `docs/LIMITATIONS.md` 中的 capability 矩阵。
- **Worker 退出后谁决定重启**：Host 只投递 `worker_session_end`，续跑权在 meta——见 `src/host/daemon.ts` 文件头注释与 [四角色与阶段机](pages/agent-roles-stage-machine.md)。
