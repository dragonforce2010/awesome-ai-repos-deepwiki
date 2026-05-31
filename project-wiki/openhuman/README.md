# OpenHuman DeepWiki

> **OpenHuman 是一款 UI-first 的开源个人 AI 助手：用本地 Memory Tree + Obsidian vault 在几分钟内建立上下文，Rust 核心统一集成、工具、推理与语音，Tauri 桌面壳交付。**

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 定位、能力矩阵、阅读路线 |
| 架构 | [系统架构](pages/system-architecture.md) | 分层架构、依赖图、模式判定 |
| 架构 | [Tauri 桌面壳层](pages/tauri-shell.md) | 窗口、CEF、Core 生命周期 |
| 架构 | [React 前端](pages/react-frontend.md) | coreRpcClient、目录结构 |
| 架构 | [JSON-RPC 通信桥](pages/json-rpc-bridge.md) | RPC 分发、双通道 |
| 运行时 | [Rust 核心运行时](pages/rust-core-runtime.md) | 100+ 领域模块地图 |
| 运行时 | [Agent 编排](pages/agent-orchestration.md) | 多 Agent、对话时序 |
| 运行时 | [工具与 MCP](pages/tools-mcp.md) | tool_registry、MCP 安装 |
| 记忆 | [Memory Tree 流水线](pages/memory-tree-pipeline.md) | ingest→chunk→检索 |
| 记忆 | [数据库模型](pages/memory-store-schema.md) | SQLite ER、迁移 |
| 记忆 | [Subconscious 后台](pages/subconscious-background.md) | 后台 tick、escalation |
| 推理 | [推理与模型路由](pages/inference-routing.md) | Ollama + 云端路由 |
| 推理 | [TokenJuice](pages/tokenjuice-compression.md) | 工具输出压缩 |
| 推理 | [Composio 集成](pages/integrations-composio.md) | OAuth、auto-fetch |
| 通道 | [消息通道](pages/channels-messaging.md) | Telegram/Discord 等 |
| 体验 | [语音与 Meet Agent](pages/voice-meet-agent.md) | STT/TTS、会议 Agent |
| 工程 | [安全与隐私](pages/security-privacy.md) | 信任边界、攻击面 |
| 工程 | [CI/CD 与发布](pages/ci-deployment.md) | GitHub Actions、安装渠道 |
| 工程 | [质量与重构](pages/quality-risks-refactor.md) | 评分、风险、路线图 |

## 仓库全景

```text
openhuman/
├── app/                 # React + Tauri 桌面应用
│   ├── src/             # 前端 UI（无业务逻辑）
│   └── src-tauri/       # Tauri 壳 + embedded core
├── src/                 # Rust openhuman 核心 crate
│   ├── openhuman/       # 100+ 领域模块
│   ├── core/            # CLI、JSON-RPC、事件总线
│   └── rpc/             # RpcOutcome 共享类型
├── tests/               # Rust E2E（体量极大）
├── gitbooks/            # 产品/开发文档
└── packages/            # npm 插件、arch AUR 等
```

## 核心入口

| 文件 | 为何重要 |
|------|----------|
| `src/lib.rs` | crate 入口，`run_core_from_args` |
| `src/openhuman/mod.rs` | 全部领域模块清单 |
| `app/src/services/coreRpcClient.ts` | UI→Core 唯一 RPC 客户端 |
| `src/openhuman/memory_store/chunks/store.rs` | Memory Tree SQLite schema |
| `src/openhuman/agent_orchestration/mod.rs` | 多 Agent 控制面 |
| `src/openhuman/inference/mod.rs` | 统一推理域 |
| `src/openhuman/tokenjuice/mod.rs` | Token 压缩引擎 |
| `Cargo.toml` | 依赖与 feature flags |

## 你想了解什么？

- **为什么它能"几分钟了解你"？** → [Memory Tree 流水线](pages/memory-tree-pipeline.md)
- **代码怎么分层？** → [系统架构](pages/system-architecture.md)
- **对话怎么驱动工具？** → [Agent 编排](pages/agent-orchestration.md)
- **数据存在哪？** → [数据库模型](pages/memory-store-schema.md)
- **上线前安全面？** → [安全与隐私](pages/security-privacy.md)

## 源码信息

- 仓库：https://github.com/tinyhumansai/openhuman
- Commit：`225b1dabf611a0972d69ff73553780cf0753da13`
- 分析规格：工业级全图表版（Profile 3）
