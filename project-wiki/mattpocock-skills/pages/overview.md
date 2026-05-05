<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](../../../project-repos/skills/README.md)
- [CLAUDE.md](../../../project-repos/skills/CLAUDE.md)
- [CONTEXT.md](../../../project-repos/skills/CONTEXT.md)
- [.claude-plugin/plugin.json](../../../project-repos/skills/.claude-plugin/plugin.json)

</details>

# 项目概览

这份仓库并不是传统意义上的「库」或「服务」，而是一套可直接安装的 **Agent Skills**：把几十年的工程习惯压缩成一组可组合的提示词与工作流，让它们能在 Claude Code、Codex 等环境里反复执行，而不是把流程外包给某个大一统方法论。

作者明确把定位放在 **真实工程**（real engineering）：技能要小、要能改、要可拼装；同时也要对抗代理产品的典型失效模式——对齐失败、话术膨胀、缺反馈闭环、以及在速度加持下更快的「泥球式增长」。读者的最佳入口仍是仓库根 `README.md` 里围绕这四类问题展开的故事线，而不是泛泛的 Stars 文案。

仓库物理结构非常轻：`.claude-plugin/plugin.json` 声明对 Claude Code Marketplace 友好的技能路径；真实的技能定义几乎全部落在 `skills/**/SKILL.md`；作者在自家仓库根的 `CONTEXT.md` 建模了 Issue tracker、triage role 等领域词表，ADR `docs/adr/0001-*.md` 则记录了「为何有的技能必须点名 `/setup`，有的则不必」这一类设计分叉。

```mermaid
graph TD
  UA["使用者 / 代理"] --> NPX["npx skills@latest add mattpocock/skills"]
  NPX --> PLG["`.claude-plugin/plugin.json`<br/>枚举对外技能路径"]
  PLG --> SK["skills/*/*/SKILL.md"]
  SK --> SETUP["setup-matt-pocock-skills<br/>生成 docs/agents/*"]
  SETUP --> IT["Issue tracker + label 映射 + CONTEXT/ADR"]
  IT --> ENG["engineering 技能<br/>（to-issues / triage / tdd …）"]
```

**安装路径为什么是 `npx skills`？** README 的快速开始把它写成两步：先用官方安装器把仓库挂进目标工具链，再在代理里运行 `/setup-matt-pocock-skills`，把 Issue 存放位置、triage label 字面量、`CONTEXT`/ADR 布局写进 **`docs/agents/`**（以及 `CLAUDE.md`/`AGENTS.md` 的技能索引块）；否则像 `to-issues`、`triage` 这类会直接写远端标签的技能会输出错误的标签字符串，而不是「模糊一点还能用」。这条边界在 ADR `0001` 里被称为 **hard dependency** vs **soft dependency**，也是理解整个技能矩阵的骨架。

Sources: [README.md:11-138](../../../project-repos/skills/README.md#L11-L138), [CLAUDE.md:1-14](../../../project-repos/skills/CLAUDE.md#L1-L14), [.claude-plugin/plugin.json:1-17](../../../project-repos/skills/.claude-plugin/plugin.json#L1-L17)

## 能力全景（用工程语言概括）

- **对齐（Grilling）**：用 `/grill-me` 与 `/grill-with-docs` 把需求树走完整，避免「你以为代理懂」。
- **共享语言（Ubiquitous language）**：`grill-with-docs` 在探索代码的同时维护 `CONTEXT.md` 与 ADR，让后续输出更短、更一致。
- **反馈闭环（TDD / diagnose）**：`tdd` 强化红-绿-重构；`diagnose` 把复杂缺陷收敛成可验证假设。
- **控制设计熵（Architecture）**：`to-prd`、`zoom-out`、`improve-codebase-architecture` 把设计意识嵌进日常节奏，而不是事后补救。
- **Issue 作为执行接口（Tracker ops）**：`to-issues` 用竖切（tracer bullet）拆单；`triage` 用有限状态机管理代理可接手的边界。

## 技术栈与边界

- **语言与形态**：以 Markdown 技能为主，辅以少量 Bash 脚本（`scripts/`）；无应用代码、无 CI、无测试目录——仓库质量靠作者自身的使用反馈与社区 PR 维护。
- **面向的工具链**：Claude Code 插件清单是明确的一等公民；其他代理可通过复制 `SKILL.md` 或安装器间接消费。

## 阅读路线

- **想 5 分钟判断「适不适合我」** → 读根 `README` 里四个失败模式章节，然后对照 [失败模式与工程价值观](failure-modes-and-values.md)。
- **要把它装进自己的仓库** → [发布面与插件清单](publishing-surface.md) + [每仓配置与领域契约](setup-and-domain-contract.md)。
- **要知道日常开发时具体会跑哪些提示词** → [Engineering 技能矩阵](engineering-skills-matrix.md) 与 [Productivity 与 Misc 技能](productivity-and-tooling-skills.md)。
- **要在本机做符号链接开发** → [本地开发脚本](scripts-local-dev.md)。

## 相关页面

- [失败模式与工程价值观](failure-modes-and-values.md) — README 故事线的拆解释义
- [发布面与插件清单](publishing-surface.md) — `.claude-plugin` 与对外目录如何对齐
- [每仓配置与领域契约](setup-and-domain-contract.md) — `/setup` 产物与硬 / 软依赖
