---
name: setup-matt-pocock-skills
description: 在 AGENTS.md/CLAUDE.md 中设置 `## Agent skills` 区块，并创建 `docs/agents/`，使工程类 skills 知晓本仓库的议题追踪（GitHub 或本地 Markdown）、分类标签词汇，以及领域文档布局。在首次使用 `to-issues`、`to-prd`、`triage`、`diagnose`、`tdd`、`improve-codebase-architecture` 或 `zoom-out` 之前运行——或当这些 skills 似乎缺少议题追踪、分类标签或领域文档上下文时运行。
disable-model-invocation: true
---

# 设置 Matt Pocock 的 Skills

搭建工程类 skills 所假设的**每仓库**配置：

- **议题追踪** —— 议题存放处（默认 GitHub；也原生支持本地 Markdown）
- **分类标签** —— 五个标准分类角色所用的字符串
- **领域文档** —— `CONTEXT.md` 与 ADR 的位置，以及读取它们的消费方规则

这是**由提示驱动**的 skill，不是确定性脚本。探索、展示发现、与用户确认，然后写入。

## 流程

### 1. 探索

查看当前仓库以了解起点。读取已有内容；不要假设：

- `git remote -v` 与 `.git/config` —— 是否 GitHub？是哪一棵？
- 仓库根目录的 `AGENTS.md` 与 `CLAUDE.md` —— 是否存在？是否已有 `## Agent skills`？
- 根目录 `CONTEXT.md` 与 `CONTEXT-MAP.md`
- `docs/adr/` 与任意 `src/*/docs/adr/`
- `docs/agents/` —— 本 skill 是否已有输出？
- `.scratch/` —— 表示可能已在使用本地 Markdown 议题追踪约定

### 2. 展示发现并提问

总结已有与缺失。然后**每次只**带用户走三个决策之一——展示一节，得到答案，再下一节。不要三节一次性倒出。

默认用户不懂这些术语。每节以简短说明开头（是什么、为何 skills 需要、选不同会怎样）。再展示选项与默认。

**A 节 —— 议题追踪。**

> 说明：「议题追踪」是本仓库实际跟踪工作的地方。`to-issues`、`triage`、`to-prd`、`qa` 等会读写它——需要知道是调用 `gh issue create`、在 `.scratch/` 下写 Markdown，还是遵循你描述的其他工作流。选你**实际**跟踪工作的地方。

默认立场：这些 skills 面向 GitHub 设计。若 `git remote` 指向 GitHub，建议 GitHub。若指向 GitLab（`gitlab.com` 或自建 host），建议 GitLab。否则（或用户偏好）提供：

- **GitHub** —— 议题在仓库 GitHub Issues（用 `gh` CLI）
- **GitLab** —— 议题在仓库 GitLab Issues（用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **本地 Markdown** —— 议题为 `.scratch/<feature>/` 下文件（适合单人或无 remote 的仓库）
- **其他**（Jira、Linear 等）—— 请用户用一段话描述工作流；skill 将其记录为自由文本

**B 节 —— 分类标签词汇。**

> 说明：`triage` skill 处理进线议题时会驱动一台小状态机——待评估、等报告人、可供 AFK 代理接手、需要人工、或不修。为此需要应用与你**已配置**相匹配的标签（或议题追踪中的等价物）。若仓库已用不同标签名（如 `bug:triage` 而非 `needs-triage`），在此映射，避免 skill 建重复标签。

五个标准角色：

- `needs-triage` —— 维护者需评估
- `needs-info` —— 等待报告人
- `ready-for-agent` —— 说明充分，AFK 可接（代理可无需人工上下文接手）
- `ready-for-human` —— 需要人工实现
- `wontfix` —— 不会处理

默认：每个角色的字符串与其名字相同。询问用户是否覆盖。若议题追踪尚无标签，默认即可。

**C 节 —— 领域文档。**

> 说明：部分 skills（`improve-codebase-architecture`、`diagnose`、`tdd`）读 `CONTEXT.md` 学习领域语言，读 `docs/adr/` 了解过往架构决策。需知仓库是单一全局上下文还是多个（例如 monorepo 前后端分离），以便查对位置。

确认布局：

- **单上下文** —— 根目录一个 `CONTEXT.md` + `docs/adr/`。多数仓库如此。
- **多上下文** —— 根目录 `CONTEXT-MAP.md` 指向各上下文的 `CONTEXT.md`（典型 monorepo）。

### 3. 确认并编辑

向用户展示草稿：

- 要加入 `CLAUDE.md` / `AGENTS.md` 的 `## Agent skills` 区块（选用规则见步骤 4）
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容

写入前允许其编辑。

### 4. 写入

**选择要编辑的文件：**

- 若存在 `CLAUDE.md`，编辑它。
- 否则若存在 `AGENTS.md`，编辑它。
- 若二者皆无，询问用户要创建哪一个——勿替用户决定。

若已存在 `CLAUDE.md`，切勿再创建 `AGENTS.md`（反之亦然）——始终编辑已存在者。

若所选文件中已有 `## Agent skills` 区块，**原地更新**内容而非追加重复。勿覆盖用户对其他节的编辑。

区块：

```markdown
## Agent skills

### Issue tracker

[一行摘要：议题跟踪何处]. See `docs/agents/issue-tracker.md`.

### Triage labels

[一行摘要：标签词汇]. See `docs/agents/triage-labels.md`.

### Domain docs

[一行摘要：布局 — 「单上下文」或「多上下文」]. See `docs/agents/domain.md`.
```

然后以本 skill 文件夹中的种子模板为起点写三个文档：

- [issue-tracker-github.md](./issue-tracker-github.md) —— GitHub
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) —— GitLab
- [issue-tracker-local.md](./issue-tracker-local.md) —— 本地 Markdown
- [triage-labels.md](./triage-labels.md) —— 标签映射
- [domain.md](./domain.md) —— 领域文档消费规则 + 布局

对「其他」议题追踪，根据用户描述从零编写 `docs/agents/issue-tracker.md`。

### 5. 完成

告知设置完成，以及哪些工程 skills 现在会读这些文件。说明后续可直接编辑 `docs/agents/*.md` —— 仅当切换议题追踪或想从头重来时才需重跑本 skill。
