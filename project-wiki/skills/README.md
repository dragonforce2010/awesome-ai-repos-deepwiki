# Matt Pocock Skills DeepWiki

> **Matt Pocock 的技能仓库把「真实软件工程」压进一堆小而可替换的 Agent Skill：`grill-*` 负责对齐、`setup-matt-pocock-skills` 写入每台仓库的运行契约，`tdd`/`diagnose`/`improve-codebase-architecture` 则分别在测试、排障与模块加深三条反馈链路上卡住工程质量。**  
> 它不是大而全的流程套件（对比 README 中对「夺走控制权」类方案的批评），而是一套围绕对齐、共享语言和垂直切片交付的组合拳。

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | 动机、四类典型失败模式、技能分层 |
| 分发与仓库约定 | [安装与 Claude 插件清单](pages/installation-and-manifest.md) | `npx skills add` 与 `plugin.json` 上架边界 |
| 分发与仓库约定 | [每仓库配置与硬软依赖](pages/per-repo-setup.md) | `/setup-matt-pocock-skills`、ADR 0001 |
| 工作流 | [对齐会话与共享语言](pages/grilling-and-domain-language.md) | `grill-me` / `grill-with-docs` / `CONTEXT.md` |
| 工作流 | [规划、Issue 切片与分流](pages/planning-issues-triage.md) | `to-prd`、`to-issues`、`triage` |
| 工作流 | [质量回路、诊断与架构加深](pages/quality-architecture-feedback.md) | `tdd`、`diagnose`、`improve-*`、`zoom-out` |
| 扩展目录与脚本 | [扩展目录、脚本与个人技能](pages/extended-catalog-and-scripts.md) | productivity/misc/personal、脚本工具 |

## 仓库全景

```text
skills/                         # 本 DeepWiki 所分析的 mattpocock/skills 源码树要点
├── .claude-plugin/plugin.json # Claude Code 插件：仅列出对外推广的 engineering/productivity 技能
├── CLAUDE.md                  # 维护者对仓库结构的硬性约定（目录分层与 README/plugin 交叉引用）
├── CONTEXT.md                 # 展示用的共享术语表（Issue tracker / Issue / Triage role）
├── docs/adr/                  # 架构决策记录（含 setup 指针策略）
├── scripts/                   # link-skills.sh（symlink 到 ~/.claude/skills）、list-skills.sh
└── skills/
    ├── engineering/           # 日常编码：setup、triage、tdd、diagnose…
    ├── productivity/        # 通用协作：grill-me、caveman、write-a-skill
    ├── misc/                # 低频脚本类工具（不进 plugin.json）
    ├── personal/            # 个人向（不进 README/plugin）
    └── deprecated/          # 不再推荐使用
```

## 你想了解什么？

- **30 秒怎么装进 Claude Code？** → [安装与 Claude 插件清单](pages/installation-and-manifest.md)  
- **为什么必须先跑 `/setup-matt-pocock-skills`？** → [每仓库配置与硬软依赖](pages/per-repo-setup.md)  
- **如何把口头想法磨成可追溯术语？** → [对齐会话与共享语言](pages/grilling-and-domain-language.md)  
- **Issue / PRD / 分流状态机怎么串起来？** → [规划、Issue 切片与分流](pages/planning-issues-triage.md)

## 可继续追问的主题

- **`CONTEXT.md` 与 ADR 的边界**：何时只更新 glossary，何时新开 ADR（见 grill-with-docs 的三条件）。  
- **Tracer bullet vs horizontal slice**：`to-issues` 如何把交付切成垂直切片，`tdd` 如何避免一次性堆测试。  
- **Hard dependency**：为何 `to-issues`/`to-prd`/`triage` 在没有 triage label 映射时会产出错误而非含糊输出。

## 源码快照

- **仓库**：https://github.com/mattpocock/skills  
- **Commit**：`b843cb5ea74b1fe5e58a0fc23cddef9e66076fb8`
