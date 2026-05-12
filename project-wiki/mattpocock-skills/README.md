# mattpocock-skills DeepWiki

**站点路径**：`https://dragonforce2010.github.io/awesome-ai-repos-deepwiki/mattpocock-skills/pages/overview`（本目录在 `project-wiki` 下的名为 `mattpocock-skills`，与上游 Git 仓库短名 `skills` 区分，避免多项目并列时歧义。）

> **这是 Matt Pocock 维护的一套「面向真实工程的 Agent Skills」：通过对齐会话、共享领域语言、triage 状态机与竖切 issue，补上代理开发里最常见的四类失效模式——而不是再包装一套剥夺控制权的巨无霸流程。**

## 源码快照

| 字段 | 值 |
|------|-----|
| 仓库 | [https://github.com/mattpocock/skills](https://github.com/mattpocock/skills) |
| 记录提交 | `b843cb5ea74b1fe5e58a0fc23cddef9e66076fb8` |
| Wiki 生成日 | `2026-05-05` |

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | Quickstart、`npx skills`、阅读路线、物理结构 |
| 概览 | [失败模式与工程价值观](pages/failure-modes-and-values.md) | README 四条失败模式与 ADR 0001 |
| 发布与治理 | [发布面与插件清单](pages/publishing-surface.md) | `README` + `.claude-plugin` 的双重发布面 |
| 发布与治理 | [本地开发脚本](pages/scripts-local-dev.md) | `link-skills.sh` / `list-skills.sh` |
| 运行契约 | [每仓配置与领域契约](pages/setup-and-domain-contract.md) | `/setup-matt-pocock-skills` 与 docs/agents |
| 运行契约 | [Engineering 技能矩阵](pages/engineering-skills-matrix.md) | to-issues / triage / PRD 流水线 |
| 运行契约 | [Productivity 与 Misc 技能](pages/productivity-and-tooling-skills.md) | grill / caveman / write-a-skill / misc |
| 运行契约 | [目录桶策略与治理边界](pages/bucket-policies-and-out-of-scope.md) | personal/deprecated 与 `.out-of-scope/` |

## 仓库全景（作者维护面）

```text
mattpocock/skills/
├── .claude-plugin/plugin.json    # Claude Code Marketplace 技能路径
├── CLAUDE.md                     # README + plugin 同步规则
├── CONTEXT.md                    # 本仓库自身领域词表（Issue tracker…）
├── docs/adr/                     # 设计决策（含 hard vs soft dependency）
├── scripts/                      # 本地 symlink / 枚举工具
└── skills/
    ├── engineering/              # 日常工程工作流技能
    ├── productivity/           # 非代码向工作流技能
    ├── misc/                     # 低频工具技能
    ├── personal/                 # 个人向，不进 plugin.json
    └── deprecated/               # 历史实验
```

## 核心入口（从维护者视角）

| 文件 | 为什么重要 |
|------|------------|
| [README.md](../../../project-repos/skills/README.md) | 对外叙事、安装 Quickstart、技能清单 |
| [.claude-plugin/plugin.json](../../../project-repos/skills/.claude-plugin/plugin.json) | 机器可读的技能子集声明 |
| [skills/engineering/setup-matt-pocock-skills/SKILL.md](../../../project-repos/skills/skills/engineering/setup-matt-pocock-skills/SKILL.md) | 把任意消费仓接到 Issue/label/CONTEXT 契约 |
| [docs/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md](../../../project-repos/skills/docs/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md) | 解释哪些技能强制 `/setup` |
| [CONTEXT.md](../../../project-repos/skills/CONTEXT.md) | 作者在 **本仓库** 示范如何用共享语言砍掉歧义 |
| [scripts/link-skills.sh](../../../project-repos/skills/scripts/link-skills.sh) | 开发者把全技能 symlink 进 `~/.claude/skills` |

## 你想了解什么？

- **我到底要不要装这一套？先看价值观** → [失败模式与工程价值观](pages/failure-modes-and-values.md)
- **装完插件为什么还要跑 slash command？** → [每仓配置与领域契约](pages/setup-and-domain-contract.md)
- **Issue/triage/to-issues 是一条怎样的流水线？** → [Engineering 技能矩阵](pages/engineering-skills-matrix.md)
- **我准备 fork 这套技能时需要遵守哪些收录规则？** → [目录桶策略与治理边界](pages/bucket-policies-and-out-of-scope.md)

## 结构化数据

更多机器可读信息见 [`wiki-structure.json`](wiki-structure.json) 与本目录下的盘点文件：

- [`00-repo-inventory.md`](00-repo-inventory.md)
- [`source-manifest.json`](source-manifest.json)

## Skills 中文副本

源仓库的全部 `SKILL.md`（含 deprecated / personal）在 DeepWiki 输出目录中以中文副本形式保存在 [`skills/`](skills/)（相对本 wiki 根 `project-wiki/mattpocock-skills/skills/`）— 结构与源技能包一致，文件名保持英文标识符便于检索。

## 可继续追问的主题

- **`hard dependency` vs `soft dependency`**：哪些技能必须把 label 字面量配对成功？阅读 ADR `0001` + `to-issues`/`triage` 开头段落。
- **consumer 侧的 `.out-of-scope/`**：triage 在拒绝 enhancement 时要写入什么格式的机构记忆？
- **`misc` vs plugin.json**：为什么 README 引用了 `misc` 技能却未全部进入 `.claude-plugin`？

## 单文件导出

合并版见 [`exports/full-wiki.md`](exports/full-wiki.md)。
