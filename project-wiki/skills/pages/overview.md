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

Sources: [README.md:11-138](../../../project-repos/skills/README.md#L11-L138), [CLAUDE.md:1-14](../../../project-repos/skills/CLAUDE.md#L1-L14), [claude-plugin/plugin.json:1-17](../../../project-repos/skills/.claude-plugin/plugin.json#L1-L17)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:11-138`

````markdown
# Skills For Real Engineers

My agent skills that I use every day to do real engineering - not vibe coding.

Developing real applications is hard. Approaches like GSD, BMAD, and Spec-Kit try to help by owning the process. But while doing so, they take away your control and make bugs in the process hard to resolve.

These skills are designed to be small, easy to adapt, and composable. They work with any model. They're based on decades of engineering experience. Hack around with them. Make them your own. Enjoy.

If you want to keep up with changes to these skills, and any new ones I create, you can join ~60,000 other devs on my newsletter:

[Sign Up To The Newsletter](https://www.aihero.dev/s/skills-newsletter)

## Quickstart (30-second setup)

1. Run the skills.sh installer:

```bash
npx skills@latest add mattpocock/skills
```

2. Pick the skills you want, and which coding agents you want to install them on. **Make sure you select `/setup-matt-pocock-skills`**.

3. Run `/setup-matt-pocock-skills` in your agent. It will:
   - Ask you which issue tracker you want to use (GitHub, Linear, or local files)
   - Ask you what labels you apply to ticks when you triage them (`/triage` uses labels)
   - Ask you where you want to save any docs we create

4. Bam - you're ready to go.

## Why These Skills Exist

I built these skills as a way to fix common failure modes I see with Claude Code, Codex, and other coding agents.

### #1: The Agent Didn't Do What I Want

> "No-one knows exactly what they want"
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**The Problem**. The most common failure mode in software development is misalignment. You think the dev knows what you want. Then you see what they've built - and you realize it didn't understand you at all.

This is just the same in the AI age. There is a communication gap between you and the agent. The fix for this is a **grilling session** - getting the agent to ask you detailed questions about what you're building.

**The Fix** is to use:

- [`/grill-me`](./skills/productivity/grill-me/SKILL.md) - for non-code uses
- [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md) - same as [`/grill-me`](./skills/productivity/grill-me/SKILL.md), but adds more goodies (see below)

These are my most popular skills. They help you align with the agent before you get started, and think deeply about the change you're making. Use them _every_ time you want to make a change.

### #2: The Agent Is Way Too Verbose

> With a ubiquitous language, conversations among developers and expressions of the code are all derived from the same domain model.
>
> Eric Evans, [Domain-Driven-Design](https://www.amazon.co.uk/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

**The Problem**: At the start of a project, devs and the people they're building the software for (the domain experts) are usually speaking different languages.

I felt the same tension with my agents. Agents are usually dropped into a project and asked to figure out the jargon as they go. So they use 20 words where 1 will do.

**The Fix** for this is a shared language. It's a document that helps agents decode the jargon used in the project.

<details>
<summary>
Example
</summary>

Here's an example [`CONTEXT.md`](https://github.com/mattpocock/course-video-manager/blob/076a5a7a182db0fe1e62971dd7a68bcadf010f1c/CONTEXT.md), from my `course-video-manager` repo. Which one is easier to read?

- **BEFORE**: "There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"
- **AFTER**: "There's a problem with the materialization cascade"

This concision pays off session after session.

</details>

This is built into [`/grill-with-docs`](./skills/engineering/grill-with-docs/SKILL.md). It's a grilling session, but that helps you build a shared language with the AI, and document hard-to-explain decisions in ADR's.

It's hard to explain how powerful this is. It might be the single coolest technique in this repo. Try it, and see.

> [!TIP]
> A shared language has many other benefits than reducing verbosity:
>
> - **Variables, functions and files are named consistently**, using the shared language
> - As a result, the **codebase is easier to navigate** for the agent
> - The agent also **spends fewer tokens on thinking**, because it has access to a more concise language

### #3: The Code Doesn't Work

> "Always take small, deliberate steps. The rate of feedback is your speed limit. Never take on a task that’s too big."
>
> David Thomas & Andrew Hunt, [The Pragmatic Programmer](https://www.amazon.co.uk/Pragmatic-Programmer-Anniversary-Journey-Mastery/dp/B0833F1T3V)

**The Problem**: Let's say that you and the agent are aligned on what to build. What happens when the agent _still_ produces crap?

It's time to look at your feedback loops. Without feedback on how the code it produces actually runs, the agent will be flying blind.

**The Fix**: You need the usual tranche of feedback loops: static types, browser access, and automated tests.

For automated tests, a red-green-refactor loop is critical. This is where the agent writes a failing test first, then fixes the test. This helps give the agent a consistent level of feedback that results in far better code.

I've built a **[`/tdd`](./skills/engineering/tdd/SKILL.md) skill** you can slot into any project. It encourages red-green-refactor and gives the agent plenty of guidance on what makes good and bad tests.

For debugging, I've also built a **[`/diagnose`](./skills/engineering/diagnose/SKILL.md)** skill that wraps best debugging practices into a simple loop.

### #4: We Built A Ball Of Mud

> "Invest in the design of the system _every day_."
>
> Kent Beck, [Extreme Programming Explained](https://www.amazon.co.uk/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

> "The best modules are deep. They allow a lot of functionality to be accessed through a simple interface."
>
> John Ousterhout, [A Philosophy Of Software Design](https://www.amazon.co.uk/Philosophy-Software-Design-2nd/dp/173210221X)

**The Problem**: Most apps built with agents are complex and hard to change. Because agents can radically speed up coding, they also accelerate software entropy. Codebases get more complex at an unprecedented rate.

**The Fix** for this is a radical new approach to AI-powered development: caring about the design of the code.

This is built in to every layer of these skills:
... snippet truncated ...
````

#### `CLAUDE.md:1-14`

```markdown
Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used
- `personal/` — tied to my own setup, not promoted
- `deprecated/` — no longer used

Every skill in `engineering/`, `productivity/`, or `misc/` must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`. Skills in `personal/` and `deprecated/` must not appear in either.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`.
```

#### `claude-plugin/plugin.json:1-17`

```json
{
  "name": "mattpocock-skills",
  "skills": [
    "./skills/engineering/diagnose",
    "./skills/engineering/grill-with-docs",
    "./skills/engineering/triage",
    "./skills/engineering/improve-codebase-architecture",
    "./skills/engineering/setup-matt-pocock-skills",
    "./skills/engineering/tdd",
    "./skills/engineering/to-issues",
    "./skills/engineering/to-prd",
    "./skills/engineering/zoom-out",
    "./skills/productivity/caveman",
    "./skills/productivity/grill-me",
    "./skills/productivity/write-a-skill"
  ]
}
```

<!-- source-snippets:end -->
</details>

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
