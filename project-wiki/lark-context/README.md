# lark-context DeepWiki

> **lark-context 把飞书群聊与云文档“落在本地 SQLite”，再通过 TS CLI 暴露给 Claude Code；记忆提炼（digest）刻意只做 shell 与文件 IO，不调用任何外部 LLM API，让敏感工作数据留在本机闭环里。**  

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览与地图 | [项目概览](pages/overview.md) | 痛点、两层记忆、与 Claude 的协作叙事 |
| 概览与地图 | [仓库地图与阅读路线](pages/repository-map.md) | 目录分工、TS 主路径、docs 与 skill |
| 架构与数据 | [系统架构](pages/system-architecture.md) | lark-cli 边界、编排层、存储切分 |
| 架构与数据 | [SQLite 数据模型](pages/sqlite-data-model.md) | 表结构、线程字段、索引 |
| 架构与数据 | [增量拉取与话题回复](pages/pull-and-threads.md) | 分页、cursor、thread 二阶段 |
| 能力与接口 | [CLI 命令参考](pages/cli-commands.md) | 子命令、白名单、错误语义 |
| 能力与接口 | [文档入库与展示](pages/docs-ingest-show.md) | ingest-doc、render、show 窗口 |
| 能力与接口 | [Claude Skill 与工作流](pages/skill-workflows.md) | 意图路由、references、digest 约束 |
| 工程交付 | [配置、路径与隐私边界](pages/config-and-privacy.md) | YAML/env、V1 边界、默认路径 |
| 工程交付 | [测试、构建与 Python 遗留](pages/testing-and-legacy.md) | tsup、Vitest、legacy/ 对照 |

## 仓库全景

```text
lark-context/
├── src/                    # TypeScript CLI 实现（ESM + commander）
│   ├── cli.ts              # 入口：注册子命令、版本号、EPIPE
│   ├── lark.ts             # execa 封装 lark-cli
│   ├── db.ts               # SQLite schema + 迁移
│   ├── config.ts           # YAML + 环境变量解析
│   ├── render.ts           # show 的 markdown 排版
│   └── commands/           # init / list-groups / groups / pull / ingest-doc / show
├── skills/lark-context/    # Claude Code skill + references/workflows
├── test/                   # Vitest，含 lark/json 夹具
├── legacy/python/          # 早期 Python 实现（对照与迁移痕迹）
└── docs/                   # superpowers 规格与设计备忘录
```

## 核心入口

| 源文件 | 为什么重要 |
|--------|------------|
| [src/cli.ts](../../../project-repos/lark-context/src/cli.ts) | 单一入口注册全部子命令，并从 `package.json` 读版本 |
| [src/lark.ts](../../../project-repos/lark-context/src/lark.ts) | 所有飞书能力最终都落到 `lark-cli … --format json` |
| [src/db.ts](../../../project-repos/lark-context/src/db.ts) | `raw.db` 的 schema、`thread_id` 迁移与 WAL 模式 |
| [src/commands/pull.ts](../../../project-repos/lark-context/src/commands/pull.ts) | 增量拉取、200 页上限、`thread_replies` 与二阶段补全 |
| [skills/lark-context/SKILL.md](../../../project-repos/lark-context/skills/lark-context/SKILL.md) | `/lark-context` 自然语言路由与各 workflow 前置条件 |

## 你想了解什么？

- **这个项目解决什么？** → [项目概览](pages/overview.md)  
- **数据怎么存、怎么续拉？** → [SQLite 数据模型](pages/sqlite-data-model.md) + [增量拉取与话题回复](pages/pull-and-threads.md)  
- **我能敲哪些命令？** → [CLI 命令参考](pages/cli-commands.md)  
- **Claude 侧怎么编排？** → [Claude Skill 与工作流](pages/skill-workflows.md)  

## 可继续追问的主题

- **`last_cursor` 与 `--since` 究竟谁说了算？** → 先读 [增量拉取与话题回复](pages/pull-and-threads.md)，再对照 [skills/.../references/pull.md](skills/lark-context/references/pull.md)。  
- **digest 为什么不调 API？** → [Claude Skill 与工作流](pages/skill-workflows.md) 与 [references/digest.md](skills/lark-context/references/digest.md)。  
- **README「不拉回复线程」与代码不一致？** → 以 `messages.thread_id` / `pullThreads` 为准，见 [增量拉取与话题回复](pages/pull-and-threads.md)。  

## 来源快照

- **远端**：`git@code.byted.org:tiktok/lark-context.git`  
- **本地路径**：`/Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/lark-context`  
- **提交**：`8099f2131ca597a21e77346ce2e272a5e0bf0554`（分支 `master`）  
