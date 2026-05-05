---
name: setup-matt-pocock-skills
description: 在 AGENTS.md/CLAUDE.md 中设置 `## Agent skills` 区块，并创建 `docs/agents/`，使工程类技能知晓本仓库的 issue 跟踪器（GitHub 或本地 Markdown）、分诊标签词汇表与领域文档布局。在首次使用 `to-issues`、`to-prd`、`triage`、`diagnose`、`tdd`、`improve-codebase-architecture` 或 `zoom-out` 之前运行——或当这些技能似乎缺少关于跟踪器、分诊标签或领域文档的上下文时运行。
disable-model-invocation: true
---

# 配置 Matt Pocock 技能集（Setup Matt Pocock's Skills）

搭建工程类技能所假设的**每仓库**配置：

- **Issue 跟踪器** —— 工单存放位置（默认 GitHub；亦原生支持本地 Markdown）
- **分诊标签** —— 五个规范分诊角色所用的字符串
- **领域文档** —— `CONTEXT.md` 与 ADR 的位置，以及读取它们的消费规则

这是**提示驱动**的技能，不是确定性脚本。先探索、展示发现、与用户确认，再写入。

## 流程

### 1. 探索

查看当前仓库以了解起点。阅读已有内容；不要假设：

- `git remote -v` 与 `.git/config` —— 是否为 GitHub 仓库？是哪一个？
- 仓库根目录的 `AGENTS.md` 与 `CLAUDE.md` —— 是否存在？其中是否已有 `## Agent skills` 小节？
- 根目录的 `CONTEXT.md` 与 `CONTEXT-MAP.md`
- `docs/adr/` 以及任意 `src/*/docs/adr/` 目录
- `docs/agents/` —— 本技能先前输出是否已存在？
- `.scratch/` —— 表示可能已在使用本地 Markdown issue 约定

### 2. 展示发现并提问

总结已有与缺失。然后**每次只走**三个决策中的一节——展示一节、得到用户回答、再进入下一节。不要三节一次性倾倒。

假设用户不懂这些术语含义。每节以简短说明开头（是什么、为何技能需要、选择不同选项会怎样）。然后展示选项与默认。

**A 节 —— Issue 跟踪器。**

> 说明：「Issue 跟踪器」指本仓库工单的存放位置。`to-issues`、`triage`、`to-prd`、`qa` 等技能会读写它——需要知道是调用 `gh issue create`、在 `.scratch/` 下写 Markdown，还是遵循你描述的其他工作流。请选择你**实际**跟踪本仓库工作的地方。

默认立场：这些技能为 GitHub 设计。若 `git remote` 指向 GitHub，建议 GitHub。若指向 GitLab（`gitlab.com` 或自建主机），建议 GitLab。否则（或用户偏好）可提供：

- **GitHub** —— 工单在仓库的 GitHub Issues（使用 `gh` CLI）
- **GitLab** —— 工单在仓库的 GitLab Issues（使用 [`glab`](https://gitlab.com/gitlab-org/cli) CLI）
- **Local markdown（本地 Markdown）** —— 工单以文件形式存放在本仓库 `.scratch/<feature>/` 下（适合单人项目或无 remote 的仓库）
- **Other（其他）**（Jira、Linear 等）—— 请用户用一段话描述工作流；技能将其记录为自由文本

**B 节 —— 分诊标签词汇表。**

> 说明：`triage` 技能处理进站工单时，会将其推过状态机——待评估、等报告者、可供离线代理领取、需人类处理、或不予修复。为此需要应用与**你实际配置**字符串相匹配的标签（或跟踪器等价物）。若仓库已使用不同标签名（例如 `bug:triage` 而非 `needs-triage`），在此映射，避免技能创建重复标签。

五个规范角色：

- `needs-triage` —— 维护者需评估
- `needs-info` —— 等待报告者
- `ready-for-agent` —— 规格完整，AFK 可接（代理无需人类上下文即可开工）
- `ready-for-human` —— 需要人类实现
- `wontfix` —— 不会处理

默认：每个角色的字符串等于其角色名。询问用户是否覆盖任一项。若跟踪器尚无标签，默认即可。

**C 节 —— 领域文档。**

> 说明：部分技能（`improve-codebase-architecture`、`diagnose`、`tdd`）通过 `CONTEXT.md` 学习项目领域语言，通过 `docs/adr/` 了解过往架构决策。需要确认仓库是单一全局上下文还是多个（例如前后端分离的 monorepo），以便在正确位置查找。

确认布局：

- **Single-context（单上下文）** —— 根目录一个 `CONTEXT.md` + `docs/adr/`。大多数仓库如此。
- **Multi-context（多上下文）** —— 根目录 `CONTEXT-MAP.md` 指向各上下文的 `CONTEXT.md`（典型 monorepo）。

### 3. 确认并编辑

向用户展示草案：

- 将添加到正在编辑的 `CLAUDE.md` / `AGENTS.md` 中的 `## Agent skills` 区块（选择规则见步骤 4）
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容

在写入前允许其编辑。

### 4. 写入

**选择要编辑的文件：**

- 若存在 `CLAUDE.md`，编辑它。
- 否则若存在 `AGENTS.md`，编辑它。
- 若两者皆无，询问用户要创建哪一个——不要替用户选择。

在已存在 `CLAUDE.md` 时**不要**创建 `AGENTS.md`（反之亦然）——始终编辑已存在者。

若所选文件中已有 `## Agent skills` 区块，**原地更新**其内容，勿追加重复区块。不要覆盖用户对周围章节的编辑。

区块内容：

```markdown
## Agent skills

### Issue tracker

[一句话说明工单跟踪位置]。详见 `docs/agents/issue-tracker.md`。

### Triage labels

[一句话说明标签词汇表]。详见 `docs/agents/triage-labels.md`。

### Domain docs

[一句话说明布局——「单上下文」或「多上下文」]。详见 `docs/agents/domain.md`。
```

然后以本技能文件夹中的种子模板为起点，写入三个文档文件：

- [issue-tracker-github.md](./issue-tracker-github.md) —— GitHub issue 跟踪器
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) —— GitLab issue 跟踪器
- [issue-tracker-local.md](./issue-tracker-local.md) —— 本地 Markdown issue 跟踪器
- [triage-labels.md](./triage-labels.md) —— 标签映射
- [domain.md](./domain.md) —— 领域文档消费规则 + 布局

对「其他」跟踪器，根据用户描述从零编写 `docs/agents/issue-tracker.md`。

### 5. 完成

告知用户配置已完成，以及哪些工程技能将从此读取这些文件。说明其日后可直接编辑 `docs/agents/*.md`——仅当切换跟踪器或希望从头重来时才需重新运行本技能。
