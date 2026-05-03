# GitNexus DeepWiki

> **将代码库索引为知识图谱，并通过 MCP、CLI 与 Web 暴露给 AI 代理的 monorepo — 中文技术百科（DeepWiki-open 风格）。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、双形态产品、许可与阅读路线 |
| 系统架构与数据流 | [系统架构](pages/system-architecture.md) | high | 包边界、端到端数据流 |
| 系统架构与数据流 | [索引流水线](pages/ingestion-pipeline.md) | high | DAG 阶段、runner、调用解析 |
| 系统架构与数据流 | [图存储与持久化](pages/graph-storage-and-schema.md) | high | LadybugDB、注册表、陈旧度 |
| 接口与入口 | [MCP、CLI 与 HTTP 桥](pages/mcp-cli-http-interfaces.md) | high | 工具表、资源 URI、编辑器配置 |
| 接口与入口 | [Web UI 与本地桥接](pages/web-ui-bridge.md) | medium | Vite/React、serve 桥接 |
| 检索、图谱与多仓 | [检索、向量与 Wiki](pages/search-embeddings-and-wiki.md) | medium | 混合检索、嵌入、wiki 命令 |
| 检索、图谱与多仓 | [多仓组与 Contract Bridge](pages/groups-contract-bridge.md) | medium | `@group`、contracts/status 资源 |
| 扩展与生态 | [代理插件与 Skills](pages/agent-plugins-skills.md) | medium | Claude/Cursor 技能与工作流 |
| 测试、CI 与运维 | [测试、CI 与运维](pages/testing-ci-and-ops.md) | medium | Vitest、Playwright、GitHub Actions |

**单文件导出：** [exports/full-wiki.md](exports/full-wiki.md)

**随仓库 Skills 的中文副本：** 见 `skills/gitnexus-claude-plugin/` 与 `skills/gitnexus-cursor-integration/` 下各子目录的 `SKILL.md`。

## 仓库快照

```text
GitNexus/
├── gitnexus/              # npm 包：CLI、MCP、ingestion、图、嵌入
├── gitnexus-web/          # 浏览器 UI（Vite + React）
├── gitnexus-shared/       # 共享类型
├── gitnexus-claude-plugin/
├── gitnexus-cursor-integration/
├── eval/
├── docs/
├── .github/
├── ARCHITECTURE.md
├── RUNBOOK.md
├── README.md
└── ...
```

## 快速导航

- **想了解项目定位与使用形态？** → [项目概览](pages/overview.md)
- **想改 ingestion 或加语言？** → [索引流水线](pages/ingestion-pipeline.md) 与 `ARCHITECTURE.md` 源码
- **要接 MCP 或排查工具？** → [MCP、CLI 与 HTTP 桥](pages/mcp-cli-http-interfaces.md)
- **要看 CI 与本地测试命令？** → [测试、CI 与运维](pages/testing-ci-and-ops.md)

## 核心入口

| 文件 | 作用 |
|------|------|
| [README.md](../../project-repos/GitNexus/README.md) | 用户向文档、安装与 MCP 配置 |
| [ARCHITECTURE.md](../../project-repos/GitNexus/ARCHITECTURE.md) | 维护者向架构与阶段 DAG |
| [gitnexus/src/core/ingestion/pipeline.ts](../../project-repos/GitNexus/gitnexus/src/core/ingestion/pipeline.ts) | 阶段注册与 `runPipelineFromRepo` |
| [gitnexus/src/mcp/tools.ts](../../project-repos/GitNexus/gitnexus/src/mcp/tools.ts) | MCP 工具定义 |
| [gitnexus/src/mcp/resources.ts](../../project-repos/GitNexus/gitnexus/src/mcp/resources.ts) | MCP 资源 URI 模板 |

## 来源说明

- **上游仓库：** https://github.com/abhigyanpatwari/GitNexus  
- **索引所用提交：** `7f8b01d5068495af2f4b07f1f91bc4c1e7b82fe0`（见 `wiki-structure.json` 与 `00-repo-inventory.md`）  
- **源码检出目录：** `project-repos/GitNexus`（与本 `project-wiki/GitNexus` 分离）
