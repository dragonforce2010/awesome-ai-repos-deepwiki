# gstack DeepWiki 全量导出

- Source: https://github.com/garrytan/gstack
- Commit: `454423aeb3d3dafa88d5b57bfbe0ead05569d21e`
- Language: zh-CN

## 目录
- [项目概览](#项目概览)
- [技能工作流](#技能工作流)
- [安装与多宿主接入](#安装与多宿主接入)
- [技能生成系统](#技能生成系统)
- [Browse 运行时](#browse-运行时)
- [浏览器安全模型](#浏览器安全模型)
- [设计与 PDF 工具](#设计与-pdf-工具)
- [GBrain 与记忆系统](#gbrain-与记忆系统)
- [OpenClaw 集成](#openclaw-集成)
- [测试、CI 与质量门](#测试、ci-与质量门)
- [贡献、扩展与新增宿主](#贡献、扩展与新增宿主)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [ARCHITECTURE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ARCHITECTURE.md)
- [CLAUDE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CLAUDE.md)
- [package.json](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/package.json)
- [00-repo-inventory.md](../00-repo-inventory.md)

</details>

# 项目概览

gstack 是一个面向 AI 编码代理的“软件工厂”仓库：核心是 Claude Code 风格的 Markdown 技能集合，配套一个低延迟浏览器守护进程、设计生成工具、PDF 工具、GBrain 记忆接入、多宿主技能生成器和一组 CI/eval 质量门。README 把它描述成把 Claude Code 组织成虚拟工程团队的工作流，而 `ARCHITECTURE.md` 明确说“浏览器是难点，其他主要是 Markdown”。Sources: [README.md:53-64](../../../project-repos/gstack/README.md#L53-L64), [ARCHITECTURE.md:5-10](../../../project-repos/gstack/ARCHITECTURE.md#L5-L10)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:53-64`

````markdown
### Step 2: Team mode — auto-update for shared repos (recommended)

From inside your repo, paste this. Switches you to team mode, bootstraps the repo so teammates get gstack automatically, and commits the change:

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

No vendored files in your repo, no version drift, no manual upgrades. Every Claude Code session starts with a fast auto-update check (throttled to once/hour, network-failure-safe, completely silent).

Swap `required` for `optional` if you'd rather nudge teammates than block them.

````

#### `ARCHITECTURE.md:5-10`

```markdown
## The core idea

gstack gives Claude Code a persistent browser and a set of opinionated workflow skills. The browser is the hard part — everything else is Markdown.

The key insight: an AI agent interacting with a browser needs **sub-second latency** and **persistent state**. If every command cold-starts a browser, you're waiting 3-5 seconds per tool call. If the browser dies between commands, you lose cookies, tabs, and login sessions. So gstack runs a long-lived Chromium daemon that the CLI talks to over localhost HTTP.

```

<!-- source-snippets:end -->
</details>
## 一句话定位

| 维度 | 结论 | 证据 |
|---|---|---|
| 主要用户 | founders、第一次使用 Claude Code 的用户、tech lead/staff engineer | Sources: [README.md:56-64](../../../project-repos/gstack/README.md#L56-L64) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:56-64`

````markdown

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

No vendored files in your repo, no version drift, no manual upgrades. Every Claude Code session starts with a fast auto-update check (throttled to once/hour, network-failure-safe, completely silent).

Swap `required` for `optional` if you'd rather nudge teammates than block them.

````

<!-- source-snippets:end -->
</details>
| 核心形态 | Slash-command skills + compiled Bun tools + Playwright browser daemon | Sources: [package.json:7-19](../../../project-repos/gstack/package.json#L7-L19), [ARCHITECTURE.md:5-10](../../../project-repos/gstack/ARCHITECTURE.md#L5-L10) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `package.json:7-19`

```json
  "bin": {
    "browse": "./browse/dist/browse",
    "make-pdf": "./make-pdf/dist/pdf"
  },
  "scripts": {
    "build": "bun run vendor:xterm && bun run gen:skill-docs --host all; bun build --compile browse/src/cli.ts --outfile browse/dist/browse && bun build --compile browse/src/find-browse.ts --outfile browse/dist/find-browse && bun build --compile design/src/cli.ts --outfile design/dist/design && bun build --compile make-pdf/src/cli.ts --outfile make-pdf/dist/pdf && bun build --compile bin/gstack-global-discover.ts --outfile bin/gstack-global-discover && bash browse/scripts/build-node-server.sh && git rev-parse HEAD > browse/dist/.version && git rev-parse HEAD > design/dist/.version && git rev-parse HEAD > make-pdf/dist/.version && chmod +x browse/dist/browse browse/dist/find-browse design/dist/design make-pdf/dist/pdf bin/gstack-global-discover && (rm -f .*.bun-build || true)",
    "vendor:xterm": "mkdir -p extension/lib && cp node_modules/xterm/lib/xterm.js extension/lib/xterm.js && cp node_modules/xterm/css/xterm.css extension/lib/xterm.css && cp node_modules/xterm-addon-fit/lib/xterm-addon-fit.js extension/lib/xterm-addon-fit.js",
    "dev:make-pdf": "bun run make-pdf/src/cli.ts",
    "dev:design": "bun run design/src/cli.ts",
    "gen:skill-docs": "bun run scripts/gen-skill-docs.ts",
    "dev": "bun run browse/src/cli.ts",
    "server": "bun run browse/src/server.ts",
    "test": "bun test browse/test/ test/ make-pdf/test/ --ignore 'test/skill-e2e-*.test.ts' --ignore test/skill-llm-eval.test.ts --ignore test/skill-routing-e2e.test.ts --ignore test/codex-e2e.test.ts --ignore test/gemini-e2e.test.ts && (bun run slop:diff 2>/dev/null || true)",
```

#### `ARCHITECTURE.md:5-10`

```markdown
## The core idea

gstack gives Claude Code a persistent browser and a set of opinionated workflow skills. The browser is the hard part — everything else is Markdown.

The key insight: an AI agent interacting with a browser needs **sub-second latency** and **persistent state**. If every command cold-starts a browser, you're waiting 3-5 seconds per tool call. If the browser dies between commands, you lose cookies, tabs, and login sessions. So gstack runs a long-lived Chromium daemon that the CLI talks to over localhost HTTP.

```

<!-- source-snippets:end -->
</details>
| 工作流理念 | Think → Plan → Build → Review → Test → Ship → Reflect | Sources: [README.md:169-177](../../../project-repos/gstack/README.md#L169-L177) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:169-177`

```markdown
You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Eight commands, end to end. That is not a copilot. That is a team.

## The sprint

gstack is a process, not a collection of tools. The skills run in the order a sprint runs:

**Think → Plan → Build → Review → Test → Ship → Reflect**

Each skill feeds into the next. `/office-hours` writes a design doc that `/plan-ceo-review` reads. `/plan-eng-review` writes a test plan that `/qa` picks up. `/review` catches bugs that `/ship` verifies are fixed. Nothing falls through the cracks because every step knows what came before it.
```

<!-- source-snippets:end -->
</details>
| 源码规模 | 687 个扫描文件，TypeScript、Markdown、shell 和工作流文件占主体 | Sources: [00-repo-inventory.md:11-33](../00-repo-inventory.md#L11-L33) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `00-repo-inventory.md:11-33`

```markdown

- Files scanned: 687
- Top-level directories: `.github`, `agents`, `autoplan`, `benchmark`, `benchmark-models`, `bin`, `browse`, `browser-skills`, `canary`, `careful`, `claude`, `codex`, `context-restore`, `context-save`, `contrib`, `cso`, `design`, `design-consultation`, `design-html`, `design-review`, `design-shotgun`, `devex-review`, `docs`, `document-release`, `extension`, `freeze`, `gstack-upgrade`, `guard`, `health`, `hosts`, `investigate`, `land-and-deploy`, `landing-report`, `learn`, `lib`, `make-pdf`, `model-overlays`, `office-hours`, `open-gstack-browser`, `openclaw`, `pair-agent`, `plan-ceo-review`, `plan-design-review`, `plan-devex-review`, `plan-eng-review`, `plan-tune`, `qa`, `qa-only`, `retro`, `review`, `scrape`, `scripts`, `setup-browser-cookies`, `setup-deploy`, `setup-gbrain`, `ship`, `skillify`, `supabase`, `test`, `unfreeze`

| Extension | Count |
|-----------|------:|
| `.ts` | 367 |
| `.md` | 122 |
| `[no extension]` | 59 |
| `.tmpl` | 47 |
| `.html` | 26 |
| `.sh` | 13 |
| `.json` | 11 |
| `.yml` | 9 |
| `.js` | 6 |
| `.png` | 5 |
| `.sql` | 5 |
| `.css` | 4 |
| `.rb` | 4 |
| `.yaml` | 3 |
| `.example` | 1 |
| `.ci` | 1 |
| `.cjs` | 1 |
```

<!-- source-snippets:end -->
</details>
## 仓库地形

```mermaid
graph TD
  A[gstack repo] --> B[技能目录]
  A --> C[browse runtime]
  A --> D[design CLI]
  A --> E[make-pdf CLI]
  A --> F[hosts + generator]
  A --> G[GBrain + memory sync]
  A --> H[CI + evals]
  B --> B1[office/review/qa/ship]
  C --> C1[Playwright Chromium daemon]
  F --> F1[Claude/Codex/OpenClaw/etc]
```

`CLAUDE.md` 给出开发者视角的项目结构：`browse/src` 是命令注册和浏览器服务，`hosts` 是多宿主配置，`scripts` 负责模板生成，`test` 覆盖静态验证与 E2E eval，技能目录则承载实际工作流。Sources: [CLAUDE.md:78-149](../../../project-repos/gstack/CLAUDE.md#L78-L149)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CLAUDE.md:78-149`

````markdown
## Project structure

```
gstack/
├── browse/          # Headless browser CLI (Playwright)
│   ├── src/         # CLI + server + commands
│   │   ├── commands.ts  # Command registry (single source of truth)
│   │   └── snapshot.ts  # SNAPSHOT_FLAGS metadata array
│   ├── test/        # Integration tests + fixtures
│   └── dist/        # Compiled binary
├── hosts/           # Typed host configs (one per AI agent)
│   ├── claude.ts    # Primary host config
│   ├── codex.ts, factory.ts, kiro.ts  # Existing hosts
│   ├── opencode.ts, slate.ts, cursor.ts, openclaw.ts  # IDE hosts
│   ├── hermes.ts, gbrain.ts  # Agent runtime hosts
│   └── index.ts     # Registry: exports all, derives Host type
├── scripts/         # Build + DX tooling
│   ├── gen-skill-docs.ts  # Template → SKILL.md generator (config-driven)
│   ├── host-config.ts     # HostConfig interface + validator
│   ├── host-config-export.ts  # Shell bridge for setup script
│   ├── host-adapters/     # Host-specific adapters (OpenClaw tool mapping)
│   ├── resolvers/   # Template resolver modules (preamble, design, review, gbrain, etc.)
│   ├── skill-check.ts     # Health dashboard
│   └── dev-skill.ts       # Watch mode
├── test/            # Skill validation + eval tests
│   ├── helpers/     # skill-parser.ts, session-runner.ts, llm-judge.ts, eval-store.ts
│   ├── fixtures/    # Ground truth JSON, planted-bug fixtures, eval baselines
│   ├── skill-validation.test.ts  # Tier 1: static validation (free, <1s)
│   ├── gen-skill-docs.test.ts    # Tier 1: generator quality (free, <1s)
│   ├── skill-llm-eval.test.ts   # Tier 3: LLM-as-judge (~$0.15/run)
│   └── skill-e2e-*.test.ts       # Tier 2: E2E via claude -p (~$3.85/run, split by category)
├── qa-only/         # /qa-only skill (report-only QA, no fixes)
├── plan-design-review/  # /plan-design-review skill (report-only design audit)
├── design-review/    # /design-review skill (design audit + fix loop)
├── ship/            # Ship workflow skill
├── review/          # PR review skill
├── plan-ceo-review/ # /plan-ceo-review skill
├── plan-eng-review/ # /plan-eng-review skill
├── autoplan/        # /autoplan skill (auto-review pipeline: CEO → design → eng)
├── benchmark/       # /benchmark skill (performance regression detection)
├── canary/          # /canary skill (post-deploy monitoring loop)
├── codex/           # /codex skill (multi-AI second opinion via OpenAI Codex CLI)
├── land-and-deploy/ # /land-and-deploy skill (merge → deploy → canary verify)
├── office-hours/    # /office-hours skill (YC Office Hours — startup diagnostic + builder brainstorm)
├── investigate/     # /investigate skill (systematic root-cause debugging)
├── retro/           # Retrospective skill (includes /retro global cross-project mode)
├── bin/             # CLI utilities (gstack-repo-mode, gstack-slug, gstack-config, etc.)
├── document-release/ # /document-release skill (post-ship doc updates)
├── cso/             # /cso skill (OWASP Top 10 + STRIDE security audit)
├── design-consultation/ # /design-consultation skill (design system from scratch)
├── design-shotgun/  # /design-shotgun skill (visual design exploration)
├── open-gstack-browser/  # /open-gstack-browser skill (launch GStack Browser)
├── connect-chrome/  # symlink → open-gstack-browser (backwards compat)
├── design/          # Design binary CLI (GPT Image API)
│   ├── src/         # CLI + commands (generate, variants, compare, serve, etc.)
│   ├── test/        # Integration tests
│   └── dist/        # Compiled binary
├── extension/       # Chrome extension (side panel + activity feed + CSS inspector)
├── lib/             # Shared libraries (worktree.ts)
├── docs/designs/    # Design documents
├── setup-deploy/    # /setup-deploy skill (one-time deploy config)
├── .github/         # CI workflows + Docker image
│   ├── workflows/   # evals.yml (E2E on Ubicloud), skill-docs.yml, actionlint.yml
│   └── docker/      # Dockerfile.ci (pre-baked toolchain + Playwright/Chromium)
├── contrib/         # Contributor-only tools (never installed for users)
│   └── add-host/    # /gstack-contrib-add-host skill
├── setup            # One-time setup: build binary + symlink skills
├── SKILL.md         # Generated from SKILL.md.tmpl (don't edit directly)
├── SKILL.md.tmpl    # Template: edit this, run gen:skill-docs
├── ETHOS.md         # Builder philosophy (Boil the Lake, Search Before Building)
└── package.json     # Build scripts for browse
```
````

<!-- source-snippets:end -->
</details>
## 主要子系统

| 子系统 | 关键路径 | 作用 |
|---|---|---|
| 技能包 | `*/SKILL.md`, `*/SKILL.md.tmpl` | 面向代理的行为说明、审查流程、发布流程和工具使用规则 |
| Browse | `browse/src/cli.ts`, `browse/src/server.ts`, `browse/src/commands.ts` | 低延迟浏览器访问、页面读取、交互、截图、CDP escape hatch |
| 设计工具 | `design/src/*`, `design-html/`, `design-shotgun/` | 生成 mockup、比较方案、从 mockup 生成实现提示 |
| PDF 工具 | `make-pdf/src/*`, `make-pdf/SKILL.md` | Markdown 到出版质量 PDF 的 CLI 和技能入口 |
| 多宿主生成 | `hosts/*.ts`, `scripts/gen-skill-docs.ts` | 将 Claude 技能模板转换成 Codex、Factory、OpenClaw 等宿主格式 |
| 记忆系统 | `setup-gbrain/`, `bin/gstack-brain-*`, `docs/gbrain-sync.md` | 接入 GBrain，并把 gstack 本地状态安全同步到私有 git repo |

## 阅读路线

1. 想知道用户怎样使用：先读 [技能工作流](skill-workflow.md)。
2. 想理解安装和多宿主：读 [安装与多宿主接入](setup-and-hosts.md)。
3. 想看技术核心：读 [Browse 运行时](browse-runtime.md) 和 [浏览器安全模型](browser-security.md)。
4. 想贡献或扩展：读 [技能生成系统](skill-generation.md) 与 [贡献、扩展与新增宿主](contributing-extension.md)。

## 相关页面

- [技能工作流](skill-workflow.md)
- [Browse 运行时](browse-runtime.md)
- [安装与多宿主接入](setup-and-hosts.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [docs/skills.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/docs/skills.md)
- [office-hours/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/office-hours/SKILL.md)
- [plan-eng-review/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/plan-eng-review/SKILL.md)
- [qa/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/qa/SKILL.md)
- [ship/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ship/SKILL.md)

</details>

# 技能工作流

技能层是 gstack 的主入口。README 把它包装成一个 sprint：从 `/office-hours` 发现真实问题，到 `/plan-*` 锁定方向，再到 `/review`、`/qa`、`/ship`、`/retro`。这不是普通命令列表，而是一套按阶段拆开的代理角色系统。Sources: [README.md:169-238](../../../project-repos/gstack/README.md#L169-L238), [docs/skills.md:5-42](../../../project-repos/gstack/docs/skills.md#L5-L42)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:169-238`

```markdown
You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Eight commands, end to end. That is not a copilot. That is a team.

## The sprint

gstack is a process, not a collection of tools. The skills run in the order a sprint runs:

**Think → Plan → Build → Review → Test → Ship → Reflect**

Each skill feeds into the next. `/office-hours` writes a design doc that `/plan-ceo-review` reads. `/plan-eng-review` writes a test plan that `/qa` picks up. `/review` catches bugs that `/ship` verifies are fixed. Nothing falls through the cracks because every step knows what came before it.

| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| `/office-hours` | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| `/plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| `/plan-eng-review` | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| `/plan-design-review` | **Senior Designer** | Rates each design dimension 0-10, explains what a 10 looks like, then edits the plan to get there. AI Slop detection. Interactive — one AskUserQuestion per design choice. |
| `/plan-devex-review` | **Developer Experience Lead** | Interactive DX review: explores developer personas, benchmarks against competitors' TTHW, designs your magical moment, traces friction points step by step. Three modes: DX EXPANSION, DX POLISH, DX TRIAGE. 20-45 forcing questions. |
| `/design-consultation` | **Design Partner** | Build a complete design system from scratch. Researches the landscape, proposes creative risks, generates realistic product mockups. |
| `/review` | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| `/investigate` | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| `/design-review` | **Designer Who Codes** | Same audit as /plan-design-review, then fixes what it finds. Atomic commits, before/after screenshots. |
| `/devex-review` | **DX Tester** | Live developer experience audit. Actually tests your onboarding: navigates docs, tries the getting started flow, times TTHW, screenshots errors. Compares against `/plan-devex-review` scores — the boomerang that shows if your plan matched reality. |
| `/design-shotgun` | **Design Explorer** | "Show me options." Generates 4-6 AI mockup variants, opens a comparison board in your browser, collects your feedback, and iterates. Taste memory learns what you like. Repeat until you love something, then hand it to `/design-html`. |
| `/design-html` | **Design Engineer** | Turn a mockup into production HTML that actually works. Pretext computed layout: text reflows, heights adjust, layouts are dynamic. 30KB, zero deps. Detects React/Svelte/Vue. Smart API routing per design type (landing page vs dashboard vs form). The output is shippable, not a demo. |
| `/qa` | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| `/qa-only` | **QA Reporter** | Same methodology as /qa but report only. Pure bug report without code changes. |
| `/pair-agent` | **Multi-Agent Coordinator** | Share your browser with any AI agent. One command, one paste, connected. Works with OpenClaw, Hermes, Codex, Cursor, or anything that can curl. Each agent gets its own tab. Auto-launches headed mode so you watch everything. Auto-starts ngrok tunnel for remote agents. Scoped tokens, tab isolation, rate limiting, activity attribution. |
| `/cso` | **Chief Security Officer** | OWASP Top 10 + STRIDE threat model. Zero-noise: 17 false positive exclusions, 8/10+ confidence gate, independent finding verification. Each finding includes a concrete exploit scenario. |
| `/ship` | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. |
| `/land-and-deploy` | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. One command from "approved" to "verified in production." |
| `/canary` | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures. |
| `/benchmark` | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. |
| `/document-release` | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| `/retro` | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. `/retro global` runs across all your projects and AI tools (Claude Code, Codex, Gemini). |
| `/browse` | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. `/open-gstack-browser` launches GStack Browser with sidebar, anti-bot stealth, and auto model routing. |
| `/setup-browser-cookies` | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| `/autoplan` | **Review Pipeline** | One command, fully reviewed plan. Runs CEO → design → eng review automatically with encoded decision principles. Surfaces only taste decisions for your approval. |
| `/learn` | **Memory** | Manage what gstack learned across sessions. Review, search, prune, and export project-specific patterns, pitfalls, and preferences. Learnings compound across sessions so gstack gets smarter on your codebase over time. |

### Which review should I use?

| Building for... | Plan stage (before code) | Live audit (after shipping) |
|-----------------|--------------------------|----------------------------|
| **End users** (UI, web app, mobile) | `/plan-design-review` | `/design-review` |
| **Developers** (API, CLI, SDK, docs) | `/plan-devex-review` | `/devex-review` |
| **Architecture** (data flow, perf, tests) | `/plan-eng-review` | `/review` |
| **All of the above** | `/autoplan` (runs CEO → design → eng → DX, auto-detects which apply) | — |

### Power tools

| Skill | What it does |
|-------|-------------|
| `/codex` | **Second Opinion** — independent code review from OpenAI Codex CLI. Three modes: review (pass/fail gate), adversarial challenge, and open consultation. Cross-model analysis when both `/review` and `/codex` have run. |
| `/careful` | **Safety Guardrails** — warns before destructive commands (rm -rf, DROP TABLE, force-push). Say "be careful" to activate. Override any warning. |
| `/freeze` | **Edit Lock** — restrict file edits to one directory. Prevents accidental changes outside scope while debugging. |
| `/guard` | **Full Safety** — `/careful` + `/freeze` in one command. Maximum safety for prod work. |
| `/unfreeze` | **Unlock** — remove the `/freeze` boundary. |
| `/open-gstack-browser` | **GStack Browser** — launch GStack Browser with sidebar, anti-bot stealth, auto model routing (Sonnet for actions, Opus for analysis), one-click cookie import, and Claude Code integration. Clean up pages, take smart screenshots, edit CSS, and pass info back to your terminal. |
| `/setup-deploy` | **Deploy Configurator** — one-time setup for `/land-and-deploy`. Detects your platform, production URL, and deploy commands. |
| `/setup-gbrain` | **GBrain Onboarding** — from zero to running gbrain in under 5 minutes. PGLite local, Supabase existing URL, or auto-provision a new Supabase project via Management API. MCP registration for Claude Code + per-repo trust triad (read-write/read-only/deny). [Full guide](USING_GBRAIN_WITH_GSTACK.md). |
| `/gstack-upgrade` | **Self-Updater** — upgrade gstack to latest. Detects global vs vendored install, syncs both, shows what changed. |

### New binaries (v0.19)

Beyond the slash-command skills, gstack ships standalone CLIs for workflows that don't belong inside a session:

| Command | What it does |
|---------|-------------|
| `gstack-model-benchmark` | **Cross-model benchmark** — run the same prompt through Claude, GPT (via Codex CLI), and Gemini; compare latency, tokens, cost, and (optionally) LLM-judge quality score. Auth detected per provider, unavailable providers skip cleanly. Output as table, JSON, or markdown. `--dry-run` validates flags + auth without spending API calls. |
| `gstack-taste-update` | **Design taste learning** — writes approvals and rejections from `/design-shotgun` into a persistent per-project taste profile. Decays 5%/week. Feeds back into future variant generation so the system learns what you actually pick. |
```

#### `docs/skills.md:5-42`

```markdown
| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| [`/office-hours`](#office-hours) | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| [`/plan-ceo-review`](#plan-ceo-review) | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| [`/plan-eng-review`](#plan-eng-review) | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| [`/plan-design-review`](#plan-design-review) | **Senior Designer** | Interactive plan-mode design review. Rates each dimension 0-10, explains what a 10 looks like, fixes the plan. Works in plan mode. |
| [`/design-consultation`](#design-consultation) | **Design Partner** | Build a complete design system from scratch. Knows the landscape, proposes creative risks, generates realistic product mockups. Design at the heart of all other phases. |
| [`/review`](#review) | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| [`/investigate`](#investigate) | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| [`/design-review`](#design-review) | **Designer Who Codes** | Live-site visual audit + fix loop. 80-item audit, then fixes what it finds. Atomic commits, before/after screenshots. |
| [`/design-shotgun`](#design-shotgun) | **Design Explorer** | Generate multiple AI design variants, open a comparison board in your browser, and iterate until you approve a direction. Taste memory biases toward your preferences. |
| [`/design-html`](#design-html) | **Design Engineer** | Generates production-quality Pretext-native HTML. Works with approved mockups, CEO plans, design reviews, or from scratch. Text reflows on resize, heights adjust to content. Smart API routing per design type. Framework detection for React/Svelte/Vue. |
| [`/qa`](#qa) | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| [`/qa-only`](#qa) | **QA Reporter** | Same methodology as /qa but report only. Use when you want a pure bug report without code changes. |
| [`/ship`](#ship) | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. One command. |
| [`/land-and-deploy`](#land-and-deploy) | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. One command from "approved" to "verified in production." |
| [`/canary`](#canary) | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures using the browse daemon. |
| [`/benchmark`](#benchmark) | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. Track trends over time. |
| [`/cso`](#cso) | **Chief Security Officer** | OWASP Top 10 + STRIDE threat modeling security audit. Scans for injection, auth, crypto, and access control issues. |
| [`/document-release`](#document-release) | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| [`/retro`](#retro) | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. |
| [`/browse`](#browse) | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. |
| [`/setup-browser-cookies`](#setup-browser-cookies) | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| [`/autoplan`](#autoplan) | **Review Pipeline** | One command, fully reviewed plan. Runs CEO → design → eng review automatically with encoded decision principles. Surfaces only taste decisions for your approval. |
| [`/learn`](#learn) | **Memory** | Manage what gstack learned across sessions. Review, search, prune, and export project-specific patterns and preferences. |
| | | |
| **Multi-AI** | | |
| [`/codex`](#codex) | **Second Opinion** | Independent review from OpenAI Codex CLI. Three modes: code review (pass/fail gate), adversarial challenge, and open consultation with session continuity. Cross-model analysis when both `/review` and `/codex` have run. |
| | | |
| **Safety & Utility** | | |
| [`/careful`](#safety--guardrails) | **Safety Guardrails** | Warns before destructive commands (rm -rf, DROP TABLE, force-push, git reset --hard). Override any warning. Common build cleanups whitelisted. |
| [`/freeze`](#safety--guardrails) | **Edit Lock** | Restrict all file edits to a single directory. Blocks Edit and Write outside the boundary. Accident prevention for debugging. |
| [`/guard`](#safety--guardrails) | **Full Safety** | Combines /careful + /freeze in one command. Maximum safety for prod work. |
| [`/unfreeze`](#safety--guardrails) | **Unlock** | Remove the /freeze boundary, allowing edits everywhere again. |
| [`/open-gstack-browser`](#open-gstack-browser) | **GStack Browser** | Launch GStack Browser with sidebar, anti-bot stealth, auto model routing, cookie import, and Claude Code integration. Watch every action live. |
| [`/setup-deploy`](#setup-deploy) | **Deploy Configurator** | One-time setup for `/land-and-deploy`. Detects your platform, production URL, and deploy commands. |
| [`/gstack-upgrade`](#gstack-upgrade) | **Self-Updater** | Upgrade gstack to the latest version. Detects global vs vendored install, syncs both, shows what changed. |

```

<!-- source-snippets:end -->
</details>
## Sprint 拓扑

```mermaid
flowchart TD
  A[/office-hours/] --> B[/plan-ceo-review/]
  B --> C[/plan-design-review/]
  B --> D[/plan-eng-review/]
  C --> E[/autoplan/]
  D --> E
  E --> F[实现]
  F --> G[/review/]
  G --> H[/qa 或 qa-only/]
  H --> I[/ship/]
  I --> J[/land-and-deploy/]
  J --> K[/canary/]
  K --> L[/retro/]
```

`/office-hours` 明确产出设计文档，后续 CEO/工程/QA 技能会读取该上下文；`docs/skills.md` 也把 office-hours 的结果描述为进入 plan、implementation、review、QA、ship、retro 的生命周期输入。Sources: [docs/skills.md:94-99](../../../project-repos/gstack/docs/skills.md#L94-L99), [README.md:169-177](../../../project-repos/gstack/README.md#L169-L177)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/skills.md:94-99`

```markdown
### The design doc

Both modes end with a design doc written to `~/.gstack/projects/` — and that doc feeds directly into `/plan-ceo-review` and `/plan-eng-review`. The full lifecycle is now: `office-hours → plan → implement → review → QA → ship → retro`.

After the design doc is approved, `/office-hours` reflects on what it noticed about how you think — not generic praise, but specific callbacks to things you said during the session. The observations appear in the design doc too, so you re-encounter them when you re-read later.

```

#### `README.md:169-177`

```markdown
You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Eight commands, end to end. That is not a copilot. That is a team.

## The sprint

gstack is a process, not a collection of tools. The skills run in the order a sprint runs:

**Think → Plan → Build → Review → Test → Ship → Reflect**

Each skill feeds into the next. `/office-hours` writes a design doc that `/plan-ceo-review` reads. `/plan-eng-review` writes a test plan that `/qa` picks up. `/review` catches bugs that `/ship` verifies are fixed. Nothing falls through the cracks because every step knows what came before it.
```

<!-- source-snippets:end -->
</details>
## 角色分层

| 阶段 | 代表技能 | 行为重点 |
|---|---|---|
| 产品发现 | `/office-hours`, `/plan-ceo-review` | 逼问需求证据、scope expansion/reduction、找 10-star product |
| 技术计划 | `/plan-eng-review`, `/autoplan` | 架构、状态、边界、测试矩阵和隐藏假设 |
| 设计计划与实现 | `/plan-design-review`, `/design-shotgun`, `/design-html`, `/design-review` | 视觉方案、mockup、生产 HTML、上线后设计 QA |
| 质量与安全 | `/review`, `/qa`, `/qa-only`, `/cso`, `/benchmark` | diff 审查、浏览器测试、漏洞审计、性能回归 |
| 发布运维 | `/ship`, `/land-and-deploy`, `/canary`, `/document-release` | PR、merge、部署验证、监控、文档同步 |
| 复盘记忆 | `/retro`, `/learn`, `/context-save`, `/context-restore` | 周复盘、跨会话 learnings、上下文恢复 |

Sources: [docs/skills.md:5-42](../../../project-repos/gstack/docs/skills.md#L5-L42), [README.md:179-237](../../../project-repos/gstack/README.md#L179-L237)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/skills.md:5-42`

```markdown
| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| [`/office-hours`](#office-hours) | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| [`/plan-ceo-review`](#plan-ceo-review) | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| [`/plan-eng-review`](#plan-eng-review) | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| [`/plan-design-review`](#plan-design-review) | **Senior Designer** | Interactive plan-mode design review. Rates each dimension 0-10, explains what a 10 looks like, fixes the plan. Works in plan mode. |
| [`/design-consultation`](#design-consultation) | **Design Partner** | Build a complete design system from scratch. Knows the landscape, proposes creative risks, generates realistic product mockups. Design at the heart of all other phases. |
| [`/review`](#review) | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| [`/investigate`](#investigate) | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| [`/design-review`](#design-review) | **Designer Who Codes** | Live-site visual audit + fix loop. 80-item audit, then fixes what it finds. Atomic commits, before/after screenshots. |
| [`/design-shotgun`](#design-shotgun) | **Design Explorer** | Generate multiple AI design variants, open a comparison board in your browser, and iterate until you approve a direction. Taste memory biases toward your preferences. |
| [`/design-html`](#design-html) | **Design Engineer** | Generates production-quality Pretext-native HTML. Works with approved mockups, CEO plans, design reviews, or from scratch. Text reflows on resize, heights adjust to content. Smart API routing per design type. Framework detection for React/Svelte/Vue. |
| [`/qa`](#qa) | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| [`/qa-only`](#qa) | **QA Reporter** | Same methodology as /qa but report only. Use when you want a pure bug report without code changes. |
| [`/ship`](#ship) | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. One command. |
| [`/land-and-deploy`](#land-and-deploy) | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. One command from "approved" to "verified in production." |
| [`/canary`](#canary) | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures using the browse daemon. |
| [`/benchmark`](#benchmark) | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. Track trends over time. |
| [`/cso`](#cso) | **Chief Security Officer** | OWASP Top 10 + STRIDE threat modeling security audit. Scans for injection, auth, crypto, and access control issues. |
| [`/document-release`](#document-release) | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| [`/retro`](#retro) | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. |
| [`/browse`](#browse) | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. |
| [`/setup-browser-cookies`](#setup-browser-cookies) | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| [`/autoplan`](#autoplan) | **Review Pipeline** | One command, fully reviewed plan. Runs CEO → design → eng review automatically with encoded decision principles. Surfaces only taste decisions for your approval. |
| [`/learn`](#learn) | **Memory** | Manage what gstack learned across sessions. Review, search, prune, and export project-specific patterns and preferences. |
| | | |
| **Multi-AI** | | |
| [`/codex`](#codex) | **Second Opinion** | Independent review from OpenAI Codex CLI. Three modes: code review (pass/fail gate), adversarial challenge, and open consultation with session continuity. Cross-model analysis when both `/review` and `/codex` have run. |
| | | |
| **Safety & Utility** | | |
| [`/careful`](#safety--guardrails) | **Safety Guardrails** | Warns before destructive commands (rm -rf, DROP TABLE, force-push, git reset --hard). Override any warning. Common build cleanups whitelisted. |
| [`/freeze`](#safety--guardrails) | **Edit Lock** | Restrict all file edits to a single directory. Blocks Edit and Write outside the boundary. Accident prevention for debugging. |
| [`/guard`](#safety--guardrails) | **Full Safety** | Combines /careful + /freeze in one command. Maximum safety for prod work. |
| [`/unfreeze`](#safety--guardrails) | **Unlock** | Remove the /freeze boundary, allowing edits everywhere again. |
| [`/open-gstack-browser`](#open-gstack-browser) | **GStack Browser** | Launch GStack Browser with sidebar, anti-bot stealth, auto model routing, cookie import, and Claude Code integration. Watch every action live. |
| [`/setup-deploy`](#setup-deploy) | **Deploy Configurator** | One-time setup for `/land-and-deploy`. Detects your platform, production URL, and deploy commands. |
| [`/gstack-upgrade`](#gstack-upgrade) | **Self-Updater** | Upgrade gstack to the latest version. Detects global vs vendored install, syncs both, shows what changed. |

```

#### `README.md:179-237`

```markdown
| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| `/office-hours` | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| `/plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| `/plan-eng-review` | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| `/plan-design-review` | **Senior Designer** | Rates each design dimension 0-10, explains what a 10 looks like, then edits the plan to get there. AI Slop detection. Interactive — one AskUserQuestion per design choice. |
| `/plan-devex-review` | **Developer Experience Lead** | Interactive DX review: explores developer personas, benchmarks against competitors' TTHW, designs your magical moment, traces friction points step by step. Three modes: DX EXPANSION, DX POLISH, DX TRIAGE. 20-45 forcing questions. |
| `/design-consultation` | **Design Partner** | Build a complete design system from scratch. Researches the landscape, proposes creative risks, generates realistic product mockups. |
| `/review` | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| `/investigate` | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| `/design-review` | **Designer Who Codes** | Same audit as /plan-design-review, then fixes what it finds. Atomic commits, before/after screenshots. |
| `/devex-review` | **DX Tester** | Live developer experience audit. Actually tests your onboarding: navigates docs, tries the getting started flow, times TTHW, screenshots errors. Compares against `/plan-devex-review` scores — the boomerang that shows if your plan matched reality. |
| `/design-shotgun` | **Design Explorer** | "Show me options." Generates 4-6 AI mockup variants, opens a comparison board in your browser, collects your feedback, and iterates. Taste memory learns what you like. Repeat until you love something, then hand it to `/design-html`. |
| `/design-html` | **Design Engineer** | Turn a mockup into production HTML that actually works. Pretext computed layout: text reflows, heights adjust, layouts are dynamic. 30KB, zero deps. Detects React/Svelte/Vue. Smart API routing per design type (landing page vs dashboard vs form). The output is shippable, not a demo. |
| `/qa` | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| `/qa-only` | **QA Reporter** | Same methodology as /qa but report only. Pure bug report without code changes. |
| `/pair-agent` | **Multi-Agent Coordinator** | Share your browser with any AI agent. One command, one paste, connected. Works with OpenClaw, Hermes, Codex, Cursor, or anything that can curl. Each agent gets its own tab. Auto-launches headed mode so you watch everything. Auto-starts ngrok tunnel for remote agents. Scoped tokens, tab isolation, rate limiting, activity attribution. |
| `/cso` | **Chief Security Officer** | OWASP Top 10 + STRIDE threat model. Zero-noise: 17 false positive exclusions, 8/10+ confidence gate, independent finding verification. Each finding includes a concrete exploit scenario. |
| `/ship` | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. |
| `/land-and-deploy` | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. One command from "approved" to "verified in production." |
| `/canary` | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures. |
| `/benchmark` | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. |
| `/document-release` | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| `/retro` | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. `/retro global` runs across all your projects and AI tools (Claude Code, Codex, Gemini). |
| `/browse` | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. `/open-gstack-browser` launches GStack Browser with sidebar, anti-bot stealth, and auto model routing. |
| `/setup-browser-cookies` | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| `/autoplan` | **Review Pipeline** | One command, fully reviewed plan. Runs CEO → design → eng review automatically with encoded decision principles. Surfaces only taste decisions for your approval. |
| `/learn` | **Memory** | Manage what gstack learned across sessions. Review, search, prune, and export project-specific patterns, pitfalls, and preferences. Learnings compound across sessions so gstack gets smarter on your codebase over time. |

### Which review should I use?

| Building for... | Plan stage (before code) | Live audit (after shipping) |
|-----------------|--------------------------|----------------------------|
| **End users** (UI, web app, mobile) | `/plan-design-review` | `/design-review` |
| **Developers** (API, CLI, SDK, docs) | `/plan-devex-review` | `/devex-review` |
| **Architecture** (data flow, perf, tests) | `/plan-eng-review` | `/review` |
| **All of the above** | `/autoplan` (runs CEO → design → eng → DX, auto-detects which apply) | — |

### Power tools

| Skill | What it does |
|-------|-------------|
| `/codex` | **Second Opinion** — independent code review from OpenAI Codex CLI. Three modes: review (pass/fail gate), adversarial challenge, and open consultation. Cross-model analysis when both `/review` and `/codex` have run. |
| `/careful` | **Safety Guardrails** — warns before destructive commands (rm -rf, DROP TABLE, force-push). Say "be careful" to activate. Override any warning. |
| `/freeze` | **Edit Lock** — restrict file edits to one directory. Prevents accidental changes outside scope while debugging. |
| `/guard` | **Full Safety** — `/careful` + `/freeze` in one command. Maximum safety for prod work. |
| `/unfreeze` | **Unlock** — remove the `/freeze` boundary. |
| `/open-gstack-browser` | **GStack Browser** — launch GStack Browser with sidebar, anti-bot stealth, auto model routing (Sonnet for actions, Opus for analysis), one-click cookie import, and Claude Code integration. Clean up pages, take smart screenshots, edit CSS, and pass info back to your terminal. |
| `/setup-deploy` | **Deploy Configurator** — one-time setup for `/land-and-deploy`. Detects your platform, production URL, and deploy commands. |
| `/setup-gbrain` | **GBrain Onboarding** — from zero to running gbrain in under 5 minutes. PGLite local, Supabase existing URL, or auto-provision a new Supabase project via Management API. MCP registration for Claude Code + per-repo trust triad (read-write/read-only/deny). [Full guide](USING_GBRAIN_WITH_GSTACK.md). |
| `/gstack-upgrade` | **Self-Updater** — upgrade gstack to latest. Detects global vs vendored install, syncs both, shows what changed. |

### New binaries (v0.19)

Beyond the slash-command skills, gstack ships standalone CLIs for workflows that don't belong inside a session:

| Command | What it does |
|---------|-------------|
| `gstack-model-benchmark` | **Cross-model benchmark** — run the same prompt through Claude, GPT (via Codex CLI), and Gemini; compare latency, tokens, cost, and (optionally) LLM-judge quality score. Auth detected per provider, unavailable providers skip cleanly. Output as table, JSON, or markdown. `--dry-run` validates flags + auth without spending API calls. |
```

<!-- source-snippets:end -->
</details>
## 决策传递

技能之间通过文件系统和约定传递上下文。例如 `/office-hours` 会把设计文档写到 `~/.gstack/projects/`，后续 `/plan-ceo-review` 和 `/plan-eng-review` 会消费；`/plan-eng-review` 写出的测试计划会被 `/qa` 自动捡起。Sources: [docs/skills.md:94-99](../../../project-repos/gstack/docs/skills.md#L94-L99), [docs/skills.md:229-231](../../../project-repos/gstack/docs/skills.md#L229-L231)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/skills.md:94-99`

```markdown
### The design doc

Both modes end with a design doc written to `~/.gstack/projects/` — and that doc feeds directly into `/plan-ceo-review` and `/plan-eng-review`. The full lifecycle is now: `office-hours → plan → implement → review → QA → ship → retro`.

After the design doc is approved, `/office-hours` reflects on what it noticed about how you think — not generic praise, but specific callbacks to things you said during the session. The observations appear in the design doc too, so you re-encounter them when you re-read later.

```

#### `docs/skills.md:229-231`

```markdown
### Plan-to-QA flow

When `/plan-eng-review` finishes the test review section, it writes a test plan artifact to `~/.gstack/projects/`. When you later run `/qa`, it picks up that test plan automatically — your engineering review feeds directly into QA testing with no manual copy-paste.
```

<!-- source-snippets:end -->
</details>
```mermaid
sequenceDiagram
  participant User as User
  participant OH as office-hours
  participant Plan as plan reviews
  participant QA as qa
  participant Ship as ship
  User->>OH: 描述想法或问题
  OH-->>Plan: 写入设计文档
  Plan-->>QA: 形成测试计划
  QA-->>Ship: 修复并验证问题
  Ship-->>User: PR + release evidence
```

## 技能包不是全部等价

仓库里既有大型工作流技能，也有安全/范围控制小技能。`/careful`、`/freeze`、`/guard`、`/unfreeze` 只负责安全边界；`/browse`、`/open-gstack-browser` 是工具入口；`/skillify` 和 `browser-skills/*` 则把成功的浏览器流程固化为可复用脚本。Sources: [README.md:244-251](../../../project-repos/gstack/README.md#L244-L251), [README.md:285-293](../../../project-repos/gstack/README.md#L285-L293), [browser-skills/hackernews-frontpage/SKILL.md:1-12](../../../project-repos/gstack/browser-skills/hackernews-frontpage/SKILL.md#L1-L12)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:244-251`

```markdown
### Domain skills + raw CDP escape hatch

Two new browser primitives compound the gstack agent over time:

- **`$B domain-skill save`** — agent saves a per-site note (e.g., "LinkedIn's Apply button lives in an iframe") that fires automatically next time it visits that hostname. Quarantined → active after 3 successful uses → optional cross-project promotion via `$B domain-skill promote-to-global`. Storage lives alongside `/learn`'s per-project learnings file. Full reference: **[docs/domain-skills.md](docs/domain-skills.md)**.
- **`$B cdp <Domain.method>`** — raw Chrome DevTools Protocol escape hatch for the rare case curated commands miss. Deny-default: methods must be explicitly added to `browse/src/cdp-allowlist.ts` with a one-line justification. Two-tier mutex serializes browser-scoped CDP calls against per-tab work. Output for data-exfil methods is wrapped in the UNTRUSTED envelope.

> Want raw CDP with no rails, no allowlist, no daemon — just thin transport from agent to Chrome? [browser-use/browser-harness-js](https://github.com/browser-use/browser-harness-js) is a different philosophy (agent-authored helpers vs gstack's curated commands) and a good fit if you don't want gstack's security stack. The two can coexist: gstack's `$B cdp` and harness can both attach to the same Chrome via Playwright's `newCDPSession`.
```

#### `README.md:285-293`

```markdown
**Browser handoff when the AI gets stuck.** Hit a CAPTCHA, auth wall, or MFA prompt? `$B handoff` opens a visible Chrome at the exact same page with all your cookies and tabs intact. Solve the problem, tell Claude you're done, `$B resume` picks up right where it left off. The agent even suggests it automatically after 3 consecutive failures.

**`/pair-agent` is cross-agent coordination.** You're in Claude Code. You also have OpenClaw running. Or Hermes. Or Codex. You want them both looking at the same website. Type `/pair-agent`, pick your agent, and a GStack Browser window opens so you can watch. The skill prints a block of instructions. Paste that block into the other agent's chat. It exchanges a one-time setup key for a session token, creates its own tab, and starts browsing. You see both agents working in the same browser, each in their own tab, neither able to interfere with the other. If ngrok is installed, the tunnel starts automatically so the other agent can be on a completely different machine. Same-machine agents get a zero-friction shortcut that writes credentials directly. This is the first time AI agents from different vendors can coordinate through a shared browser with real security: scoped tokens, tab isolation, rate limiting, domain restrictions, and activity attribution.

**Multi-AI second opinion.** `/codex` gets an independent review from OpenAI's Codex CLI — a completely different AI looking at the same diff. Three modes: code review with a pass/fail gate, adversarial challenge that actively tries to break your code, and open consultation with session continuity. When both `/review` (Claude) and `/codex` (OpenAI) have reviewed the same branch, you get a cross-model analysis showing which findings overlap and which are unique to each.

**Safety guardrails on demand.** Say "be careful" and `/careful` warns before any destructive command — rm -rf, DROP TABLE, force-push, git reset --hard. `/freeze` locks edits to one directory while debugging so Claude can't accidentally "fix" unrelated code. `/guard` activates both. `/investigate` auto-freezes to the module being investigated.

**Proactive skill suggestions.** gstack notices what stage you're in — brainstorming, reviewing, debugging, testing — and suggests the right skill. Don't like it? Say "stop suggesting" and it remembers across sessions.
```

#### `browser-skills/hackernews-frontpage/SKILL.md:1-12`

```markdown
---
name: hackernews-frontpage
description: Scrape the Hacker News front page (titles, points, comment counts).
host: news.ycombinator.com
trusted: true
source: human
version: 1.0.0
args: []
triggers:
  - scrape hacker news frontpage
  - scrape hn frontpage
  - get hn top stories
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [项目概览](overview.md)
- [技能生成系统](skill-generation.md)
- [测试、CI 与质量门](testing-ci-quality.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [setup](https://github.com/garrytan/gstack/tree/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/setup)
- [hosts/index.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/hosts/index.ts)
- [hosts/codex.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/hosts/codex.ts)
- [hosts/openclaw.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/hosts/openclaw.ts)
- [CONTRIBUTING.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CONTRIBUTING.md)

</details>

# 安装与多宿主接入

gstack 的安装不是简单复制文件。`setup` 会验证 Bun/Playwright、构建二进制、生成宿主格式的技能文档、创建每个技能的发现入口，并根据宿主差异链接 runtime assets。README 的 30 秒安装命令只是用户入口，真实行为在 `setup` 和 `hosts/*.ts` 中。Sources: [README.md:67-104](../../../project-repos/gstack/README.md#L67-L104), [setup:1-15](../../../project-repos/gstack/setup#L1-L15), [setup:223-362](../../../project-repos/gstack/setup#L223-L362)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:67-104`

````markdown
OpenClaw spawns Claude Code sessions via ACP, so every gstack skill just works
when Claude Code has gstack installed. Paste this to your OpenClaw agent:

> Install gstack: run `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` to install gstack for Claude Code. Then add a "Coding Tasks" section to AGENTS.md that says: when spawning Claude Code sessions for coding work, tell the session to use gstack skills. Include these examples — security audit: "Load gstack. Run /cso", code review: "Load gstack. Run /review", QA test a URL: "Load gstack. Run /qa https://...", build a feature end-to-end: "Load gstack. Run /autoplan, implement the plan, then run /ship", plan before building: "Load gstack. Run /office-hours then /autoplan. Save the plan, don't implement."

**After setup, just talk to your OpenClaw agent naturally:**

| You say | What happens |
|---------|-------------|
| "Fix the typo in README" | Simple — Claude Code session, no gstack needed |
| "Run a security audit on this repo" | Spawns Claude Code with `Run /cso` |
| "Build me a notifications feature" | Spawns Claude Code with /autoplan → implement → /ship |
| "Help me plan the v2 API redesign" | Spawns Claude Code with /office-hours → /autoplan, saves plan |

See [docs/OPENCLAW.md](docs/OPENCLAW.md) for advanced dispatch routing and
the gstack-lite/gstack-full prompt templates.

### Native OpenClaw Skills (via ClawHub)

Four methodology skills that work directly in your OpenClaw agent, no Claude Code
session needed. Install from ClawHub:

```
clawhub install gstack-openclaw-office-hours gstack-openclaw-ceo-review gstack-openclaw-investigate gstack-openclaw-retro
```

| Skill | What it does |
|-------|-------------|
| `gstack-openclaw-office-hours` | Product interrogation with 6 forcing questions |
| `gstack-openclaw-ceo-review` | Strategic challenge with 4 scope modes |
| `gstack-openclaw-investigate` | Root cause debugging methodology |
| `gstack-openclaw-retro` | Weekly engineering retrospective |

These are conversational skills. Your OpenClaw agent runs them directly via chat.

### Other AI Agents

gstack works on 10 AI coding agents, not just Claude. Setup auto-detects which
````

#### `setup:1-15`

```
#!/usr/bin/env bash
# gstack setup — build browser binary + register skills with Claude Code / Codex
set -e
umask 077  # Restrict new files to owner-only (0o600 files, 0o700 dirs)

if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is required but not installed." >&2
  echo "Install with checksum verification:" >&2
  echo '  BUN_VERSION="1.3.10"' >&2
  echo '  tmpfile=$(mktemp)' >&2
  echo '  curl -fsSL "https://bun.sh/install" -o "$tmpfile"' >&2
  echo '  echo "Verify checksum before running: shasum -a 256 $tmpfile"' >&2
  echo '  BUN_VERSION="$BUN_VERSION" bash "$tmpfile" && rm "$tmpfile"' >&2
  exit 1
fi
```

#### `setup:223-362`

```
# 1. Build browse binary if needed (smart rebuild: stale sources, package.json, lock)
NEEDS_BUILD=0
if [ ! -x "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
elif [ -n "$(find "$SOURCE_GSTACK_DIR/browse/src" -type f -newer "$BROWSE_BIN" -print -quit 2>/dev/null)" ]; then
  NEEDS_BUILD=1
elif [ "$SOURCE_GSTACK_DIR/package.json" -nt "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
elif [ -f "$SOURCE_GSTACK_DIR/bun.lock" ] && [ "$SOURCE_GSTACK_DIR/bun.lock" -nt "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
fi

if [ "$NEEDS_BUILD" -eq 1 ]; then
  log "Building browse binary..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bun install --frozen-lockfile 2>/dev/null || bun install
    bun run build
  )
  # Safety net: write .version if build script didn't (e.g., git not available during build)
  if [ ! -f "$SOURCE_GSTACK_DIR/browse/dist/.version" ]; then
    git -C "$SOURCE_GSTACK_DIR" rev-parse HEAD > "$SOURCE_GSTACK_DIR/browse/dist/.version" 2>/dev/null || true
  fi

  # macOS Apple Silicon: ad-hoc codesign compiled binaries.
  # Bun's --compile can produce a corrupt or linker-only code signature that
  # macOS kills with SIGKILL (exit 137). The two-step remove+re-sign is
  # required because a naive `codesign -s - -f` fails when the existing
  # signature block is corrupt. This is idempotent and costs <1s.
  # See: https://github.com/garrytan/gstack/issues/997
  if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
    for _bin in browse/dist/browse browse/dist/find-browse design/dist/design make-pdf/dist/pdf bin/gstack-global-discover; do
      _bin_path="$SOURCE_GSTACK_DIR/$_bin"
      [ -f "$_bin_path" ] && [ -x "$_bin_path" ] || continue
      codesign --remove-signature "$_bin_path" 2>/dev/null || true
      if ! codesign -s - -f "$_bin_path" 2>/dev/null; then
        log "warning: codesign failed for $_bin (binary may not run on Apple Silicon)"
      fi
    done
  fi

  # macOS: install coreutils for `gtimeout` (Codex hang protection in /codex + /autoplan).
  # macOS ships BSD `timeout`-less; Homebrew's coreutils installs GNU timeout as
  # `gtimeout` to avoid shadowing BSD utilities. The /codex and /autoplan skills
  # fall back to unwrapped codex invocations when neither is available — this
  # auto-install upgrades them to hang-protected where possible.
  # Skip entirely with GSTACK_SKIP_COREUTILS=1 (CI, managed machines, offline envs).
  if [ "$(uname -s)" = "Darwin" ] && [ "${GSTACK_SKIP_COREUTILS:-0}" != "1" ]; then
    if ! command -v gtimeout >/dev/null 2>&1 && ! command -v timeout >/dev/null 2>&1; then
      if command -v brew >/dev/null 2>&1; then
        log "Installing coreutils for Codex hang protection (set GSTACK_SKIP_COREUTILS=1 to skip)..."
        brew install coreutils >/dev/null 2>&1 || log "warning: brew install coreutils failed; /codex will run without hang protection"
      else
        log "warning: Homebrew not found. /codex will run without hang protection. Install coreutils manually or set GSTACK_SKIP_COREUTILS=1."
      fi
    fi
  fi
fi

if [ ! -x "$BROWSE_BIN" ]; then
  echo "gstack setup failed: browse binary missing at $BROWSE_BIN" >&2
  exit 1
fi

# 1b. Generate .agents/ Codex skill docs — always regenerate to prevent stale descriptions.
# .agents/ is no longer committed — generated at setup time from .tmpl templates.
# bun run build already does this, but we need it when NEEDS_BUILD=0 (binary is fresh).
# Always regenerate: generation is fast (<2s) and mtime-based staleness checks are fragile
# (miss stale files when timestamps match after clone/checkout/upgrade).
AGENTS_DIR="$SOURCE_GSTACK_DIR/.agents/skills"
NEEDS_AGENTS_GEN=1

if [ "$NEEDS_AGENTS_GEN" -eq 1 ] && [ "$NEEDS_BUILD" -eq 0 ]; then
  log "Generating .agents/ skill docs..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bun install --frozen-lockfile 2>/dev/null || bun install
    bun run gen:skill-docs --host codex
  )
fi

# 1c. Generate .factory/ Factory Droid skill docs
if [ "$INSTALL_FACTORY" -eq 1 ] && [ "$NEEDS_BUILD" -eq 0 ]; then
  log "Generating .factory/ skill docs..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bun install --frozen-lockfile 2>/dev/null || bun install
    bun run gen:skill-docs --host factory
  )
fi

# 1d. Generate .opencode/ OpenCode skill docs
if [ "$INSTALL_OPENCODE" -eq 1 ] && [ "$NEEDS_BUILD" -eq 0 ]; then
  log "Generating .opencode/ skill docs..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bun install --frozen-lockfile 2>/dev/null || bun install
    bun run gen:skill-docs --host opencode
  )
fi

# 2. Ensure Playwright's Chromium is available
if ! ensure_playwright_browser; then
  echo "Installing Playwright Chromium..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bunx playwright install chromium
  )

  if [ "$IS_WINDOWS" -eq 1 ]; then
    # On Windows, Node.js launches Chromium (not Bun — see oven-sh/bun#4253).
    # Ensure playwright is importable by Node from the gstack directory.
    if ! command -v node >/dev/null 2>&1; then
      echo "gstack setup failed: Node.js is required on Windows (Bun cannot launch Chromium due to a pipe bug)" >&2
      echo "  Install Node.js: https://nodejs.org/" >&2
      exit 1
    fi
    echo "Windows detected — verifying Node.js can load Playwright..."
    (
      cd "$SOURCE_GSTACK_DIR"
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>
## 安装主流程

```mermaid
flowchart TD
  A[./setup] --> B[解析 host/team/prefix]
  B --> C[构建 browse/design/make-pdf]
  C --> D[生成外部宿主技能]
  D --> E[确认 Playwright Chromium]
  E --> F[创建 ~/.gstack/projects]
  F --> G[链接 Claude 或 Codex 技能]
  G --> H[写入 runtime root/sidecar]
```

`setup` 默认 host 是 Claude，同时支持 `--host codex|kiro|factory|opencode|auto`；`openclaw`、`hermes`、`gbrain` 在脚本里被特殊处理，因为它们不是普通“把技能目录装进去”的模型。Sources: [setup:37-95](../../../project-repos/gstack/setup#L37-L95), [setup:152-178](../../../project-repos/gstack/setup#L152-L178)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `setup:37-95`

```
# ─── Parse flags ──────────────────────────────────────────────
HOST="claude"
LOCAL_INSTALL=0
SKILL_PREFIX=1
SKILL_PREFIX_FLAG=0
TEAM_MODE=0
NO_TEAM_MODE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --host) [ -z "$2" ] && echo "Missing value for --host (expected claude, codex, kiro, factory, opencode, openclaw, hermes, gbrain, or auto)" >&2 && exit 1; HOST="$2"; shift 2 ;;
    --host=*) HOST="${1#--host=}"; shift ;;
    --local) LOCAL_INSTALL=1; shift ;;
    --prefix)    SKILL_PREFIX=1; SKILL_PREFIX_FLAG=1; shift ;;
    --no-prefix) SKILL_PREFIX=0; SKILL_PREFIX_FLAG=1; shift ;;
    --team)    TEAM_MODE=1; shift ;;
    --no-team) NO_TEAM_MODE=1; shift ;;
    -q|--quiet) QUIET=1; shift ;;
    *) shift ;;
  esac
done

case "$HOST" in
  claude|codex|kiro|factory|opencode|auto) ;;
  openclaw)
    echo ""
    echo "OpenClaw integration uses a different model — OpenClaw spawns Claude Code"
    echo "sessions natively via ACP. gstack provides methodology artifacts, not a"
    echo "full skill installation."
    echo ""
    echo "To integrate gstack with OpenClaw:"
    echo "  1. Tell your OpenClaw agent: 'install gstack for openclaw'"
    echo "  2. Or generate artifacts: bun run gen:skill-docs --host openclaw"
    echo "  3. See docs/OPENCLAW.md for the full architecture"
    echo ""
    exit 0 ;;
  hermes)
    echo ""
    echo "Hermes integration uses the same model as OpenClaw — Hermes spawns"
    echo "Claude Code sessions, and gstack provides methodology artifacts."
    echo ""
    echo "To integrate gstack with Hermes:"
    echo "  1. Tell your Hermes agent: 'install gstack for hermes'"
    echo "  2. Or generate artifacts: bun run gen:skill-docs --host hermes"
    echo ""
    exit 0 ;;
  gbrain)
    echo ""
    echo "GBrain is a mod for gstack — it makes coding skills brain-aware."
    echo "GBrain generates brain-enhanced skill variants that search your brain"
    echo "for context before starting and save results after finishing."
    echo ""
    echo "To generate brain-aware skills:"
    echo "  bun run gen:skill-docs --host gbrain"
    echo ""
    echo "GBrain setup and brain skills ship from the GBrain repo."
    echo ""
    exit 0 ;;
  *) echo "Unknown --host value: $HOST (expected claude, codex, kiro, factory, opencode, openclaw, hermes, gbrain, or auto)" >&2; exit 1 ;;
esac
```

#### `setup:152-178`

```
# For auto: detect which agents are installed
INSTALL_CLAUDE=0
INSTALL_CODEX=0
INSTALL_KIRO=0
INSTALL_FACTORY=0
INSTALL_OPENCODE=0
if [ "$HOST" = "auto" ]; then
  command -v claude >/dev/null 2>&1 && INSTALL_CLAUDE=1
  command -v codex >/dev/null 2>&1 && INSTALL_CODEX=1
  command -v kiro-cli >/dev/null 2>&1 && INSTALL_KIRO=1
  command -v droid >/dev/null 2>&1 && INSTALL_FACTORY=1
  command -v opencode >/dev/null 2>&1 && INSTALL_OPENCODE=1
  # If none found, default to claude
  if [ "$INSTALL_CLAUDE" -eq 0 ] && [ "$INSTALL_CODEX" -eq 0 ] && [ "$INSTALL_KIRO" -eq 0 ] && [ "$INSTALL_FACTORY" -eq 0 ] && [ "$INSTALL_OPENCODE" -eq 0 ]; then
    INSTALL_CLAUDE=1
  fi
elif [ "$HOST" = "claude" ]; then
  INSTALL_CLAUDE=1
elif [ "$HOST" = "codex" ]; then
  INSTALL_CODEX=1
elif [ "$HOST" = "kiro" ]; then
  INSTALL_KIRO=1
elif [ "$HOST" = "factory" ]; then
  INSTALL_FACTORY=1
elif [ "$HOST" = "opencode" ]; then
  INSTALL_OPENCODE=1
fi
```

<!-- source-snippets:end -->
</details>
## 关键安装行为

| 行为 | 实现位置 | 说明 |
|---|---|---|
| Bun 前置检查 | `setup` | 缺失时直接退出并给 checksum-aware 安装提示 |
| smart rebuild | `setup` | 根据 browse 源码、`package.json`、`bun.lock` 判断是否需要重新构建 |
| Playwright 校验 | `setup` | Windows 下通过 Node.js fallback 验证 Chromium 启动 |
| Claude 技能链接 | `link_claude_skill_dirs` | 每个技能建真实目录，`SKILL.md` 指回 gstack 源目录 |
| Codex runtime root | `create_codex_runtime_root` | 只暴露 runtime assets，避免 Codex 递归扫描重复技能 |

Sources: [setup:223-285](../../../project-repos/gstack/setup#L223-L285), [setup:324-362](../../../project-repos/gstack/setup#L324-L362), [setup:367-410](../../../project-repos/gstack/setup#L367-L410), [setup:494-609](../../../project-repos/gstack/setup#L494-L609)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `setup:223-285`

```
# 1. Build browse binary if needed (smart rebuild: stale sources, package.json, lock)
NEEDS_BUILD=0
if [ ! -x "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
elif [ -n "$(find "$SOURCE_GSTACK_DIR/browse/src" -type f -newer "$BROWSE_BIN" -print -quit 2>/dev/null)" ]; then
  NEEDS_BUILD=1
elif [ "$SOURCE_GSTACK_DIR/package.json" -nt "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
elif [ -f "$SOURCE_GSTACK_DIR/bun.lock" ] && [ "$SOURCE_GSTACK_DIR/bun.lock" -nt "$BROWSE_BIN" ]; then
  NEEDS_BUILD=1
fi

if [ "$NEEDS_BUILD" -eq 1 ]; then
  log "Building browse binary..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bun install --frozen-lockfile 2>/dev/null || bun install
    bun run build
  )
  # Safety net: write .version if build script didn't (e.g., git not available during build)
  if [ ! -f "$SOURCE_GSTACK_DIR/browse/dist/.version" ]; then
    git -C "$SOURCE_GSTACK_DIR" rev-parse HEAD > "$SOURCE_GSTACK_DIR/browse/dist/.version" 2>/dev/null || true
  fi

  # macOS Apple Silicon: ad-hoc codesign compiled binaries.
  # Bun's --compile can produce a corrupt or linker-only code signature that
  # macOS kills with SIGKILL (exit 137). The two-step remove+re-sign is
  # required because a naive `codesign -s - -f` fails when the existing
  # signature block is corrupt. This is idempotent and costs <1s.
  # See: https://github.com/garrytan/gstack/issues/997
  if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
    for _bin in browse/dist/browse browse/dist/find-browse design/dist/design make-pdf/dist/pdf bin/gstack-global-discover; do
      _bin_path="$SOURCE_GSTACK_DIR/$_bin"
      [ -f "$_bin_path" ] && [ -x "$_bin_path" ] || continue
      codesign --remove-signature "$_bin_path" 2>/dev/null || true
      if ! codesign -s - -f "$_bin_path" 2>/dev/null; then
        log "warning: codesign failed for $_bin (binary may not run on Apple Silicon)"
      fi
    done
  fi

  # macOS: install coreutils for `gtimeout` (Codex hang protection in /codex + /autoplan).
  # macOS ships BSD `timeout`-less; Homebrew's coreutils installs GNU timeout as
  # `gtimeout` to avoid shadowing BSD utilities. The /codex and /autoplan skills
  # fall back to unwrapped codex invocations when neither is available — this
  # auto-install upgrades them to hang-protected where possible.
  # Skip entirely with GSTACK_SKIP_COREUTILS=1 (CI, managed machines, offline envs).
  if [ "$(uname -s)" = "Darwin" ] && [ "${GSTACK_SKIP_COREUTILS:-0}" != "1" ]; then
    if ! command -v gtimeout >/dev/null 2>&1 && ! command -v timeout >/dev/null 2>&1; then
      if command -v brew >/dev/null 2>&1; then
        log "Installing coreutils for Codex hang protection (set GSTACK_SKIP_COREUTILS=1 to skip)..."
        brew install coreutils >/dev/null 2>&1 || log "warning: brew install coreutils failed; /codex will run without hang protection"
      else
        log "warning: Homebrew not found. /codex will run without hang protection. Install coreutils manually or set GSTACK_SKIP_COREUTILS=1."
      fi
    fi
  fi
fi

if [ ! -x "$BROWSE_BIN" ]; then
  echo "gstack setup failed: browse binary missing at $BROWSE_BIN" >&2
  exit 1
fi
```

#### `setup:324-362`

```
# 2. Ensure Playwright's Chromium is available
if ! ensure_playwright_browser; then
  echo "Installing Playwright Chromium..."
  (
    cd "$SOURCE_GSTACK_DIR"
    bunx playwright install chromium
  )

  if [ "$IS_WINDOWS" -eq 1 ]; then
    # On Windows, Node.js launches Chromium (not Bun — see oven-sh/bun#4253).
    # Ensure playwright is importable by Node from the gstack directory.
    if ! command -v node >/dev/null 2>&1; then
      echo "gstack setup failed: Node.js is required on Windows (Bun cannot launch Chromium due to a pipe bug)" >&2
      echo "  Install Node.js: https://nodejs.org/" >&2
      exit 1
    fi
    echo "Windows detected — verifying Node.js can load Playwright..."
    (
      cd "$SOURCE_GSTACK_DIR"
      # Bun's node_modules already has playwright; verify Node can require it
      node -e "require('playwright')" 2>/dev/null || npm install --no-save playwright
      # @ngrok/ngrok is externalized in server-node.mjs and resolved at runtime.
      # Verify the platform-specific native binary is installed so /pair-agent
      # tunnels don't fail later with a cryptic module-not-found error.
      node -e "require('@ngrok/ngrok')" 2>/dev/null || npm install --no-save @ngrok/ngrok
    )
  fi
fi

if ! ensure_playwright_browser; then
  if [ "$IS_WINDOWS" -eq 1 ]; then
    echo "gstack setup failed: Playwright Chromium could not be launched via Node.js" >&2
    echo "  This is a known issue with Bun on Windows (oven-sh/bun#4253)." >&2
    echo "  Ensure Node.js is installed and 'node -e \"require('playwright')\"' works." >&2
  else
    echo "gstack setup failed: Playwright Chromium could not be launched" >&2
  fi
  exit 1
fi
```

#### `setup:367-410`

```
# ─── Helper: link Claude skill subdirectories into a skills parent directory ──
# Creates real directories (not symlinks) at the top level with a SKILL.md symlink
# inside. This ensures Claude discovers them as top-level skills, not nested under
# gstack/ (which would auto-prefix them as gstack-*).
# When SKILL_PREFIX=1, directories are prefixed with "gstack-".
# Use --no-prefix to restore flat names.
link_claude_skill_dirs() {
  local gstack_dir="$1"
  local skills_dir="$2"
  local linked=()
  for skill_dir in "$gstack_dir"/*/; do
    if [ -f "$skill_dir/SKILL.md" ]; then
      dir_name="$(basename "$skill_dir")"
      # Skip node_modules
      [ "$dir_name" = "node_modules" ] && continue
      # Use frontmatter name: if present (e.g., run-tests/ with name: test → symlink as "test")
      skill_name=$(grep -m1 '^name:' "$skill_dir/SKILL.md" 2>/dev/null | sed 's/^name:[[:space:]]*//' | tr -d '[:space:]')
      [ -z "$skill_name" ] && skill_name="$dir_name"
      # Apply gstack- prefix unless --no-prefix or already prefixed
      if [ "$SKILL_PREFIX" -eq 1 ]; then
        case "$skill_name" in
          gstack-*) link_name="$skill_name" ;;
          *)        link_name="gstack-$skill_name" ;;
        esac
      else
        link_name="$skill_name"
      fi
      target="$skills_dir/$link_name"
      # Upgrade old directory symlinks to real directories
      if [ -L "$target" ]; then
        rm -f "$target"
      fi
      # Create real directory with symlinked SKILL.md (absolute path)
      # Use mkdir -p unconditionally (idempotent) to avoid TOCTOU race
      mkdir -p "$target"
      # Validate target isn't a symlink before creating the link
      if [ -L "$target/SKILL.md" ]; then rm "$target/SKILL.md"; fi
      ln -snf "$gstack_dir/$dir_name/SKILL.md" "$target/SKILL.md"
      linked+=("$link_name")
    fi
  done
  if [ ${#linked[@]} -gt 0 ]; then
    echo "  linked skills: ${linked[*]}"
  fi
```

#### `setup:494-609`

```
# ─── Helper: link generated Codex skills into a skills parent directory ──
# Installs from .agents/skills/gstack-* (the generated Codex-format skills)
# instead of source dirs (which have Claude paths).
link_codex_skill_dirs() {
  local gstack_dir="$1"
  local skills_dir="$2"
  local agents_dir="$gstack_dir/.agents/skills"
  local linked=()

  if [ ! -d "$agents_dir" ]; then
    echo "  Generating .agents/ skill docs..."
    ( cd "$gstack_dir" && bun run gen:skill-docs --host codex )
  fi

  if [ ! -d "$agents_dir" ]; then
    echo "  warning: .agents/skills/ generation failed — run 'bun run gen:skill-docs --host codex' manually" >&2
    return 1
  fi

  for skill_dir in "$agents_dir"/gstack*/; do
    if [ -f "$skill_dir/SKILL.md" ]; then
      skill_name="$(basename "$skill_dir")"
      # Skip the sidecar directory — it contains runtime asset symlinks (bin/,
      # browse/), not a skill. Linking it would overwrite the root gstack
      # symlink that Step 5 already pointed at the repo root.
      [ "$skill_name" = "gstack" ] && continue
      target="$skills_dir/$skill_name"
      # Create or update symlink
      if [ -L "$target" ] || [ ! -e "$target" ]; then
        ln -snf "$skill_dir" "$target"
        linked+=("$skill_name")
      fi
    fi
  done
  if [ ${#linked[@]} -gt 0 ]; then
    echo "  linked skills: ${linked[*]}"
  fi
}

# ─── Helper: create .agents/skills/gstack/ sidecar symlinks ──────────
# Codex/Gemini/Cursor read skills from .agents/skills/. We link runtime
# assets (bin/, browse/dist/, review/, qa/, etc.) so skill templates can
# resolve paths like $SKILL_ROOT/review/design-checklist.md.
create_agents_sidecar() {
  local repo_root="$1"
  local agents_gstack="$repo_root/.agents/skills/gstack"
  mkdir -p "$agents_gstack"

  # Sidecar directories that skills reference at runtime
  for asset in bin browse review qa; do
    local src="$SOURCE_GSTACK_DIR/$asset"
    local dst="$agents_gstack/$asset"
    if [ -d "$src" ] || [ -f "$src" ]; then
      if [ -L "$dst" ] || [ ! -e "$dst" ]; then
        ln -snf "$src" "$dst"
      fi
    fi
  done

  # Sidecar files that skills reference at runtime
  for file in ETHOS.md; do
    local src="$SOURCE_GSTACK_DIR/$file"
    local dst="$agents_gstack/$file"
    if [ -f "$src" ]; then
      if [ -L "$dst" ] || [ ! -e "$dst" ]; then
        ln -snf "$src" "$dst"
      fi
    fi
  done
}

# ─── Helper: create a minimal ~/.codex/skills/gstack runtime root ───────────
# Codex scans ~/.codex/skills recursively. Exposing the whole repo here causes
# duplicate skills because source SKILL.md files and generated Codex skills are
# both discoverable. Keep this directory limited to runtime assets + root skill.
create_codex_runtime_root() {
  local gstack_dir="$1"
  local codex_gstack="$2"
  local agents_dir="$gstack_dir/.agents/skills"

  if [ -L "$codex_gstack" ]; then
    rm -f "$codex_gstack"
  elif [ -d "$codex_gstack" ] && [ "$codex_gstack" != "$gstack_dir" ]; then
    # Old direct installs left a real directory here with stale source skills.
    # Remove it so we start fresh with only the minimal runtime assets.
    rm -rf "$codex_gstack"
  fi

  mkdir -p "$codex_gstack" "$codex_gstack/browse" "$codex_gstack/gstack-upgrade" "$codex_gstack/review"

  if [ -f "$agents_dir/gstack/SKILL.md" ]; then
    ln -snf "$agents_dir/gstack/SKILL.md" "$codex_gstack/SKILL.md"
  fi
  if [ -d "$gstack_dir/bin" ]; then
    ln -snf "$gstack_dir/bin" "$codex_gstack/bin"
  fi
  if [ -d "$gstack_dir/browse/dist" ]; then
    ln -snf "$gstack_dir/browse/dist" "$codex_gstack/browse/dist"
  fi
  if [ -d "$gstack_dir/browse/bin" ]; then
    ln -snf "$gstack_dir/browse/bin" "$codex_gstack/browse/bin"
  fi
  if [ -f "$agents_dir/gstack-upgrade/SKILL.md" ]; then
    ln -snf "$agents_dir/gstack-upgrade/SKILL.md" "$codex_gstack/gstack-upgrade/SKILL.md"
  fi
  # Review runtime assets (individual files, NOT the whole review/ dir which has SKILL.md)
  for f in checklist.md design-checklist.md greptile-triage.md TODOS-format.md; do
    if [ -f "$gstack_dir/review/$f" ]; then
      ln -snf "$gstack_dir/review/$f" "$codex_gstack/review/$f"
    fi
  done
  # ETHOS.md — referenced by "Search Before Building" in all skill preambles
  if [ -f "$gstack_dir/ETHOS.md" ]; then
    ln -snf "$gstack_dir/ETHOS.md" "$codex_gstack/ETHOS.md"
  fi
}
```

<!-- source-snippets:end -->
</details>
## 多宿主配置模型

`hosts/index.ts` 注册了 Claude、Codex、Factory、Kiro、OpenCode、Slate、Cursor、OpenClaw、Hermes、GBrain 等配置；每个配置通过 `HostConfig` 声明路径、frontmatter 转换、生成策略、路径 rewrite、runtime assets 和安装策略。Sources: [hosts/index.ts:20-67](../../../project-repos/gstack/hosts/index.ts#L20-L67), [scripts/host-config.ts:17-112](../../../project-repos/gstack/scripts/host-config.ts#L17-L112)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `hosts/index.ts:20-67`

```typescript
/** All registered host configs. Add new hosts here. */
export const ALL_HOST_CONFIGS: HostConfig[] = [claude, codex, factory, kiro, opencode, slate, cursor, openclaw, hermes, gbrain];

/** Map from host name to config. */
export const HOST_CONFIG_MAP: Record<string, HostConfig> = Object.fromEntries(
  ALL_HOST_CONFIGS.map(c => [c.name, c])
);

/** Union type of all host names, derived from configs. */
export type Host = (typeof ALL_HOST_CONFIGS)[number]['name'];

/** All host names as a string array (for CLI arg validation, etc.). */
export const ALL_HOST_NAMES: string[] = ALL_HOST_CONFIGS.map(c => c.name);

/** Get a host config by name. Throws if not found. */
export function getHostConfig(name: string): HostConfig {
  const config = HOST_CONFIG_MAP[name];
  if (!config) {
    throw new Error(`Unknown host '${name}'. Valid hosts: ${ALL_HOST_NAMES.join(', ')}`);
  }
  return config;
}

/**
 * Resolve a host name from a CLI argument, handling aliases.
 * e.g., 'agents' → 'codex', 'droid' → 'factory'
 */
export function resolveHostArg(arg: string): string {
  // Direct name match
  if (HOST_CONFIG_MAP[arg]) return arg;

  // Alias match
  for (const config of ALL_HOST_CONFIGS) {
    if (config.cliAliases?.includes(arg)) return config.name;
  }

  throw new Error(`Unknown host '${arg}'. Valid hosts: ${ALL_HOST_NAMES.join(', ')}`);
}

/**
 * Get hosts that are NOT the primary host (Claude).
 * These are the hosts that need generated skill docs.
 */
export function getExternalHosts(): HostConfig[] {
  return ALL_HOST_CONFIGS.filter(c => c.name !== 'claude');
}

// Re-export individual configs for direct import
```

#### `scripts/host-config.ts:17-112`

```typescript
export interface HostConfig {
  /** Unique host identifier (e.g., 'opencode'). Must match filename in hosts/. */
  name: string;
  /** Human-readable name for UI/logs (e.g., 'OpenCode'). */
  displayName: string;
  /** Binary name for `command -v` detection (e.g., 'opencode'). */
  cliCommand: string;
  /** Alternative binary names (e.g., ['droid'] for factory). */
  cliAliases?: string[];

  // --- Path Configuration ---
  /** Global install path relative to $HOME (e.g., '.config/opencode/skills/gstack'). */
  globalRoot: string;
  /** Project-local skill path relative to repo root (e.g., '.opencode/skills/gstack'). */
  localSkillRoot: string;
  /** Gitignored directory under repo root for generated docs (e.g., '.opencode'). */
  hostSubdir: string;
  /** Whether preamble generates $GSTACK_ROOT env vars (true for non-Claude hosts). */
  usesEnvVars: boolean;

  // --- Frontmatter Transformation ---
  frontmatter: {
    /** 'allowlist': ONLY keepFields survive. 'denylist': strip listed fields. */
    mode: 'allowlist' | 'denylist';
    /** Fields to preserve (allowlist mode only). */
    keepFields?: string[];
    /** Fields to remove (denylist mode only). */
    stripFields?: string[];
    /** Max chars for description field. null = no limit. */
    descriptionLimit?: number | null;
    /** What to do when description exceeds limit. Default: 'error'. */
    descriptionLimitBehavior?: 'error' | 'truncate' | 'warn';
    /** Additional frontmatter fields to inject (host-wide). */
    extraFields?: Record<string, unknown>;
    /** Rename fields from template (e.g., { 'voice-triggers': 'triggers' }). */
    renameFields?: Record<string, string>;
    /** Conditionally add fields based on template frontmatter values. */
    conditionalFields?: Array<{ if: Record<string, unknown>; add: Record<string, unknown> }>;
  };

  // --- Generation ---
  generation: {
    /** Whether to create sidecar metadata file (e.g., openai.yaml for Codex). */
    generateMetadata: boolean;
    /** Metadata file format (e.g., 'openai.yaml'). */
    metadataFormat?: string | null;
    /** Skill directories to exclude from generation for this host. */
    skipSkills?: string[];
    /** Skill directories to include (allowlist). Union logic: include minus skip. */
    includeSkills?: string[];
  };

  // --- Content Rewrites ---
  /** Literal string replacements on generated SKILL.md content. Order matters, replaceAll. */
  pathRewrites: Array<{ from: string; to: string }>;
  /** Tool name string replacements on content. */
  toolRewrites?: Record<string, string>;
  /** Resolver functions that return empty string for this host. */
  suppressedResolvers?: string[];

  // --- Runtime Root ---
  runtimeRoot: {
    /** Explicit asset list for global install symlinks (no globs). */
    globalSymlinks: string[];
    /** Dir → explicit file list for selective file linking. */
    globalFiles?: Record<string, string[]>;
  };
  /** Optional repo-local sidecar config (e.g., Codex uses .agents/skills/gstack). */
  sidecar?: {
    /** Sidecar path relative to repo root (e.g., '.agents/skills/gstack'). */
    path: string;
    /** Assets to symlink into sidecar (different set than global). */
    symlinks: string[];
  };

  // --- Install Behavior ---
  install: {
    /** Whether gstack-config skill_prefix applies (Claude only). */
    prefixable: boolean;
    /** How skills are linked into the host dir. */
    linkingStrategy: 'real-dir-symlink' | 'symlink-generated';
  };

  // --- Host-Specific Behavioral Config ---
  /** Git co-author trailer string. */
  coAuthorTrailer?: string;
  /** Learnings implementation: 'full' = cross-project, 'basic' = simple. */
  learningsMode?: 'full' | 'basic';
  /** Anti-prompt-injection boundary instruction for cross-model invocations. */
  boundaryInstruction?: string;

  /** Static files to copy alongside generated skills (e.g., { 'SOUL.md': 'openclaw/SOUL.md' }). */
  staticFiles?: Record<string, string>;
  /** Optional path to host-adapter module for complex transformations. */
  adapter?: string;
}
```

<!-- source-snippets:end -->
</details>
```mermaid
classDiagram
  class HostConfig {
    name
    displayName
    globalRoot
    localSkillRoot
    frontmatter
    generation
    pathRewrites
    runtimeRoot
    install
  }
  HostConfig <|-- Codex
  HostConfig <|-- OpenClaw
  HostConfig <|-- Claude
  HostConfig <|-- Factory
```

Codex 配置展示了外部宿主的典型差异：输出根是 `.agents/skills/gstack`，frontmatter 只保留 `name` 和 `description`，会生成 `openai.yaml`，并跳过 Claude-only 的 `codex` 技能。Sources: [hosts/codex.ts:3-63](../../../project-repos/gstack/hosts/codex.ts#L3-L63)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `hosts/codex.ts:3-63`

```typescript
const codex: HostConfig = {
  name: 'codex',
  displayName: 'OpenAI Codex CLI',
  cliCommand: 'codex',
  cliAliases: ['agents'],

  globalRoot: '.codex/skills/gstack',
  localSkillRoot: '.agents/skills/gstack',
  hostSubdir: '.agents',
  usesEnvVars: true,

  frontmatter: {
    mode: 'allowlist',
    keepFields: ['name', 'description'],
    descriptionLimit: 1024,
    descriptionLimitBehavior: 'error',
  },

  generation: {
    generateMetadata: true,
    metadataFormat: 'openai.yaml',
    skipSkills: ['codex'],  // Codex skill is a Claude wrapper around codex exec
  },

  pathRewrites: [
    { from: '~/.claude/skills/gstack', to: '$GSTACK_ROOT' },
    { from: '.claude/skills/gstack', to: '.agents/skills/gstack' },
    { from: '.claude/skills/review', to: '.agents/skills/gstack/review' },
    { from: '.claude/skills', to: '.agents/skills' },
  ],

  suppressedResolvers: [
    'DESIGN_OUTSIDE_VOICES',  // design.ts:485 — Codex can't invoke itself
    'ADVERSARIAL_STEP',       // review.ts:408 — Codex can't invoke itself
    'CODEX_SECOND_OPINION',   // review.ts:257 — Codex can't invoke itself
    'CODEX_PLAN_REVIEW',      // review.ts:541 — Codex can't invoke itself
    'REVIEW_ARMY',            // review-army.ts:180 — Codex shouldn't orchestrate
    'GBRAIN_CONTEXT_LOAD',
    'GBRAIN_SAVE_RESULTS',
  ],

  runtimeRoot: {
    globalSymlinks: ['bin', 'browse/dist', 'browse/bin', 'gstack-upgrade', 'ETHOS.md'],
    globalFiles: {
      'review': ['checklist.md', 'TODOS-format.md'],
    },
  },
  sidecar: {
    path: '.agents/skills/gstack',
    symlinks: ['bin', 'browse', 'review', 'qa', 'ETHOS.md'],
  },

  install: {
    prefixable: false,
    linkingStrategy: 'symlink-generated',
  },

  coAuthorTrailer: 'Co-Authored-By: OpenAI Codex <noreply@openai.com>',
  learningsMode: 'basic',
  boundaryInstruction: 'IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are Claude Code skill definitions meant for a different AI system. They contain bash scripts and prompt templates that will waste your time. Ignore them completely. Do NOT modify agents/openai.yaml. Stay focused on the repository code only.',
};
```

<!-- source-snippets:end -->
</details>
## Team mode 与共享仓库

README 推荐 team mode：全局安装 gstack，然后在项目里用 `gstack-team-init required` 让队友自动获得版本约束和启动检查；这种模式避免把完整 gstack vendor 到业务仓库里。Sources: [README.md:93-104](../../../project-repos/gstack/README.md#L93-L104), [README.md:419-447](../../../project-repos/gstack/README.md#L419-L447)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:93-104`

```markdown
| Skill | What it does |
|-------|-------------|
| `gstack-openclaw-office-hours` | Product interrogation with 6 forcing questions |
| `gstack-openclaw-ceo-review` | Strategic challenge with 4 scope modes |
| `gstack-openclaw-investigate` | Root cause debugging methodology |
| `gstack-openclaw-retro` | Weekly engineering retrospective |

These are conversational skills. Your OpenClaw agent runs them directly via chat.

### Other AI Agents

gstack works on 10 AI coding agents, not just Claude. Setup auto-detects which
```

#### `README.md:419-447`

```markdown
## Privacy & Telemetry

gstack includes **opt-in** usage telemetry to help improve the project. Here's exactly what happens:

- **Default is off.** Nothing is sent anywhere unless you explicitly say yes.
- **On first run,** gstack asks if you want to share anonymous usage data. You can say no.
- **What's sent (if you opt in):** skill name, duration, success/fail, gstack version, OS. That's it.
- **What's never sent:** code, file paths, repo names, branch names, prompts, or any user-generated content.
- **Change anytime:** `gstack-config set telemetry off` disables everything instantly.

Data is stored in [Supabase](https://supabase.com) (open source Firebase alternative). The schema is in [`supabase/migrations/`](supabase/migrations/) — you can verify exactly what's collected. The Supabase publishable key in the repo is a public key (like a Firebase API key) — row-level security policies deny all direct access. Telemetry flows through validated edge functions that enforce schema checks, event type allowlists, and field length limits.

**Local analytics are always available.** Run `gstack-analytics` to see your personal usage dashboard from the local JSONL file — no remote data needed.

## Troubleshooting

**Skill not showing up?** `cd ~/.claude/skills/gstack && ./setup`

**`/browse` fails?** `cd ~/.claude/skills/gstack && bun install && bun run build`

**Stale install?** Run `/gstack-upgrade` — or set `auto_upgrade: true` in `~/.gstack/config.yaml`

**Want shorter commands?** `cd ~/.claude/skills/gstack && ./setup --no-prefix` — switches from `/gstack-qa` to `/qa`. Your choice is remembered for future upgrades.

**Want namespaced commands?** `cd ~/.claude/skills/gstack && ./setup --prefix` — switches from `/qa` to `/gstack-qa`. Useful if you run other skill packs alongside gstack.

**Codex says "Skipped loading skill(s) due to invalid SKILL.md"?** Your Codex skill descriptions are stale. Fix: `cd ~/.codex/skills/gstack && git pull && ./setup --host codex` — or for repo-local installs: `cd "$(readlink -f .agents/skills/gstack)" && git pull && ./setup --host codex`

**Windows users:** gstack works on Windows 11 via Git Bash or WSL. Node.js is required in addition to Bun — Bun has a known bug with Playwright's pipe transport on Windows ([bun#4253](https://github.com/oven-sh/bun/issues/4253)). The browse server automatically falls back to Node.js. Make sure both `bun` and `node` are on your PATH.
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [技能生成系统](skill-generation.md)
- [OpenClaw 集成](openclaw-integration.md)
- [贡献、扩展与新增宿主](contributing-extension.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [ARCHITECTURE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ARCHITECTURE.md)
- [scripts/gen-skill-docs.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/gen-skill-docs.ts)
- [scripts/discover-skills.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/discover-skills.ts)
- [scripts/resolvers/index.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/resolvers/index.ts)
- [scripts/host-config.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/host-config.ts)
- [package.json](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/package.json)
- [CONTRIBUTING.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CONTRIBUTING.md)

</details>

# 技能生成系统

gstack 把 `SKILL.md.tmpl` 视为人工维护的源，把 `SKILL.md` 视为提交到仓库的生成产物。这样技能在被 Claude 或其他宿主加载时已经完整，CI 又能用生成器检查文档是否陈旧。Sources: [ARCHITECTURE.md:234-289](../../../project-repos/gstack/ARCHITECTURE.md#L234-L289), [CONTRIBUTING.md:213-233](../../../project-repos/gstack/CONTRIBUTING.md#L213-L233)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:234-289`

````markdown
## SKILL.md template system

### The problem

SKILL.md files tell Claude how to use the browse commands. If the docs list a flag that doesn't exist, or miss a command that was added, the agent hits errors. Hand-maintained docs always drift from code.

### The solution

```
SKILL.md.tmpl          (human-written prose + placeholders)
       ↓
gen-skill-docs.ts      (reads source code metadata)
       ↓
SKILL.md               (committed, auto-generated sections)
```

Templates contain the workflows, tips, and examples that require human judgment. Placeholders are filled from source code at build time:

| Placeholder | Source | What it generates |
|-------------|--------|-------------------|
| `{{COMMAND_REFERENCE}}` | `commands.ts` | Categorized command table |
| `{{SNAPSHOT_FLAGS}}` | `snapshot.ts` | Flag reference with examples |
| `{{PREAMBLE}}` | `gen-skill-docs.ts` | Startup block: update check, session tracking, contributor mode, AskUserQuestion format |
| `{{BROWSE_SETUP}}` | `gen-skill-docs.ts` | Binary discovery + setup instructions |
| `{{BASE_BRANCH_DETECT}}` | `gen-skill-docs.ts` | Dynamic base branch detection for PR-targeting skills (ship, review, qa, plan-ceo-review) |
| `{{QA_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared QA methodology block for /qa and /qa-only |
| `{{DESIGN_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared design audit methodology for /plan-design-review and /design-review |
| `{{REVIEW_DASHBOARD}}` | `gen-skill-docs.ts` | Review Readiness Dashboard for /ship pre-flight |
| `{{TEST_BOOTSTRAP}}` | `gen-skill-docs.ts` | Test framework detection, bootstrap, CI/CD setup for /qa, /ship, /design-review |
| `{{CODEX_PLAN_REVIEW}}` | `gen-skill-docs.ts` | Optional cross-model plan review (Codex or Claude subagent fallback) for /plan-ceo-review and /plan-eng-review |
| `{{DESIGN_SETUP}}` | `resolvers/design.ts` | Discovery pattern for `$D` design binary, mirrors `{{BROWSE_SETUP}}` |
| `{{DESIGN_SHOTGUN_LOOP}}` | `resolvers/design.ts` | Shared comparison board feedback loop for /design-shotgun, /plan-design-review, /design-consultation |
| `{{UX_PRINCIPLES}}` | `resolvers/design.ts` | User behavioral foundations (scanning, satisficing, goodwill reservoir, trunk test) for /design-html, /design-shotgun, /design-review, /plan-design-review |
| `{{GBRAIN_CONTEXT_LOAD}}` | `resolvers/gbrain.ts` | Brain-first context search with keyword extraction, health awareness, and data-research routing. Injected into 10 brain-aware skills. Suppressed on non-brain hosts. |
| `{{GBRAIN_SAVE_RESULTS}}` | `resolvers/gbrain.ts` | Post-skill brain persistence with entity enrichment, throttle handling, and per-skill save instructions. 8 skill-specific save formats. |

This is structurally sound — if a command exists in code, it appears in docs. If it doesn't exist, it can't appear.

### The preamble

Every skill starts with a `{{PREAMBLE}}` block that runs before the skill's own logic. It handles five things in a single bash command:

1. **Update check** — calls `gstack-update-check`, reports if an upgrade is available.
2. **Session tracking** — touches `~/.gstack/sessions/$PPID` and counts active sessions (files modified in the last 2 hours). When 3+ sessions are running, all skills enter "ELI16 mode" — every question re-grounds the user on context because they're juggling windows.
3. **Operational self-improvement** — at the end of every skill session, the agent reflects on failures (CLI errors, wrong approaches, project quirks) and logs operational learnings to the project's JSONL file for future sessions.
4. **AskUserQuestion format** — universal format: context, question, `RECOMMENDATION: Choose X because ___`, lettered options. Consistent across all skills.
5. **Search Before Building** — before building infrastructure or unfamiliar patterns, search first. Three layers of knowledge: tried-and-true (Layer 1), new-and-popular (Layer 2), first-principles (Layer 3). When first-principles reasoning reveals conventional wisdom is wrong, the agent names the "eureka moment" and logs it. See `ETHOS.md` for the full builder philosophy.

### Why committed, not generated at runtime?

Three reasons:

1. **Claude reads SKILL.md at skill load time.** There's no build step when a user invokes `/browse`. The file must already exist and be correct.
2. **CI can validate freshness.** `gen:skill-docs --dry-run` + `git diff --exit-code` catches stale docs before merge.
3. **Git blame works.** You can see when a command was added and in which commit.

````

#### `CONTRIBUTING.md:213-233`

````markdown
## Editing SKILL.md files

SKILL.md files are **generated** from `.tmpl` templates. Don't edit the `.md` directly — your changes will be overwritten on the next build.

```bash
# 1. Edit the template
vim SKILL.md.tmpl              # or browse/SKILL.md.tmpl

# 2. Regenerate for all hosts
bun run gen:skill-docs --host all

# 3. Check health (reports all hosts)
bun run skill:check

# Or use watch mode — auto-regenerates on save
bun run dev:skill
```

For template authoring best practices (natural language over bash-isms, dynamic branch detection, `{{BASE_BRANCH_DETECT}}` usage), see CLAUDE.md's "Writing SKILL templates" section.

To add a browse command, add it to `browse/src/commands.ts`. To add a snapshot flag, add it to `SNAPSHOT_FLAGS` in `browse/src/snapshot.ts`. Then rebuild.
````

<!-- source-snippets:end -->
</details>
## 生成管线

```mermaid
flowchart TD
  A[discoverTemplates] --> B[读取 SKILL.md.tmpl]
  B --> C[解析 frontmatter]
  C --> D[替换 &#123;&#123;RESOLVERS&#125;&#125;]
  D --> E[voice trigger 处理]
  E --> F{host == claude?}
  F -->|yes| G[transformFrontmatter]
  F -->|no| H[processExternalHost]
  H --> I[path/tool rewrites]
  H --> J[metadata 如 openai.yaml]
  G --> K[写入 SKILL.md]
  I --> K
  J --> K
```

生成脚本的注释直接说明管线是 “read .tmpl → find placeholders → resolve from source → format → write .md”，并支持 `--dry-run` 作为 CI freshness gate。Sources: [scripts/gen-skill-docs.ts:1-24](../../../project-repos/gstack/scripts/gen-skill-docs.ts#L1-L24), [scripts/gen-skill-docs.ts:403-485](../../../project-repos/gstack/scripts/gen-skill-docs.ts#L403-L485)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/gen-skill-docs.ts:1-24`

```typescript
#!/usr/bin/env bun
/**
 * Generate SKILL.md files from .tmpl templates.
 *
 * Pipeline:
 *   read .tmpl → find {{PLACEHOLDERS}} → resolve from source → format → write .md
 *
 * Supports --dry-run: generate to memory, exit 1 if different from committed file.
 * Used by skill:check and CI freshness checks.
 */

import { COMMAND_DESCRIPTIONS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';
import { discoverTemplates } from './discover-skills';
import * as fs from 'fs';
import * as path from 'path';
import type { Host, TemplateContext } from './resolvers/types';
import { HOST_PATHS } from './resolvers/types';
import { RESOLVERS } from './resolvers/index';
import { externalSkillName, extractHookSafetyProse as _extractHookSafetyProse, extractNameAndDescription as _extractNameAndDescription, condenseOpenAIShortDescription as _condenseOpenAIShortDescription, generateOpenAIYaml as _generateOpenAIYaml } from './resolvers/codex-helpers';
import { generatePlanCompletionAuditShip, generatePlanCompletionAuditReview, generatePlanVerificationExec } from './resolvers/review';
import { ALL_HOST_CONFIGS, ALL_HOST_NAMES, resolveHostArg, getHostConfig } from '../hosts/index';
import type { HostConfig } from './host-config';

```

#### `scripts/gen-skill-docs.ts:403-485`

```typescript
function processTemplate(tmplPath: string, host: Host = 'claude'): { outputPath: string; content: string; symlinkLoop?: boolean } {
  const tmplContent = fs.readFileSync(tmplPath, 'utf-8');
  const relTmplPath = path.relative(ROOT, tmplPath);
  let outputPath = tmplPath.replace(/\.tmpl$/, '');

  // Determine skill directory relative to ROOT
  const skillDir = path.relative(ROOT, path.dirname(tmplPath));

  // Extract skill name from frontmatter early — needed for both TemplateContext and external host output paths.
  // When frontmatter name: differs from directory name (e.g., run-tests/ with name: test),
  // the frontmatter name is used for external skill naming and setup script symlinks.
  const { name: extractedName, description: extractedDescription } = extractNameAndDescription(tmplContent);
  const skillName = extractedName || path.basename(path.dirname(tmplPath));


  // Extract benefits-from list from frontmatter (inline YAML: benefits-from: [a, b])
  const benefitsMatch = tmplContent.match(/^benefits-from:\s*\[([^\]]*)\]/m);
  const benefitsFrom = benefitsMatch
    ? benefitsMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  // Extract preamble-tier from frontmatter (1-4, controls which preamble sections are included)
  const tierMatch = tmplContent.match(/^preamble-tier:\s*(\d+)$/m);
  const preambleTier = tierMatch ? parseInt(tierMatch[1], 10) : undefined;

  // Extract interactive flag from frontmatter (generator-only; controls plan-mode handshake inclusion)
  const interactiveMatch = tmplContent.match(/^interactive:\s*(true|false)\s*$/m);
  const interactive = interactiveMatch ? interactiveMatch[1] === 'true' : undefined;

  const ctx: TemplateContext = { skillName, tmplPath, benefitsFrom, host, paths: HOST_PATHS[host], preambleTier, model: MODEL_ARG_VAL, interactive };

  // Replace placeholders (supports parameterized: {{NAME:arg1:arg2}})
  // Config-driven: suppressedResolvers return empty string for this host
  const currentHostConfig = getHostConfig(host);
  const suppressed = new Set(currentHostConfig.suppressedResolvers || []);
  let content = tmplContent.replace(/\{\{(\w+(?::[^}]+)?)\}\}/g, (match, fullKey) => {
    const parts = fullKey.split(':');
    const resolverName = parts[0];
    const args = parts.slice(1);
    if (suppressed.has(resolverName)) return '';
    const resolver = RESOLVERS[resolverName];
    if (!resolver) throw new Error(`Unknown placeholder {{${resolverName}}} in ${relTmplPath}`);
    return args.length > 0 ? resolver(ctx, args) : resolver(ctx);
  });

  // Check for any remaining unresolved placeholders
  const remaining = content.match(/\{\{(\w+(?::[^}]+)?)\}\}/g);
  if (remaining) {
    throw new Error(`Unresolved placeholders in ${relTmplPath}: ${remaining.join(', ')}`);
  }

  // Preprocess voice triggers: fold into description, strip field from frontmatter.
  // Must run BEFORE transformFrontmatter so all hosts see the updated description,
  // and BEFORE extractedDescription is used by external host metadata.
  content = processVoiceTriggers(content);

  // Re-extract description AFTER voice trigger preprocessing so Codex openai.yaml
  // metadata gets the updated description with voice triggers included.
  const postProcessDescription = extractNameAndDescription(content).description;

  // For Claude: strip sensitive: field (only Factory uses it)
  // For external hosts: route output, transform frontmatter, rewrite paths
  let symlinkLoop = false;
  if (host === 'claude') {
    content = transformFrontmatter(content, host);
  } else {
    const result = processExternalHost(content, tmplContent, host, skillDir, postProcessDescription, ctx, extractedName || undefined);
    content = result.content;
    outputPath = result.outputPath;
    symlinkLoop = result.symlinkLoop;
  }

  // Prepend generated header (after frontmatter)
  const header = GENERATED_HEADER.replace('{{SOURCE}}', path.basename(tmplPath));
  const fmEnd = content.indexOf('---', content.indexOf('---') + 3);
  if (fmEnd !== -1) {
    const insertAt = content.indexOf('\n', fmEnd) + 1;
    content = content.slice(0, insertAt) + header + content.slice(insertAt);
  } else {
    content = header + content;
  }

  return { outputPath, content, symlinkLoop };
```

<!-- source-snippets:end -->
</details>
## Template 发现与 resolver

`discover-skills.ts` 只扫描仓库根和一级子目录，跳过 `node_modules`、`.git`、`dist`，寻找 `SKILL.md.tmpl` 与 `SKILL.md`。resolver registry 把 &lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>COMMAND_REFERENCE&#125;&#125;&lt;/code>、&lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>SNAPSHOT_FLAGS&#125;&#125;&lt;/code>、&lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>PREAMBLE&#125;&#125;&lt;/code>、&lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>BROWSE_SETUP&#125;&#125;&lt;/code>、&lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>GBRAIN_CONTEXT_LOAD&#125;&#125;&lt;/code> 等占位符映射到具体生成函数。Sources: [scripts/discover-skills.ts:1-38](../../../project-repos/gstack/scripts/discover-skills.ts#L1-L38), [scripts/resolvers/index.ts:26-79](../../../project-repos/gstack/scripts/resolvers/index.ts#L26-L79)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/discover-skills.ts:1-38`

```typescript
/**
 * Shared discovery for SKILL.md and .tmpl files.
 * Scans root + one level of subdirs, skipping node_modules/.git/dist.
 */

import * as fs from 'fs';
import * as path from 'path';

const SKIP = new Set(['node_modules', '.git', 'dist']);

function subdirs(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !SKIP.has(d.name))
    .map(d => d.name);
}

export function discoverTemplates(root: string): Array<{ tmpl: string; output: string }> {
  const dirs = ['', ...subdirs(root)];
  const results: Array<{ tmpl: string; output: string }> = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md.tmpl` : 'SKILL.md.tmpl';
    if (fs.existsSync(path.join(root, rel))) {
      results.push({ tmpl: rel, output: rel.replace(/\.tmpl$/, '') });
    }
  }
  return results;
}

export function discoverSkillFiles(root: string): string[] {
  const dirs = ['', ...subdirs(root)];
  const results: string[] = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md` : 'SKILL.md';
    if (fs.existsSync(path.join(root, rel))) {
      results.push(rel);
    }
  }
  return results;
```

#### `scripts/resolvers/index.ts:26-79`

```typescript
export const RESOLVERS: Record<string, ResolverFn> = {
  SLUG_EVAL: generateSlugEval,
  SLUG_SETUP: generateSlugSetup,
  COMMAND_REFERENCE: generateCommandReference,
  SNAPSHOT_FLAGS: generateSnapshotFlags,
  PREAMBLE: generatePreamble,
  BROWSE_SETUP: generateBrowseSetup,
  BASE_BRANCH_DETECT: generateBaseBranchDetect,
  QA_METHODOLOGY: generateQAMethodology,
  DESIGN_METHODOLOGY: generateDesignMethodology,
  DESIGN_HARD_RULES: generateDesignHardRules,
  UX_PRINCIPLES: generateUXPrinciples,
  DESIGN_OUTSIDE_VOICES: generateDesignOutsideVoices,
  DESIGN_REVIEW_LITE: generateDesignReviewLite,
  REVIEW_DASHBOARD: generateReviewDashboard,
  PLAN_FILE_REVIEW_REPORT: generatePlanFileReviewReport,
  TEST_BOOTSTRAP: generateTestBootstrap,
  TEST_COVERAGE_AUDIT_PLAN: generateTestCoverageAuditPlan,
  TEST_COVERAGE_AUDIT_SHIP: generateTestCoverageAuditShip,
  TEST_COVERAGE_AUDIT_REVIEW: generateTestCoverageAuditReview,
  TEST_FAILURE_TRIAGE: generateTestFailureTriage,
  SPEC_REVIEW_LOOP: generateSpecReviewLoop,
  DESIGN_SKETCH: generateDesignSketch,
  DESIGN_SETUP: generateDesignSetup,
  DESIGN_MOCKUP: generateDesignMockup,
  DESIGN_SHOTGUN_LOOP: generateDesignShotgunLoop,
  BENEFITS_FROM: generateBenefitsFrom,
  CODEX_SECOND_OPINION: generateCodexSecondOpinion,
  ADVERSARIAL_STEP: generateAdversarialStep,
  SCOPE_DRIFT: generateScopeDrift,
  DEPLOY_BOOTSTRAP: generateDeployBootstrap,
  CODEX_PLAN_REVIEW: generateCodexPlanReview,
  PLAN_COMPLETION_AUDIT_SHIP: generatePlanCompletionAuditShip,
  PLAN_COMPLETION_AUDIT_REVIEW: generatePlanCompletionAuditReview,
  PLAN_VERIFICATION_EXEC: generatePlanVerificationExec,
  CO_AUTHOR_TRAILER: generateCoAuthorTrailer,
  LEARNINGS_SEARCH: generateLearningsSearch,
  LEARNINGS_LOG: generateLearningsLog,
  CONFIDENCE_CALIBRATION: generateConfidenceCalibration,
  INVOKE_SKILL: generateInvokeSkill,
  CHANGELOG_WORKFLOW: generateChangelogWorkflow,
  REVIEW_ARMY: generateReviewArmy,
  CROSS_REVIEW_DEDUP: generateCrossReviewDedup,
  DX_FRAMEWORK: generateDxFramework,
  MODEL_OVERLAY: generateModelOverlay,
  TASTE_PROFILE: generateTasteProfile,
  BIN_DIR: (ctx) => ctx.paths.binDir,
  GBRAIN_CONTEXT_LOAD: generateGBrainContextLoad,
  GBRAIN_SAVE_RESULTS: generateGBrainSaveResults,
  QUESTION_PREFERENCE_CHECK: generateQuestionPreferenceCheck,
  QUESTION_LOG: generateQuestionLog,
  INLINE_TUNE_FEEDBACK: generateInlineTuneFeedback,
  MAKE_PDF_SETUP: generateMakePdfSetup,
};
```

<!-- source-snippets:end -->
</details>
## 为什么命令文档不手写

Browse 命令表和 snapshot flag 来自源码，生成器把这些信息注入技能。`ARCHITECTURE.md` 明确把 `commands.ts`、`snapshot.ts` 和 `gen-skill-docs.ts` 作为防止文档漂移的结构性方案。Sources: [ARCHITECTURE.md:242-270](../../../project-repos/gstack/ARCHITECTURE.md#L242-L270)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:242-270`

````markdown
```
SKILL.md.tmpl          (human-written prose + placeholders)
       ↓
gen-skill-docs.ts      (reads source code metadata)
       ↓
SKILL.md               (committed, auto-generated sections)
```

Templates contain the workflows, tips, and examples that require human judgment. Placeholders are filled from source code at build time:

| Placeholder | Source | What it generates |
|-------------|--------|-------------------|
| `{{COMMAND_REFERENCE}}` | `commands.ts` | Categorized command table |
| `{{SNAPSHOT_FLAGS}}` | `snapshot.ts` | Flag reference with examples |
| `{{PREAMBLE}}` | `gen-skill-docs.ts` | Startup block: update check, session tracking, contributor mode, AskUserQuestion format |
| `{{BROWSE_SETUP}}` | `gen-skill-docs.ts` | Binary discovery + setup instructions |
| `{{BASE_BRANCH_DETECT}}` | `gen-skill-docs.ts` | Dynamic base branch detection for PR-targeting skills (ship, review, qa, plan-ceo-review) |
| `{{QA_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared QA methodology block for /qa and /qa-only |
| `{{DESIGN_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared design audit methodology for /plan-design-review and /design-review |
| `{{REVIEW_DASHBOARD}}` | `gen-skill-docs.ts` | Review Readiness Dashboard for /ship pre-flight |
| `{{TEST_BOOTSTRAP}}` | `gen-skill-docs.ts` | Test framework detection, bootstrap, CI/CD setup for /qa, /ship, /design-review |
| `{{CODEX_PLAN_REVIEW}}` | `gen-skill-docs.ts` | Optional cross-model plan review (Codex or Claude subagent fallback) for /plan-ceo-review and /plan-eng-review |
| `{{DESIGN_SETUP}}` | `resolvers/design.ts` | Discovery pattern for `$D` design binary, mirrors `{{BROWSE_SETUP}}` |
| `{{DESIGN_SHOTGUN_LOOP}}` | `resolvers/design.ts` | Shared comparison board feedback loop for /design-shotgun, /plan-design-review, /design-consultation |
| `{{UX_PRINCIPLES}}` | `resolvers/design.ts` | User behavioral foundations (scanning, satisficing, goodwill reservoir, trunk test) for /design-html, /design-shotgun, /design-review, /plan-design-review |
| `{{GBRAIN_CONTEXT_LOAD}}` | `resolvers/gbrain.ts` | Brain-first context search with keyword extraction, health awareness, and data-research routing. Injected into 10 brain-aware skills. Suppressed on non-brain hosts. |
| `{{GBRAIN_SAVE_RESULTS}}` | `resolvers/gbrain.ts` | Post-skill brain persistence with entity enrichment, throttle handling, and per-skill save instructions. 8 skill-specific save formats. |

This is structurally sound — if a command exists in code, it appears in docs. If it doesn't exist, it can't appear.
````

<!-- source-snippets:end -->
</details>
| Placeholder | 来源 | 产物 |
|---|---|---|
| &lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>COMMAND_REFERENCE&#125;&#125;&lt;/code> | `browse/src/commands.ts` | 分类命令表 |
| &lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>SNAPSHOT_FLAGS&#125;&#125;&lt;/code> | `browse/src/snapshot.ts` | snapshot flag 文档 |
| &lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>PREAMBLE&#125;&#125;&lt;/code> | `scripts/resolvers/preamble.ts` | 更新检查、会话跟踪、telemetry、routing 等通用前置块 |
| &lt;code v-pre>&lt;span v-pre>&#123;&#123;&lt;/span>GBRAIN_CONTEXT_LOAD&#125;&#125;&lt;/code> | `scripts/resolvers/gbrain.ts` | brain-aware 技能上下文加载 |

Sources: [ARCHITECTURE.md:250-269](../../../project-repos/gstack/ARCHITECTURE.md#L250-L269)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:250-269`

```markdown
Templates contain the workflows, tips, and examples that require human judgment. Placeholders are filled from source code at build time:

| Placeholder | Source | What it generates |
|-------------|--------|-------------------|
| `{{COMMAND_REFERENCE}}` | `commands.ts` | Categorized command table |
| `{{SNAPSHOT_FLAGS}}` | `snapshot.ts` | Flag reference with examples |
| `{{PREAMBLE}}` | `gen-skill-docs.ts` | Startup block: update check, session tracking, contributor mode, AskUserQuestion format |
| `{{BROWSE_SETUP}}` | `gen-skill-docs.ts` | Binary discovery + setup instructions |
| `{{BASE_BRANCH_DETECT}}` | `gen-skill-docs.ts` | Dynamic base branch detection for PR-targeting skills (ship, review, qa, plan-ceo-review) |
| `{{QA_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared QA methodology block for /qa and /qa-only |
| `{{DESIGN_METHODOLOGY}}` | `gen-skill-docs.ts` | Shared design audit methodology for /plan-design-review and /design-review |
| `{{REVIEW_DASHBOARD}}` | `gen-skill-docs.ts` | Review Readiness Dashboard for /ship pre-flight |
| `{{TEST_BOOTSTRAP}}` | `gen-skill-docs.ts` | Test framework detection, bootstrap, CI/CD setup for /qa, /ship, /design-review |
| `{{CODEX_PLAN_REVIEW}}` | `gen-skill-docs.ts` | Optional cross-model plan review (Codex or Claude subagent fallback) for /plan-ceo-review and /plan-eng-review |
| `{{DESIGN_SETUP}}` | `resolvers/design.ts` | Discovery pattern for `$D` design binary, mirrors `{{BROWSE_SETUP}}` |
| `{{DESIGN_SHOTGUN_LOOP}}` | `resolvers/design.ts` | Shared comparison board feedback loop for /design-shotgun, /plan-design-review, /design-consultation |
| `{{UX_PRINCIPLES}}` | `resolvers/design.ts` | User behavioral foundations (scanning, satisficing, goodwill reservoir, trunk test) for /design-html, /design-shotgun, /design-review, /plan-design-review |
| `{{GBRAIN_CONTEXT_LOAD}}` | `resolvers/gbrain.ts` | Brain-first context search with keyword extraction, health awareness, and data-research routing. Injected into 10 brain-aware skills. Suppressed on non-brain hosts. |
| `{{GBRAIN_SAVE_RESULTS}}` | `resolvers/gbrain.ts` | Post-skill brain persistence with entity enrichment, throttle handling, and per-skill save instructions. 8 skill-specific save formats. |

```

<!-- source-snippets:end -->
</details>
## Host-aware 输出

外部宿主输出由 `processExternalHost` 处理：变换 frontmatter、插入安全 advisory、执行 `pathRewrites` 和 `toolRewrites`，并按配置生成 metadata。`HostConfig` 约束每个 host 的路径、安全、frontmatter 和 runtime root。Sources: [scripts/gen-skill-docs.ts:339-400](../../../project-repos/gstack/scripts/gen-skill-docs.ts#L339-L400), [scripts/host-config.ts:17-112](../../../project-repos/gstack/scripts/host-config.ts#L17-L112)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/gen-skill-docs.ts:339-400`

```typescript
function processExternalHost(
  content: string,
  tmplContent: string,
  host: Host,
  skillDir: string,
  extractedDescription: string,
  ctx: TemplateContext,
  frontmatterName?: string,
): { content: string; outputPath: string; outputDir: string; symlinkLoop: boolean } {
  const hostConfig = getHostConfig(host);

  const name = externalSkillName(skillDir === '.' ? '' : skillDir, frontmatterName);
  const outputDir = path.join(ROOT, hostConfig.hostSubdir, 'skills', name);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'SKILL.md');

  // Guard against symlink loops
  let symlinkLoop = false;
  const claudePath = ctx.tmplPath.replace(/\.tmpl$/, '');
  try {
    const resolvedClaude = fs.realpathSync(claudePath);
    const resolvedExternal = fs.realpathSync(path.dirname(outputPath)) + '/' + path.basename(outputPath);
    if (resolvedClaude === resolvedExternal) {
      symlinkLoop = true;
    }
  } catch {
    // realpathSync fails if file doesn't exist yet — no symlink loop
  }

  // Extract hook safety prose BEFORE transforming frontmatter (which strips hooks)
  const safetyProse = extractHookSafetyProse(tmplContent);

  // Transform frontmatter (host-aware)
  let result = transformFrontmatter(content, host);

  // Insert safety advisory at the top of the body (after frontmatter)
  if (safetyProse) {
    const bodyStart = result.indexOf('\n---') + 4;
    result = result.slice(0, bodyStart) + '\n' + safetyProse + '\n' + result.slice(bodyStart);
  }

  // Config-driven path rewrites (order matters, replaceAll)
  for (const rewrite of hostConfig.pathRewrites) {
    result = result.replaceAll(rewrite.from, rewrite.to);
  }

  // Config-driven tool rewrites
  if (hostConfig.toolRewrites) {
    for (const [from, to] of Object.entries(hostConfig.toolRewrites)) {
      result = result.replaceAll(from, to);
    }
  }

  // Config-driven: generate metadata (e.g., openai.yaml for Codex)
  if (hostConfig.generation.generateMetadata && !symlinkLoop) {
    const agentsDir = path.join(outputDir, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    const shortDescription = condenseOpenAIShortDescription(extractedDescription);
    fs.writeFileSync(path.join(agentsDir, 'openai.yaml'), generateOpenAIYaml(name, shortDescription));
  }

  return { content: result, outputPath, outputDir, symlinkLoop };
```

#### `scripts/host-config.ts:17-112`

```typescript
export interface HostConfig {
  /** Unique host identifier (e.g., 'opencode'). Must match filename in hosts/. */
  name: string;
  /** Human-readable name for UI/logs (e.g., 'OpenCode'). */
  displayName: string;
  /** Binary name for `command -v` detection (e.g., 'opencode'). */
  cliCommand: string;
  /** Alternative binary names (e.g., ['droid'] for factory). */
  cliAliases?: string[];

  // --- Path Configuration ---
  /** Global install path relative to $HOME (e.g., '.config/opencode/skills/gstack'). */
  globalRoot: string;
  /** Project-local skill path relative to repo root (e.g., '.opencode/skills/gstack'). */
  localSkillRoot: string;
  /** Gitignored directory under repo root for generated docs (e.g., '.opencode'). */
  hostSubdir: string;
  /** Whether preamble generates $GSTACK_ROOT env vars (true for non-Claude hosts). */
  usesEnvVars: boolean;

  // --- Frontmatter Transformation ---
  frontmatter: {
    /** 'allowlist': ONLY keepFields survive. 'denylist': strip listed fields. */
    mode: 'allowlist' | 'denylist';
    /** Fields to preserve (allowlist mode only). */
    keepFields?: string[];
    /** Fields to remove (denylist mode only). */
    stripFields?: string[];
    /** Max chars for description field. null = no limit. */
    descriptionLimit?: number | null;
    /** What to do when description exceeds limit. Default: 'error'. */
    descriptionLimitBehavior?: 'error' | 'truncate' | 'warn';
    /** Additional frontmatter fields to inject (host-wide). */
    extraFields?: Record<string, unknown>;
    /** Rename fields from template (e.g., { 'voice-triggers': 'triggers' }). */
    renameFields?: Record<string, string>;
    /** Conditionally add fields based on template frontmatter values. */
    conditionalFields?: Array<{ if: Record<string, unknown>; add: Record<string, unknown> }>;
  };

  // --- Generation ---
  generation: {
    /** Whether to create sidecar metadata file (e.g., openai.yaml for Codex). */
    generateMetadata: boolean;
    /** Metadata file format (e.g., 'openai.yaml'). */
    metadataFormat?: string | null;
    /** Skill directories to exclude from generation for this host. */
    skipSkills?: string[];
    /** Skill directories to include (allowlist). Union logic: include minus skip. */
    includeSkills?: string[];
  };

  // --- Content Rewrites ---
  /** Literal string replacements on generated SKILL.md content. Order matters, replaceAll. */
  pathRewrites: Array<{ from: string; to: string }>;
  /** Tool name string replacements on content. */
  toolRewrites?: Record<string, string>;
  /** Resolver functions that return empty string for this host. */
  suppressedResolvers?: string[];

  // --- Runtime Root ---
  runtimeRoot: {
    /** Explicit asset list for global install symlinks (no globs). */
    globalSymlinks: string[];
    /** Dir → explicit file list for selective file linking. */
    globalFiles?: Record<string, string[]>;
  };
  /** Optional repo-local sidecar config (e.g., Codex uses .agents/skills/gstack). */
  sidecar?: {
    /** Sidecar path relative to repo root (e.g., '.agents/skills/gstack'). */
    path: string;
    /** Assets to symlink into sidecar (different set than global). */
    symlinks: string[];
  };

  // --- Install Behavior ---
  install: {
    /** Whether gstack-config skill_prefix applies (Claude only). */
    prefixable: boolean;
    /** How skills are linked into the host dir. */
    linkingStrategy: 'real-dir-symlink' | 'symlink-generated';
  };

  // --- Host-Specific Behavioral Config ---
  /** Git co-author trailer string. */
  coAuthorTrailer?: string;
  /** Learnings implementation: 'full' = cross-project, 'basic' = simple. */
  learningsMode?: 'full' | 'basic';
  /** Anti-prompt-injection boundary instruction for cross-model invocations. */
  boundaryInstruction?: string;

  /** Static files to copy alongside generated skills (e.g., { 'SOUL.md': 'openclaw/SOUL.md' }). */
  staticFiles?: Record<string, string>;
  /** Optional path to host-adapter module for complex transformations. */
  adapter?: string;
}
```

<!-- source-snippets:end -->
</details>
## 风险点

- 生成脚本目前既处理模板，也直接写外部宿主目录和 OpenClaw artifacts；这让 `gen-skill-docs` 同时承担文档生成和部分安装产物生成。Sources: [scripts/gen-skill-docs.ts:498-614](../../../project-repos/gstack/scripts/gen-skill-docs.ts#L498-L614)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/gen-skill-docs.ts:498-614`

```typescript
for (const currentHost of hostsToRun) {
  HOST = currentHost;

  try {
    let hasChanges = false;
    const tokenBudget: Array<{ skill: string; lines: number; tokens: number }> = [];

    const currentHostConfig = getHostConfig(currentHost);
    for (const tmplPath of findTemplates()) {
      const dir = path.basename(path.dirname(tmplPath));

      // includeSkills allowlist (union logic: include minus skip)
      if (currentHostConfig.generation.includeSkills?.length) {
        if (!currentHostConfig.generation.includeSkills.includes(dir)) continue;
      }
      // skipSkills denylist (subtracts from includeSkills or full set)
      if (currentHostConfig.generation.skipSkills?.length) {
        if (currentHostConfig.generation.skipSkills.includes(dir)) continue;
      }

      const { outputPath, content, symlinkLoop } = processTemplate(tmplPath, currentHost);
      const relOutput = path.relative(ROOT, outputPath);

      if (symlinkLoop) {
        console.log(`SKIPPED (symlink loop): ${relOutput}`);
      } else if (DRY_RUN) {
        const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
        if (existing !== content) {
          console.log(`STALE: ${relOutput}`);
          hasChanges = true;
        } else {
          console.log(`FRESH: ${relOutput}`);
        }
      } else {
        fs.writeFileSync(outputPath, content);
        console.log(`GENERATED: ${relOutput}`);
      }

      // Track token budget
      const lines = content.split('\n').length;
      const tokens = Math.round(content.length / 4); // ~4 chars per token
      tokenBudget.push({ skill: relOutput, lines, tokens });

      // Token ceiling check: warn if any generated SKILL.md exceeds ~40K tokens (160KB).
      // The ceiling is a "watch for feature bloat" guardrail, not a hard gate. Modern
      // flagship models have 200K-1M context windows, so 40K (4-20% of window) is fine.
      // Prompt caching further reduces the marginal cost of larger skills. This ceiling
      // exists to catch a runaway preamble or resolver that's grown by 10K+ tokens in
      // a release, not to force compression on carefully-tuned big skills (ship,
      // plan-ceo-review, office-hours all legitimately pack 25-35K tokens of behavior).
      const TOKEN_CEILING_BYTES = 160_000;
      if (content.length > TOKEN_CEILING_BYTES) {
        console.warn(`⚠️  TOKEN CEILING: ${relOutput} is ${content.length} bytes (~${tokens} tokens), exceeds ${TOKEN_CEILING_BYTES} byte ceiling (~40K tokens)`);
      }
    }

    // Generate gstack-lite and gstack-full for OpenClaw host
    if (currentHost === 'openclaw' && !DRY_RUN) {
      const openclawDir = path.join(ROOT, 'openclaw');
      if (!fs.existsSync(openclawDir)) fs.mkdirSync(openclawDir, { recursive: true });

      const gstackLite = `# gstack-lite Planning Discipline

Injected by the orchestrator into spawned Claude Code sessions. Append to existing CLAUDE.md.

## Planning Discipline
1. Read every file you will modify. Understand existing patterns first.
2. Before writing code, state your plan: what, why, which files, test case, risk.
3. When ambiguous, prefer: completeness over shortcuts, existing patterns over new ones,
   reversible choices over irreversible ones, safe defaults over clever ones.
4. Self-review your changes before reporting done. Check for: missed files, broken
   imports, untested paths, style inconsistencies.
5. Report when done: what shipped, what decisions you made, anything uncertain.
`;
      fs.writeFileSync(path.join(openclawDir, 'gstack-lite-CLAUDE.md'), gstackLite);
      console.log('GENERATED: openclaw/gstack-lite-CLAUDE.md');

      const gstackFull = `# gstack-full Pipeline

Injected by the orchestrator for complete feature builds. Append to existing CLAUDE.md.

## Full Pipeline
1. Read CLAUDE.md and understand the project context.
2. Run /autoplan to review your approach (CEO + eng + design review pipeline).
3. Implement the approved plan. Follow the planning discipline above.
4. Run /ship to create a PR with tests, changelog, and version bump.
5. Report back: PR URL, what shipped, decisions made, anything uncertain.

Do not ask for human input until the PR is ready for review.
`;
      fs.writeFileSync(path.join(openclawDir, 'gstack-full-CLAUDE.md'), gstackFull);
      console.log('GENERATED: openclaw/gstack-full-CLAUDE.md');

      const gstackPlan = `# gstack-plan: Full Review Gauntlet

Injected by the orchestrator when the user wants to plan a Claude Code project.
Append to existing CLAUDE.md.

## Planning Pipeline
1. Read CLAUDE.md and understand the project context.
2. Run /office-hours to produce a design doc (problem statement, premises, alternatives).
3. Run /autoplan to review the design (CEO + eng + design + DX reviews + codex adversarial).
4. Save the final reviewed plan to a file the orchestrator can reference later.
   Write it to: plans/<project-slug>-plan-<date>.md in the current repo.
   Include the design doc, all review decisions, and the implementation sequence.
5. Report back to the orchestrator:
   - Plan file path
   - One-paragraph summary of what was designed and the key decisions
   - List of accepted scope expansions (if any)
   - Recommended next step (usually: spawn a new session with gstack-full to implement)

Do not implement anything. This is planning only.
The orchestrator will persist the plan link to its own memory/knowledge store.
`;
      fs.writeFileSync(path.join(openclawDir, 'gstack-plan-CLAUDE.md'), gstackPlan);
      console.log('GENERATED: openclaw/gstack-plan-CLAUDE.md');
    }
```

<!-- source-snippets:end -->
</details>
- `discoverTemplates` 只扫一级子目录，因此深层技能（如 `openclaw/skills/*`）不是普通 `.tmpl` 生成路径，属于手写/特殊产物。Sources: [scripts/discover-skills.ts:17-38](../../../project-repos/gstack/scripts/discover-skills.ts#L17-L38), [docs/OPENCLAW.md:104-113](../../../project-repos/gstack/docs/OPENCLAW.md#L104-L113)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/discover-skills.ts:17-38`

```typescript
export function discoverTemplates(root: string): Array<{ tmpl: string; output: string }> {
  const dirs = ['', ...subdirs(root)];
  const results: Array<{ tmpl: string; output: string }> = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md.tmpl` : 'SKILL.md.tmpl';
    if (fs.existsSync(path.join(root, rel))) {
      results.push({ tmpl: rel, output: rel.replace(/\.tmpl$/, '') });
    }
  }
  return results;
}

export function discoverSkillFiles(root: string): string[] {
  const dirs = ['', ...subdirs(root)];
  const results: string[] = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md` : 'SKILL.md';
    if (fs.existsSync(path.join(root, rel))) {
      results.push(rel);
    }
  }
  return results;
```

#### `docs/OPENCLAW.md:104-113`

```markdown
### Native methodology skills
Published to ClawHub. Install with `clawhub install`:
- `gstack-openclaw-office-hours` — Product interrogation (6 forcing questions)
- `gstack-openclaw-ceo-review` — Strategic challenge (10-section review, 4 modes)
- `gstack-openclaw-investigate` — Operational debugging (4-phase methodology)
- `gstack-openclaw-retro` — Operational retrospective (weekly review)

Source lives in `openclaw/skills/` in the gstack repo. These are hand-crafted
adaptations of the gstack methodology for OpenClaw's conversational context.
No gstack infrastructure (no browse, no telemetry, no preamble).
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [安装与多宿主接入](setup-and-hosts.md)
- [测试、CI 与质量门](testing-ci-quality.md)
- [贡献、扩展与新增宿主](contributing-extension.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [ARCHITECTURE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ARCHITECTURE.md)
- [browse/src/cli.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/cli.ts)
- [browse/src/server.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/server.ts)
- [browse/src/commands.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/commands.ts)
- [browse/src/browser-manager.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/browser-manager.ts)
- [browse/src/config.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/config.ts)

</details>

# Browse 运行时

Browse 是 gstack 的技术核心。它把每次浏览器动作变成对长期运行 Chromium 守护进程的 localhost HTTP 请求，避免每个工具调用都冷启动浏览器。设计文档给出的目标是首个命令启动约 3 秒，后续命令约 100-200ms。Sources: [ARCHITECTURE.md:5-37](../../../project-repos/gstack/ARCHITECTURE.md#L5-L37), [browse/src/cli.ts:1-10](../../../project-repos/gstack/browse/src/cli.ts#L1-L10)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:5-37`

````markdown
## The core idea

gstack gives Claude Code a persistent browser and a set of opinionated workflow skills. The browser is the hard part — everything else is Markdown.

The key insight: an AI agent interacting with a browser needs **sub-second latency** and **persistent state**. If every command cold-starts a browser, you're waiting 3-5 seconds per tool call. If the browser dies between commands, you lose cookies, tabs, and login sessions. So gstack runs a long-lived Chromium daemon that the CLI talks to over localhost HTTP.

```
Claude Code                     gstack
─────────                      ──────
                               ┌──────────────────────┐
  Tool call: $B snapshot -i    │  CLI (compiled binary)│
  ─────────────────────────→   │  • reads state file   │
                               │  • POST /command      │
                               │    to localhost:PORT   │
                               └──────────┬───────────┘
                                          │ HTTP
                               ┌──────────▼───────────┐
                               │  Server (Bun.serve)   │
                               │  • dispatches command  │
                               │  • talks to Chromium   │
                               │  • returns plain text  │
                               └──────────┬───────────┘
                                          │ CDP
                               ┌──────────▼───────────┐
                               │  Chromium (headless)   │
                               │  • persistent tabs     │
                               │  • cookies carry over  │
                               │  • 30min idle timeout  │
                               └───────────────────────┘
```

First call starts everything (~3s). Every call after: ~100-200ms.

````

#### `browse/src/cli.ts:1-10`

```typescript
/**
 * gstack CLI — thin wrapper that talks to the persistent server
 *
 * Flow:
 *   1. Read .gstack/browse.json for port + token
 *   2. If missing or stale PID → start server in background
 *   3. Health check + version mismatch detection
 *   4. Send command via HTTP POST
 *   5. Print response to stdout (or stderr for errors)
 */
```

<!-- source-snippets:end -->
</details>
## 运行时拓扑

```mermaid
flowchart TD
  A[AI skill / $B] --> B[browse CLI]
  B --> C[.gstack/browse.json]
  B --> D[POST /command]
  D --> E[Bun.serve server]
  E --> F[BrowserManager]
  F --> G[Playwright BrowserContext]
  G --> H[Chromium tabs]
  E --> I[console/network/dialog buffers]
  I --> J[.gstack/*.log]
```

CLI 读取 state file、判断服务健康、必要时启动 server，再通过 `/command` 发送命令；server 写入的 state file 包含 pid、port、token、startedAt、serverPath、binaryVersion 和 mode。Sources: [browse/src/cli.ts:97-124](../../../project-repos/gstack/browse/src/cli.ts#L97-L124), [browse/src/cli.ts:203-276](../../../project-repos/gstack/browse/src/cli.ts#L203-L276), [browse/src/server.ts:1986-2004](../../../project-repos/gstack/browse/src/server.ts#L1986-L2004)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/cli.ts:97-124`

```typescript
// ─── State File ────────────────────────────────────────────────
function readState(): ServerState | null {
  try {
    const data = fs.readFileSync(config.stateFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// isProcessAlive is imported from ./error-handling

/**
 * HTTP health check — definitive proof the server is alive and responsive.
 * Used in all polling loops instead of isProcessAlive() (which is slow on Windows).
 */
export async function isServerHealthy(port: number): Promise<boolean> {
  try {
    const resp = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!resp.ok) return false;
    const health = await resp.json() as any;
    return health.status === 'healthy';
  } catch {
    return false;
  }
}
```

#### `browse/src/cli.ts:203-276`

```typescript
// ─── Server Lifecycle ──────────────────────────────────────────
async function startServer(extraEnv?: Record<string, string>): Promise<ServerState> {
  ensureStateDir(config);

  // Clean up stale state file and error log
  safeUnlink(config.stateFile);
  safeUnlink(path.join(config.stateDir, 'browse-startup-error.log'));

  let proc: any = null;

  // Allow the caller to opt out of the parent-process watchdog by setting
  // BROWSE_PARENT_PID=0 in the environment. Useful for CI, non-interactive
  // shells, and short-lived Bash invocations that need the server to outlive
  // the spawning CLI. Defaults to the current process PID (watchdog active).
  // Parse as int so stray whitespace ("0\n") still opts out — matches the
  // server's own parseInt at server.ts:760.
  const parentPid = parseInt(process.env.BROWSE_PARENT_PID || '', 10) === 0 ? '0' : String(process.pid);

  if (IS_WINDOWS && NODE_SERVER_SCRIPT) {
    // Windows: Bun.spawn() + proc.unref() doesn't truly detach on Windows —
    // when the CLI exits, the server dies with it. Use Node's child_process.spawn
    // with { detached: true } instead, which is the gold standard for Windows
    // process independence. Credit: PR #191 by @fqueiro.
    const extraEnvStr = JSON.stringify({ BROWSE_STATE_FILE: config.stateFile, BROWSE_PARENT_PID: parentPid, ...(extraEnv || {}) });
    const launcherCode =
      `const{spawn}=require('child_process');` +
      `spawn(process.execPath,[${JSON.stringify(NODE_SERVER_SCRIPT)}],` +
      `{detached:true,stdio:['ignore','ignore','ignore'],env:Object.assign({},process.env,` +
      `${extraEnvStr})}).unref()`;
    Bun.spawnSync(['node', '-e', launcherCode], { stdio: ['ignore', 'ignore', 'ignore'] });
  } else {
    // macOS/Linux: Bun.spawn + unref works correctly
    proc = Bun.spawn(['bun', 'run', SERVER_SCRIPT], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSE_STATE_FILE: config.stateFile, BROWSE_PARENT_PID: parentPid, ...extraEnv },
    });
    proc.unref();
  }

  // Wait for server to become healthy.
  // Use HTTP health check (not isProcessAlive) — it's fast (~instant ECONNREFUSED)
  // and works reliably on all platforms including Windows.
  const start = Date.now();
  while (Date.now() - start < MAX_START_WAIT) {
    const state = readState();
    if (state && await isServerHealthy(state.port)) {
      return state;
    }
    await Bun.sleep(100);
  }

  // Server didn't start in time — try to get error details
  if (proc?.stderr) {
    // macOS/Linux: read stderr from the spawned process
    const reader = proc.stderr.getReader();
    const { value } = await reader.read();
    if (value) {
      const errText = new TextDecoder().decode(value);
      throw new Error(`Server failed to start:\n${errText}`);
    }
  } else {
    // Windows: check startup error log (server writes errors to disk since
    // stderr is unavailable due to stdio: 'ignore' for detachment)
    const errorLogPath = path.join(config.stateDir, 'browse-startup-error.log');
    try {
      const errorLog = fs.readFileSync(errorLogPath, 'utf-8').trim();
      if (errorLog) {
        throw new Error(`Server failed to start:\n${errorLog}`);
      }
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  throw new Error(`Server failed to start within ${MAX_START_WAIT / 1000}s`);
```

#### `browse/src/server.ts:1986-2004`

```typescript
  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch: makeFetchHandler('local'),
  });

  // Write state file (atomic: write .tmp then rename)
  const state: Record<string, unknown> = {
    pid: process.pid,
    port,
    token: AUTH_TOKEN,
    startedAt: new Date().toISOString(),
    serverPath: path.resolve(import.meta.dir, 'server.ts'),
    binaryVersion: readVersionHash() || undefined,
    mode: browserManager.getConnectionMode(),
  };
  const tmpFile = config.stateFile + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(tmpFile, config.stateFile);
```

<!-- source-snippets:end -->
</details>
## 状态与配置解析

`browse/src/config.ts` 的解析顺序是：`BROWSE_STATE_FILE` 环境变量、git 根目录、当前工作目录 fallback。所有日志和 state 都落在项目 `.gstack/` 下，`ensureStateDir` 会创建目录并尝试把 `.gstack/` 加到 `.gitignore`。Sources: [browse/src/config.ts:1-11](../../../project-repos/gstack/browse/src/config.ts#L1-L11), [browse/src/config.ts:50-75](../../../project-repos/gstack/browse/src/config.ts#L50-L75), [browse/src/config.ts:78-115](../../../project-repos/gstack/browse/src/config.ts#L78-L115)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/config.ts:1-11`

```typescript
/**
 * Shared config for browse CLI + server.
 *
 * Resolution:
 *   1. BROWSE_STATE_FILE env → derive stateDir from parent
 *   2. git rev-parse --show-toplevel → projectDir/.gstack/
 *   3. process.cwd() fallback (non-git environments)
 *
 * The CLI computes the config and passes BROWSE_STATE_FILE to the
 * spawned server. The server derives all paths from that env var.
 */
```

#### `browse/src/config.ts:50-75`

```typescript
export function resolveConfig(
  env: Record<string, string | undefined> = process.env,
): BrowseConfig {
  let stateFile: string;
  let stateDir: string;
  let projectDir: string;

  if (env.BROWSE_STATE_FILE) {
    stateFile = env.BROWSE_STATE_FILE;
    stateDir = path.dirname(stateFile);
    projectDir = path.dirname(stateDir); // parent of .gstack/
  } else {
    projectDir = getGitRoot() || process.cwd();
    stateDir = path.join(projectDir, '.gstack');
    stateFile = path.join(stateDir, 'browse.json');
  }

  return {
    projectDir,
    stateDir,
    stateFile,
    consoleLog: path.join(stateDir, 'browse-console.log'),
    networkLog: path.join(stateDir, 'browse-network.log'),
    dialogLog: path.join(stateDir, 'browse-dialog.log'),
    auditLog: path.join(stateDir, 'browse-audit.jsonl'),
  };
```

#### `browse/src/config.ts:78-115`

```typescript
/**
 * Create the .gstack/ state directory if it doesn't exist.
 * Throws with a clear message on permission errors.
 */
export function ensureStateDir(config: BrowseConfig): void {
  try {
    fs.mkdirSync(config.stateDir, { recursive: true, mode: 0o700 });
  } catch (err: any) {
    if (err.code === 'EACCES') {
      throw new Error(`Cannot create state directory ${config.stateDir}: permission denied`);
    }
    if (err.code === 'ENOTDIR') {
      throw new Error(`Cannot create state directory ${config.stateDir}: a file exists at that path`);
    }
    throw err;
  }

  // Ensure .gstack/ is in the project's .gitignore
  const gitignorePath = path.join(config.projectDir, '.gitignore');
  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.match(/^\.gstack\/?$/m)) {
      const separator = content.endsWith('\n') ? '' : '\n';
      fs.appendFileSync(gitignorePath, `${separator}.gstack/\n`);
    }
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      // Write warning to server log (visible even in daemon mode)
      const logPath = path.join(config.stateDir, 'browse-server.log');
      try {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] Warning: could not update .gitignore at ${gitignorePath}: ${err.message}\n`);
      } catch {
        // stateDir write failed too — nothing more we can do
      }
    }
    // ENOENT (no .gitignore) — skip silently
  }
}
```

<!-- source-snippets:end -->
</details>
## 命令分发

`commands.ts` 是命令事实来源，并把命令分成 READ、WRITE、META 三类。server 内部按这些 set 分发到 `handleReadCommand`、`handleWriteCommand`、`handleMetaCommand`。Sources: [browse/src/commands.ts:1-50](../../../project-repos/gstack/browse/src/commands.ts#L1-L50), [ARCHITECTURE.md:300-317](../../../project-repos/gstack/ARCHITECTURE.md#L300-L317), [browse/src/server.ts:556-740](../../../project-repos/gstack/browse/src/server.ts#L556-L740)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/commands.ts:1-50`

```typescript
/**
 * Command registry — single source of truth for all browse commands.
 *
 * Dependency graph:
 *   commands.ts ──▶ server.ts (runtime dispatch)
 *                ──▶ gen-skill-docs.ts (doc generation)
 *                ──▶ skill-parser.ts (validation)
 *                ──▶ skill-check.ts (health reporting)
 *
 * Zero side effects. Safe to import from build scripts and tests.
 */

export const READ_COMMANDS = new Set([
  'text', 'html', 'links', 'forms', 'accessibility',
  'js', 'eval', 'css', 'attrs',
  'console', 'network', 'cookies', 'storage', 'perf',
  'dialog', 'is',
  'inspect',
  'media', 'data',
]);

export const WRITE_COMMANDS = new Set([
  'goto', 'back', 'forward', 'reload',
  'load-html',
  'click', 'fill', 'select', 'hover', 'type', 'press', 'scroll', 'wait',
  'viewport', 'cookie', 'cookie-import', 'cookie-import-browser', 'header', 'useragent',
  'upload', 'dialog-accept', 'dialog-dismiss',
  'style', 'cleanup', 'prettyscreenshot',
  'download', 'scrape', 'archive',
]);

export const META_COMMANDS = new Set([
  'tabs', 'tab', 'tab-each', 'newtab', 'closetab',
  'status', 'stop', 'restart',
  'screenshot', 'pdf', 'responsive',
  'chain', 'diff',
  'url', 'snapshot',
  'handoff', 'resume',
  'connect', 'disconnect', 'focus',
  'inbox',
  'watch',
  'state',
  'frame',
  'ux-audit',
  'domain-skill',
  'skill',
  'cdp',
]);

export const ALL_COMMANDS = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
```

#### `ARCHITECTURE.md:300-317`

````markdown
## Command dispatch

Commands are categorized by side effects:

- **READ** (text, html, links, console, cookies, ...): No mutations. Safe to retry. Returns page state.
- **WRITE** (goto, click, fill, press, ...): Mutates page state. Not idempotent.
- **META** (snapshot, screenshot, tabs, chain, ...): Server-level operations that don't fit neatly into read/write.

This isn't just organizational. The server uses it for dispatch:

```typescript
if (READ_COMMANDS.has(cmd))  → handleReadCommand(cmd, args, bm)
if (WRITE_COMMANDS.has(cmd)) → handleWriteCommand(cmd, args, bm)
if (META_COMMANDS.has(cmd))  → handleMetaCommand(cmd, args, bm, shutdown)
```

The `help` command returns all three sets so agents can self-discover available commands.

````

#### `browse/src/server.ts:556-740`

```typescript
async function handleCommandInternal(
  body: { command: string; args?: string[]; tabId?: number },
  tokenInfo?: TokenInfo | null,
  opts?: { skipRateCheck?: boolean; skipActivity?: boolean; chainDepth?: number },
): Promise<CommandResult> {
  const { args = [], tabId } = body;
  const rawCommand = body.command;

  if (!rawCommand) {
    return { status: 400, result: JSON.stringify({ error: 'Missing "command" field' }), json: true };
  }

  // ─── Alias canonicalization (before scope, watch, tab-ownership, dispatch) ─
  // Agent-friendly names like 'setcontent' route to canonical 'load-html'. Must
  // happen BEFORE scope check so a read-scoped token calling 'setcontent' is still
  // rejected (load-html lives in SCOPE_WRITE). Audit logging preserves rawCommand
  // so the trail records what the agent actually typed.
  const command = canonicalizeCommand(rawCommand);
  const isAliased = command !== rawCommand;

  // ─── Recursion guard: reject nested chains ──────────────────
  if (command === 'chain' && (opts?.chainDepth ?? 0) > 0) {
    return { status: 400, result: JSON.stringify({ error: 'Nested chain commands are not allowed' }), json: true };
  }

  // ─── Scope check (for scoped tokens) ──────────────────────────
  if (tokenInfo && tokenInfo.clientId !== 'root') {
    if (!checkScope(tokenInfo, command)) {
      return {
        status: 403, json: true,
        result: JSON.stringify({
          error: `Command "${command}" not allowed by your token scope`,
          hint: `Your scopes: ${tokenInfo.scopes.join(', ')}. Ask the user to re-pair with --admin for eval/cookies/storage access.`,
        }),
      };
    }

    // Domain check for navigation commands
    if ((command === 'goto' || command === 'newtab') && args[0]) {
      if (!checkDomain(tokenInfo, args[0])) {
        return {
          status: 403, json: true,
          result: JSON.stringify({
            error: `Domain not allowed by your token scope`,
            hint: `Allowed domains: ${tokenInfo.domains?.join(', ') || 'none configured'}`,
          }),
        };
      }
    }

    // Rate check (skipped for chain subcommands — chain counts as 1 request)
    if (!opts?.skipRateCheck) {
      const rateResult = checkRate(tokenInfo);
      if (!rateResult.allowed) {
        return {
          status: 429, json: true,
          result: JSON.stringify({
            error: 'Rate limit exceeded',
            hint: `Max ${tokenInfo.rateLimit} requests/second. Retry after ${rateResult.retryAfterMs}ms.`,
          }),
          headers: { 'Retry-After': String(Math.ceil((rateResult.retryAfterMs || 1000) / 1000)) },
        };
      }
    }

    // Record command execution for idempotent key exchange tracking
    if (!opts?.skipRateCheck && tokenInfo.token) recordCommand(tokenInfo.token);
  }

  // Pin to a specific tab if requested (set by BROWSE_TAB env var in sidebar agents).
  // This prevents parallel agents from interfering with each other's tab context.
  // Safe because Bun's event loop is single-threaded — no concurrent handleCommand.
  let savedTabId: number | null = null;
  if (tabId !== undefined && tabId !== null) {
    savedTabId = browserManager.getActiveTabId();
    // bringToFront: false — internal tab pinning must NOT steal window focus
    try { browserManager.switchTab(tabId, { bringToFront: false }); } catch (err: any) {
      console.warn('[browse] Failed to pin tab', tabId, ':', err.message);
    }
  }

  // ─── Tab ownership check (own-only tokens / pair-agent isolation) ──
  //
  // Only `own-only` tokens (pair-agent over tunnel) are bound to their own
  // tabs. `shared` tokens — the default for skill spawns and local scoped
  // clients — can drive any tab; the capability gate (scope checks above)
  // and rate limits already constrain what they can do.
  //
  // Skip for `newtab` — it creates a tab rather than accessing one.
  if (command !== 'newtab' && tokenInfo && tokenInfo.clientId !== 'root' && tokenInfo.tabPolicy === 'own-only') {
    const targetTab = tabId ?? browserManager.getActiveTabId();
    if (!browserManager.checkTabAccess(targetTab, tokenInfo.clientId, { isWrite: WRITE_COMMANDS.has(command), ownOnly: true })) {
      return {
        status: 403, json: true,
        result: JSON.stringify({
          error: 'Tab not owned by your agent. Use newtab to create your own tab.',
          hint: `Tab ${targetTab} is owned by ${browserManager.getTabOwner(targetTab) || 'root'}. Your agent: ${tokenInfo.clientId}.`,
        }),
      };
    }
  }

  // ─── newtab with ownership for scoped tokens ──────────────
  if (command === 'newtab' && tokenInfo && tokenInfo.clientId !== 'root') {
    const newId = await browserManager.newTab(args[0] || undefined, tokenInfo.clientId);
    return {
      status: 200, json: true,
      result: JSON.stringify({
        tabId: newId,
        owner: tokenInfo.clientId,
        hint: 'Include "tabId": ' + newId + ' in subsequent commands to target this tab.',
      }),
    };
  }

  // Block mutation commands while watching (read-only observation mode)
  if (browserManager.isWatching() && WRITE_COMMANDS.has(command)) {
    return {
      status: 400, json: true,
      result: JSON.stringify({ error: 'Cannot run mutation commands while watching. Run `$B watch stop` first.' }),
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>
| 分类 | 示例 | 风险语义 |
|---|---|---|
| READ | `text`, `html`, `links`, `console`, `cookies`, `inspect` | 读取页面或运行时状态，适合封装 untrusted output |
| WRITE | `goto`, `click`, `fill`, `viewport`, `cookie-import-browser`, `style` | 会改变页面、上下文或浏览器状态 |
| META | `tabs`, `snapshot`, `chain`, `handoff`, `domain-skill`, `cdp` | 管理 tab、server、链式执行或扩展能力 |

Sources: [browse/src/commands.ts:13-49](../../../project-repos/gstack/browse/src/commands.ts#L13-L49), [browse/src/commands.ts:90-185](../../../project-repos/gstack/browse/src/commands.ts#L90-L185)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/commands.ts:13-49`

```typescript
export const READ_COMMANDS = new Set([
  'text', 'html', 'links', 'forms', 'accessibility',
  'js', 'eval', 'css', 'attrs',
  'console', 'network', 'cookies', 'storage', 'perf',
  'dialog', 'is',
  'inspect',
  'media', 'data',
]);

export const WRITE_COMMANDS = new Set([
  'goto', 'back', 'forward', 'reload',
  'load-html',
  'click', 'fill', 'select', 'hover', 'type', 'press', 'scroll', 'wait',
  'viewport', 'cookie', 'cookie-import', 'cookie-import-browser', 'header', 'useragent',
  'upload', 'dialog-accept', 'dialog-dismiss',
  'style', 'cleanup', 'prettyscreenshot',
  'download', 'scrape', 'archive',
]);

export const META_COMMANDS = new Set([
  'tabs', 'tab', 'tab-each', 'newtab', 'closetab',
  'status', 'stop', 'restart',
  'screenshot', 'pdf', 'responsive',
  'chain', 'diff',
  'url', 'snapshot',
  'handoff', 'resume',
  'connect', 'disconnect', 'focus',
  'inbox',
  'watch',
  'state',
  'frame',
  'ux-audit',
  'domain-skill',
  'skill',
  'cdp',
]);

```

#### `browse/src/commands.ts:90-185`

```typescript
export const COMMAND_DESCRIPTIONS: Record<string, { category: string; description: string; usage?: string }> = {
  // Navigation
  'goto':    { category: 'Navigation', description: 'Navigate to URL (http://, https://, or file:// scoped to cwd/TEMP_DIR)', usage: 'goto <url>' },
  'load-html': { category: 'Navigation', description: 'Load HTML via setContent. Accepts a file path under safe-dirs (validated), OR --from-file <payload.json> with {"html":"...","waitUntil":"..."} for large inline HTML (Windows argv safe).', usage: 'load-html <file> [--wait-until load|domcontentloaded|networkidle] [--tab-id <N>]  |  load-html --from-file <payload.json> [--tab-id <N>]' },
  'back':    { category: 'Navigation', description: 'History back' },
  'forward': { category: 'Navigation', description: 'History forward' },
  'reload':  { category: 'Navigation', description: 'Reload page' },
  'url':     { category: 'Navigation', description: 'Print current URL' },
  // Reading
  'text':    { category: 'Reading', description: 'Cleaned page text' },
  'html':    { category: 'Reading', description: 'innerHTML of selector (throws if not found), or full page HTML if no selector given', usage: 'html [selector]' },
  'links':   { category: 'Reading', description: 'All links as "text → href"' },
  'forms':   { category: 'Reading', description: 'Form fields as JSON' },
  'accessibility': { category: 'Reading', description: 'Full ARIA tree' },
  'media':   { category: 'Reading', description: 'All media elements (images, videos, audio) with URLs, dimensions, types', usage: 'media [--images|--videos|--audio] [selector]' },
  'data':    { category: 'Reading', description: 'Structured data: JSON-LD, Open Graph, Twitter Cards, meta tags', usage: 'data [--jsonld|--og|--meta|--twitter]' },
  // Inspection
  'js':      { category: 'Inspection', description: 'Run inline JavaScript expression in the page context and return result as string. Same JS sandbox as eval; the only difference is js takes an inline expr while eval reads from a file.', usage: 'js <expr>' },
  'eval':    { category: 'Inspection', description: 'Run JavaScript from a file in the page context and return result as string. Path must resolve under /tmp or cwd (no traversal). Use eval for multi-line scripts; use js for one-liners.', usage: 'eval <file>' },
  'css':     { category: 'Inspection', description: 'Computed CSS value', usage: 'css <sel> <prop>' },
  'attrs':   { category: 'Inspection', description: 'Element attributes as JSON', usage: 'attrs <sel|@ref>' },
  'is':      { category: 'Inspection', description: 'State check on element. Valid <prop> values: visible, hidden, enabled, disabled, checked, editable, focused (case-sensitive). <sel> accepts a CSS selector OR an @ref token from a prior snapshot (e.g. @e3, @c1) — refs are interchangeable with selectors anywhere a selector is expected.', usage: 'is <prop> <sel|@ref>' },
  'console': { category: 'Inspection', description: 'Console messages (--errors filters to error/warning)', usage: 'console [--clear|--errors]' },
  'network': { category: 'Inspection', description: 'Network requests', usage: 'network [--clear]' },
  'dialog':  { category: 'Inspection', description: 'Dialog messages', usage: 'dialog [--clear]' },
  'cookies': { category: 'Inspection', description: 'All cookies as JSON' },
  'storage': { category: 'Inspection', description: 'Read both localStorage and sessionStorage as JSON. With "set <key> <value>", write to localStorage only (sessionStorage is read-only via this command — set it with `js sessionStorage.setItem(...)`).', usage: 'storage  |  storage set <key> <value>' },
  'perf':    { category: 'Inspection', description: 'Page load timings' },
  // Interaction
  'click':   { category: 'Interaction', description: 'Click element', usage: 'click <sel>' },
  'fill':    { category: 'Interaction', description: 'Fill input', usage: 'fill <sel> <val>' },
  'select':  { category: 'Interaction', description: 'Select dropdown option by value, label, or visible text', usage: 'select <sel> <val>' },
  'hover':   { category: 'Interaction', description: 'Hover element', usage: 'hover <sel>' },
  'type':    { category: 'Interaction', description: 'Type into focused element', usage: 'type <text>' },
  'press':   { category: 'Interaction', description: 'Press a Playwright keyboard key against the focused element. Names are case-sensitive: Enter, Tab, Escape, ArrowUp/Down/Left/Right, Backspace, Delete, Home, End, PageUp, PageDown. Modifiers combine with +: Shift+Enter, Control+A, Meta+K. Single printable chars (a, A, 1) work too. Full key list: https://playwright.dev/docs/api/class-keyboard#keyboard-press', usage: 'press <key>' },
  'scroll':  { category: 'Interaction', description: 'With a selector, smooth-scrolls the element into view. Without a selector, jumps to page bottom. No --by/--to amount option; for pixel-precise scrolling use `js window.scrollTo(0, N)`.', usage: 'scroll [sel|@ref]' },
  'wait':    { category: 'Interaction', description: 'Wait for element, network idle, or page load (timeout: 15s)', usage: 'wait <sel|--networkidle|--load>' },
  'upload':  { category: 'Interaction', description: 'Upload file(s)', usage: 'upload <sel> <file> [file2...]' },
  'viewport':{ category: 'Interaction', description: 'Set viewport size and optional deviceScaleFactor (1-3, for retina screenshots). --scale requires a context rebuild.', usage: 'viewport [<WxH>] [--scale <n>]' },
  'cookie':  { category: 'Interaction', description: 'Set cookie on current page domain', usage: 'cookie <name>=<value>' },
  'cookie-import': { category: 'Interaction', description: 'Import cookies from JSON file', usage: 'cookie-import <json>' },
  'cookie-import-browser': { category: 'Interaction', description: 'Import cookies from installed Chromium browsers (opens picker, or use --domain for direct import)', usage: 'cookie-import-browser [browser] [--domain d]' },
  'header':  { category: 'Interaction', description: 'Set custom request header (colon-separated, sensitive values auto-redacted)', usage: 'header <name>:<value>' },
  'useragent': { category: 'Interaction', description: 'Set user agent', usage: 'useragent <string>' },
  'dialog-accept': { category: 'Interaction', description: 'Auto-accept next alert/confirm/prompt. Optional text is sent as the prompt response', usage: 'dialog-accept [text]' },
  'dialog-dismiss': { category: 'Interaction', description: 'Auto-dismiss next dialog' },
  // Data extraction
  'download': { category: 'Extraction', description: 'Download URL or media element to disk using browser cookies', usage: 'download <url|@ref> [path] [--base64]' },
  'scrape':   { category: 'Extraction', description: 'Bulk download all media from page. Writes manifest.json', usage: 'scrape <images|videos|media> [--selector sel] [--dir path] [--limit N]' },
  'archive':  { category: 'Extraction', description: 'Save complete page as MHTML via CDP', usage: 'archive [path]' },
  // Visual
  'screenshot': { category: 'Visual', description: 'Save screenshot. --selector targets a specific element (explicit flag form). Positional selectors starting with ./#/@/[ still work.', usage: 'screenshot [--selector <css>] [--viewport] [--clip x,y,w,h] [--base64] [selector|@ref] [path]' },
  'pdf':     { category: 'Visual', description: 'Save the current page as PDF. Supports page layout (--format, --width, --height, --margins, --margin-*), structure (--toc waits for Paged.js), branding (--header-template, --footer-template, --page-numbers), accessibility (--tagged, --outline), and --from-file <payload.json> for large payloads. Use --tab-id <N> to target a specific tab.', usage: 'pdf [path] [--format letter|a4|legal] [--width <dim> --height <dim>] [--margins <dim>] [--margin-top <dim> --margin-right <dim> --margin-bottom <dim> --margin-left <dim>] [--header-template <html>] [--footer-template <html>] [--page-numbers] [--tagged] [--outline] [--print-background] [--prefer-css-page-size] [--toc] [--tab-id <N>]  |  pdf --from-file <payload.json> [--tab-id <N>]' },
  'responsive': { category: 'Visual', description: 'Screenshots at mobile (375x812), tablet (768x1024), desktop (1280x720). Saves as {prefix}-mobile.png etc.', usage: 'responsive [prefix]' },
  'diff':    { category: 'Visual', description: 'Text diff between pages', usage: 'diff <url1> <url2>' },
  // Tabs
  'tabs':    { category: 'Tabs', description: 'List open tabs' },
  'tab':     { category: 'Tabs', description: 'Switch to tab', usage: 'tab <id>' },
  'newtab':  { category: 'Tabs', description: 'Open new tab. With --json, returns {"tabId":N,"url":...} for programmatic use (make-pdf).', usage: 'newtab [url] [--json]' },
  'closetab':{ category: 'Tabs', description: 'Close tab', usage: 'closetab [id]' },
  'tab-each':{ category: 'Tabs', description: 'Run a command on every open tab. Returns JSON with per-tab results.', usage: 'tab-each <command> [args...]' },
  // Server
  'status':  { category: 'Server', description: 'Health check' },
  'stop':    { category: 'Server', description: 'Shutdown server' },
  'restart': { category: 'Server', description: 'Restart server' },
  // Meta
  'snapshot':{ category: 'Snapshot', description: 'Accessibility tree with @e refs for element selection. Flags: -i interactive only, -c compact, -d N depth limit, -s sel scope, -D diff vs previous, -a annotated screenshot, -o path output, -C cursor-interactive @c refs', usage: 'snapshot [flags]' },
  'chain':   { category: 'Meta', description: 'Run a sequence of commands from JSON on stdin. One JSON array of arrays, each inner array is [cmd, ...args]. Output is one JSON result per command. Pipe a JSON array (e.g. `[["goto","https://example.com"],["text","h1"]]`) to `$B chain` and it runs the goto then the text command in order. Stops at the first error.', usage: 'chain  (JSON via stdin)' },
  // Handoff
  'handoff': { category: 'Server', description: 'Open visible Chrome at current page for user takeover', usage: 'handoff [message]' },
  'resume':  { category: 'Server', description: 'Re-snapshot after user takeover, return control to AI', usage: 'resume' },
  // Headed mode
  'connect': { category: 'Server', description: 'Launch headed Chromium with Chrome extension', usage: 'connect' },
  'disconnect': { category: 'Server', description: 'Disconnect headed browser, return to headless mode' },
  'focus':   { category: 'Server', description: 'Bring headed browser window to foreground (macOS)', usage: 'focus [@ref]' },
  // Inbox
  'inbox':   { category: 'Meta', description: 'List messages from sidebar scout inbox', usage: 'inbox [--clear]' },
  // Watch
  'watch':   { category: 'Meta', description: 'Passive observation — periodic snapshots while user browses', usage: 'watch [stop]' },
  // State
  'state':   { category: 'Server', description: 'Save/load browser state (cookies + URLs)', usage: 'state save|load <name>' },
  // Frame
  'frame':   { category: 'Meta', description: 'Switch to iframe context (or main to return)', usage: 'frame <sel|@ref|--name n|--url pattern|main>' },
  // CSS Inspector
  'inspect': { category: 'Inspection', description: 'Deep CSS inspection via CDP — full rule cascade, box model, computed styles', usage: 'inspect [selector] [--all] [--history]' },
  'style':   { category: 'Interaction', description: 'Modify CSS property on element (with undo support)', usage: 'style <sel> <prop> <value> | style --undo [N]' },
  'cleanup': { category: 'Interaction', description: 'Remove page clutter (ads, cookie banners, sticky elements, social widgets)', usage: 'cleanup [--ads] [--cookies] [--sticky] [--social] [--all]' },
  'prettyscreenshot': { category: 'Visual', description: 'Clean screenshot with optional cleanup, scroll positioning, and element hiding', usage: 'prettyscreenshot [--scroll-to sel|text] [--cleanup] [--hide sel...] [--width px] [path]' },
  // UX Audit
  'ux-audit': { category: 'Inspection', description: 'Extract page structure for UX behavioral analysis — site ID, nav, headings, text blocks, interactive elements. Returns JSON for agent interpretation.', usage: 'ux-audit' },
  // Domain skills (per-site notes the agent writes for itself)
  'domain-skill': { category: 'Meta', description: 'Per-site notes the agent writes for itself. Host is derived from the active tab. Lifecycle: `save` adds a quarantined note → after N=3 successful uses without the prompt-injection classifier flagging it, the note auto-promotes to "active" → `promote-to-global` lifts it to the global tier (machine-wide, all projects). The classifier flag is set automatically by the L4 prompt-injection scan; agents do not set it manually. Use `list` / `show` to inspect, `edit` to revise, `rollback` to demote, `rm` to tombstone.', usage: 'domain-skill save|list|show|edit|promote-to-global|rollback|rm <host?>' },
  // Browser-skills (hand-written or generated Playwright scripts the runtime spawns)
  'skill':        { category: 'Meta', description: 'Run a browser-skill: deterministic Playwright script that drives the daemon over loopback HTTP. 3-tier lookup (project > global > bundled). Spawned scripts get a per-spawn scoped token (read+write only) — never the daemon root token.', usage: 'skill list|show|run|test|rm <name?> [--arg k=v]... [--timeout=Ns]' },
  // CDP escape hatch (deny-default; see browse/src/cdp-allowlist.ts)
  'cdp':          { category: 'Inspection', description: 'Raw Chrome DevTools Protocol method dispatch. Deny-default: only methods enumerated in `browse/src/cdp-allowlist.ts` (CDP_ALLOWLIST const) are reachable; any other method 403s. Each allowlist entry declares scope (tab vs browser) and output (trusted vs untrusted) — untrusted methods (data-exfil-shaped, e.g. Network.getResponseBody) get UNTRUSTED-envelope wrapped output. To discover allowed methods: read `browse/src/cdp-allowlist.ts`. Example: `$B cdp Page.getLayoutMetrics`.', usage: 'cdp <Domain.method> [json-params]' },
```

<!-- source-snippets:end -->
</details>
## 生命周期

```mermaid
stateDiagram-v2
  [*] --> NoState
  NoState --> Starting: CLI detects no healthy server
  Starting --> Healthy: state file + /health OK
  Healthy --> Healthy: /command resets idle timer
  Healthy --> Headed: connect/open-gstack-browser
  Healthy --> Tunnel: pair-agent tunnel
  Healthy --> Shutdown: idle timeout
  Headed --> Shutdown: disconnect/window closed
  Tunnel --> Shutdown: explicit stop/parent death
```

server 每分钟检查 idle timer，headed mode 和 tunnel mode 不自动 idle shutdown；普通 headless 模式空闲超过默认 30 分钟会关闭。Sources: [browse/src/server.ts:378-395](../../../project-repos/gstack/browse/src/server.ts#L378-L395)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/server.ts:378-395`

```typescript
// ─── Idle Timer ────────────────────────────────────────────────
let lastActivity = Date.now();

function resetIdleTimer() {
  lastActivity = Date.now();
}

const idleCheckInterval = setInterval(() => {
  // Headed mode: the user is looking at the browser. Never auto-die.
  // Only shut down when the user explicitly disconnects or closes the window.
  if (browserManager.getConnectionMode() === 'headed') return;
  // Tunnel mode: remote agents may send commands sporadically. Never auto-die.
  if (tunnelActive) return;
  if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
    console.log(`[browse] Idle for ${IDLE_TIMEOUT_MS / 1000}s, shutting down`);
    shutdown();
  }
}, 60_000);
```

<!-- source-snippets:end -->
</details>
## BrowserManager 职责

`BrowserManager` 持有 Playwright browser/context、tab map、tab session、额外 header、user agent、viewport/deviceScaleFactor、tab ownership、watch mode 和 headed mode 状态。Sources: [browse/src/browser-manager.ts:49-104](../../../project-repos/gstack/browse/src/browser-manager.ts#L49-L104), [browse/src/browser-manager.ts:177-234](../../../project-repos/gstack/browse/src/browser-manager.ts#L177-L234), [browse/src/browser-manager.ts:236-280](../../../project-repos/gstack/browse/src/browser-manager.ts#L236-L280)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/browser-manager.ts:49-104`

```typescript
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Map<number, Page> = new Map();
  private tabSessions: Map<number, TabSession> = new Map();
  private activeTabId: number = 0;
  private nextTabId: number = 1;
  private extraHeaders: Record<string, string> = {};
  private customUserAgent: string | null = null;

  // ─── Viewport + deviceScaleFactor (context options) ──────────
  // Tracked at the manager level so recreateContext() preserves them.
  // deviceScaleFactor is a *context* option, not a page-level setter — changes
  // require recreateContext(). Viewport width/height can change on-page, but we
  // track the latest so context recreation restores it instead of hardcoding 1280x720.
  private deviceScaleFactor: number = 1;
  private currentViewport: { width: number; height: number } = { width: 1280, height: 720 };

  /** Server port — set after server starts, used by cookie-import-browser command */
  public serverPort: number = 0;

  // ─── Tab Ownership (multi-agent isolation) ──────────────
  // Maps tabId → clientId. Unowned tabs (not in this map) are root-only for writes.
  private tabOwnership: Map<number, string> = new Map();

  // ─── Dialog Handling (global, not per-tab) ──────────────────
  private dialogAutoAccept: boolean = true;
  private dialogPromptText: string | null = null;

  // ─── Cookie Origin Tracking ────────────────────────────────
  private cookieImportedDomains: Set<string> = new Set();

  // ─── Handoff State ─────────────────────────────────────────
  private isHeaded: boolean = false;
  private consecutiveFailures: number = 0;

  // ─── Watch Mode ─────────────────────────────────────────
  private watching = false;
  public watchInterval: ReturnType<typeof setInterval> | null = null;
  private watchSnapshots: string[] = [];
  private watchStartTime: number = 0;

  // ─── Headed State ────────────────────────────────────────
  private connectionMode: 'launched' | 'headed' = 'launched';
  private intentionalDisconnect = false;

  // Called when the headed browser disconnects without intentional teardown
  // (user closed the window). Wired up by server.ts to run full cleanup
  // (sidebar-agent, state file, profile locks) before exiting with code 2.
  // Returns void or a Promise; rejections are caught and fall back to exit(2).
  public onDisconnect: (() => void | Promise<void>) | null = null;

  getConnectionMode(): 'launched' | 'headed' { return this.connectionMode; }

  // ─── Watch Mode Methods ─────────────────────────────────
  isWatching(): boolean { return this.watching; }
```

#### `browse/src/browser-manager.ts:177-234`

```typescript
  async launch() {
    // ─── Extension Support ────────────────────────────────────
    // BROWSE_EXTENSIONS_DIR points to an unpacked Chrome extension directory.
    // Extensions only work in headed mode, so we use an off-screen window.
    const extensionsDir = process.env.BROWSE_EXTENSIONS_DIR;
    const launchArgs: string[] = [];
    let useHeadless = true;

    // Docker/CI: Chromium sandbox requires unprivileged user namespaces which
    // are typically disabled in containers. Detect container environment and
    // add --no-sandbox automatically.
    if (process.env.CI || process.env.CONTAINER) {
      launchArgs.push('--no-sandbox');
    }

    if (extensionsDir) {
      launchArgs.push(
        `--disable-extensions-except=${extensionsDir}`,
        `--load-extension=${extensionsDir}`,
        '--window-position=-9999,-9999',
        '--window-size=1,1',
      );
      useHeadless = false; // extensions require headed mode; off-screen window simulates headless
      console.log(`[browse] Extensions loaded from: ${extensionsDir}`);
    }

    this.browser = await chromium.launch({
      headless: useHeadless,
      // On Windows, Chromium's sandbox fails when the server is spawned through
      // the Bun→Node process chain (GitHub #276). Disable it — local daemon
      // browsing user-specified URLs has marginal sandbox benefit.
      chromiumSandbox: process.platform !== 'win32',
      ...(launchArgs.length > 0 ? { args: launchArgs } : {}),
    });

    // Chromium crash → exit with clear message
    this.browser.on('disconnected', () => {
      console.error('[browse] FATAL: Chromium process crashed or was killed. Server exiting.');
      console.error('[browse] Console/network logs flushed to .gstack/browse-*.log');
      process.exit(1);
    });

    const contextOptions: BrowserContextOptions = {
      viewport: { width: this.currentViewport.width, height: this.currentViewport.height },
      deviceScaleFactor: this.deviceScaleFactor,
    };
    if (this.customUserAgent) {
      contextOptions.userAgent = this.customUserAgent;
    }
    this.context = await this.browser.newContext(contextOptions);

    if (Object.keys(this.extraHeaders).length > 0) {
      await this.context.setExtraHTTPHeaders(this.extraHeaders);
    }

    // Create first tab
    await this.newTab();
  }
```

#### `browse/src/browser-manager.ts:236-280`

```typescript
  // ─── Headed Mode ─────────────────────────────────────────────
  /**
   * Launch Playwright's bundled Chromium in headed mode with the gstack
   * Chrome extension auto-loaded. Uses launchPersistentContext() which
   * is required for extension loading (launch() + newContext() can't
   * load extensions).
   *
   * The browser launches headed with a visible window — the user sees
   * every action Claude takes in real time.
   */
  async launchHeaded(authToken?: string): Promise<void> {
    // Clear old state before repopulating
    this.pages.clear();
    this.tabSessions.clear();
    this.nextTabId = 1;

    // Find the gstack extension directory for auto-loading
    const extensionPath = this.findExtensionPath();
    const launchArgs = [
      '--hide-crash-restore-bubble',
      // Anti-bot-detection: remove the navigator.webdriver flag that Playwright sets.
      // Sites like Google and NYTimes check this to block automation browsers.
      '--disable-blink-features=AutomationControlled',
    ];
    if (extensionPath) {
      launchArgs.push(`--disable-extensions-except=${extensionPath}`);
      launchArgs.push(`--load-extension=${extensionPath}`);
      // Write auth token for extension bootstrap.
      // Write to ~/.gstack/.auth.json (not the extension dir, which may be read-only
      // in .app bundles and breaks codesigning).
      if (authToken) {
        const fs = require('fs');
        const path = require('path');
        const gstackDir = path.join(process.env.HOME || '/tmp', '.gstack');
        fs.mkdirSync(gstackDir, { recursive: true });
        const authFile = path.join(gstackDir, '.auth.json');
        try {
          fs.writeFileSync(authFile, JSON.stringify({ token: authToken, port: this.serverPort || 34567 }), { mode: 0o600 });
        } catch (err: any) {
          console.warn(`[browse] Could not write .auth.json: ${err.message}`);
        }
      }
    }

    // Launch headed Chromium via Playwright's persistent context.
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [浏览器安全模型](browser-security.md)
- [技能工作流](skill-workflow.md)
- [设计与 PDF 工具](design-pdf-tools.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [ARCHITECTURE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ARCHITECTURE.md)
- [browse/src/server.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/server.ts)
- [browse/src/content-security.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/content-security.ts)
- [browse/src/security.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/security.ts)
- [browse/src/cdp-allowlist.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/cdp-allowlist.ts)
- [browse/src/token-registry.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/token-registry.ts)
- [browse/src/commands.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/commands.ts)

</details>

# 浏览器安全模型

gstack 的 Browse 安全边界围绕“本机 daemon + scoped remote pairing + untrusted page content”展开。基础 server 只绑定 `127.0.0.1`，写入 owner-only state file，并用 Bearer token 保护会改变状态的请求；远程 pair-agent 则通过独立 tunnel listener 暴露极小路径集合。Sources: [ARCHITECTURE.md:82-128](../../../project-repos/gstack/ARCHITECTURE.md#L82-L128), [browse/src/server.ts:62-67](../../../project-repos/gstack/browse/src/server.ts#L62-L67), [browse/src/server.ts:1020-1074](../../../project-repos/gstack/browse/src/server.ts#L1020-L1074)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:82-128`

```markdown
## Security model

### Localhost only

The HTTP server binds to `127.0.0.1`, not `0.0.0.0`. It's not reachable from the network.

### Dual-listener tunnel architecture (v1.6.0.0)

When a user runs `pair-agent --client`, the daemon starts an ngrok tunnel so a remote paired agent can drive the browser. Exposing the full daemon surface to the internet (even behind a random ngrok subdomain) meant `/health` leaked the root token on any Origin spoof, and `/cookie-picker` embedded the token into HTML that any caller could fetch.

The fix is **two HTTP listeners**, not one:

- **Local listener** (`127.0.0.1:LOCAL_PORT`) — always bound. Serves bootstrap (`/health` with token delivery), `/cookie-picker`, `/inspector/*`, `/welcome`, `/refs`, the sidebar-agent API, and the full command surface. Never forwarded.
- **Tunnel listener** (`127.0.0.1:TUNNEL_PORT`) — bound lazily on `/tunnel/start`, torn down on `/tunnel/stop`. Serves a locked allowlist: `/connect` (pairing ceremony, unauth + rate-limited), `/command` (scoped tokens only, further restricted to a browser-driving command allowlist), and `/sidebar-chat`. Everything else 404s.

ngrok forwards only the tunnel port. The security property comes from **physical port separation**: a tunnel caller cannot reach `/health` or `/cookie-picker` because those paths don't exist on that TCP socket. Header inference (check `x-forwarded-for`, check origin) is unreliable (ngrok header behavior changes; local proxies can add these headers); socket separation isn't.

| Endpoint | Local listener | Tunnel listener | Notes |
|---|---|---|---|
| `GET /health` | public (no token unless headed/extension) | 404 | Token bootstrap for extension happens locally only |
| `GET /connect` | public (`{alive:true}`) | public (`{alive:true}`) | Probe path for tunnel liveness |
| `POST /connect` | public (rate-limited 300/min) | public (rate-limited) | Setup-key exchange for pair-agent |
| `POST /command` | auth (Bearer root OR scoped) | auth (scoped only, allowlisted commands) | Root token on tunnel = 403 |
| `POST /sidebar-chat` | auth | auth | Lets remote agent post into local sidebar |
| `POST /pair` | root-only | 404 | Pairing mint — local operator action |
| `POST /tunnel/{start,stop}` | root-only | 404 | Daemon configuration |
| `POST /token`, `DELETE /token/:id` | root-only | 404 | Scoped token mint/revoke |
| `GET /cookie-picker`, `GET /cookie-picker/*` | public UI, auth API | 404 | Local-only — reads local browser DBs |
| `GET /inspector`, `/inspector/events`, etc. | auth | 404 | Extension callback, local-only |
| `GET /welcome` | public | 404 | GStack Browser landing page, local-only |
| `GET /refs` | auth | 404 | Ref map — internal state |
| `GET /activity/stream` | Bearer OR HttpOnly `gstack_sse` cookie | 404 | SSE. ?token= query param no longer accepted |
| `GET /inspector/events` | Bearer OR HttpOnly `gstack_sse` cookie | 404 | SSE. Same cookie as /activity/stream |
| `POST /sse-session` | auth (Bearer) | 404 | Mints the view-only 30-min SSE session cookie |

**Tunnel surface denial logs.** Every rejection on the tunnel listener (`path_not_on_tunnel`, `root_token_on_tunnel`, `missing_scoped_token`, `disallowed_command:*`) is recorded asynchronously to `~/.gstack/security/attempts.jsonl` with timestamp, source IP (from `x-forwarded-for`), path, and method. Rate-capped at 60 writes/min globally to prevent log-flood DoS. Shares the attempt log with the prompt-injection scanner.

**SSE session cookies.** EventSource can't send Authorization headers, so the extension POSTs `/sse-session` once at bootstrap with the root Bearer and receives a 30-minute view-only cookie (`gstack_sse`, HttpOnly, SameSite=Strict). The cookie is valid ONLY for `/activity/stream` and `/inspector/events` — it is NOT a scoped token and cannot be used on `/command`. Scope isolation is enforced by the module boundary: `sse-session-cookie.ts` has no imports from `token-registry.ts`.

**Non-goal in this wave** (tracked as #1136): the cookie-import-browser path launches Chrome with `--remote-debugging-port=<random>`. On Windows with App-Bound Encryption v20, a same-user local process can connect to that port and exfiltrate decrypted v20 cookies — an elevation path relative to reading the SQLite DB directly (which can't decrypt v20 without DPAPI context). Fix direction is `--remote-debugging-pipe` instead of TCP; requires restructuring the CDP client.

### Bearer token auth

Every server session generates a random UUID token, written to the state file with mode 0o600 (owner-only read). Every HTTP request that mutates browser state must include `Authorization: Bearer <token>`. If the token doesn't match, the server returns 401.

This prevents other processes on the same machine from talking to your browse server. The cookie picker UI (`/cookie-picker`) and health check (`/health`) are exempt on the local listener — they're 127.0.0.1-bound and don't execute commands. On the tunnel listener nothing is exempt except `/connect`.

```

#### `browse/src/server.ts:62-67`

```typescript
// ─── Auth ───────────────────────────────────────────────────────
const AUTH_TOKEN = crypto.randomUUID();
initRegistry(AUTH_TOKEN);
const BROWSE_PORT = parseInt(process.env.BROWSE_PORT || '0', 10);
const IDLE_TIMEOUT_MS = parseInt(process.env.BROWSE_IDLE_TIMEOUT || '1800000', 10); // 30 min

```

#### `browse/src/server.ts:1020-1074`

```typescript
  const port = await findPort();
  LOCAL_LISTEN_PORT = port;

  // Launch browser (headless or headed with extension)
  // BROWSE_HEADLESS_SKIP=1 skips browser launch entirely (for HTTP-only testing)
  const skipBrowser = process.env.BROWSE_HEADLESS_SKIP === '1';
  if (!skipBrowser) {
    const headed = process.env.BROWSE_HEADED === '1';
    if (headed) {
      await browserManager.launchHeaded(AUTH_TOKEN);
      console.log(`[browse] Launched headed Chromium with extension`);
    } else {
      await browserManager.launch();
    }
  }

  const startTime = Date.now();

  // ─── Request handler factory ────────────────────────────────────
  //
  // Same logic serves both the local listener (bootstrap, CLI, sidebar) and
  // the tunnel listener (pairing + scoped-token commands).  The factory
  // closes over `surface` so the filter that runs before route dispatch
  // knows which socket accepted the request.
  //
  // On the tunnel surface: reject anything not in TUNNEL_PATHS (404), reject
  // root-token bearers (403), and require a scoped token for everything
  // except /connect.  Denials are logged to ~/.gstack/security/attempts.jsonl.
  const makeFetchHandler = (surface: Surface) => async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // ─── Tunnel surface filter (runs before any route dispatch) ──
    if (surface === 'tunnel') {
      const isGetConnect = req.method === 'GET' && url.pathname === '/connect';
      const allowed = TUNNEL_PATHS.has(url.pathname);
      if (!allowed && !isGetConnect) {
        logTunnelDenial(req, url, 'path_not_on_tunnel');
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (isRootRequest(req)) {
        logTunnelDenial(req, url, 'root_token_on_tunnel');
        return new Response(JSON.stringify({
          error: 'Root token rejected on tunnel surface',
          hint: 'Remote agents must pair via /connect to receive a scoped token.',
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname !== '/connect' && !getTokenInfo(req)) {
        logTunnelDenial(req, url, 'missing_scoped_token');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
    }
```

<!-- source-snippets:end -->
</details>
## 双监听器 tunnel

```mermaid
flowchart TD
  A[Local listener 127.0.0.1] --> A1[/health]
  A --> A2[/cookie-picker]
  A --> A3[/inspector/*]
  A --> A4[/command root or scoped]
  B[Tunnel listener 127.0.0.1] --> B1[/connect]
  B --> B2[/command scoped only]
  B --> B3[/sidebar-chat]
  C[ngrok] --> B
  D[remote agent] --> C
```

架构文档明确说安全属性来自物理端口分离，而不是依赖 header 判断。server 代码也在 tunnel surface 上先拒绝非 allowlist path、拒绝 root token、要求 scoped token。Sources: [ARCHITECTURE.md:88-121](../../../project-repos/gstack/ARCHITECTURE.md#L88-L121), [browse/src/server.ts:77-142](../../../project-repos/gstack/browse/src/server.ts#L77-L142), [browse/src/server.ts:1048-1074](../../../project-repos/gstack/browse/src/server.ts#L1048-L1074)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:88-121`

```markdown
### Dual-listener tunnel architecture (v1.6.0.0)

When a user runs `pair-agent --client`, the daemon starts an ngrok tunnel so a remote paired agent can drive the browser. Exposing the full daemon surface to the internet (even behind a random ngrok subdomain) meant `/health` leaked the root token on any Origin spoof, and `/cookie-picker` embedded the token into HTML that any caller could fetch.

The fix is **two HTTP listeners**, not one:

- **Local listener** (`127.0.0.1:LOCAL_PORT`) — always bound. Serves bootstrap (`/health` with token delivery), `/cookie-picker`, `/inspector/*`, `/welcome`, `/refs`, the sidebar-agent API, and the full command surface. Never forwarded.
- **Tunnel listener** (`127.0.0.1:TUNNEL_PORT`) — bound lazily on `/tunnel/start`, torn down on `/tunnel/stop`. Serves a locked allowlist: `/connect` (pairing ceremony, unauth + rate-limited), `/command` (scoped tokens only, further restricted to a browser-driving command allowlist), and `/sidebar-chat`. Everything else 404s.

ngrok forwards only the tunnel port. The security property comes from **physical port separation**: a tunnel caller cannot reach `/health` or `/cookie-picker` because those paths don't exist on that TCP socket. Header inference (check `x-forwarded-for`, check origin) is unreliable (ngrok header behavior changes; local proxies can add these headers); socket separation isn't.

| Endpoint | Local listener | Tunnel listener | Notes |
|---|---|---|---|
| `GET /health` | public (no token unless headed/extension) | 404 | Token bootstrap for extension happens locally only |
| `GET /connect` | public (`{alive:true}`) | public (`{alive:true}`) | Probe path for tunnel liveness |
| `POST /connect` | public (rate-limited 300/min) | public (rate-limited) | Setup-key exchange for pair-agent |
| `POST /command` | auth (Bearer root OR scoped) | auth (scoped only, allowlisted commands) | Root token on tunnel = 403 |
| `POST /sidebar-chat` | auth | auth | Lets remote agent post into local sidebar |
| `POST /pair` | root-only | 404 | Pairing mint — local operator action |
| `POST /tunnel/{start,stop}` | root-only | 404 | Daemon configuration |
| `POST /token`, `DELETE /token/:id` | root-only | 404 | Scoped token mint/revoke |
| `GET /cookie-picker`, `GET /cookie-picker/*` | public UI, auth API | 404 | Local-only — reads local browser DBs |
| `GET /inspector`, `/inspector/events`, etc. | auth | 404 | Extension callback, local-only |
| `GET /welcome` | public | 404 | GStack Browser landing page, local-only |
| `GET /refs` | auth | 404 | Ref map — internal state |
| `GET /activity/stream` | Bearer OR HttpOnly `gstack_sse` cookie | 404 | SSE. ?token= query param no longer accepted |
| `GET /inspector/events` | Bearer OR HttpOnly `gstack_sse` cookie | 404 | SSE. Same cookie as /activity/stream |
| `POST /sse-session` | auth (Bearer) | 404 | Mints the view-only 30-min SSE session cookie |

**Tunnel surface denial logs.** Every rejection on the tunnel listener (`path_not_on_tunnel`, `root_token_on_tunnel`, `missing_scoped_token`, `disallowed_command:*`) is recorded asynchronously to `~/.gstack/security/attempts.jsonl` with timestamp, source IP (from `x-forwarded-for`), path, and method. Rate-capped at 60 writes/min globally to prevent log-flood DoS. Shares the attempt log with the prompt-injection scanner.

**SSE session cookies.** EventSource can't send Authorization headers, so the extension POSTs `/sse-session` once at bootstrap with the root Bearer and receives a 30-minute view-only cookie (`gstack_sse`, HttpOnly, SameSite=Strict). The cookie is valid ONLY for `/activity/stream` and `/inspector/events` — it is NOT a scoped token and cannot be used on `/command`. Scope isolation is enforced by the module boundary: `sse-session-cookie.ts` has no imports from `token-registry.ts`.

**Non-goal in this wave** (tracked as #1136): the cookie-import-browser path launches Chrome with `--remote-debugging-port=<random>`. On Windows with App-Bound Encryption v20, a same-user local process can connect to that port and exfiltrate decrypted v20 cookies — an elevation path relative to reading the SQLite DB directly (which can't decrypt v20 without DPAPI context). Fix direction is `--remote-debugging-pipe` instead of TCP; requires restructuring the CDP client.
```

#### `browse/src/server.ts:77-142`

```typescript
// ─── Tunnel State ───────────────────────────────────────────────
//
// Dual-listener architecture: the daemon binds TWO HTTP listeners when a
// tunnel is active. The local listener serves bootstrap + CLI + sidebar
// (never exposed to ngrok). The tunnel listener serves only the pairing
// ceremony and scoped-token command endpoints (the ONLY port ngrok forwards).
//
// Security property comes from physical port separation: a tunnel caller
// cannot reach bootstrap endpoints because they live on a different TCP
// socket, not because of any per-request check.
let tunnelActive = false;
let tunnelUrl: string | null = null;
let tunnelListener: any = null;           // ngrok listener handle
let tunnelServer: ReturnType<typeof Bun.serve> | null = null; // tunnel HTTP listener

/** Which HTTP listener accepted this request. */
export type Surface = 'local' | 'tunnel';

/**
 * Paths reachable over the tunnel surface. Everything else returns 404.
 *
 * `/connect` is the only unauthenticated tunnel endpoint — POST for setup-key
 * exchange, GET for an `{alive: true}` probe used by /pair and /tunnel/start
 * to detect dead ngrok tunnels. Other paths in this set require a scoped
 * token via Authorization: Bearer.
 *
 * Updating this set is a deliberate security decision. Every addition widens
 * the tunnel attack surface.
 */
const TUNNEL_PATHS = new Set<string>([
  '/connect',
  '/command',
  '/sidebar-chat',
]);

/**
 * Commands reachable via POST /command over the tunnel surface. A paired
 * remote agent can drive the browser (goto, click, text, etc.) but cannot
 * configure the daemon, bootstrap new sessions, import cookies, or reach
 * extension-inspector state. This allowlist maps to the eng-review decision
 * logged in the CEO plan for sec-wave v1.6.0.0.
 */
export const TUNNEL_COMMANDS = new Set<string>([
  // Original 17
  'goto', 'click', 'text', 'screenshot',
  'html', 'links', 'forms', 'accessibility',
  'attrs', 'media', 'data',
  'scroll', 'press', 'type', 'select', 'wait', 'eval',
  // Tab + navigation primitives operator docs and CLI hints already promised
  'newtab', 'tabs', 'back', 'forward', 'reload',
  // Read/inspect/write operators paired agents need to be useful
  'snapshot', 'fill', 'url', 'closetab',
]);

/**
 * Pure gate: returns true iff the command is reachable over the tunnel surface.
 * Extracted from the inline /command handler so the gate logic is unit-testable
 * without standing up an HTTP listener. Behavior is identical to the inline
 * check; the function canonicalizes the command (so aliases hit the same set)
 * and returns false for null/undefined input.
 */
export function canDispatchOverTunnel(command: string | undefined | null): boolean {
  if (typeof command !== 'string' || command.length === 0) return false;
  const cmd = canonicalizeCommand(command);
  return TUNNEL_COMMANDS.has(cmd);
}
```

#### `browse/src/server.ts:1048-1074`

```typescript
  const makeFetchHandler = (surface: Surface) => async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // ─── Tunnel surface filter (runs before any route dispatch) ──
    if (surface === 'tunnel') {
      const isGetConnect = req.method === 'GET' && url.pathname === '/connect';
      const allowed = TUNNEL_PATHS.has(url.pathname);
      if (!allowed && !isGetConnect) {
        logTunnelDenial(req, url, 'path_not_on_tunnel');
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (isRootRequest(req)) {
        logTunnelDenial(req, url, 'root_token_on_tunnel');
        return new Response(JSON.stringify({
          error: 'Root token rejected on tunnel surface',
          hint: 'Remote agents must pair via /connect to receive a scoped token.',
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.pathname !== '/connect' && !getTokenInfo(req)) {
        logTunnelDenial(req, url, 'missing_scoped_token');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        });
      }
    }
```

<!-- source-snippets:end -->
</details>
## 命令面收敛

`tunnel` 面只允许浏览器驱动类命令，例如 `goto`、`click`、`text`、`screenshot`、`snapshot`、`fill`、`newtab`、`tabs` 等；server 对 `/command` 再次调用 `canDispatchOverTunnel` 检查。Sources: [browse/src/server.ts:112-142](../../../project-repos/gstack/browse/src/server.ts#L112-L142), [browse/src/server.ts:1792-1817](../../../project-repos/gstack/browse/src/server.ts#L1792-L1817)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/server.ts:112-142`

```typescript
/**
 * Commands reachable via POST /command over the tunnel surface. A paired
 * remote agent can drive the browser (goto, click, text, etc.) but cannot
 * configure the daemon, bootstrap new sessions, import cookies, or reach
 * extension-inspector state. This allowlist maps to the eng-review decision
 * logged in the CEO plan for sec-wave v1.6.0.0.
 */
export const TUNNEL_COMMANDS = new Set<string>([
  // Original 17
  'goto', 'click', 'text', 'screenshot',
  'html', 'links', 'forms', 'accessibility',
  'attrs', 'media', 'data',
  'scroll', 'press', 'type', 'select', 'wait', 'eval',
  // Tab + navigation primitives operator docs and CLI hints already promised
  'newtab', 'tabs', 'back', 'forward', 'reload',
  // Read/inspect/write operators paired agents need to be useful
  'snapshot', 'fill', 'url', 'closetab',
]);

/**
 * Pure gate: returns true iff the command is reachable over the tunnel surface.
 * Extracted from the inline /command handler so the gate logic is unit-testable
 * without standing up an HTTP listener. Behavior is identical to the inline
 * check; the function canonicalizes the command (so aliases hit the same set)
 * and returns false for null/undefined input.
 */
export function canDispatchOverTunnel(command: string | undefined | null): boolean {
  if (typeof command !== 'string' || command.length === 0) return false;
  const cmd = canonicalizeCommand(command);
  return TUNNEL_COMMANDS.has(cmd);
}
```

#### `browse/src/server.ts:1792-1817`

```typescript
      // ─── Command endpoint (accepts both root AND scoped tokens) ────
      // Must be checked BEFORE the blanket root-only auth gate below,
      // because scoped tokens from /connect are valid for /command.
      if (url.pathname === '/command' && req.method === 'POST') {
        const tokenInfo = getTokenInfo(req);
        if (!tokenInfo) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        resetIdleTimer();
        const body = await req.json() as any;
        // Tunnel surface: only commands in TUNNEL_COMMANDS are allowed.
        // Paired remote agents drive the browser but cannot configure the
        // daemon, launch new browsers, import cookies, or rotate tokens.
        if (surface === 'tunnel') {
          if (!canDispatchOverTunnel(body?.command)) {
            logTunnelDenial(req, url, `disallowed_command:${body?.command}`);
            return new Response(JSON.stringify({
              error: `Command '${body?.command}' is not allowed over the tunnel surface`,
              hint: `Tunnel commands: ${[...TUNNEL_COMMANDS].sort().join(', ')}`,
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          }
        }
        return handleCommand(body, tokenInfo);
```

<!-- source-snippets:end -->
</details>
## 内容安全层

页面内容是攻击面。`content-security.ts` 提供 datamarking、隐藏元素/ARIA injection 检测、untrusted envelope 和可注册内容过滤器。`commands.ts` 还把 `snapshot` 纳入 `PAGE_CONTENT_COMMANDS`，因为 aria-label 也可能是攻击者控制的文本。Sources: [browse/src/content-security.ts:1-11](../../../project-repos/gstack/browse/src/content-security.ts#L1-L11), [browse/src/content-security.ts:60-88](../../../project-repos/gstack/browse/src/content-security.ts#L60-L88), [browse/src/content-security.ts:198-244](../../../project-repos/gstack/browse/src/content-security.ts#L198-L244), [browse/src/commands.ts:52-80](../../../project-repos/gstack/browse/src/commands.ts#L52-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/content-security.ts:1-11`

```typescript
/**
 * Content security layer for pair-agent browser sharing.
 *
 * Four defense layers:
 *   1. Datamarking — watermark text output to detect exfiltration
 *   2. Hidden element stripping — remove invisible/deceptive elements from output
 *   3. Content filter hooks — extensible URL/content filter pipeline
 *   4. Instruction block hardening — SECURITY section in agent instructions
 *
 * This module handles layers 1-3. Layer 4 is in cli.ts.
 */
```

#### `browse/src/content-security.ts:60-88`

```typescript
// ─── Hidden Element Stripping (Layer 2) ─────────────────────────

/** Injection-like patterns in ARIA labels */
const ARIA_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /you\s+are\s+(now|a)\s+/i,
  /system\s*:\s*/i,
  /\bdo\s+not\s+(follow|obey|listen)/i,
  /\bexecute\s+(the\s+)?following/i,
  /\bforget\s+(everything|all|your)/i,
  /\bnew\s+instructions?\s*:/i,
];

/**
 * Detect hidden elements and ARIA injection on a page.
 * Marks hidden elements with data-gstack-hidden attribute.
 * Returns descriptions of what was found for logging.
 *
 * Detection criteria:
 *   - opacity < 0.1
 *   - font-size < 1px
 *   - off-screen (positioned far outside viewport)
 *   - visibility:hidden or display:none with text content
 *   - same foreground/background color
 *   - clip/clip-path hiding
 *   - ARIA labels with injection patterns
 */
export async function markHiddenElements(page: Page | Frame): Promise<string[]> {
  return page.evaluate((ariaPatterns: string[]) => {
```

#### `browse/src/content-security.ts:198-244`

```typescript
// ─── Content Envelope (wrapping) ────────────────────────────────

const ENVELOPE_BEGIN = '═══ BEGIN UNTRUSTED WEB CONTENT ═══';
const ENVELOPE_END = '═══ END UNTRUSTED WEB CONTENT ═══';

/**
 * Defuse envelope sentinels that appear inside attacker-controlled page
 * content. Any raw BEGIN/END marker inside `content` gets a zero-width
 * space spliced through CONTENT so the marker still renders visibly but
 * no longer matches the envelope grep the LLM anchors on.
 *
 * Both the wrap path (full-page content) and the split path (scoped
 * snapshots) must funnel untrusted text through this helper before
 * emitting the outer envelope, otherwise a page whose accessibility
 * tree contains the literal sentinel can close the envelope early and
 * forge a fake "trusted" section in the LLM's view.
 */
export function escapeEnvelopeSentinels(content: string): string {
  const zwsp = '\u200B';
  return content
    .replace(/═══ BEGIN UNTRUSTED WEB CONTENT ═══/g, `═══ BEGIN UNTRUSTED WEB C${zwsp}ONTENT ═══`)
    .replace(/═══ END UNTRUSTED WEB CONTENT ═══/g, `═══ END UNTRUSTED WEB C${zwsp}ONTENT ═══`);
}

/**
 * Wrap page content in a trust boundary envelope for scoped tokens.
 * Escapes envelope markers in content to prevent boundary escape attacks.
 */
export function wrapUntrustedPageContent(
  content: string,
  command: string,
  filterWarnings?: string[],
): string {
  const safeContent = escapeEnvelopeSentinels(content);

  const parts: string[] = [];

  if (filterWarnings && filterWarnings.length > 0) {
    parts.push(`⚠ CONTENT WARNINGS: ${filterWarnings.join('; ')}`);
  }

  parts.push(ENVELOPE_BEGIN);
  parts.push(safeContent);
  parts.push(ENVELOPE_END);

  return parts.join('\n');
}
```

#### `browse/src/commands.ts:52-80`

```typescript
/** Commands that return untrusted third-party page content */
export const PAGE_CONTENT_COMMANDS = new Set([
  'text', 'html', 'links', 'forms', 'accessibility', 'attrs',
  'console', 'dialog',
  'media', 'data',
  'ux-audit',
  // snapshot emits aria tree with attacker-controlled aria-label strings.
  // The sidebar's system prompt pushes agents to run `$B snapshot` as the
  // primary read path, so unwrapped snapshot output is the biggest ingress
  // for indirect prompt injection. Envelope it like every other read.
  'snapshot',
]);

/**
 * Subset of PAGE_CONTENT_COMMANDS whose output is derived from the
 * live page DOM. These channels can carry hidden elements or
 * ARIA-injection payloads that the centralized envelope wrap alone
 * does not neutralize, so the scoped-token pipeline runs
 * `markHiddenElements` on the page before the read and surfaces any
 * hits as CONTENT WARNINGS to the LLM.
 *
 * `console`, `dialog` intentionally excluded — they read separate
 * runtime state (console capture, dialog events), not the DOM tree.
 */
export const DOM_CONTENT_COMMANDS = new Set([
  'text', 'html', 'links', 'forms', 'accessibility', 'attrs',
  'media', 'data', 'ux-audit',
]);

```

<!-- source-snippets:end -->
</details>
```mermaid
flowchart TD
  A[DOM/page output] --> B[markHiddenElements]
  B --> C[getCleanTextWithStripping]
  C --> D[escapeEnvelopeSentinels]
  D --> E[UNTRUSTED envelope]
  E --> F[LLM sees warnings + bounded content]
```

## Prompt injection 防御

`ARCHITECTURE.md` 记录了 sidebar agent 的分层防御：L1-L3 内容安全、L4 本地 ML classifier、L4b transcript classifier、L5 canary token、L6 ensemble combiner。`security.ts` 只包含纯字符串和 ML-free 部分，避免 compiled Bun binary 加载 native ONNX runtime。Sources: [ARCHITECTURE.md:147-165](../../../project-repos/gstack/ARCHITECTURE.md#L147-L165), [browse/src/security.ts:1-20](../../../project-repos/gstack/browse/src/security.ts#L1-L20), [browse/src/security.ts:28-51](../../../project-repos/gstack/browse/src/security.ts#L28-L51), [browse/src/security.ts:87-148](../../../project-repos/gstack/browse/src/security.ts#L87-L148)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `ARCHITECTURE.md:147-165`

```markdown
### Prompt injection defense (sidebar agent)

The Chrome sidebar agent has tools (Bash, Read, Glob, Grep, WebFetch) and reads hostile web pages, so it's the part of gstack most exposed to prompt injection. Defense is layered, not single-point.

1. **L1-L3 content security (`browse/src/content-security.ts`).** Runs on every page-content command and every tool output: datamarking, hidden-element strip, ARIA regex, URL blocklist, and a trust-boundary envelope wrapper. Applied at both the server and the agent.

2. **L4 ML classifier — TestSavantAI (`browse/src/security-classifier.ts`).** A 22MB BERT-small ONNX model (int8 quantized) bundled with the agent. Runs locally, no network. Scans every user message and every Read/Glob/Grep/WebFetch tool output before Claude sees it. Opt-in 721MB DeBERTa-v3 ensemble via `GSTACK_SECURITY_ENSEMBLE=deberta`.

3. **L4b transcript classifier.** A Claude Haiku pass that looks at the full conversation shape (user message, tool calls, tool output), not just text. Gated by `LOG_ONLY: 0.40` so most clean traffic skips the paid call.

4. **L5 canary token (`browse/src/security.ts`).** A random token injected into the system prompt at session start. Rolling-buffer detection across `text_delta` and `input_json_delta` streams catches the token if it shows up anywhere in Claude's output, tool arguments, URLs, or file writes. Deterministic BLOCK — if the token leaks, the attacker convinced Claude to reveal the system prompt, and the session ends.

5. **L6 ensemble combiner (`combineVerdict`).** BLOCK requires agreement from two ML classifiers at >= `WARN` (0.60), not a single confident hit. This is the Stack Overflow instruction-writing false-positive mitigation. On tool-output scans, single-layer high confidence BLOCKs directly — the content wasn't user-authored, so the FP concern doesn't apply.

**Critical constraint:** `security-classifier.ts` runs only in the sidebar-agent process, never in the compiled browse binary. `@huggingface/transformers` v4 requires `onnxruntime-node`, which fails `dlopen` from Bun compile's temp extract directory. Only the pure-string pieces (canary inject/check, verdict combiner, attack log, status) are in `security.ts`, which is safe to import from `server.ts`.

**Env knobs:** `GSTACK_SECURITY_OFF=1` is a real kill switch (skips ML scan, canary still injects). Model cache at `~/.gstack/models/testsavant-small/` (112MB, first run) and `~/.gstack/models/deberta-v3-injection/` (721MB, opt-in only). Attack log at `~/.gstack/security/attempts.jsonl` (salted sha256 + domain, rotates at 10MB, 5 generations). Per-device salt at `~/.gstack/security/device-salt` (0600), cached in-process to survive FS-unwritable environments.

**Visibility.** The sidebar header shows a shield icon (green/amber/red) polled via `/sidebar-chat`. A centered banner appears on canary leak or BLOCK verdict with the exact layer scores. `bin/gstack-security-dashboard` aggregates local attempts; `supabase/functions/community-pulse` aggregates opt-in community telemetry across users.
```

#### `browse/src/security.ts:1-20`

```typescript
/**
 * Security module: prompt injection defense layer.
 *
 * This file contains the PURE-STRING / ML-FREE parts of the security stack.
 * Safe to import from the compiled `browse/dist/browse` binary because it
 * does not load onnxruntime-node or other native modules.
 *
 * ML classifier code lives in `security-classifier.ts`, which is only
 * imported from `sidebar-agent.ts` (runs as non-compiled bun script).
 *
 * Layering (see CEO plan 2026-04-19-prompt-injection-guard.md):
 *   L1-L3: content-security.ts (existing, datamarking / DOM strip / URL blocklist)
 *   L4:    ML content classifier (TestSavantAI via security-classifier.ts)
 *   L4b:   ML transcript classifier (Haiku via security-classifier.ts)
 *   L5:    Canary (this module — inject + check)
 *   L6:    Threshold aggregation (this module — combineVerdict)
 *
 * Cross-process state lives at ~/.gstack/security/session-state.json
 * (per eng review finding 1.2 — server.ts and sidebar-agent.ts are different processes).
 */
```

#### `browse/src/security.ts:28-51`

```typescript
// ─── Thresholds + verdict types ──────────────────────────────

/**
 * Confidence thresholds for classifier output. Calibrated against BrowseSafe-Bench
 * smoke (200 cases) + benign corpus (50 pages). BLOCK is intentionally conservative.
 * See plan §"Threshold Spec" for calibration methodology.
 */
export const THRESHOLDS = {
  BLOCK: 0.85,
  WARN: 0.75,
  LOG_ONLY: 0.40,
  // Single-layer BLOCK threshold for content classifiers (testsavant, deberta)
  // — intentionally HIGHER than BLOCK because these layers are label-less and
  // cannot distinguish "this is an injection" from "this looks like phishing
  // aimed at the user." On the 500-case BrowseSafe-Bench smoke, testsavant
  // alone at >= 0.85 generated 34+ false positives on benign phishing-flavored
  // content. At 0.92 the FP rate drops below the 25% ceiling while detection
  // stays above the 55% floor (v2 measured 56.2% / 22.9%).
  // The transcript_classifier keeps a separate, label-gated solo path that
  // requires meta.verdict === 'block' + confidence >= BLOCK (0.85). It
  // doesn't need the higher threshold because Haiku's block label is
  // inherently more selective than testsavant's raw confidence.
  SOLO_CONTENT_BLOCK: 0.92,
} as const;
```

#### `browse/src/security.ts:87-148`

```typescript
// ─── Verdict combiner (ensemble rule, label-first for transcript) ────

/**
 * Combine per-layer signals into a single verdict. Post-v2 ensemble rule
 * (v1.5.2.0+) is label-first for the transcript layer: Haiku's verdict
 * label is the primary signal, not its self-reported confidence. Other ML
 * layers (testsavant_content, deberta_content) remain confidence-based
 * because they emit only a scalar.
 *
 * BLOCK requires 2 block-votes across testsavant + deberta + transcript.
 * Vote rules:
 *   - testsavant_content / deberta_content: block-vote iff confidence >= WARN
 *   - transcript_classifier + meta.verdict === 'block' + confidence >= LOG_ONLY:
 *     block-vote (label-first; LOG_ONLY floor is the hallucination guard —
 *     a block label with confidence < 0.40 is treated as a warn-vote because
 *     it likely signals model breakage, not a real block decision)
 *   - transcript_classifier + meta.verdict === 'warn': warn-vote only
 *   - transcript_classifier + missing meta.verdict (backward-compat): warn-vote
 *     only when confidence >= WARN; missing meta NEVER block-votes
 *
 * Warn-votes are soft signals: retained in the signals array for surfacing
 * in the review banner, but they do NOT count toward the 2-of-N block count.
 *
 * Canary leak (confidence >= 1.0 on 'canary' layer) always BLOCKs — it's
 * deterministic, not a probabilistic signal.
 *
 * toolOutput branch: single-layer BLOCK (confidence >= 0.85) on any ML layer
 * kills the session even without cross-confirm. Tool outputs aren't
 * user-authored, so the SO-FP mitigation that motivated the 2-of-N rule
 * for user input doesn't apply.
 */
export interface CombineVerdictOpts {
  toolOutput?: boolean;
}

type VoteStrength = 'block' | 'warn' | 'none';

function classifyTranscript(signal: LayerSignal): VoteStrength {
  const verdict = signal.meta?.verdict as string | undefined;
  const confidence = signal.confidence;

  if (verdict === 'block') {
    // Hallucination guard: verdict=block with confidence < LOG_ONLY drops
    // to warn-vote. Prevents a malformed low-confidence block from becoming
    // authoritative.
    return confidence >= THRESHOLDS.LOG_ONLY ? 'block' : 'warn';
  }
  if (verdict === 'warn') {
    return 'warn';
  }
  if (verdict === 'safe') {
    return 'none';
  }
  // Backward-compat: signal with no meta.verdict (old tests, pre-v2 cached
  // signals). Confidence-only fallback: warn-vote when >= WARN, else no vote.
  // Missing meta NEVER block-votes — the old confidence-only block-vote rule
  // is deprecated for the transcript layer.
  if (confidence >= THRESHOLDS.WARN) return 'warn';
  return 'none';
}

export function combineVerdict(signals: LayerSignal[], opts: CombineVerdictOpts = {}): SecurityResult {
```

<!-- source-snippets:end -->
</details>
## CDP escape hatch

`$B cdp` 是默认拒绝策略：每个允许的 CDP method 都必须声明 domain、method、scope、output 和 justification；危险方法如 `Runtime.evaluate`、`Network.getResponseBody`、`Page.navigate` 不在 allowlist 中。Sources: [browse/src/cdp-allowlist.ts:1-17](../../../project-repos/gstack/browse/src/cdp-allowlist.ts#L1-L17), [browse/src/cdp-allowlist.ts:30-214](../../../project-repos/gstack/browse/src/cdp-allowlist.ts#L30-L214)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `browse/src/cdp-allowlist.ts:1-17`

```typescript
/**
 * CDP method allow-list (T2: deny-default).
 *
 * Codex outside-voice T2: allow-default with a deny-list is backwards because
 * Target.*, Browser.*, Runtime.evaluate, Page.addScriptToEvaluateOnNewDocument,
 * Fetch.*, IO.read, etc. are all dangerous and easy to forget. Default-deny
 * inverts the failure mode: missing a method means it's blocked (annoying),
 * not exposed (silent compromise).
 *
 * Each entry has:
 *   - domain.method     unique CDP identifier
 *   - scope             "tab" | "browser" — controls T7 mutex tier
 *   - output            "trusted" | "untrusted" — wraps result if "untrusted"
 *   - justification     why this method is safe to allow
 *
 * Add entries via PR. CI lint (cdp-allowlist.test.ts) ensures every entry has all 4 fields.
 */
```

#### `browse/src/cdp-allowlist.ts:30-214`

```typescript
export const CDP_ALLOWLIST: ReadonlyArray<CdpAllowEntry> = Object.freeze([
  // ─── Accessibility (read-only) ─────────────────────────────
  {
    domain: 'Accessibility',
    method: 'getFullAXTree',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Read-only AX tree extraction. Output is third-party page content; wrap in UNTRUSTED.',
  },
  {
    domain: 'Accessibility',
    method: 'getPartialAXTree',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Read-only AX tree subtree by node. Output is third-party page content.',
  },
  {
    domain: 'Accessibility',
    method: 'getRootAXNode',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Read-only root AX node accessor.',
  },
  // ─── DOM (read-only inspection) ────────────────────────────
  {
    domain: 'DOM',
    method: 'describeNode',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Inspect a DOM node by backend ID; pure read.',
  },
  {
    domain: 'DOM',
    method: 'getBoxModel',
    scope: 'tab',
    output: 'trusted',
    justification: 'Pure geometric data (box dimensions). No page content leaks; safe trusted.',
  },
  {
    domain: 'DOM',
    method: 'getNodeForLocation',
    scope: 'tab',
    output: 'trusted',
    justification: 'Pure coordinate→nodeId mapping; no content leak.',
  },
  // ─── CSS (read-only) ───────────────────────────────────────
  {
    domain: 'CSS',
    method: 'getMatchedStylesForNode',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Read computed cascade for a node; output may contain attacker-controlled selectors.',
  },
  {
    domain: 'CSS',
    method: 'getComputedStyleForNode',
    scope: 'tab',
    output: 'trusted',
    justification: 'Computed style values are bounded (CSS keywords/numbers); safe trusted.',
  },
  {
    domain: 'CSS',
    method: 'getInlineStylesForNode',
    scope: 'tab',
    output: 'untrusted',
    justification: 'Inline style content may contain attacker-controlled custom-property values.',
  },
  // ─── Performance metrics ───────────────────────────────────
  {
    domain: 'Performance',
    method: 'getMetrics',
    scope: 'tab',
    output: 'trusted',
    justification: 'Pure numeric metrics (timing, layout count); safe.',
  },
  {
    domain: 'Performance',
    method: 'enable',
    scope: 'tab',
    output: 'trusted',
    justification: 'Domain enable; no content; required prerequisite for getMetrics.',
  },
  {
    domain: 'Performance',
    method: 'disable',
    scope: 'tab',
    output: 'trusted',
    justification: 'Domain disable; no content.',
  },
  // ─── Tracing (event capture) ───────────────────────────────
  // NOTE: Tracing.start can capture cross-tab data depending on categories.
  // We mark it browser-scoped to acquire the global lock when in use.
  {
    domain: 'Tracing',
    method: 'start',
    scope: 'browser',
    output: 'trusted',
    justification: 'Trace category capture. Browser-scoped to serialize against other CDP ops.',
  },
  {
    domain: 'Tracing',
    method: 'end',
    scope: 'browser',
    output: 'untrusted',
    justification: 'Trace dump may contain URLs and page data; wrap.',
  },
  // ─── Emulation (viewport/device) ───────────────────────────
  {
    domain: 'Emulation',
    method: 'setDeviceMetricsOverride',
    scope: 'tab',
    output: 'trusted',
    justification: 'Viewport/scale override on the active tab.',
  },
  {
    domain: 'Emulation',
    method: 'clearDeviceMetricsOverride',
    scope: 'tab',
    output: 'trusted',
    justification: 'Clear viewport override.',
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [Browse 运行时](browse-runtime.md)
- [测试、CI 与质量门](testing-ci-quality.md)
- [OpenClaw 集成](openclaw-integration.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [design/src/cli.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/design/src/cli.ts)
- [design/src/commands.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/design/src/commands.ts)
- [design/src/generate.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/design/src/generate.ts)
- [design/src/design-to-code.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/design/src/design-to-code.ts)
- [make-pdf/src/cli.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/make-pdf/src/cli.ts)
- [make-pdf/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/make-pdf/SKILL.md)

</details>

# 设计与 PDF 工具

除了 Browse，gstack 还内置了两个面向产物的二进制工具：`design` 负责 AI mockup、视觉比较和 design-to-code prompt；`make-pdf` 负责把 Markdown 转为出版质量 PDF。README 把 design-shotgun → design-html 描述为并行 sprint 的关键能力。Sources: [README.md:259-268](../../../project-repos/gstack/README.md#L259-L268), [package.json:7-19](../../../project-repos/gstack/package.json#L7-L19)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:259-268`

```markdown
## Parallel sprints

gstack works well with one sprint. It gets interesting with ten running at once.

**Design is at the heart.** `/design-consultation` builds your design system from scratch, researches what's out there, proposes creative risks, and writes `DESIGN.md`. But the real magic is the shotgun-to-HTML pipeline.

**`/design-shotgun` is how you explore.** You describe what you want. It generates 4-6 AI mockup variants using GPT Image. Then it opens a comparison board in your browser with all variants side by side. You pick favorites, leave feedback ("more whitespace", "bolder headline", "lose the gradient"), and it generates a new round. Repeat until you love something. Taste memory kicks in after a few rounds so it starts biasing toward what you actually like. No more describing your vision in words and hoping the AI gets it. You see options, pick the good ones, and iterate visually.

**`/design-html` makes it real.** Take that approved mockup (from `/design-shotgun`, a CEO plan, a design review, or just a description) and turn it into production-quality HTML/CSS. Not the kind of AI HTML that looks fine at one viewport width and breaks everywhere else. This uses Pretext for computed text layout: text actually reflows on resize, heights adjust to content, layouts are dynamic. 30KB overhead, zero dependencies. It detects your framework (React, Svelte, Vue) and outputs the right format. Smart API routing picks different Pretext patterns depending on whether it's a landing page, dashboard, form, or card layout. The output is something you'd actually ship, not a demo.

```

#### `package.json:7-19`

```json
  "bin": {
    "browse": "./browse/dist/browse",
    "make-pdf": "./make-pdf/dist/pdf"
  },
  "scripts": {
    "build": "bun run vendor:xterm && bun run gen:skill-docs --host all; bun build --compile browse/src/cli.ts --outfile browse/dist/browse && bun build --compile browse/src/find-browse.ts --outfile browse/dist/find-browse && bun build --compile design/src/cli.ts --outfile design/dist/design && bun build --compile make-pdf/src/cli.ts --outfile make-pdf/dist/pdf && bun build --compile bin/gstack-global-discover.ts --outfile bin/gstack-global-discover && bash browse/scripts/build-node-server.sh && git rev-parse HEAD > browse/dist/.version && git rev-parse HEAD > design/dist/.version && git rev-parse HEAD > make-pdf/dist/.version && chmod +x browse/dist/browse browse/dist/find-browse design/dist/design make-pdf/dist/pdf bin/gstack-global-discover && (rm -f .*.bun-build || true)",
    "vendor:xterm": "mkdir -p extension/lib && cp node_modules/xterm/lib/xterm.js extension/lib/xterm.js && cp node_modules/xterm/css/xterm.css extension/lib/xterm.css && cp node_modules/xterm-addon-fit/lib/xterm-addon-fit.js extension/lib/xterm-addon-fit.js",
    "dev:make-pdf": "bun run make-pdf/src/cli.ts",
    "dev:design": "bun run design/src/cli.ts",
    "gen:skill-docs": "bun run scripts/gen-skill-docs.ts",
    "dev": "bun run browse/src/cli.ts",
    "server": "bun run browse/src/server.ts",
    "test": "bun test browse/test/ test/ make-pdf/test/ --ignore 'test/skill-e2e-*.test.ts' --ignore test/skill-llm-eval.test.ts --ignore test/skill-routing-e2e.test.ts --ignore test/codex-e2e.test.ts --ignore test/gemini-e2e.test.ts && (bun run slop:diff 2>/dev/null || true)",
```

<!-- source-snippets:end -->
</details>
## Design CLI

`design/src/cli.ts` 明确说明它是 stateless CLI：每次调用解析参数、解析 OpenAI auth、执行 API 调用并写入 PNG/HTML，多轮迭代状态保存在 `/tmp` JSON 文件里。Sources: [design/src/cli.ts:1-13](../../../project-repos/gstack/design/src/cli.ts#L1-L13)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `design/src/cli.ts:1-13`

```typescript
/**
 * gstack design CLI — stateless CLI for AI-powered design generation.
 *
 * Unlike the browse binary (persistent Chromium daemon), the design binary
 * is stateless: each invocation makes API calls and writes files. Session
 * state for multi-turn iteration is a JSON file in /tmp.
 *
 * Flow:
 *   1. Parse command + flags from argv
 *   2. Resolve auth (~/. gstack/openai.json → OPENAI_API_KEY → guided setup)
 *   3. Execute command (API call → write PNG/HTML)
 *   4. Print result JSON to stdout
 */
```

<!-- source-snippets:end -->
</details>
```mermaid
flowchart TD
  A[$D command] --> B[parseArgs]
  B --> C[resolveApiKey]
  C --> D{command}
  D --> E[generate image]
  D --> F[variants]
  D --> G[compare board]
  D --> H[prompt from mockup]
  D --> I[verify live screenshot]
  E --> J[PNG + session JSON]
  G --> K[HTML board]
  H --> L[implementation prompt]
```

命令 registry 覆盖 `generate`、`variants`、`iterate`、`check`、`compare`、`diff`、`evolve`、`verify`、`prompt`、`extract`、`gallery`、`serve`、`setup`。Sources: [design/src/commands.ts:12-82](../../../project-repos/gstack/design/src/commands.ts#L12-L82), [design/src/cli.ts:118-254](../../../project-repos/gstack/design/src/cli.ts#L118-L254)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `design/src/commands.ts:12-82`

```typescript
export const COMMANDS = new Map<string, {
  description: string;
  usage: string;
  flags?: string[];
}>([
  ["generate", {
    description: "Generate a UI mockup from a design brief",
    usage: "generate --brief \"...\" --output /path.png",
    flags: ["--brief", "--brief-file", "--output", "--check", "--retry", "--size", "--quality"],
  }],
  ["variants", {
    description: "Generate N design variants from a brief",
    usage: "variants --brief \"...\" --count 3 --output-dir /path/",
    flags: ["--brief", "--brief-file", "--count", "--output-dir", "--size", "--quality", "--viewports"],
  }],
  ["iterate", {
    description: "Iterate on an existing mockup with feedback",
    usage: "iterate --session /path/session.json --feedback \"...\" --output /path.png",
    flags: ["--session", "--feedback", "--output"],
  }],
  ["check", {
    description: "Vision-based quality check on a mockup",
    usage: "check --image /path.png --brief \"...\"",
    flags: ["--image", "--brief"],
  }],
  ["compare", {
    description: "Generate HTML comparison board for user review",
    usage: "compare --images /path/*.png --output /path/board.html [--serve]",
    flags: ["--images", "--output", "--serve", "--timeout"],
  }],
  ["diff", {
    description: "Visual diff between two mockups",
    usage: "diff --before old.png --after new.png",
    flags: ["--before", "--after", "--output"],
  }],
  ["evolve", {
    description: "Generate improved mockup from existing screenshot",
    usage: "evolve --screenshot current.png --brief \"make it calmer\" --output /path.png",
    flags: ["--screenshot", "--brief", "--output"],
  }],
  ["verify", {
    description: "Compare live site screenshot against approved mockup",
    usage: "verify --mockup approved.png --screenshot live.png",
    flags: ["--mockup", "--screenshot", "--output"],
  }],
  ["prompt", {
    description: "Generate structured implementation prompt from approved mockup",
    usage: "prompt --image approved.png",
    flags: ["--image"],
  }],
  ["extract", {
    description: "Extract design language from approved mockup into DESIGN.md",
    usage: "extract --image approved.png",
    flags: ["--image"],
  }],
  ["gallery", {
    description: "Generate HTML timeline of all design explorations for a project",
    usage: "gallery --designs-dir ~/.gstack/projects/$SLUG/designs/ --output /path/gallery.html",
    flags: ["--designs-dir", "--output"],
  }],
  ["serve", {
    description: "Serve comparison board over HTTP and collect user feedback",
    usage: "serve --html /path/board.html [--timeout 600]",
    flags: ["--html", "--timeout"],
  }],
  ["setup", {
    description: "Guided API key setup + smoke test",
    usage: "setup",
    flags: [],
  }],
]);
```

#### `design/src/cli.ts:118-254`

```typescript
  switch (command) {
    case "generate":
      await generate({
        brief: flags.brief as string,
        briefFile: flags["brief-file"] as string,
        output: (flags.output as string) || "/tmp/gstack-mockup.png",
        check: !!flags.check,
        retry: flags.retry ? parseInt(flags.retry as string) : 0,
        size: flags.size as string,
        quality: flags.quality as string,
      });
      break;

    case "check":
      await checkCommand(flags.image as string, flags.brief as string);
      break;

    case "compare": {
      // Parse --images as glob or multiple files
      const imagesArg = flags.images as string;
      const images = await resolveImagePaths(imagesArg);
      const outputPath = (flags.output as string) || "/tmp/gstack-design-board.html";
      compare({ images, output: outputPath });
      // If --serve flag is set, start HTTP server for the board
      if (flags.serve) {
        await serve({
          html: outputPath,
          timeout: flags.timeout ? parseInt(flags.timeout as string) : 600,
        });
      }
      break;
    }

    case "prompt": {
      const promptImage = flags.image as string;
      if (!promptImage) {
        console.error("--image is required");
        process.exit(1);
      }
      console.error(`Generating implementation prompt from ${promptImage}...`);
      const proc2 = Bun.spawn(["git", "rev-parse", "--show-toplevel"]);
      const root = (await new Response(proc2.stdout).text()).trim();
      const d2c = await generateDesignToCodePrompt(promptImage, root || undefined);
      console.log(JSON.stringify(d2c, null, 2));
      break;
    }

    case "setup":
      await runSetup();
      break;

    case "variants":
      await variants({
        brief: flags.brief as string,
        briefFile: flags["brief-file"] as string,
        count: flags.count ? parseInt(flags.count as string) : 3,
        outputDir: (flags["output-dir"] as string) || "/tmp/gstack-variants/",
        size: flags.size as string,
        quality: flags.quality as string,
        viewports: flags.viewports as string,
      });
      break;

    case "iterate":
      await iterate({
        session: flags.session as string,
        feedback: flags.feedback as string,
        output: (flags.output as string) || "/tmp/gstack-iterate.png",
      });
      break;

    case "extract": {
      const imagePath = flags.image as string;
      if (!imagePath) {
        console.error("--image is required");
        process.exit(1);
      }
      console.error(`Extracting design language from ${imagePath}...`);
      const extracted = await extractDesignLanguage(imagePath);
      const proc = Bun.spawn(["git", "rev-parse", "--show-toplevel"]);
      const repoRoot = (await new Response(proc.stdout).text()).trim();
      if (repoRoot) {
        updateDesignMd(repoRoot, extracted, imagePath);
      }
      console.log(JSON.stringify(extracted, null, 2));
      break;
    }

    case "diff": {
      const before = flags.before as string;
      const after = flags.after as string;
      if (!before || !after) {
        console.error("--before and --after are required");
        process.exit(1);
      }
      console.error(`Comparing ${before} vs ${after}...`);
      const diffResult = await diffMockups(before, after);
      console.log(JSON.stringify(diffResult, null, 2));
      break;
    }

    case "verify": {
      const mockup = flags.mockup as string;
      const screenshot = flags.screenshot as string;
      if (!mockup || !screenshot) {
        console.error("--mockup and --screenshot are required");
        process.exit(1);
      }
      console.error(`Verifying implementation against approved mockup...`);
      const verifyResult = await verifyAgainstMockup(mockup, screenshot);
      console.error(`Match: ${verifyResult.matchScore}/100 — ${verifyResult.pass ? "PASS" : "FAIL"}`);
      console.log(JSON.stringify(verifyResult, null, 2));
      break;
    }

    case "evolve":
      await evolve({
        screenshot: flags.screenshot as string,
        brief: flags.brief as string,
        output: (flags.output as string) || "/tmp/gstack-evolved.png",
... snippet truncated ...
```

<!-- source-snippets:end -->
</details>
## 图像生成与实现提示

`generate.ts` 使用 OpenAI Responses API 的 `image_generation` tool，默认生成 `1536x1024`、`high` quality，并可选做视觉质量检查和重试。`design-to-code.ts` 则用 GPT-4o vision 从批准的 mockup 中提取颜色、排版、布局和组件，输出 JSON 结构化实现提示。Sources: [design/src/generate.ts:29-92](../../../project-repos/gstack/design/src/generate.ts#L29-L92), [design/src/generate.ts:97-160](../../../project-repos/gstack/design/src/generate.ts#L97-L160), [design/src/design-to-code.ts:1-18](../../../project-repos/gstack/design/src/design-to-code.ts#L1-L18), [design/src/design-to-code.ts:22-88](../../../project-repos/gstack/design/src/design-to-code.ts#L22-L88)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `design/src/generate.ts:29-92`

```typescript
/**
 * Call OpenAI Responses API with image_generation tool.
 * Returns the response ID and base64 image data.
 */
async function callImageGeneration(
  apiKey: string,
  prompt: string,
  size: string,
  quality: string,
): Promise<{ responseId: string; imageData: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: prompt,
        tools: [{
          type: "image_generation",
          size,
          quality,
        }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 403 && error.includes("organization must be verified")) {
        throw new Error(
          "OpenAI organization verification required.\n"
          + "Go to https://platform.openai.com/settings/organization to verify.\n"
          + "After verification, wait up to 15 minutes for access to propagate.",
        );
      }
      throw new Error(`API error (${response.status}): ${error.slice(0, 200)}`);
    }

    const data = await response.json() as any;

    const imageItem = data.output?.find((item: any) =>
      item.type === "image_generation_call"
    );

    if (!imageItem?.result) {
      throw new Error(
        `No image data in response. Output types: ${data.output?.map((o: any) => o.type).join(", ") || "none"}`
      );
    }

    return {
      responseId: data.id,
      imageData: imageItem.result,
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

#### `design/src/generate.ts:97-160`

```typescript
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = requireApiKey();

  // Parse the brief
  const prompt = options.briefFile
    ? parseBrief(options.briefFile, true)
    : parseBrief(options.brief!, false);

  const size = options.size || "1536x1024";
  const quality = options.quality || "high";
  const maxRetries = options.retry ?? 0;

  let lastResult: GenerateResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      console.error(`Retry ${attempt}/${maxRetries}...`);
    }

    // Generate the image
    const startTime = Date.now();
    const { responseId, imageData } = await callImageGeneration(apiKey, prompt, size, quality);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Write to disk
    const outputDir = path.dirname(options.output);
    fs.mkdirSync(outputDir, { recursive: true });
    const imageBuffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(options.output, imageBuffer);

    // Create session
    const session = createSession(responseId, prompt, options.output);

    console.error(`Generated (${elapsed}s, ${(imageBuffer.length / 1024).toFixed(0)}KB) → ${options.output}`);

    lastResult = {
      outputPath: options.output,
      sessionFile: sessionPath(session.id),
      responseId,
    };

    // Quality check if requested
    if (options.check) {
      const checkResult = await checkMockup(options.output, prompt);
      lastResult.checkResult = checkResult;

      if (checkResult.pass) {
        console.error(`Quality check: PASS`);
        break;
      } else {
        console.error(`Quality check: FAIL — ${checkResult.issues}`);
        if (attempt < maxRetries) {
          console.error("Will retry...");
        }
      }
    } else {
      break;
    }
  }

  // Output result as JSON to stdout
  console.log(JSON.stringify(lastResult, null, 2));
  return lastResult!;
}
```

#### `design/src/design-to-code.ts:1-18`

```typescript
/**
 * Design-to-Code Prompt Generator.
 * Extracts implementation instructions from an approved mockup via GPT-4o vision.
 * Produces a structured prompt the agent can use to implement the design.
 */

import fs from "fs";
import { requireApiKey } from "./auth";
import { readDesignConstraints } from "./memory";

export interface DesignToCodeResult {
  implementationPrompt: string;
  colors: string[];
  typography: string[];
  layout: string[];
  components: string[];
}

```

#### `design/src/design-to-code.ts:22-88`

```typescript
export async function generateDesignToCodePrompt(
  imagePath: string,
  repoRoot?: string,
): Promise<DesignToCodeResult> {
  const apiKey = requireApiKey();
  const imageData = fs.readFileSync(imagePath).toString("base64");

  // Read DESIGN.md if available for additional context
  const designConstraints = repoRoot ? readDesignConstraints(repoRoot) : null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const contextBlock = designConstraints
      ? `\n\nExisting DESIGN.md (use these as constraints):\n${designConstraints}`
      : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${imageData}` },
            },
            {
              type: "text",
              text: `Analyze this approved UI mockup and generate a structured implementation prompt. Return valid JSON only:

{
  "implementationPrompt": "A detailed paragraph telling a developer exactly how to build this UI. Include specific CSS values, layout approach (flex/grid), component structure, and interaction behaviors. Reference the specific elements visible in the mockup.",
  "colors": ["#hex - usage", ...],
  "typography": ["role: family, size, weight", ...],
  "layout": ["description of layout pattern", ...],
  "components": ["component name - description", ...]
}

Be specific about every visual detail: exact hex colors, font sizes in px, spacing values, border-radius, shadows. The developer should be able to implement this without looking at the mockup again.${contextBlock}`,
            },
          ],
        }],
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return JSON.parse(content) as DesignToCodeResult;
  } finally {
    clearTimeout(timeout);
  }
}
```

<!-- source-snippets:end -->
</details>
## make-pdf CLI

`make-pdf/src/cli.ts` 的输出契约很严格：成功时 stdout 只输出路径，stderr 输出进度和错误；exit code 区分 bad args、render error、Paged.js timeout、browse unavailable。CLI 支持 cover、TOC、page numbers、tagged PDF、outline、watermark、header/footer template、network control 等。Sources: [make-pdf/src/cli.ts:1-11](../../../project-repos/gstack/make-pdf/src/cli.ts#L1-L11), [make-pdf/src/cli.ts:56-99](../../../project-repos/gstack/make-pdf/src/cli.ts#L56-L99), [make-pdf/src/cli.ts:174-253](../../../project-repos/gstack/make-pdf/src/cli.ts#L174-L253)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `make-pdf/src/cli.ts:1-11`

```typescript
#!/usr/bin/env bun
/**
 * make-pdf CLI — argv parse, dispatch, exit.
 *
 * Output contract (per CEO plan DX spec):
 *   stdout: ONLY the output path on success. One line. Nothing else.
 *   stderr: progress spinner per stage, final "Done in Xs. N pages."
 *   --quiet: suppress progress. Errors still print.
 *   --verbose: per-stage timings.
 *   exit 0 success / 1 bad args / 2 render error / 3 Paged.js timeout / 4 browse unavailable.
 */
```

#### `make-pdf/src/cli.ts:56-99`

```typescript
function printUsage(): void {
  const lines = [
    "make-pdf — turn markdown into publication-quality PDFs",
    "",
    "Usage:",
  ];
  for (const [name, info] of COMMANDS) {
    lines.push(`  $P ${info.usage}`);
    lines.push(`      ${info.description}`);
  }
  lines.push("");
  lines.push("Page layout:");
  lines.push("  --margins <dim>           All four margins (default: 1in). in, pt, cm, mm.");
  lines.push("  --page-size letter|a4|legal  (aliases: --format)");
  lines.push("");
  lines.push("Document structure:");
  lines.push("  --cover                   Add a cover page.");
  lines.push("  --toc                     Generate clickable table of contents.");
  lines.push("  --no-chapter-breaks       Don't start a new page at every H1.");
  lines.push("");
  lines.push("Branding:");
  lines.push("  --watermark <text>        Diagonal watermark on every page.");
  lines.push("  --header-template <html>");
  lines.push("  --footer-template <html>  Mutex with --page-numbers.");
  lines.push("  --no-confidential         Suppress the CONFIDENTIAL footer.");
  lines.push("");
  lines.push("Output control:");
  lines.push("  --page-numbers / --no-page-numbers   (default: on)");
  lines.push("  --tagged / --no-tagged               (default: on, accessible PDF)");
  lines.push("  --outline / --no-outline             (default: on, PDF bookmarks)");
  lines.push("  --quiet                   Suppress progress on stderr.");
  lines.push("  --verbose                 Per-stage timings on stderr.");
  lines.push("");
  lines.push("Network:");
  lines.push("  --allow-network           Load external images (off by default).");
  lines.push("");
  lines.push("Examples:");
  lines.push("  $P generate letter.md");
  lines.push("  $P generate --cover --toc essay.md essay.pdf");
  lines.push("  $P generate --watermark DRAFT memo.md draft.pdf");
  lines.push("  $P preview letter.md");
  lines.push("");
  lines.push("Run `$P setup` to verify browse + Chromium + pdftotext install.");
  console.error(lines.join("\n"));
```

#### `make-pdf/src/cli.ts:174-253`

```typescript
async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (!parsed.command) {
    printUsage();
    process.exit(ExitCode.BadArgs);
  }

  if (!COMMANDS.has(parsed.command)) {
    console.error(`$P: unknown command: ${parsed.command}`);
    console.error("");
    printUsage();
    process.exit(ExitCode.BadArgs);
  }

  try {
    switch (parsed.command) {
      case "version": {
        // Read from VERSION file or fall back to a hard-coded default.
        try {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const versionFile = path.resolve(
            path.dirname(process.argv[1] || ""),
            "../../VERSION",
          );
          const version = fs.readFileSync(versionFile, "utf8").trim();
          console.log(version);
        } catch {
          console.log("make-pdf (version unknown)");
        }
        process.exit(ExitCode.Success);
      }

      case "setup": {
        const { runSetup } = await import("./setup");
        await runSetup();
        process.exit(ExitCode.Success);
      }

      case "generate": {
        const opts = generateOptionsFromFlags(parsed);
        const { generate } = await import("./orchestrator");
        const outputPath = await generate(opts);
        // Contract: stdout = output path only
        console.log(outputPath);
        process.exit(ExitCode.Success);
      }

      case "preview": {
        const opts = previewOptionsFromFlags(parsed);
        const { preview } = await import("./orchestrator");
        const htmlPath = await preview(opts);
        console.log(htmlPath);
        process.exit(ExitCode.Success);
      }

      default:
        // Unreachable: COMMANDS.has guarded above
        process.exit(ExitCode.BadArgs);
    }
  } catch (err: any) {
    if (err instanceof BrowseClientError) {
      console.error(`$P: ${err.message}`);
      process.exit(ExitCode.BrowseUnavailable);
    }
    if (err?.code === "ENOENT") {
      console.error(`$P: file not found: ${err.path ?? err.message}`);
      process.exit(ExitCode.BadArgs);
    }
    if (err?.name === "PagedJsTimeout") {
      console.error(`$P: ${err.message}`);
      process.exit(ExitCode.PagedJsTimeout);
    }
    console.error(`$P: ${err?.message ?? String(err)}`);
    if (parsed.flags.verbose && err?.stack) {
      console.error(err.stack);
    }
    process.exit(ExitCode.RenderError);
  }
```

<!-- source-snippets:end -->
</details>
## 与技能层的关系

```mermaid
flowchart TD
  A[/design-shotgun/] --> B[$D variants]
  B --> C[$D compare]
  C --> D[用户反馈]
  D --> E[$D iterate]
  E --> F[/design-html/]
  G[/make-pdf/] --> H[$P generate]
  H --> I[PDF]
```

`make-pdf/SKILL.md` 是生成技能，要求把 Markdown 变成“finished artifact”，而不只是草稿；设计技能则通过 `$D` 二进制把 mockup、比较板和实现提示接入代理工作流。Sources: [make-pdf/SKILL.md:1-23](../../../project-repos/gstack/make-pdf/SKILL.md#L1-L23), [README.md:263-268](../../../project-repos/gstack/README.md#L263-L268)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `make-pdf/SKILL.md:1-23`

```markdown
---
name: make-pdf
preamble-tier: 1
version: 1.0.0
description: |
  Turn any markdown file into a publication-quality PDF. Proper 1in margins,
  intelligent page breaks, page numbers, cover pages, running headers, curly
  quotes and em dashes, clickable TOC, diagonal DRAFT watermark. Not a draft
  artifact — a finished artifact. Use when asked to "make a PDF", "export to
  PDF", "turn this markdown into a PDF", or "generate a document". (gstack)
  Voice triggers (speech-to-text aliases): "make this a pdf", "make it a pdf", "export to pdf", "turn this into a pdf", "turn this markdown into a pdf", "generate a pdf", "make a pdf from", "pdf this markdown".
triggers:
  - markdown to pdf
  - generate pdf
  - make pdf
  - export pdf
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->
```

#### `README.md:263-268`

```markdown
**Design is at the heart.** `/design-consultation` builds your design system from scratch, researches what's out there, proposes creative risks, and writes `DESIGN.md`. But the real magic is the shotgun-to-HTML pipeline.

**`/design-shotgun` is how you explore.** You describe what you want. It generates 4-6 AI mockup variants using GPT Image. Then it opens a comparison board in your browser with all variants side by side. You pick favorites, leave feedback ("more whitespace", "bolder headline", "lose the gradient"), and it generates a new round. Repeat until you love something. Taste memory kicks in after a few rounds so it starts biasing toward what you actually like. No more describing your vision in words and hoping the AI gets it. You see options, pick the good ones, and iterate visually.

**`/design-html` makes it real.** Take that approved mockup (from `/design-shotgun`, a CEO plan, a design review, or just a description) and turn it into production-quality HTML/CSS. Not the kind of AI HTML that looks fine at one viewport width and breaks everywhere else. This uses Pretext for computed text layout: text actually reflows on resize, heights adjust to content, layouts are dynamic. 30KB overhead, zero dependencies. It detects your framework (React, Svelte, Vue) and outputs the right format. Smart API routing picks different Pretext patterns depending on whether it's a landing page, dashboard, form, or card layout. The output is something you'd actually ship, not a demo.

```

<!-- source-snippets:end -->
</details>
## 相关页面

- [技能工作流](skill-workflow.md)
- [Browse 运行时](browse-runtime.md)
- [测试、CI 与质量门](testing-ci-quality.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [USING_GBRAIN_WITH_GSTACK.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/USING_GBRAIN_WITH_GSTACK.md)
- [docs/gbrain-sync.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/docs/gbrain-sync.md)
- [bin/gstack-brain-init](https://github.com/garrytan/gstack/tree/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/bin/gstack-brain-init)
- [setup-gbrain/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/setup-gbrain/SKILL.md)

</details>

# GBrain 与记忆系统

gstack 的记忆分两层：GBrain 是外部持久知识库，`/setup-gbrain` 负责安装、初始化和 MCP 注册；GStack memory sync 则把 `~/.gstack/` 中的 allowlisted 状态同步到私有 git repo，供跨机器恢复和 GBrain 索引。Sources: [README.md:372-405](../../../project-repos/gstack/README.md#L372-L405), [USING_GBRAIN_WITH_GSTACK.md:1-18](../../../project-repos/gstack/USING_GBRAIN_WITH_GSTACK.md#L1-L18), [USING_GBRAIN_WITH_GSTACK.md:110-128](../../../project-repos/gstack/USING_GBRAIN_WITH_GSTACK.md#L110-L128)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:372-405`

````markdown
## GBrain — persistent knowledge for your coding agent

[GBrain](https://github.com/garrytan/gbrain) is a persistent knowledge base for AI agents — think of it as the memory your agent actually keeps between sessions. GStack gives you a one-command path from zero to "it's running, my agent can call it."

```bash
/setup-gbrain
```

Three paths, pick one:

- **Supabase, existing URL** — your cloud agent already provisioned a brain; paste the Session Pooler URL, now this laptop uses the same data.
- **Supabase, auto-provision** — paste a Supabase Personal Access Token; the skill creates a new project, polls to healthy, fetches the pooler URL, hands it to `gbrain init`. ~90 seconds end-to-end.
- **PGLite local** — zero accounts, zero network, ~30 seconds. Isolated brain on this Mac only. Great for try-first; migrate to Supabase later with `/setup-gbrain --switch`.

After init, the skill offers to register gbrain as an MCP server for Claude Code (`claude mcp add gbrain -- gbrain serve`) so `gbrain search`, `gbrain put_page`, etc. show up as first-class typed tools — not bash shell-outs.

**Per-remote trust policy.** Each repo on your machine gets one of three tiers:

- `read-write` — agent can search the brain AND write new pages back from this repo
- `read-only` — agent can search but never writes (best for multi-client consultants: search the shared brain, don't contaminate it with Client A's work while in Client B's repo)
- `deny` — no gbrain interaction at all

The skill asks once per repo. The decision is sticky across worktrees and branches of the same remote.

**GStack memory sync (different feature, same private-repo infra).** Optionally pushes your gstack state (learnings, CEO plans, design docs, retros, developer profile) to a private git repo so your memory follows you across machines, with a one-time privacy prompt (everything allowlisted / artifacts only / off) and a defense-in-depth secret scanner that blocks AWS keys, tokens, PEM blocks, and JWTs before they leave your machine.

```bash
gstack-brain-init
```

**Full monty — every scenario, every flag, every bin helper, every troubleshooting step:** [USING_GBRAIN_WITH_GSTACK.md](USING_GBRAIN_WITH_GSTACK.md)

Other references: [docs/gbrain-sync.md](docs/gbrain-sync.md) (sync-specific guide) • [docs/gbrain-sync-errors.md](docs/gbrain-sync-errors.md) (error index)

````

#### `USING_GBRAIN_WITH_GSTACK.md:1-18`

````markdown
# Using GBrain with GStack

Your coding agent, with a memory it actually keeps.

[GBrain](https://github.com/garrytan/gbrain) is a persistent knowledge base designed for AI agents. It stores what your agent learns, what you've decided, what worked and what didn't, and lets the agent search all of it on demand. GStack gives you a one-command path from zero to "gbrain is running, and my agent can call it" — with paths for try-it-local, share-with-your-team, and everything between.

This is the full monty: every scenario, every flag, every helper bin, every troubleshooting step. For the quick pitch, see the [README's GBrain section](README.md#gbrain--persistent-knowledge-for-your-coding-agent). For error codes and sync-specific issues, see [docs/gbrain-sync.md](docs/gbrain-sync.md).

---

## The one-command install

```bash
/setup-gbrain
```

That's it. The skill detects your current state, asks three questions at most, and walks you through install, init, MCP registration for Claude Code, and per-repo trust policy. On a clean Mac with nothing installed it finishes in under five minutes. On a Mac where something's already set up it takes seconds (it detects the existing state and skips done work).

````

#### `USING_GBRAIN_WITH_GSTACK.md:110-128`

````markdown
## GStack memory sync (a separate concern)

This is different from gbrain itself. Your gstack state (`~/.gstack/` — learnings, plans, retros, timeline, developer profile) is machine-local by default. "GStack memory sync" optionally pushes a curated, secret-scanned subset to a private git repo so your memory follows you across machines — and, if you're running gbrain, that git repo becomes indexable there too.

Turn it on with:

```bash
gstack-brain-init
```

You'll get a one-time privacy prompt: **everything allowlisted** / **artifacts only** (plans, designs, retros, learnings — skip behavioral data like timelines) / **off**. Every skill run syncs the queue at start and end — no daemon, no background process.

Secret-shaped content (AWS keys, GitHub tokens, PEM blocks, JWTs, bearer tokens) is blocked from sync before it leaves your machine.

**On a new machine:** Copy `~/.gstack-brain-remote.txt` over, run `gstack-brain-restore`, and yesterday's learnings surface on today's laptop.

Full guide: [docs/gbrain-sync.md](docs/gbrain-sync.md). Error index: [docs/gbrain-sync-errors.md](docs/gbrain-sync-errors.md).

`/setup-gbrain` offers to wire this up for you at the end of initial setup — it's one more AskUserQuestion, and it integrates with the same private-repo infrastructure.
````

<!-- source-snippets:end -->
</details>
## `/setup-gbrain` 三条路径

```mermaid
flowchart TD
  A[/setup-gbrain/] --> B{brain location}
  B --> C[Supabase existing URL]
  B --> D[Supabase auto-provision]
  B --> E[PGLite local]
  C --> F[gbrain init via env]
  D --> F
  E --> G[gbrain init --pglite]
  F --> H[optional claude mcp add]
  G --> H
  H --> I[repo trust policy]
```

文档列出三种初始化方式：已有 Supabase Session Pooler URL、自动 provision 新 Supabase 项目、PGLite 本地 brain。所有 secret 都通过环境变量或 echo-off 读取，避免出现在 argv 或 shell history。Sources: [USING_GBRAIN_WITH_GSTACK.md:19-67](../../../project-repos/gstack/USING_GBRAIN_WITH_GSTACK.md#L19-L67), [USING_GBRAIN_WITH_GSTACK.md:204-224](../../../project-repos/gstack/USING_GBRAIN_WITH_GSTACK.md#L204-L224)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `USING_GBRAIN_WITH_GSTACK.md:19-67`

````markdown
## The three paths

You pick one when the skill asks "Where should your brain live?"

### Path 1: Supabase, you already have a connection string

Best for: you (or a teammate's cloud agent) already provisioned a Supabase brain and you want this local machine to use the same data.

**What happens:** Paste the Session Pooler URL (Settings → Database → Connection Pooler → Session → copy URI, port 6543). The skill reads it with echo off, shows you a redacted preview (`aws-0-us-east-1.pooler.supabase.com:6543/postgres` — host visible, password masked), hands it to `gbrain init` via the `GBRAIN_DATABASE_URL` environment variable, and the URL is never written to argv or your shell history.

**Trust warning:** Pasting this URL gives your local Claude Code full read/write access to every page in the shared brain. If that's not the trust level you want, pick PGLite local (Path 3) instead and accept the brains are disjoint.

### Path 2a: Supabase, auto-provision a new project

Best for: fresh Supabase account, you want a clean new project with zero clicking.

**What happens:** You paste a Supabase Personal Access Token (PAT). The skill shows you the scope disclosure first — *the token grants full access to every project in your Supabase account, not just the one we're about to create*. It lists your organizations, asks which one and which region (default `us-east-1`), generates a database password, calls `POST /v1/projects`, polls `GET /v1/projects/{ref}` every 5 seconds until the project is `ACTIVE_HEALTHY` (180s timeout), fetches the pooler URL, hands it to `gbrain init`. End-to-end: ~90 seconds.

At the end: explicit reminder to revoke the PAT at https://supabase.com/dashboard/account/tokens. The skill already discarded it from memory.

**If you Ctrl-C mid-provision:** The SIGINT trap prints your in-flight project ref + a resume command. You can delete the orphan at the Supabase dashboard, or run `/setup-gbrain --resume-provision <ref>` to pick up where you left off.

### Path 2b: Supabase, create manually

Best for: you'd rather click through supabase.com yourself than paste a PAT.

**What happens:** The skill walks you through the four manual steps (signup → new project → wait ~2 min → copy Session Pooler URL), then takes over from Path 1's paste step. Same security treatment as Path 1.

### Path 3: PGLite local

Best for: try-it-first, no account, no cloud, no sharing. Or a dedicated "this Mac's brain" that stays isolated from any cloud agent.

**What happens:** `gbrain init --pglite`. Brain lives at `~/.gbrain/brain.pglite`. No network calls. Done in 30 seconds.

This is the best first choice if you just want to see what gbrain feels like before committing to cloud. You can always migrate later with `/setup-gbrain --switch`.

## MCP registration for Claude Code

By default the skill asks "Give Claude Code a typed tool surface for gbrain?" If you say yes, it runs:

```bash
claude mcp add gbrain -- gbrain serve
```

That registers gbrain's stdio MCP server with Claude Code. Now `gbrain search`, `gbrain put_page`, `gbrain get_page`, etc. show up as first-class tools in every session, not bash shell-outs.

**If `claude` is not on PATH**, the skill skips MCP registration gracefully with a manual-register hint. The CLI resolver still works from any skill that shells out to `gbrain` — MCP is an upgrade, not a prerequisite.

**Other local agents** (Cursor, Codex CLI, etc.) need their own MCP registration. The skill is Claude-Code-targeted for v1; other hosts can register `gbrain serve` manually in their own MCP config.
````

#### `USING_GBRAIN_WITH_GSTACK.md:204-224`

```markdown
## Security model

One rule for every secret this skill touches: **env var only, never argv, never logged, never written to disk by us.** The only persistent storage is gbrain's own `~/.gbrain/config.json` at mode 0600, which is gbrain's discipline, not ours.

**Enforced in code:**

- CI grep test in `test/skill-validation.test.ts` fails the build if `$SUPABASE_ACCESS_TOKEN` or `$GBRAIN_DATABASE_URL` appears in an argv position
- CI grep test fails if `--insecure`, `-k`, or `NODE_TLS_REJECT_UNAUTHORIZED=0` appear in `bin/gstack-gbrain-supabase-provision`
- `set +x` at the top of the provision helper prevents debug tracing from leaking PAT
- Telemetry payload contains only enumerated categorical values (scenario, install result, MCP opt-in, trust tier) — never free-form strings that could contain secrets

**Enforced via tests:**

- `test/secret-sink-harness.test.ts` runs every secret-handling bin with a seeded secret and asserts the seed never appears in any captured channel (stdout, stderr, files under `$HOME`, telemetry JSONL). Four match rules per seed: exact, URL-decoded, first-12-char prefix, base64.
- Positive controls in the same test file deliberately leak seeds in every covered channel and assert the harness catches each one. Without the positive controls, a harness that silently under-reports would look identical to a working harness.

**What you can still leak** (the honest limits of v1):

- If you paste a secret into a normal chat message outside `read -s`, it's in the conversation transcript and any host-side logging
- The leak harness doesn't dump subprocess environment — a bin that `env >> ~/.log` would evade detection (no bin in v1 does this; grep tests prevent it)
- Your shell's own `HISTFILE` behavior is your shell's, not ours — we never pass secrets to argv so they don't land there via our code, but nothing stops you from pasting one into a raw `curl` command yourself
```

<!-- source-snippets:end -->
</details>
## Per-remote trust triad

每个 repo 对 GBrain 有 `read-write`、`read-only`、`deny` 三档策略，按远端归一化后持久化到 `~/.gstack/gbrain-repo-policy.json`。这避免在客户仓库或敏感 repo 中把本地工作污染到共享 brain。Sources: [USING_GBRAIN_WITH_GSTACK.md:69-97](../../../project-repos/gstack/USING_GBRAIN_WITH_GSTACK.md#L69-L97)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `USING_GBRAIN_WITH_GSTACK.md:69-97`

````markdown
## Per-remote trust policy (the triad)

Every repo on your machine gets a policy decision: **read-write**, **read-only**, or **deny**.

- **read-write** — your agent can `gbrain search` from this repo's context AND write new pages back to the brain. Default for your own projects.
- **read-only** — your agent can search the brain but never writes new pages from this repo's sessions. Ideal for multi-client consultants: search the shared brain, don't contaminate it with Client A's code while you're in Client B's repo.
- **deny** — no gbrain interaction at all. The repo is invisible to gbrain tooling.

The skill asks once per repo the first time you run a gstack skill there. After that the decision is sticky — every worktree + branch of the same git remote shares the same policy, so you set it once and it follows you.

SSH and HTTPS remote variants collapse to the same key: `https://github.com/foo/bar.git` and `git@github.com:foo/bar.git` are the same repo.

**To change a policy:**

```bash
/setup-gbrain --repo      # re-prompt for this repo only

# Or directly:
~/.claude/skills/gstack/bin/gstack-gbrain-repo-policy set "github.com/foo/bar" read-only
```

**To see every policy:**

```bash
~/.claude/skills/gstack/bin/gstack-gbrain-repo-policy list
```

Storage: `~/.gstack/gbrain-repo-policy.json`, mode 0600, schema-versioned so future migrations stay deterministic.

````

<!-- source-snippets:end -->
</details>
## Memory sync

`gstack-brain-init` 把 `~/.gstack/` 初始化为 git repo，写入 ignore-everything base、allowlist、privacy map、gitattributes、JSONL merge driver 和 pre-commit secret scan hook，然后推送到私有 remote。Sources: [bin/gstack-brain-init:1-24](../../../project-repos/gstack/bin/gstack-brain-init#L1-L24), [bin/gstack-brain-init:141-240](../../../project-repos/gstack/bin/gstack-brain-init#L141-L240)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `bin/gstack-brain-init:1-24`

```
#!/usr/bin/env bash
# gstack-brain-init — set up ~/.gstack/ as a git repo that syncs to GBrain.
#
# Usage:
#   gstack-brain-init [--remote <url>]
#
# Interactive by default. Pass --remote to skip the remote prompt.
#
# Idempotent: safe to re-run. If ~/.gstack/.git already exists AND points at
# the same remote, reconfigures drivers/hooks/attributes without clobbering
# history. If it points at a DIFFERENT remote, refuses and suggests
# `gstack-brain-uninstall` first.
#
# What it does:
#   1. git init ~/.gstack/  (or verify existing repo points at the right remote)
#   2. Write .gitignore = "*"  (ignore everything; allowlist is explicit)
#   3. Write .brain-allowlist  (canonical paths to sync)
#   4. Write .brain-privacy-map.json  (paths → privacy class)
#   5. Write .gitattributes  (register JSONL + union merge drivers)
#   6. git config  merge.jsonl-append.driver + merge.union.driver
#   7. Install .git/hooks/pre-commit  (defense-in-depth secret scan)
#   8. Prompt for remote (default: gh repo create --private gstack-brain-$USER)
#   9. Initial commit + push
#   10. Write ~/.gstack-brain-remote.txt  (URL-only, safe to share)
```

#### `bin/gstack-brain-init:141-240`

```
# ---- write canonical files (idempotent) ----
cat > "$GSTACK_HOME/.gitignore" <<'EOF'
# gstack-brain sync: ignore-everything base. Paths are included explicitly via
# .brain-allowlist and `git add -f` from gstack-brain-sync. Do not edit.
*
EOF

cat > "$GSTACK_HOME/.brain-allowlist" <<'EOF'
# Canonical allowlist of paths that gstack-brain-sync will publish.
# One glob per line. Anything not matching stays local.
# Do not edit directly; managed by gstack-brain-init. User additions go below
# the marker and survive re-init.
projects/*/learnings.jsonl
projects/*/*-reviews.jsonl
projects/*/ceo-plans/*.md
projects/*/ceo-plans/*/*.md
projects/*/designs/*.md
projects/*/designs/*/*.md
projects/*/timeline.jsonl
retros/*.md
developer-profile.json
builder-journey.md
builder-profile.jsonl
# NOT synced (per Codex v2 review — machine-local UX state):
#   projects/*/question-preferences.json (per-machine UX preferences)
#   projects/*/question-log.jsonl (audit/derivation log stays with preferences)
#   projects/*/question-events.jsonl (same)
# ---- USER ADDITIONS BELOW ---- (survives re-init; above is managed)
EOF

cat > "$GSTACK_HOME/.brain-privacy-map.json" <<'EOF'
[
  {"pattern": "projects/*/learnings.jsonl", "class": "artifact"},
  {"pattern": "projects/*/*-reviews.jsonl", "class": "artifact"},
  {"pattern": "projects/*/ceo-plans/*.md", "class": "artifact"},
  {"pattern": "projects/*/ceo-plans/*/*.md", "class": "artifact"},
  {"pattern": "projects/*/designs/*.md", "class": "artifact"},
  {"pattern": "projects/*/designs/*/*.md", "class": "artifact"},
  {"pattern": "retros/*.md", "class": "artifact"},
  {"pattern": "builder-journey.md", "class": "artifact"},
  {"pattern": "projects/*/timeline.jsonl", "class": "behavioral"},
  {"pattern": "developer-profile.json", "class": "behavioral"},
  {"pattern": "builder-profile.jsonl", "class": "behavioral"}
]
EOF

cat > "$GSTACK_HOME/.gitattributes" <<'EOF'
# gstack-brain: merge drivers for cross-machine sync conflicts.
# Matching driver must be registered in local git config; gstack-brain-init
# and gstack-brain-restore run `git config merge.<name>.driver ...` after init.
*.jsonl merge=jsonl-append
retros/*.md merge=union
projects/*/designs/**/*.md merge=union
projects/*/ceo-plans/**/*.md merge=union
EOF

# ---- register merge drivers in local git config ----
git -C "$GSTACK_HOME" config merge.jsonl-append.driver "$SCRIPT_DIR/gstack-jsonl-merge %O %A %B"
git -C "$GSTACK_HOME" config merge.jsonl-append.name "gstack JSONL append-only merger"
git -C "$GSTACK_HOME" config merge.union.driver "cat %A %B > %A.merged && mv %A.merged %A"
git -C "$GSTACK_HOME" config merge.union.name "union concat"

# ---- install pre-commit hook (defense-in-depth) ----
HOOK="$GSTACK_HOME/.git/hooks/pre-commit"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# gstack-brain pre-commit hook — secret-scan defense-in-depth.
# The primary scanner runs inside gstack-brain-sync BEFORE staging. This hook
# catches any manual `git commit` a user might accidentally run against the
# brain repo.
set -uo pipefail

python3 -c "
import sys, re, subprocess
try:
    out = subprocess.check_output(['git', 'diff', '--cached'], stderr=subprocess.DEVNULL).decode('utf-8', 'replace')
except Exception:
    sys.exit(0)

patterns = [
    ('aws-access-key', re.compile(r'AKIA[0-9A-Z]{16}')),
    ('github-token', re.compile(r'\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})')),
    ('openai-key', re.compile(r'\bsk-[A-Za-z0-9_-]{20,}')),
    ('pem-block', re.compile(r'-----BEGIN [A-Z ]{3,}-----')),
    ('jwt', re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b')),
    ('bearer-token-json',
     re.compile(r'\"(authorization|api[_-]?key|apikey|token|secret|password)\"\s*:\s*\"[A-Za-z0-9_./+=-]{16,}\"',
                re.IGNORECASE)),
]
for name, rx in patterns:
    if rx.search(out):
        sys.stderr.write(f'gstack-brain pre-commit: refusing commit — {name} detected in staged diff.\n')
        sys.stderr.write('Either edit the offending file, or if intentional, run:\n')
        sys.stderr.write('  gstack-brain-sync --skip-file <path>  (to permanently exclude)\n')
        sys.exit(1)
sys.exit(0)
"
HOOK_EOF
chmod +x "$HOOK"
```

<!-- source-snippets:end -->
</details>
```mermaid
flowchart TD
  A[~/.gstack local state] --> B[allowlist filter]
  B --> C[privacy mode]
  C --> D[secret scanner]
  D -->|pass| E[private git repo]
  D -->|block| F[preamble warning]
  E --> G[gbrain source wireup]
  E --> H[gstack-brain-restore]
```

## 同步范围与隐私

`docs/gbrain-sync.md` 明确排除凭证、Chromium profiles、ONNX 模型、cache、prompt marker、question-preferences 等机器本地状态；隐私模式分为 off、artifacts-only、full。Sources: [docs/gbrain-sync.md:16-29](../../../project-repos/gstack/docs/gbrain-sync.md#L16-L29), [docs/gbrain-sync.md:100-112](../../../project-repos/gstack/docs/gbrain-sync.md#L100-L112)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/gbrain-sync.md:16-29`

```markdown
## What does NOT leave your machine

By design, these stay local even when sync is on:

- Credentials: `.auth.json`, `auth-token.json`, `sidebar-sessions/`,
  `security/device-salt`, consumer tokens in `config.yaml`
- Machine-specific state: Chromium profiles, ONNX model weights,
  caches, eval-cache, CDP-profile, one-time prompt markers
  (`.welcome-seen`, `.telemetry-prompted`, `.vendoring-warned-*`, etc.)
- Question-preferences: per-machine UX preferences
  (`question-preferences.json`, `question-log.jsonl`, `question-events.jsonl`).

The exact allowlist lives in `~/.gstack/.brain-allowlist`. The CLI manages
it; you can append your own entries below the marker line.
```

#### `docs/gbrain-sync.md:100-112`

````markdown
## Privacy modes in detail

| Mode | What syncs |
|------|------------|
| `off` | Nothing (default). |
| `artifacts-only` | Plans, designs, retros, learnings, reviews. Skips timelines + developer-profile. |
| `full` | Everything in the allowlist, including behavioral state. |

Change anytime with:
```bash
gstack-config set gbrain_sync_mode full
gstack-config set gbrain_sync_mode off
```
````

<!-- source-snippets:end -->
</details>
## Secret 保护

同步前会扫描 AWS、GitHub token、OpenAI key、PEM、JWT、Bearer/API key 等模式；命中后保留队列并阻止 sync。`bin/gstack-brain-init` 还安装了 pre-commit hook 作为 defense-in-depth。Sources: [docs/gbrain-sync.md:114-142](../../../project-repos/gstack/docs/gbrain-sync.md#L114-L142), [bin/gstack-brain-init:203-240](../../../project-repos/gstack/bin/gstack-brain-init#L203-L240)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/gbrain-sync.md:114-142`

````markdown
## Secret protection

Every commit is scanned for credential-shaped content before it leaves
your machine. Blocked patterns include:

- AWS access keys (`AKIA…`)
- GitHub tokens (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`, `github_pat_`)
- OpenAI keys (`sk-…`)
- PEM blocks (`-----BEGIN …-----`)
- JWTs (`eyJ…`)
- Bearer tokens in JSON (`"authorization": "…"`, `"api_key": "…"`, etc.)

If a scan hits, sync stops, the queue is preserved, and your preamble
prints:

```
BRAIN_SYNC: blocked: <pattern-family>:<snippet>
```

To remediate:

1. Review the offending file.
2. If the match is a false positive on content you explicitly want to
   sync, run `gstack-brain-sync --skip-file <path>` to permanently
   exclude that path.
3. Otherwise, edit the file to remove the secret and re-run any skill.

There's a defense-in-depth hook at `~/.gstack/.git/hooks/pre-commit` that
runs the same scan if you manually `git commit` against the repo.
````

#### `bin/gstack-brain-init:203-240`

```
# ---- install pre-commit hook (defense-in-depth) ----
HOOK="$GSTACK_HOME/.git/hooks/pre-commit"
mkdir -p "$(dirname "$HOOK")"
cat > "$HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# gstack-brain pre-commit hook — secret-scan defense-in-depth.
# The primary scanner runs inside gstack-brain-sync BEFORE staging. This hook
# catches any manual `git commit` a user might accidentally run against the
# brain repo.
set -uo pipefail

python3 -c "
import sys, re, subprocess
try:
    out = subprocess.check_output(['git', 'diff', '--cached'], stderr=subprocess.DEVNULL).decode('utf-8', 'replace')
except Exception:
    sys.exit(0)

patterns = [
    ('aws-access-key', re.compile(r'AKIA[0-9A-Z]{16}')),
    ('github-token', re.compile(r'\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})')),
    ('openai-key', re.compile(r'\bsk-[A-Za-z0-9_-]{20,}')),
    ('pem-block', re.compile(r'-----BEGIN [A-Z ]{3,}-----')),
    ('jwt', re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b')),
    ('bearer-token-json',
     re.compile(r'\"(authorization|api[_-]?key|apikey|token|secret|password)\"\s*:\s*\"[A-Za-z0-9_./+=-]{16,}\"',
                re.IGNORECASE)),
]
for name, rx in patterns:
    if rx.search(out):
        sys.stderr.write(f'gstack-brain pre-commit: refusing commit — {name} detected in staged diff.\n')
        sys.stderr.write('Either edit the offending file, or if intentional, run:\n')
        sys.stderr.write('  gstack-brain-sync --skip-file <path>  (to permanently exclude)\n')
        sys.exit(1)
sys.exit(0)
"
HOOK_EOF
chmod +x "$HOOK"
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [技能工作流](skill-workflow.md)
- [安装与多宿主接入](setup-and-hosts.md)
- [测试、CI 与质量门](testing-ci-quality.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/README.md)
- [docs/OPENCLAW.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/docs/OPENCLAW.md)
- [hosts/openclaw.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/hosts/openclaw.ts)
- [scripts/host-adapters/openclaw-adapter.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/host-adapters/openclaw-adapter.ts)
- [openclaw/skills/gstack-openclaw-office-hours/SKILL.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/openclaw/skills/gstack-openclaw-office-hours/SKILL.md)

</details>

# OpenClaw 集成

OpenClaw 集成不是把 Browse daemon 或完整 Claude 技能运行时搬过去，而是把 gstack 当作 methodology source。OpenClaw 负责 messaging、calendar、memory 和 ACP session spawning，gstack 生成 prompt artifacts 和少量原生 conversational skills。Sources: [docs/OPENCLAW.md:1-9](../../../project-repos/gstack/docs/OPENCLAW.md#L1-L9), [docs/OPENCLAW.md:10-29](../../../project-repos/gstack/docs/OPENCLAW.md#L10-L29)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:1-9`

```markdown
# gstack x OpenClaw Integration

gstack integrates with OpenClaw as a methodology source, not a ported codebase.
OpenClaw's ACP runtime spawns Claude Code sessions natively. gstack provides the
planning discipline and methodology that makes those sessions better.

This is a lightweight protocol encoded as prompt text. No daemon. No JSON-RPC.
No compatibility matrices. The prompt is the bridge.

```

#### `docs/OPENCLAW.md:10-29`

````markdown
## Architecture

```
  OpenClaw                               gstack repo
  ─────────────────────                    ──────────────
  Orchestrator: messaging,                 Source of truth for
  calendar, memory, EA                     methodology + planning
       │                                        │
       ├── Native skills (conversational)       ├── Generates native skills
       │   office-hours, ceo-review,            │   via gen-skill-docs pipeline
       │   investigate, retro                   │
       │                                        ├── Generates gstack-lite
       ├── sessions_spawn(runtime: "acp")       │   (planning discipline)
       │       │                                │
       │       └── Claude Code                  ├── Generates gstack-full
       │           └── gstack installed at      │   (complete pipeline)
       │               ~/.claude/skills/gstack  │
       │                                        └── docs/OPENCLAW.md (this file)
       └── Dispatch routing (AGENTS.md)
```
````

<!-- source-snippets:end -->
</details>
## 架构分工

```mermaid
flowchart TD
  A[OpenClaw orchestrator] --> B[sessions_spawn runtime acp]
  B --> C[Claude Code session]
  C --> D[gstack installed in Claude]
  E[gstack repo] --> F[gstack-lite]
  E --> G[gstack-full]
  E --> H[gstack-plan]
  E --> I[Native OpenClaw skills]
  F --> A
  G --> A
  H --> A
  I --> A
```

OpenClaw 侧按任务复杂度选择 tier：simple 不注入 gstack，medium 注入 `gstack-lite`，heavy 让 Claude Code load gstack 并运行指定技能，full 注入完整 pipeline，plan 只产出计划不实现。Sources: [docs/OPENCLAW.md:31-49](../../../project-repos/gstack/docs/OPENCLAW.md#L31-L49)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:31-49`

```markdown
## Dispatch Routing

OpenClaw decides at spawn time which tier of gstack support to use:

| Tier | When | Prompt prefix |
|------|------|---------------|
| **Simple** | One-file edits, typos, config changes | No gstack context injected |
| **Medium** | Multi-file features, refactors | gstack-lite CLAUDE.md appended |
| **Heavy** | Specific gstack skill needed | "Load gstack. Run /X" |
| **Full** | Complete features, objectives, projects | gstack-full pipeline appended |
| **Plan** | "Help me plan a Claude Code project" | gstack-plan pipeline appended |

### Decision heuristic

- Can it be done in <10 lines of code? -> **Simple**
- Does it touch multiple files but the approach is obvious? -> **Medium**
- Does the user name a specific skill (/cso, /review, /qa)? -> **Heavy**
- Is it a feature, project, or objective (not a task)? -> **Full**
- Does the user want to PLAN something for Claude Code without implementing yet? -> **Plan**
```

<!-- source-snippets:end -->
</details>
## 生成产物

| 产物 | 用途 | 来源 |
|---|---|---|
| `openclaw/gstack-lite-CLAUDE.md` | 多文件任务的轻量 planning discipline | Sources: [docs/OPENCLAW.md:70-84](../../../project-repos/gstack/docs/OPENCLAW.md#L70-L84) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:70-84`

```markdown
## What gstack generates for OpenClaw

All artifacts live in the `openclaw/` directory and are generated by
`bun run gen:skill-docs --host openclaw`:

### gstack-lite (Medium tier)
`openclaw/gstack-lite-CLAUDE.md` — ~15 lines of planning discipline:
1. Read every file before modifying
2. Write a 5-line plan: what, why, which files, test case, risk
3. Resolve ambiguity using decision principles
4. Self-review before reporting done
5. Completion report: what shipped, decisions made, anything uncertain

A/B tested: 2x time, meaningfully better output.

```

<!-- source-snippets:end -->
</details>
| `openclaw/gstack-full-CLAUDE.md` | 完整 feature pipeline：理解项目、autoplan、实现、ship | Sources: [docs/OPENCLAW.md:85-92](../../../project-repos/gstack/docs/OPENCLAW.md#L85-L92) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:85-92`

```markdown
### gstack-full (Full tier)
`openclaw/gstack-full-CLAUDE.md` — chains existing gstack skills:
1. Read CLAUDE.md and understand the project
2. Run /autoplan (CEO + eng + design review)
3. Implement the approved plan
4. Run /ship to create a PR
5. Report back with PR URL and decisions

```

<!-- source-snippets:end -->
</details>
| `openclaw/gstack-plan-CLAUDE.md` | 只做 planning gauntlet，不实现 | Sources: [docs/OPENCLAW.md:93-103](../../../project-repos/gstack/docs/OPENCLAW.md#L93-L103) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:93-103`

```markdown
### gstack-plan (Plan tier)
`openclaw/gstack-plan-CLAUDE.md` — full review gauntlet, no implementation:
1. Run /office-hours to produce a design doc
2. Run /autoplan (CEO + eng + design + DX reviews + codex adversarial)
3. Save the reviewed plan to `plans/<project-slug>-plan-<date>.md`
4. Report back: plan path, summary, key decisions, recommended next step

The orchestrator persists the plan link to its own memory store (brain repo,
knowledge base, or whatever is configured in AGENTS.md). When the user is
ready to build, spawn a FULL session that references the saved plan.

```

<!-- source-snippets:end -->
</details>
| `openclaw/skills/*` | 原生 conversational methodology skills | Sources: [docs/OPENCLAW.md:104-113](../../../project-repos/gstack/docs/OPENCLAW.md#L104-L113) |

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:104-113`

```markdown
### Native methodology skills
Published to ClawHub. Install with `clawhub install`:
- `gstack-openclaw-office-hours` — Product interrogation (6 forcing questions)
- `gstack-openclaw-ceo-review` — Strategic challenge (10-section review, 4 modes)
- `gstack-openclaw-investigate` — Operational debugging (4-phase methodology)
- `gstack-openclaw-retro` — Operational retrospective (weekly review)

Source lives in `openclaw/skills/` in the gstack repo. These are hand-crafted
adaptations of the gstack methodology for OpenClaw's conversational context.
No gstack infrastructure (no browse, no telemetry, no preamble).
```

<!-- source-snippets:end -->
</details>
## Host config 与 adapter

`hosts/openclaw.ts` 声明 OpenClaw 的输出根、frontmatter、path rewrite、tool rewrite 和 suppressed resolvers；adapter 负责把 Claude tool 语义转换成 OpenClaw 能理解的 prose/session_spawn/browser exec 形态。Sources: [hosts/openclaw.ts:3-74](../../../project-repos/gstack/hosts/openclaw.ts#L3-L74), [scripts/host-adapters/openclaw-adapter.ts:1-45](../../../project-repos/gstack/scripts/host-adapters/openclaw-adapter.ts#L1-L45)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `hosts/openclaw.ts:3-74`

```typescript
const openclaw: HostConfig = {
  name: 'openclaw',
  displayName: 'OpenClaw',
  cliCommand: 'openclaw',
  cliAliases: [],

  globalRoot: '.openclaw/skills/gstack',
  localSkillRoot: '.openclaw/skills/gstack',
  hostSubdir: '.openclaw',
  usesEnvVars: true,

  frontmatter: {
    mode: 'allowlist',
    keepFields: ['name', 'description'],
    descriptionLimit: null,
    extraFields: {
      version: '0.15.2.0',
    },
  },

  generation: {
    generateMetadata: false,
    skipSkills: ['codex'],
    includeSkills: [],
  },

  pathRewrites: [
    { from: '~/.claude/skills/gstack', to: '~/.openclaw/skills/gstack' },
    { from: '.claude/skills/gstack', to: '.openclaw/skills/gstack' },
    { from: '.claude/skills', to: '.openclaw/skills' },
    { from: 'CLAUDE.md', to: 'AGENTS.md' },
  ],
  toolRewrites: {
    'use the Bash tool': 'use the exec tool',
    'use the Write tool': 'use the write tool',
    'use the Read tool': 'use the read tool',
    'use the Edit tool': 'use the edit tool',
    'use the Agent tool': 'use sessions_spawn',
    'use the Grep tool': 'search for',
    'use the Glob tool': 'find files matching',
    'the Bash tool': 'the exec tool',
    'the Read tool': 'the read tool',
    'the Write tool': 'the write tool',
    'the Edit tool': 'the edit tool',
  },

  // Suppress Claude-specific preamble sections that don't apply to OpenClaw
  suppressedResolvers: [
    'DESIGN_OUTSIDE_VOICES',
    'ADVERSARIAL_STEP',
    'CODEX_SECOND_OPINION',
    'CODEX_PLAN_REVIEW',
    'REVIEW_ARMY',
    'GBRAIN_CONTEXT_LOAD',
    'GBRAIN_SAVE_RESULTS',
  ],

  runtimeRoot: {
    globalSymlinks: ['bin', 'browse/dist', 'browse/bin', 'gstack-upgrade', 'ETHOS.md'],
    globalFiles: {
      'review': ['checklist.md', 'TODOS-format.md'],
    },
  },

  install: {
    prefixable: false,
    linkingStrategy: 'symlink-generated',
  },

  coAuthorTrailer: 'Co-Authored-By: OpenClaw Agent <agent@openclaw.ai>',
  learningsMode: 'basic',
};
```

#### `scripts/host-adapters/openclaw-adapter.ts:1-45`

```typescript
/**
 * OpenClaw host adapter — post-processing content transformer.
 *
 * Runs AFTER generic frontmatter/path/tool rewrites from the config system.
 * Handles semantic transformations that string-replace can't cover:
 *
 * 1. AskUserQuestion → prose instructions (tool call → "ask the user")
 * 2. Agent spawning → sessions_spawn patterns
 * 3. Browse binary patterns ($B → browser/exec)
 * 4. Preamble binary references → strip or map
 *
 * Interface: transform(content, config) → transformed content
 */

import type { HostConfig } from '../host-config';

/**
 * Transform generated SKILL.md content for OpenClaw compatibility.
 * Called after all generic rewrites (paths, tools, frontmatter) have been applied.
 */
export function transform(content: string, _config: HostConfig): string {
  let result = content;

  // 1. AskUserQuestion references → prose
  result = result.replaceAll('AskUserQuestion', 'ask the user directly in chat');
  result = result.replaceAll('Use AskUserQuestion', 'Ask the user directly');
  result = result.replaceAll('use AskUserQuestion', 'ask the user directly');

  // 2. Agent tool references → sessions_spawn
  result = result.replaceAll('the Agent tool', 'sessions_spawn');
  result = result.replaceAll('Agent tool', 'sessions_spawn');
  result = result.replaceAll('subagent_type', 'task parameter');

  // 3. Browse binary patterns
  result = result.replaceAll('`$B ', '`exec $B ');

  // 4. Strip gstack binary references that won't exist on OpenClaw
  // These are preamble utilities — OpenClaw doesn't use them
  result = result.replace(/~\/\.openclaw\/skills\/gstack\/bin\/gstack-[\w-]+/g, (match) => {
    // Keep the reference but note it as exec-based
    return match;
  });

  return result;
}
```

<!-- source-snippets:end -->
</details>
## 原生技能示例

`gstack-openclaw-office-hours` 明确禁止实现，只产出 design document；它保留了 gstack 的产品诊断方法，但适配为 OpenClaw 聊天语境。Sources: [openclaw/skills/gstack-openclaw-office-hours/SKILL.md:1-22](../../../project-repos/gstack/openclaw/skills/gstack-openclaw-office-hours/SKILL.md#L1-L22), [openclaw/skills/gstack-openclaw-office-hours/SKILL.md:48-126](../../../project-repos/gstack/openclaw/skills/gstack-openclaw-office-hours/SKILL.md#L48-L126)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `openclaw/skills/gstack-openclaw-office-hours/SKILL.md:1-22`

```markdown
---
name: gstack-openclaw-office-hours
description: Use when asked to brainstorm, evaluate whether an idea is worth building, run office hours, or think through a new product idea or design direction before any code is written.
---

# YC Office Hours

You are a **YC office hours partner**. Your job is to ensure the problem is understood before solutions are proposed. You adapt to what the user is building... startup founders get the hard questions, builders get an enthusiastic collaborator. This skill produces design docs, not code.

**HARD GATE:** Do NOT invoke any implementation, write any code, scaffold any project, or take any implementation action. Your only output is a design document.

---

## Phase 1: Context Gathering

Understand the project and the area the user wants to change.

1. Read the workspace and any existing project docs to understand what already exists.
2. Check git log to understand recent context.
3. Search the codebase for areas most relevant to the user's request.

4. **Ask: what's your goal with this?** This is a real question, not a formality. The answer determines everything about how the session runs.
```

#### `openclaw/skills/gstack-openclaw-office-hours/SKILL.md:48-126`

```markdown
## Phase 2A: Startup Mode — YC Product Diagnostic

Use this mode when the user is building a startup or doing intrapreneurship.

### Operating Principles

These are non-negotiable. They shape every response in this mode.

**Specificity is the only currency.** Vague answers get pushed. "Enterprises in healthcare" is not a customer. "Everyone needs this" means you can't find anyone. You need a name, a role, a company, a reason.

**Interest is not demand.** Waitlists, signups, "that's interesting" ... none of it counts. Behavior counts. Money counts. Panic when it breaks counts. A customer calling you when your service goes down for 20 minutes... that's demand.

**The user's words beat the founder's pitch.** There is almost always a gap between what the founder says the product does and what users say it does. The user's version is the truth.

**Watch, don't demo.** Guided walkthroughs teach you nothing about real usage. Sitting behind someone while they struggle teaches you everything.

**The status quo is your real competitor.** Not the other startup, not the big company... the cobbled-together spreadsheet-and-Slack-messages workaround your user is already living with.

**Narrow beats wide, early.** The smallest version someone will pay real money for this week is more valuable than the full platform vision. Wedge first. Expand from strength.

### Response Posture

- **Be direct to the point of discomfort.** Comfort means you haven't pushed hard enough. Your job is diagnosis, not encouragement.
- **Push once, then push again.** The first answer to any question is usually the polished version. The real answer comes after the second or third push.
- **Calibrated acknowledgment, not praise.** When a founder gives a specific, evidence-based answer, name what was good and pivot to a harder question.
- **Name common failure patterns.** If you recognize "solution in search of a problem," "hypothetical users," "waiting to launch until it's perfect" ... name it directly.
- **End with the assignment.** Every session should produce one concrete thing the founder should do next. Not a strategy... an action.

### Anti-Sycophancy Rules

**Never say these during the diagnostic:**
- "That's an interesting approach" ... take a position instead
- "There are many ways to think about this" ... pick one and state what evidence would change your mind
- "You might want to consider..." ... say "This is wrong because..." or "This works because..."
- "That could work" ... say whether it WILL work based on the evidence you have
- "I can see why you'd think that" ... if they're wrong, say they're wrong and why

**Always do:**
- Take a position on every answer. State your position AND what evidence would change it.
- Challenge the strongest version of the founder's claim, not a strawman.

### Pushback Patterns

**Vague market → force specificity**
- Founder: "I'm building an AI tool for developers"
- BAD: "That's a big market! Let's explore what kind of tool."
- GOOD: "There are 10,000 AI developer tools right now. What specific task does a specific developer currently waste 2+ hours on per week that your tool eliminates? Name the person."

**Social proof → demand test**
- Founder: "Everyone I've talked to loves the idea"
- BAD: "That's encouraging! Who specifically have you talked to?"
- GOOD: "Loving an idea is free. Has anyone offered to pay? Has anyone asked when it ships? Has anyone gotten angry when your prototype broke? Love is not demand."

**Platform vision → wedge challenge**
- Founder: "We need to build the full platform before anyone can really use it"
- BAD: "What would a stripped-down version look like?"
- GOOD: "That's a red flag. If no one can get value from a smaller version, it usually means the value proposition isn't clear yet. What's the one thing a user would pay for this week?"

**Growth stats → vision test**
- Founder: "The market is growing 20% year over year"
- BAD: "That's a strong tailwind."
- GOOD: "Growth rate is not a vision. Every competitor can cite the same stat. What's YOUR thesis about how this market changes in a way that makes YOUR product more essential?"

**Undefined terms → precision demand**
- Founder: "We want to make onboarding more seamless"
- BAD: "What does your current onboarding flow look like?"
- GOOD: "'Seamless' is not a product feature. What specific step in onboarding causes users to drop off? What's the drop-off rate? Have you watched someone go through it?"

### The Six Forcing Questions

Ask these questions **ONE AT A TIME**. Push on each one until the answer is specific, evidence-based, and uncomfortable.

**Smart routing based on product stage:**
- Pre-product → Q1, Q2, Q3
- Has users → Q2, Q4, Q5
- Has paying customers → Q4, Q5, Q6
- Pure engineering/infra → Q2, Q4 only

**Intrapreneurship adaptation:** For internal projects, reframe Q4 as "what's the smallest demo that gets your VP/sponsor to greenlight the project?" and Q6 as "does this survive a reorg?"
```

<!-- source-snippets:end -->
</details>
## 不做什么

OpenClaw 文档列出 non-goals：不做 dispatch daemon、不做 Clawvisor relay、不做 bidirectional learnings bridge、不做 JSON schema/protocol versioning、不完整移植所有 Claude Code coding skills。Sources: [docs/OPENCLAW.md:138-145](../../../project-repos/gstack/docs/OPENCLAW.md#L138-L145)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/OPENCLAW.md:138-145`

```markdown
## What we don't do

- No dispatch daemon (ACP handles session spawning)
- No Clawvisor relay (no security layer needed)
- No bidirectional learnings bridge (brain repo is the knowledge store)
- No JSON schemas or protocol versioning
- No SOUL.md from gstack (OpenClaw has its own)
- No full skill porting (coding skills stay native to Claude Code)
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [安装与多宿主接入](setup-and-hosts.md)
- [技能生成系统](skill-generation.md)
- [技能工作流](skill-workflow.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [package.json](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/package.json)
- [CONTRIBUTING.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CONTRIBUTING.md)
- [test/skill-validation.test.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/test/skill-validation.test.ts)
- [.github/workflows/skill-docs.yml](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/.github/workflows/skill-docs.yml)
- [.github/workflows/evals.yml](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/.github/workflows/evals.yml)
- [ARCHITECTURE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/ARCHITECTURE.md)
- [browse/src/cdp-allowlist.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/browse/src/cdp-allowlist.ts)

</details>

# 测试、CI 与质量门

gstack 的质量体系分成免费静态测试、付费/慢速 E2E eval、LLM-as-judge、技能文档 freshness gate 和 GitHub Actions 矩阵。`package.json` 把这些都暴露为 `bun test`、`test:evals`、`test:e2e`、`test:gate`、`skill:check` 等脚本。Sources: [package.json:19-41](../../../project-repos/gstack/package.json#L19-L41), [CONTRIBUTING.md:109-137](../../../project-repos/gstack/CONTRIBUTING.md#L109-L137)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `package.json:19-41`

```json
    "test": "bun test browse/test/ test/ make-pdf/test/ --ignore 'test/skill-e2e-*.test.ts' --ignore test/skill-llm-eval.test.ts --ignore test/skill-routing-e2e.test.ts --ignore test/codex-e2e.test.ts --ignore test/gemini-e2e.test.ts && (bun run slop:diff 2>/dev/null || true)",
    "test:evals": "EVALS=1 bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-llm-eval.test.ts test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:evals:all": "EVALS=1 EVALS_ALL=1 bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-llm-eval.test.ts test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:e2e": "EVALS=1 bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:e2e:all": "EVALS=1 EVALS_ALL=1 bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:gate": "EVALS=1 EVALS_TIER=gate bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-llm-eval.test.ts test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:periodic": "EVALS=1 EVALS_TIER=periodic EVALS_ALL=1 bun test --retry 2 --concurrent --max-concurrency ${EVALS_CONCURRENCY:-15} test/skill-e2e-*.test.ts test/skill-routing-e2e.test.ts test/codex-e2e.test.ts test/gemini-e2e.test.ts",
    "test:codex": "EVALS=1 bun test test/codex-e2e.test.ts",
    "test:codex:all": "EVALS=1 EVALS_ALL=1 bun test test/codex-e2e.test.ts",
    "test:gemini": "EVALS=1 bun test test/gemini-e2e.test.ts",
    "test:gemini:all": "EVALS=1 EVALS_ALL=1 bun test test/gemini-e2e.test.ts",
    "skill:check": "bun run scripts/skill-check.ts",
    "dev:skill": "bun run scripts/dev-skill.ts",
    "start": "bun run browse/src/server.ts",
    "eval:list": "bun run scripts/eval-list.ts",
    "eval:compare": "bun run scripts/eval-compare.ts",
    "eval:summary": "bun run scripts/eval-summary.ts",
    "eval:watch": "bun run scripts/eval-watch.ts",
    "eval:select": "bun run scripts/eval-select.ts",
    "analytics": "bun run scripts/analytics.ts",
    "test:audit": "bun test test/audit-compliance.test.ts",
    "slop": "npx slop-scan scan . 2>/dev/null || echo 'slop-scan not available (install with: npm i -g slop-scan)'",
    "slop:diff": "bun run scripts/slop-diff.ts"
```

#### `CONTRIBUTING.md:109-137`

````markdown
## Testing & evals

### Setup

```bash
# 1. Copy .env.example and add your API key
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY=sk-ant-...

# 2. Install deps (if you haven't already)
bun install
```

Bun auto-loads `.env` — no extra config. Conductor workspaces inherit `.env` from the main worktree automatically (see "Conductor workspaces" below).

### Test tiers

| Tier | Command | Cost | What it tests |
|------|---------|------|---------------|
| 1 — Static | `bun test` | Free | Command validation, snapshot flags, SKILL.md correctness, TODOS-format.md refs, observability unit tests |
| 2 — E2E | `bun run test:e2e` | ~$3.85 | Full skill execution via `claude -p` subprocess |
| 3 — LLM eval | `bun run test:evals` | ~$0.15 standalone | LLM-as-judge scoring of generated SKILL.md docs |
| 2+3 | `bun run test:evals` | ~$4 combined | E2E + LLM-as-judge (runs both) |

```bash
bun test                     # Tier 1 only (runs on every commit, <5s)
bun run test:e2e             # Tier 2: E2E only (needs EVALS=1, can't run inside Claude Code)
bun run test:evals           # Tier 2 + 3 combined (~$4/run)
```
````

<!-- source-snippets:end -->
</details>
## 测试分层

```mermaid
flowchart TD
  A[Code or template change] --> B[bun test]
  B --> C[skill parser + command validation]
  B --> D[generator tests]
  B --> E[browse integration tests]
  A --> F[EVALS=1]
  F --> G[claude -p E2E]
  F --> H[LLM-as-judge]
  A --> I[CI freshness]
  I --> J[gen-skill-docs + git diff]
```

`CONTRIBUTING.md` 说明 Tier 1 是免费静态验证，Tier 2 通过 `claude -p` 跑完整技能执行，Tier 3 用 Sonnet 给生成技能文档打分。Sources: [CONTRIBUTING.md:124-205](../../../project-repos/gstack/CONTRIBUTING.md#L124-L205), [ARCHITECTURE.md:290-298](../../../project-repos/gstack/ARCHITECTURE.md#L290-L298), [ARCHITECTURE.md:332-412](../../../project-repos/gstack/ARCHITECTURE.md#L332-L412)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:124-205`

````markdown
### Test tiers

| Tier | Command | Cost | What it tests |
|------|---------|------|---------------|
| 1 — Static | `bun test` | Free | Command validation, snapshot flags, SKILL.md correctness, TODOS-format.md refs, observability unit tests |
| 2 — E2E | `bun run test:e2e` | ~$3.85 | Full skill execution via `claude -p` subprocess |
| 3 — LLM eval | `bun run test:evals` | ~$0.15 standalone | LLM-as-judge scoring of generated SKILL.md docs |
| 2+3 | `bun run test:evals` | ~$4 combined | E2E + LLM-as-judge (runs both) |

```bash
bun test                     # Tier 1 only (runs on every commit, <5s)
bun run test:e2e             # Tier 2: E2E only (needs EVALS=1, can't run inside Claude Code)
bun run test:evals           # Tier 2 + 3 combined (~$4/run)
```

### Tier 1: Static validation (free)

Runs automatically with `bun test`. No API keys needed.

- **Skill parser tests** (`test/skill-parser.test.ts`) — Extracts every `$B` command from SKILL.md bash code blocks and validates against the command registry in `browse/src/commands.ts`. Catches typos, removed commands, and invalid snapshot flags.
- **Skill validation tests** (`test/skill-validation.test.ts`) — Validates that SKILL.md files reference only real commands and flags, and that command descriptions meet quality thresholds.
- **Generator tests** (`test/gen-skill-docs.test.ts`) — Tests the template system: verifies placeholders resolve correctly, output includes value hints for flags (e.g. `-d <N>` not just `-d`), enriched descriptions for key commands (e.g. `is` lists valid states, `press` lists key examples).

### Tier 2: E2E via `claude -p` (~$3.85/run)

Spawns `claude -p` as a subprocess with `--output-format stream-json --verbose`, streams NDJSON for real-time progress, and scans for browse errors. This is the closest thing to "does this skill actually work end-to-end?"

```bash
# Must run from a plain terminal — can't nest inside Claude Code or Conductor
EVALS=1 bun test test/skill-e2e-*.test.ts
```

- Gated by `EVALS=1` env var (prevents accidental expensive runs)
- Auto-skips if running inside Claude Code (`claude -p` can't nest)
- API connectivity pre-check — fails fast on ConnectionRefused before burning budget
- Real-time progress to stderr: `[Ns] turn T tool #C: Name(...)`
- Saves full NDJSON transcripts and failure JSON for debugging
- Tests live in `test/skill-e2e-*.test.ts` (split by category), runner logic in `test/helpers/session-runner.ts`

### E2E observability

When E2E tests run, they produce machine-readable artifacts in `~/.gstack-dev/`:

| Artifact | Path | Purpose |
|----------|------|---------|
| Heartbeat | `e2e-live.json` | Current test status (updated per tool call) |
| Partial results | `evals/_partial-e2e.json` | Completed tests (survives kills) |
| Progress log | `e2e-runs/{runId}/progress.log` | Append-only text log |
| NDJSON transcripts | `e2e-runs/{runId}/{test}.ndjson` | Raw `claude -p` output per test |
| Failure JSON | `e2e-runs/{runId}/{test}-failure.json` | Diagnostic data on failure |

**Live dashboard:** Run `bun run eval:watch` in a second terminal to see a live dashboard showing completed tests, the currently running test, and cost. Use `--tail` to also show the last 10 lines of progress.log.

**Eval history tools:**

```bash
bun run eval:list            # list all eval runs (turns, duration, cost per run)
bun run eval:compare         # compare two runs — shows per-test deltas + Takeaway commentary
bun run eval:summary         # aggregate stats + per-test efficiency averages across runs
```

**Eval comparison commentary:** `eval:compare` generates natural-language Takeaway sections interpreting what changed between runs — flagging regressions, noting improvements, calling out efficiency gains (fewer turns, faster, cheaper), and producing an overall summary. This is driven by `generateCommentary()` in `eval-store.ts`.

Artifacts are never cleaned up — they accumulate in `~/.gstack-dev/` for post-mortem debugging and trend analysis.

### Tier 3: LLM-as-judge (~$0.15/run)

Uses Claude Sonnet to score generated SKILL.md docs on three dimensions:

- **Clarity** — Can an AI agent understand the instructions without ambiguity?
- **Completeness** — Are all commands, flags, and usage patterns documented?
- **Actionability** — Can the agent execute tasks using only the information in the doc?

Each dimension is scored 1-5. Threshold: every dimension must score **≥ 4**. There's also a regression test that compares generated docs against the hand-maintained baseline from `origin/main` — generated must score equal or higher.

```bash
# Needs ANTHROPIC_API_KEY in .env — included in bun run test:evals
```

- Uses `claude-sonnet-4-6` for scoring stability
- Tests live in `test/skill-llm-eval.test.ts`
- Calls the Anthropic API directly (not `claude -p`), so it works from anywhere including inside Claude Code
````

#### `ARCHITECTURE.md:290-298`

```markdown
### Template test tiers

| Tier | What | Cost | Speed |
|------|------|------|-------|
| 1 — Static validation | Parse every `$B` command in SKILL.md, validate against registry | Free | <2s |
| 2 — E2E via `claude -p` | Spawn real Claude session, run each skill, check for errors | ~$3.85 | ~20min |
| 3 — LLM-as-judge | Sonnet scores docs on clarity/completeness/actionability | ~$0.15 | ~30s |

Tier 1 runs on every `bun test`. Tiers 2+3 are gated behind `EVALS=1`. The idea is: catch 95% of issues for free, use LLMs only for judgment calls.
```

#### `ARCHITECTURE.md:332-412`

````markdown
## E2E test infrastructure

### Session runner (`test/helpers/session-runner.ts`)

E2E tests spawn `claude -p` as a completely independent subprocess — not via the Agent SDK, which can't nest inside Claude Code sessions. The runner:

1. Writes the prompt to a temp file (avoids shell escaping issues)
2. Spawns `sh -c 'cat prompt | claude -p --output-format stream-json --verbose'`
3. Streams NDJSON from stdout for real-time progress
4. Races against a configurable timeout
5. Parses the full NDJSON transcript into structured results

The `parseNDJSON()` function is pure — no I/O, no side effects — making it independently testable.

### Observability data flow

```
  skill-e2e-*.test.ts
        │
        │ generates runId, passes testName + runId to each call
        │
  ┌─────┼──────────────────────────────┐
  │     │                              │
  │  runSkillTest()              evalCollector
  │  (session-runner.ts)         (eval-store.ts)
  │     │                              │
  │  per tool call:              per addTest():
  │  ┌──┼──────────┐              savePartial()
  │  │  │          │                   │
  │  ▼  ▼          ▼                   ▼
  │ [HB] [PL]    [NJ]          _partial-e2e.json
  │  │    │        │             (atomic overwrite)
  │  │    │        │
  │  ▼    ▼        ▼
  │ e2e-  prog-  {name}
  │ live  ress   .ndjson
  │ .json .log
  │
  │  on failure:
  │  {name}-failure.json
  │
  │  ALL files in ~/.gstack-dev/
  │  Run dir: e2e-runs/{runId}/
  │
  │         eval-watch.ts
  │              │
  │        ┌─────┴─────┐
  │     read HB     read partial
  │        └─────┬─────┘
  │              ▼
  │        render dashboard
  │        (stale >10min? warn)
```

**Split ownership:** session-runner owns the heartbeat (current test state), eval-store owns partial results (completed test state). The watcher reads both. Neither component knows about the other — they share data only through the filesystem.

**Non-fatal everything:** All observability I/O is wrapped in try/catch. A write failure never causes a test to fail. The tests themselves are the source of truth; observability is best-effort.

**Machine-readable diagnostics:** Each test result includes `exit_reason` (success, timeout, error_max_turns, error_api, exit_code_N), `timeout_at_turn`, and `last_tool_call`. This enables `jq` queries like:
```bash
jq '.tests[] | select(.exit_reason == "timeout") | .last_tool_call' ~/.gstack-dev/evals/_partial-e2e.json
```

### Eval persistence (`test/helpers/eval-store.ts`)

The `EvalCollector` accumulates test results and writes them in two ways:

1. **Incremental:** `savePartial()` writes `_partial-e2e.json` after each test (atomic: write `.tmp`, `fs.renameSync`). Survives kills.
2. **Final:** `finalize()` writes a timestamped eval file (e.g. `e2e-20260314-143022.json`). The partial file is never cleaned up — it persists alongside the final file for observability.

`eval:compare` diffs two eval runs. `eval:summary` aggregates stats across all runs in `~/.gstack-dev/evals/`.

### Test tiers

| Tier | What | Cost | Speed |
|------|------|------|-------|
| 1 — Static validation | Parse `$B` commands, validate against registry, observability unit tests | Free | <5s |
| 2 — E2E via `claude -p` | Spawn real Claude session, run each skill, scan for errors | ~$3.85 | ~20min |
| 3 — LLM-as-judge | Sonnet scores docs on clarity/completeness/actionability | ~$0.15 | ~30s |

Tier 1 runs on every `bun test`. Tiers 2+3 are gated behind `EVALS=1`. The idea: catch 95% of issues for free, use LLMs only for judgment calls and integration testing.
````

<!-- source-snippets:end -->
</details>
## 静态验证重点

`test/skill-validation.test.ts` 检查 `$B` 命令是否存在于 registry、snapshot flags 是否有效、`COMMAND_DESCRIPTIONS` 是否覆盖所有 command set、生成的 `SKILL.md` 是否没有未解析 placeholder。Sources: [test/skill-validation.test.ts:1-116](../../../project-repos/gstack/test/skill-validation.test.ts#L1-L116), [test/skill-validation.test.ts:118-224](../../../project-repos/gstack/test/skill-validation.test.ts#L118-L224)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `test/skill-validation.test.ts:1-116`

```typescript
import { describe, test, expect } from 'bun:test';
import { validateSkill, extractRemoteSlugPatterns, extractWeightsFromTable } from './helpers/skill-parser';
import { ALL_COMMANDS, COMMAND_DESCRIPTIONS, READ_COMMANDS, WRITE_COMMANDS, META_COMMANDS } from '../browse/src/commands';
import { SNAPSHOT_FLAGS } from '../browse/src/snapshot';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

describe('SKILL.md command validation', () => {
  test('all $B commands in SKILL.md are valid browse commands', () => {
    const result = validateSkill(path.join(ROOT, 'SKILL.md'));
    expect(result.invalid).toHaveLength(0);
    expect(result.valid.length).toBeGreaterThan(0);
  });

  test('all snapshot flags in SKILL.md are valid', () => {
    const result = validateSkill(path.join(ROOT, 'SKILL.md'));
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in browse/SKILL.md are valid browse commands', () => {
    const result = validateSkill(path.join(ROOT, 'browse', 'SKILL.md'));
    expect(result.invalid).toHaveLength(0);
    expect(result.valid.length).toBeGreaterThan(0);
  });

  test('all snapshot flags in browse/SKILL.md are valid', () => {
    const result = validateSkill(path.join(ROOT, 'browse', 'SKILL.md'));
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in qa/SKILL.md are valid browse commands', () => {
    const qaSkill = path.join(ROOT, 'qa', 'SKILL.md');
    if (!fs.existsSync(qaSkill)) return; // skip if missing
    const result = validateSkill(qaSkill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in qa/SKILL.md are valid', () => {
    const qaSkill = path.join(ROOT, 'qa', 'SKILL.md');
    if (!fs.existsSync(qaSkill)) return;
    const result = validateSkill(qaSkill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in qa-only/SKILL.md are valid browse commands', () => {
    const qaOnlySkill = path.join(ROOT, 'qa-only', 'SKILL.md');
    if (!fs.existsSync(qaOnlySkill)) return;
    const result = validateSkill(qaOnlySkill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in qa-only/SKILL.md are valid', () => {
    const qaOnlySkill = path.join(ROOT, 'qa-only', 'SKILL.md');
    if (!fs.existsSync(qaOnlySkill)) return;
    const result = validateSkill(qaOnlySkill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in plan-design-review/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'plan-design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in plan-design-review/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'plan-design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in design-review/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in design-review/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in design-consultation/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'design-consultation', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in design-consultation/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'design-consultation', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in autoplan/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'autoplan', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in autoplan/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'autoplan', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });
});
```

#### `test/skill-validation.test.ts:118-224`

```typescript
describe('Command registry consistency', () => {
  test('COMMAND_DESCRIPTIONS covers all commands in sets', () => {
    const allCmds = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    const descKeys = new Set(Object.keys(COMMAND_DESCRIPTIONS));
    for (const cmd of allCmds) {
      expect(descKeys.has(cmd)).toBe(true);
    }
  });

  test('COMMAND_DESCRIPTIONS has no extra commands not in sets', () => {
    const allCmds = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    for (const key of Object.keys(COMMAND_DESCRIPTIONS)) {
      expect(allCmds.has(key)).toBe(true);
    }
  });

  test('ALL_COMMANDS matches union of all sets', () => {
    const union = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    expect(ALL_COMMANDS.size).toBe(union.size);
    for (const cmd of union) {
      expect(ALL_COMMANDS.has(cmd)).toBe(true);
    }
  });

  test('SNAPSHOT_FLAGS option keys are valid SnapshotOptions fields', () => {
    const validKeys = new Set([
      'interactive', 'compact', 'depth', 'selector',
      'diff', 'annotate', 'outputPath', 'cursorInteractive',
      'heatmap',
    ]);
    for (const flag of SNAPSHOT_FLAGS) {
      expect(validKeys.has(flag.optionKey)).toBe(true);
    }
  });
});

describe('Usage string consistency', () => {
  // Normalize a usage string to its structural skeleton for comparison.
  // Replaces <param-names> with <>, [optional] with [], strips parenthetical hints.
  // This catches format mismatches (e.g., <name>:<value> vs <name> <value>)
  // without tripping on abbreviation differences (e.g., <sel> vs <selector>).
  function skeleton(usage: string): string {
    return usage
      .replace(/\(.*?\)/g, '')        // strip parenthetical hints like (e.g., Enter, Tab)
      .replace(/<[^>]*>/g, '<>')      // normalize <param-name> → <>
      .replace(/\[[^\]]*\]/g, '[]')   // normalize [optional] → []
      .replace(/\s+/g, ' ')           // collapse whitespace
      .trim();
  }

  // Cross-check Usage: patterns in implementation against COMMAND_DESCRIPTIONS
  test('implementation Usage: structural format matches COMMAND_DESCRIPTIONS', () => {
    const implFiles = [
      path.join(ROOT, 'browse', 'src', 'write-commands.ts'),
      path.join(ROOT, 'browse', 'src', 'read-commands.ts'),
      path.join(ROOT, 'browse', 'src', 'meta-commands.ts'),
    ];

    // Extract "Usage: browse <pattern>" from throw new Error(...) calls
    const usagePattern = /throw new Error\(['"`]Usage:\s*browse\s+(.+?)['"`]\)/g;
    const implUsages = new Map<string, string>();

    for (const file of implFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      let match;
      while ((match = usagePattern.exec(content)) !== null) {
        const usage = match[1].split('\\n')[0].trim();
        const cmd = usage.split(/\s/)[0];
        implUsages.set(cmd, usage);
      }
    }

    // Compare structural skeletons
    const mismatches: string[] = [];
    for (const [cmd, implUsage] of implUsages) {
      const desc = COMMAND_DESCRIPTIONS[cmd];
      if (!desc) continue;
      if (!desc.usage) continue;
      const descSkel = skeleton(desc.usage);
      const implSkel = skeleton(implUsage);
      if (descSkel !== implSkel) {
        mismatches.push(`${cmd}: docs "${desc.usage}" (${descSkel}) vs impl "${implUsage}" (${implSkel})`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe('Generated SKILL.md freshness', () => {
  test('no unresolved {{placeholders}} in generated SKILL.md', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const unresolved = content.match(/\{\{\w+\}\}/g);
    expect(unresolved).toBeNull();
  });

  test('no unresolved {{placeholders}} in generated browse/SKILL.md', () => {
    const content = fs.readFileSync(path.join(ROOT, 'browse', 'SKILL.md'), 'utf-8');
    const unresolved = content.match(/\{\{\w+\}\}/g);
    expect(unresolved).toBeNull();
  });

  test('generated SKILL.md has AUTO-GENERATED header', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    expect(content).toContain('AUTO-GENERATED');
  });
});
```

<!-- source-snippets:end -->
</details>
| 检查 | 目的 |
|---|---|
| `$B` command validation | 避免技能文档引用不存在的 Browse 命令 |
| snapshot flag validation | 避免 agent 使用无效 flag |
| command registry consistency | 保证 READ/WRITE/META 与描述表一致 |
| unresolved placeholder check | 保证提交的 `SKILL.md` 是生成完成状态 |

Sources: [test/skill-validation.test.ts:10-116](../../../project-repos/gstack/test/skill-validation.test.ts#L10-L116), [test/skill-validation.test.ts:118-224](../../../project-repos/gstack/test/skill-validation.test.ts#L118-L224)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `test/skill-validation.test.ts:10-116`

```typescript
describe('SKILL.md command validation', () => {
  test('all $B commands in SKILL.md are valid browse commands', () => {
    const result = validateSkill(path.join(ROOT, 'SKILL.md'));
    expect(result.invalid).toHaveLength(0);
    expect(result.valid.length).toBeGreaterThan(0);
  });

  test('all snapshot flags in SKILL.md are valid', () => {
    const result = validateSkill(path.join(ROOT, 'SKILL.md'));
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in browse/SKILL.md are valid browse commands', () => {
    const result = validateSkill(path.join(ROOT, 'browse', 'SKILL.md'));
    expect(result.invalid).toHaveLength(0);
    expect(result.valid.length).toBeGreaterThan(0);
  });

  test('all snapshot flags in browse/SKILL.md are valid', () => {
    const result = validateSkill(path.join(ROOT, 'browse', 'SKILL.md'));
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in qa/SKILL.md are valid browse commands', () => {
    const qaSkill = path.join(ROOT, 'qa', 'SKILL.md');
    if (!fs.existsSync(qaSkill)) return; // skip if missing
    const result = validateSkill(qaSkill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in qa/SKILL.md are valid', () => {
    const qaSkill = path.join(ROOT, 'qa', 'SKILL.md');
    if (!fs.existsSync(qaSkill)) return;
    const result = validateSkill(qaSkill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in qa-only/SKILL.md are valid browse commands', () => {
    const qaOnlySkill = path.join(ROOT, 'qa-only', 'SKILL.md');
    if (!fs.existsSync(qaOnlySkill)) return;
    const result = validateSkill(qaOnlySkill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in qa-only/SKILL.md are valid', () => {
    const qaOnlySkill = path.join(ROOT, 'qa-only', 'SKILL.md');
    if (!fs.existsSync(qaOnlySkill)) return;
    const result = validateSkill(qaOnlySkill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in plan-design-review/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'plan-design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in plan-design-review/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'plan-design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in design-review/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in design-review/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'design-review', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in design-consultation/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'design-consultation', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in design-consultation/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'design-consultation', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });

  test('all $B commands in autoplan/SKILL.md are valid browse commands', () => {
    const skill = path.join(ROOT, 'autoplan', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.invalid).toHaveLength(0);
  });

  test('all snapshot flags in autoplan/SKILL.md are valid', () => {
    const skill = path.join(ROOT, 'autoplan', 'SKILL.md');
    if (!fs.existsSync(skill)) return;
    const result = validateSkill(skill);
    expect(result.snapshotFlagErrors).toHaveLength(0);
  });
});
```

#### `test/skill-validation.test.ts:118-224`

```typescript
describe('Command registry consistency', () => {
  test('COMMAND_DESCRIPTIONS covers all commands in sets', () => {
    const allCmds = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    const descKeys = new Set(Object.keys(COMMAND_DESCRIPTIONS));
    for (const cmd of allCmds) {
      expect(descKeys.has(cmd)).toBe(true);
    }
  });

  test('COMMAND_DESCRIPTIONS has no extra commands not in sets', () => {
    const allCmds = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    for (const key of Object.keys(COMMAND_DESCRIPTIONS)) {
      expect(allCmds.has(key)).toBe(true);
    }
  });

  test('ALL_COMMANDS matches union of all sets', () => {
    const union = new Set([...READ_COMMANDS, ...WRITE_COMMANDS, ...META_COMMANDS]);
    expect(ALL_COMMANDS.size).toBe(union.size);
    for (const cmd of union) {
      expect(ALL_COMMANDS.has(cmd)).toBe(true);
    }
  });

  test('SNAPSHOT_FLAGS option keys are valid SnapshotOptions fields', () => {
    const validKeys = new Set([
      'interactive', 'compact', 'depth', 'selector',
      'diff', 'annotate', 'outputPath', 'cursorInteractive',
      'heatmap',
    ]);
    for (const flag of SNAPSHOT_FLAGS) {
      expect(validKeys.has(flag.optionKey)).toBe(true);
    }
  });
});

describe('Usage string consistency', () => {
  // Normalize a usage string to its structural skeleton for comparison.
  // Replaces <param-names> with <>, [optional] with [], strips parenthetical hints.
  // This catches format mismatches (e.g., <name>:<value> vs <name> <value>)
  // without tripping on abbreviation differences (e.g., <sel> vs <selector>).
  function skeleton(usage: string): string {
    return usage
      .replace(/\(.*?\)/g, '')        // strip parenthetical hints like (e.g., Enter, Tab)
      .replace(/<[^>]*>/g, '<>')      // normalize <param-name> → <>
      .replace(/\[[^\]]*\]/g, '[]')   // normalize [optional] → []
      .replace(/\s+/g, ' ')           // collapse whitespace
      .trim();
  }

  // Cross-check Usage: patterns in implementation against COMMAND_DESCRIPTIONS
  test('implementation Usage: structural format matches COMMAND_DESCRIPTIONS', () => {
    const implFiles = [
      path.join(ROOT, 'browse', 'src', 'write-commands.ts'),
      path.join(ROOT, 'browse', 'src', 'read-commands.ts'),
      path.join(ROOT, 'browse', 'src', 'meta-commands.ts'),
    ];

    // Extract "Usage: browse <pattern>" from throw new Error(...) calls
    const usagePattern = /throw new Error\(['"`]Usage:\s*browse\s+(.+?)['"`]\)/g;
    const implUsages = new Map<string, string>();

    for (const file of implFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      let match;
      while ((match = usagePattern.exec(content)) !== null) {
        const usage = match[1].split('\\n')[0].trim();
        const cmd = usage.split(/\s/)[0];
        implUsages.set(cmd, usage);
      }
    }

    // Compare structural skeletons
    const mismatches: string[] = [];
    for (const [cmd, implUsage] of implUsages) {
      const desc = COMMAND_DESCRIPTIONS[cmd];
      if (!desc) continue;
      if (!desc.usage) continue;
      const descSkel = skeleton(desc.usage);
      const implSkel = skeleton(implUsage);
      if (descSkel !== implSkel) {
        mismatches.push(`${cmd}: docs "${desc.usage}" (${descSkel}) vs impl "${implUsage}" (${implSkel})`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe('Generated SKILL.md freshness', () => {
  test('no unresolved {{placeholders}} in generated SKILL.md', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    const unresolved = content.match(/\{\{\w+\}\}/g);
    expect(unresolved).toBeNull();
  });

  test('no unresolved {{placeholders}} in generated browse/SKILL.md', () => {
    const content = fs.readFileSync(path.join(ROOT, 'browse', 'SKILL.md'), 'utf-8');
    const unresolved = content.match(/\{\{\w+\}\}/g);
    expect(unresolved).toBeNull();
  });

  test('generated SKILL.md has AUTO-GENERATED header', () => {
    const content = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
    expect(content).toContain('AUTO-GENERATED');
  });
});
```

<!-- source-snippets:end -->
</details>
## CI freshness gate

`skill-docs.yml` 在 push/PR 上运行 `bun run gen:skill-docs`、检查 git diff，再对 Codex 和 Factory host 重复生成并比较 `.agents/`、`.factory/`。Sources: [github/workflows/skill-docs.yml:1-33](../../../project-repos/gstack/.github/workflows/skill-docs.yml#L1-L33)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/skill-docs.yml:1-33`

```yaml
name: Skill Docs Freshness
on: [push, pull_request]
jobs:
  check-freshness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - name: Check Claude host freshness
        run: bun run gen:skill-docs
      - name: Verify Claude skill docs are fresh
        run: |
          git diff --exit-code || {
            echo "Generated SKILL.md files are stale. Run: bun run gen:skill-docs"
            exit 1
          }
      - name: Check Codex host freshness
        run: bun run gen:skill-docs --host codex
      - name: Verify Codex skill docs are fresh
        run: |
          git diff --exit-code -- .agents/ || {
            echo "Generated Codex SKILL.md files are stale. Run: bun run gen:skill-docs --host codex"
            exit 1
          }
      - name: Generate Factory skill docs
        run: bun run gen:skill-docs --host factory
      - name: Verify Factory skill docs are fresh
        run: |
          git diff --exit-code -- .factory/ || {
            echo "Generated Factory SKILL.md files are stale. Run: bun run gen:skill-docs --host factory"
            exit 1
          }
```

<!-- source-snippets:end -->
</details>
## E2E eval workflow

`evals.yml` 使用预烘焙 Docker image、Ubicloud runners、矩阵拆分 12 个 suite，并在 PR 上上传 eval artifacts、汇总通过率和成本到评论。Sources: [github/workflows/evals.yml:1-15](../../../project-repos/gstack/.github/workflows/evals.yml#L1-L15), [github/workflows/evals.yml:58-147](../../../project-repos/gstack/.github/workflows/evals.yml#L58-L147), [github/workflows/evals.yml:149-240](../../../project-repos/gstack/.github/workflows/evals.yml#L149-L240)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/evals.yml:1-15`

```yaml
name: E2E Evals
on:
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: evals-${{ github.head_ref }}
  cancel-in-progress: true

env:
  IMAGE: ghcr.io/${{ github.repository }}/ci
  EVALS_TIER: gate

jobs:
```

#### `github/workflows/evals.yml:58-147`

```yaml
  evals:
    runs-on: ${{ matrix.suite.runner || 'ubicloud-standard-2' }}
    needs: build-image
    container:
      image: ${{ needs.build-image.outputs.image-tag }}
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
      options: --user runner
    timeout-minutes: 25
    strategy:
      fail-fast: false
      matrix:
        suite:
          - name: llm-judge
            file: test/skill-llm-eval.test.ts
          - name: e2e-browse
            file: test/skill-e2e-bws.test.ts
            runner: ubicloud-standard-8
          - name: e2e-plan
            file: test/skill-e2e-plan.test.ts
          - name: e2e-deploy
            file: test/skill-e2e-deploy.test.ts
          - name: e2e-design
            file: test/skill-e2e-design.test.ts
          - name: e2e-qa-bugs
            file: test/skill-e2e-qa-bugs.test.ts
          - name: e2e-qa-workflow
            file: test/skill-e2e-qa-workflow.test.ts
          - name: e2e-review
            file: test/skill-e2e-review.test.ts
          - name: e2e-workflow
            file: test/skill-e2e-workflow.test.ts
          - name: e2e-routing
            file: test/skill-routing-e2e.test.ts
          - name: e2e-codex
            file: test/codex-e2e.test.ts
          - name: e2e-gemini
            file: test/gemini-e2e.test.ts
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Bun creates root-owned temp dirs during Docker build. GH Actions runs as
      # runner user with HOME=/github/home. Redirect bun's cache to a writable dir.
      - name: Fix bun temp
        run: |
          mkdir -p /home/runner/.cache/bun
          {
            echo "BUN_INSTALL_CACHE_DIR=/home/runner/.cache/bun"
            echo "BUN_TMPDIR=/home/runner/.cache/bun"
            echo "TMPDIR=/home/runner/.cache"
          } >> "$GITHUB_ENV"

      # Restore pre-installed node_modules from Docker image via symlink (~0s vs ~15s install)
      - name: Restore deps
        run: |
          if [ -d /opt/node_modules_cache ] && diff -q /opt/node_modules_cache/.package.json package.json >/dev/null 2>&1; then
            ln -s /opt/node_modules_cache node_modules
          else
            bun install
          fi

      - run: bun run build

      # Verify Playwright can launch Chromium (fails fast if sandbox/deps are broken)
      - name: Verify Chromium
        if: matrix.suite.name == 'e2e-browse'
        run: |
          echo "whoami=$(whoami) HOME=$HOME TMPDIR=${TMPDIR:-unset}"
          touch /tmp/.bun-test && rm /tmp/.bun-test && echo "/tmp writable"
          bun -e "import {chromium} from 'playwright';const b=await chromium.launch({args:['--no-sandbox']});console.log('Chromium OK');await b.close()"

      - name: Run ${{ matrix.suite.name }}
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          EVALS_CONCURRENCY: "40"
          PLAYWRIGHT_BROWSERS_PATH: /opt/playwright-browsers
        run: EVALS=1 bun test --retry 2 --concurrent --max-concurrency 40 ${{ matrix.suite.file }}

      - name: Upload eval results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: eval-${{ matrix.suite.name }}
          path: ~/.gstack-dev/evals/*.json
          retention-days: 90
```

#### `github/workflows/evals.yml:149-240`

```yaml
  report:
    runs-on: ubicloud-standard-2
    needs: evals
    if: always() && github.event_name == 'pull_request'
    timeout-minutes: 5
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Download all eval artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: eval-*
          path: /tmp/eval-results
          merge-multiple: true

      - name: Post PR comment
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # shellcheck disable=SC2086,SC2059
          RESULTS=$(find /tmp/eval-results -name '*.json' 2>/dev/null | sort)
          if [ -z "$RESULTS" ]; then
            echo "No eval results found"
            exit 0
          fi

          TOTAL=0; PASSED=0; FAILED=0; COST="0"
          SUITE_LINES=""
          for f in $RESULTS; do
            if ! jq -e '.total_tests' "$f" >/dev/null 2>&1; then
              echo "Skipping malformed JSON: $f"
              continue
            fi
            T=$(jq -r '.total_tests // 0' "$f")
            P=$(jq -r '.passed // 0' "$f")
            F=$(jq -r '.failed // 0' "$f")
            C=$(jq -r '.total_cost_usd // 0' "$f")
            TIER=$(jq -r '.tier // "unknown"' "$f")
            [ "$T" -eq 0 ] && continue
            TOTAL=$((TOTAL + T))
            PASSED=$((PASSED + P))
            FAILED=$((FAILED + F))
            COST=$(echo "$COST + $C" | bc)
            STATUS_ICON="✅"
            [ "$F" -gt 0 ] && STATUS_ICON="❌"
            SUITE_LINES="${SUITE_LINES}| ${TIER} | ${P}/${T} | ${STATUS_ICON} | \$${C} |\n"
          done

          STATUS="✅ PASS"
          [ "$FAILED" -gt 0 ] && STATUS="❌ FAIL"

          BODY="## E2E Evals: ${STATUS}

          **${PASSED}/${TOTAL}** tests passed | **\$${COST}** total cost | **12 parallel runners**

          | Suite | Result | Status | Cost |
          |-------|--------|--------|------|
          $(echo -e "$SUITE_LINES")

          ---
          *12x ubicloud-standard-2 (Docker: pre-baked toolchain + deps) | wall clock ≈ slowest suite*"

          if [ "$FAILED" -gt 0 ]; then
            FAILURES=""
            for f in $RESULTS; do
              if ! jq -e '.failed' "$f" >/dev/null 2>&1; then continue; fi
              F=$(jq -r '.failed // 0' "$f")
              [ "$F" -eq 0 ] && continue
              FAILS=$(jq -r '.tests[] | select(.passed == false) | "- ❌ \(.name): \(.exit_reason // "unknown")"' "$f" 2>/dev/null || echo "- ⚠️ $(basename "$f"): parse error")
              FAILURES="${FAILURES}${FAILS}\n"
            done
            BODY="${BODY}

          ### Failures
          $(echo -e "$FAILURES")"
          fi

          # Update existing comment or create new one
          COMMENT_ID=$(gh api repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/comments \
            --jq '.[] | select(.body | startswith("## E2E Evals")) | .id' | tail -1)

          if [ -n "$COMMENT_ID" ]; then
            gh api "repos/${{ github.repository }}/issues/comments/${COMMENT_ID}" \
              -X PATCH -f body="$BODY"
          else
            gh pr comment "${{ github.event.pull_request.number }}" --body "$BODY"
          fi
```

<!-- source-snippets:end -->
</details>
## 质量风险

- 大量技能依赖生成器输出，因此 PR 必须同时检查 `.tmpl`、生成结果和多宿主产物。
- E2E eval 依赖外部 API key 与模型行为，适合作为 gate/periodic 混合，而不是所有场景都在普通开发循环里跑。
- Browser 相关测试必须覆盖安全边界，否则命令 registry 的扩展很容易扩大 tunnel 或 CDP 攻击面。

Sources: [CONTRIBUTING.md:207-233](../../../project-repos/gstack/CONTRIBUTING.md#L207-L233), [CONTRIBUTING.md:254-313](../../../project-repos/gstack/CONTRIBUTING.md#L254-L313), [browse/src/cdp-allowlist.ts:1-17](../../../project-repos/gstack/browse/src/cdp-allowlist.ts#L1-L17)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:207-233`

````markdown
### CI

A GitHub Action (`.github/workflows/skill-docs.yml`) runs `bun run gen:skill-docs --dry-run` on every push and PR. If the generated SKILL.md files differ from what's committed, CI fails. This catches stale docs before they merge.

Tests run against the browse binary directly — they don't require dev mode.

## Editing SKILL.md files

SKILL.md files are **generated** from `.tmpl` templates. Don't edit the `.md` directly — your changes will be overwritten on the next build.

```bash
# 1. Edit the template
vim SKILL.md.tmpl              # or browse/SKILL.md.tmpl

# 2. Regenerate for all hosts
bun run gen:skill-docs --host all

# 3. Check health (reports all hosts)
bun run skill:check

# Or use watch mode — auto-regenerates on save
bun run dev:skill
```

For template authoring best practices (natural language over bash-isms, dynamic branch detection, `{{BASE_BRANCH_DETECT}}` usage), see CLAUDE.md's "Writing SKILL templates" section.

To add a browse command, add it to `browse/src/commands.ts`. To add a snapshot flag, add it to `SNAPSHOT_FLAGS` in `browse/src/snapshot.ts`. Then rebuild.
````

#### `CONTRIBUTING.md:254-313`

````markdown
## Multi-host development

gstack generates SKILL.md files for 8 hosts from one set of `.tmpl` templates.
Each host is a typed config in `hosts/*.ts`. The generator reads these configs
to produce host-appropriate output (different frontmatter, paths, tool names).

**Supported hosts:** Claude (primary), Codex, Factory, Kiro, OpenCode, Slate, Cursor, OpenClaw.

### Generating for all hosts

```bash
# Generate for a specific host
bun run gen:skill-docs                    # Claude (default)
bun run gen:skill-docs --host codex       # Codex
bun run gen:skill-docs --host opencode    # OpenCode
bun run gen:skill-docs --host all         # All 8 hosts

# Or use build, which does all hosts + compiles binaries
bun run build
```

### What changes between hosts

Each host config (`hosts/*.ts`) controls:

| Aspect | Example (Claude vs Codex) |
|--------|---------------------------|
| Output directory | `{skill}/SKILL.md` vs `.agents/skills/gstack-{skill}/SKILL.md` |
| Frontmatter | Full (name, description, hooks, version) vs minimal (name + description) |
| Paths | `~/.claude/skills/gstack` vs `$GSTACK_ROOT` |
| Tool names | "use the Bash tool" vs same (Factory rewrites to "run this command") |
| Hook skills | `hooks:` frontmatter vs inline safety advisory prose |
| Suppressed sections | None vs Codex self-invocation sections stripped |

See `scripts/host-config.ts` for the full `HostConfig` interface.

### Testing host output

```bash
# Run all static tests (includes parameterized smoke tests for all hosts)
bun test

# Check freshness for all hosts
bun run gen:skill-docs --host all --dry-run

# Health dashboard covers all hosts
bun run skill:check
```

### Adding a new host

See [docs/ADDING_A_HOST.md](docs/ADDING_A_HOST.md) for the full guide. Short version:

1. Create `hosts/myhost.ts` (copy from `hosts/opencode.ts`)
2. Add to `hosts/index.ts`
3. Add `.myhost/` to `.gitignore`
4. Run `bun run gen:skill-docs --host myhost`
5. Run `bun test` (parameterized tests auto-cover it)

Zero generator, setup, or tooling code changes needed.
````

#### `browse/src/cdp-allowlist.ts:1-17`

```typescript
/**
 * CDP method allow-list (T2: deny-default).
 *
 * Codex outside-voice T2: allow-default with a deny-list is backwards because
 * Target.*, Browser.*, Runtime.evaluate, Page.addScriptToEvaluateOnNewDocument,
 * Fetch.*, IO.read, etc. are all dangerous and easy to forget. Default-deny
 * inverts the failure mode: missing a method means it's blocked (annoying),
 * not exposed (silent compromise).
 *
 * Each entry has:
 *   - domain.method     unique CDP identifier
 *   - scope             "tab" | "browser" — controls T7 mutex tier
 *   - output            "trusted" | "untrusted" — wraps result if "untrusted"
 *   - justification     why this method is safe to allow
 *
 * Add entries via PR. CI lint (cdp-allowlist.test.ts) ensures every entry has all 4 fields.
 */
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [技能生成系统](skill-generation.md)
- [浏览器安全模型](browser-security.md)
- [贡献、扩展与新增宿主](contributing-extension.md)

---

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [CONTRIBUTING.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CONTRIBUTING.md)
- [docs/ADDING_A_HOST.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/docs/ADDING_A_HOST.md)
- [setup](https://github.com/garrytan/gstack/tree/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/setup)
- [CLAUDE.md](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/CLAUDE.md)
- [scripts/host-config.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/scripts/host-config.ts)
- [hosts/index.ts](https://github.com/garrytan/gstack/blob/454423aeb3d3dafa88d5b57bfbe0ead05569d21e/hosts/index.ts)

</details>

# 贡献、扩展与新增宿主

贡献 gstack 的关键不是直接改生成产物，而是在真实项目中复现痛点、进入 dev mode、编辑 `.tmpl` 或源码、重新生成、运行测试，再用 `/ship` 走发布流程。Sources: [CONTRIBUTING.md:1-24](../../../project-repos/gstack/CONTRIBUTING.md#L1-L24), [CONTRIBUTING.md:34-52](../../../project-repos/gstack/CONTRIBUTING.md#L34-L52), [CONTRIBUTING.md:480-488](../../../project-repos/gstack/CONTRIBUTING.md#L480-L488)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:1-24`

````markdown
# Contributing to gstack

Thanks for wanting to make gstack better. Whether you're fixing a typo in a skill prompt or building an entirely new workflow, this guide will get you up and running fast.

## Quick start

gstack skills are Markdown files that Claude Code discovers from a `skills/` directory. Normally they live at `~/.claude/skills/gstack/` (your global install). But when you're developing gstack itself, you want Claude Code to use the skills *in your working tree* — so edits take effect instantly without copying or deploying anything.

That's what dev mode does. It symlinks your repo into the local `.claude/skills/` directory so Claude Code reads skills straight from your checkout.

```bash
git clone https://github.com/garrytan/gstack.git && cd gstack
bun install                    # install dependencies
bin/dev-setup                  # activate dev mode
```

> **Full clone vs shallow.** The README's user-facing install uses `--depth 1` for speed. As a contributor, use a full clone (no `--depth` flag) — you'll need history for `git log`, `git blame`, `git bisect`, and reviewing PRs against earlier versions. If you already have a `--depth 1` clone from following the README, promote it to a full clone with `git fetch --unshallow`.

Now edit any `SKILL.md`, invoke it in Claude Code (e.g. `/review`), and see your changes live. When you're done developing:

```bash
bin/dev-teardown               # deactivate — back to your global install
```

````

#### `CONTRIBUTING.md:34-52`

````markdown
### The contributor workflow

1. **Use gstack normally** — operational learnings are captured automatically
2. **Check your learnings:** `/learn` or `ls ~/.gstack/projects/*/learnings.jsonl`
3. **Fork and clone gstack** (if you haven't already)
4. **Symlink your fork into the project where you hit the bug:**
   ```bash
   # In your core project (the one where gstack annoyed you)
   ln -sfn /path/to/your/gstack-fork .claude/skills/gstack
   cd .claude/skills/gstack && bun install && bun run build && ./setup
   ```
   Setup creates per-skill directories with SKILL.md symlinks inside (`qa/SKILL.md -> gstack/qa/SKILL.md`)
   and asks your prefix preference. Pass `--no-prefix` to skip the prompt and use short names.
5. **Fix the issue** — your changes are live immediately in this project
6. **Test by actually using gstack** — do the thing that annoyed you, verify it's fixed
7. **Open a PR from your fork**

This is the best way to contribute: fix gstack while doing your real work, in the
project where you actually felt the pain.
````

#### `CONTRIBUTING.md:480-488`

````markdown
## Shipping your changes

When you're happy with your skill edits:

```bash
/ship
```

This runs tests, reviews the diff, triages Greptile comments (with 2-tier escalation), manages TODOS.md, bumps the version, and opens a PR. See `ship/SKILL.md` for the full workflow.
````

<!-- source-snippets:end -->
</details>
## Dev mode

`bin/dev-setup` 会把当前 checkout symlink 到项目本地 `.claude/skills/`，让 Claude Code 直接读取工作树里的技能；`bin/dev-teardown` 恢复到全局安装。Sources: [CONTRIBUTING.md:5-24](../../../project-repos/gstack/CONTRIBUTING.md#L5-L24), [CONTRIBUTING.md:58-89](../../../project-repos/gstack/CONTRIBUTING.md#L58-L89), [CONTRIBUTING.md:90-107](../../../project-repos/gstack/CONTRIBUTING.md#L90-L107)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:5-24`

````markdown
## Quick start

gstack skills are Markdown files that Claude Code discovers from a `skills/` directory. Normally they live at `~/.claude/skills/gstack/` (your global install). But when you're developing gstack itself, you want Claude Code to use the skills *in your working tree* — so edits take effect instantly without copying or deploying anything.

That's what dev mode does. It symlinks your repo into the local `.claude/skills/` directory so Claude Code reads skills straight from your checkout.

```bash
git clone https://github.com/garrytan/gstack.git && cd gstack
bun install                    # install dependencies
bin/dev-setup                  # activate dev mode
```

> **Full clone vs shallow.** The README's user-facing install uses `--depth 1` for speed. As a contributor, use a full clone (no `--depth` flag) — you'll need history for `git log`, `git blame`, `git bisect`, and reviewing PRs against earlier versions. If you already have a `--depth 1` clone from following the README, promote it to a full clone with `git fetch --unshallow`.

Now edit any `SKILL.md`, invoke it in Claude Code (e.g. `/review`), and see your changes live. When you're done developing:

```bash
bin/dev-teardown               # deactivate — back to your global install
```

````

#### `CONTRIBUTING.md:58-89`

````markdown
## Working on gstack inside the gstack repo

When you're editing gstack skills and want to test them by actually using gstack
in the same repo, `bin/dev-setup` wires this up. It creates `.claude/skills/`
symlinks (gitignored) pointing back to your working tree, so Claude Code uses
your local edits instead of the global install.

```
gstack/                          <- your working tree
├── .claude/skills/              <- created by dev-setup (gitignored)
│   ├── gstack -> ../../         <- symlink back to repo root
│   ├── review/                  <- real directory (short name, default)
│   │   └── SKILL.md -> gstack/review/SKILL.md
│   ├── ship/                    <- or gstack-review/, gstack-ship/ if --prefix
│   │   └── SKILL.md -> gstack/ship/SKILL.md
│   └── ...                      <- one directory per skill
├── review/
│   └── SKILL.md                 <- edit this, test with /review
├── ship/
│   └── SKILL.md
├── browse/
│   ├── src/                     <- TypeScript source
│   └── dist/                    <- compiled binary (gitignored)
└── ...
```

Setup creates real directories (not symlinks) at the top level with a SKILL.md
symlink inside. This ensures Claude discovers them as top-level skills, not nested
under `gstack/`. Names depend on your prefix setting (`~/.gstack/config.yaml`).
Short names (`/review`, `/ship`) are the default. Run `./setup --prefix` if you
prefer namespaced names (`/gstack-review`, `/gstack-ship`).

````

#### `CONTRIBUTING.md:90-107`

````markdown
## Day-to-day workflow

```bash
# 1. Enter dev mode
bin/dev-setup

# 2. Edit a skill
vim review/SKILL.md

# 3. Test it in Claude Code — changes are live
#    > /review

# 4. Editing browse source? Rebuild the binary
bun run build

# 5. Done for the day? Tear down
bin/dev-teardown
```
````

<!-- source-snippets:end -->
</details>
```mermaid
flowchart TD
  A[gstack checkout] --> B[bin/dev-setup]
  B --> C[.claude/skills/gstack symlink]
  B --> D[per-skill SKILL.md symlinks]
  C --> E[Claude Code loads local edits]
  D --> E
  E --> F[run real skill]
  F --> G[fix template/source]
  G --> H[bun run gen:skill-docs]
  H --> I[bun test]
```

## 编辑规则

`CONTRIBUTING.md` 和 `CLAUDE.md` 都强调：`SKILL.md` 是从 `.tmpl` 生成的，普通改动应编辑模板、运行 `bun run gen:skill-docs`，并提交模板和生成结果；不要在 generated `SKILL.md` 合并冲突中直接接受一侧。Sources: [CONTRIBUTING.md:213-233](../../../project-repos/gstack/CONTRIBUTING.md#L213-L233), [CLAUDE.md:151-177](../../../project-repos/gstack/CLAUDE.md#L151-L177)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:213-233`

````markdown
## Editing SKILL.md files

SKILL.md files are **generated** from `.tmpl` templates. Don't edit the `.md` directly — your changes will be overwritten on the next build.

```bash
# 1. Edit the template
vim SKILL.md.tmpl              # or browse/SKILL.md.tmpl

# 2. Regenerate for all hosts
bun run gen:skill-docs --host all

# 3. Check health (reports all hosts)
bun run skill:check

# Or use watch mode — auto-regenerates on save
bun run dev:skill
```

For template authoring best practices (natural language over bash-isms, dynamic branch detection, `{{BASE_BRANCH_DETECT}}` usage), see CLAUDE.md's "Writing SKILL templates" section.

To add a browse command, add it to `browse/src/commands.ts`. To add a snapshot flag, add it to `SNAPSHOT_FLAGS` in `browse/src/snapshot.ts`. Then rebuild.
````

#### `CLAUDE.md:151-177`

```markdown
## SKILL.md workflow

SKILL.md files are **generated** from `.tmpl` templates. To update docs:

1. Edit the `.tmpl` file (e.g. `SKILL.md.tmpl` or `browse/SKILL.md.tmpl`)
2. Run `bun run gen:skill-docs` (or `bun run build` which does it automatically)
3. Commit both the `.tmpl` and generated `.md` files

To add a new browse command: add it to `browse/src/commands.ts` and rebuild.
To add a snapshot flag: add it to `SNAPSHOT_FLAGS` in `browse/src/snapshot.ts` and rebuild.

**Token ceiling:** Generated SKILL.md files trip a warning above 160KB (~40K tokens).
This is a "watch for feature bloat" guardrail, not a hard gate. Modern flagship
models have 200K-1M context windows, so 40K is 4-20% of window, and prompt caching
makes the marginal cost of larger skills small. The ceiling exists to catch runaway
preamble/resolver growth, not to force compression on carefully-tuned big skills
(`ship`, `plan-ceo-review`, `office-hours` legitimately pack 25-35K tokens of
behavior). If you blow past 40K, the right fix is usually: (1) look at WHAT grew,
(2) if one resolver added 10K+ in a single PR, question whether it belongs inline
or as a reference doc, (3) only compress carefully-tuned prose as a last resort —
cuts to the coverage audit, review army, or voice directive have real quality cost.

**Merge conflicts on SKILL.md files:** NEVER resolve conflicts on generated SKILL.md
files by accepting either side. Instead: (1) resolve conflicts on the `.tmpl` templates
and `scripts/gen-skill-docs.ts` (the sources of truth), (2) run `bun run gen:skill-docs`
to regenerate all SKILL.md files, (3) stage the regenerated files. Accepting one side's
generated output silently drops the other side's template changes.
```

<!-- source-snippets:end -->
</details>
## 新增 host

新增宿主是 declarative config，不需要改生成器核心：创建 `hosts/myhost.ts`、在 `hosts/index.ts` 注册、加 `.gitignore`、运行生成和测试。`docs/ADDING_A_HOST.md` 给出配置字段和 adapter pattern。Sources: [docs/ADDING_A_HOST.md:1-32](../../../project-repos/gstack/docs/ADDING_A_HOST.md#L1-L32), [docs/ADDING_A_HOST.md:34-147](../../../project-repos/gstack/docs/ADDING_A_HOST.md#L34-L147), [docs/ADDING_A_HOST.md:165-182](../../../project-repos/gstack/docs/ADDING_A_HOST.md#L165-L182)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/ADDING_A_HOST.md:1-32`

````markdown
# Adding a New Host to gstack

gstack uses a declarative host config system. Each supported AI coding agent
(Claude, Codex, Factory, Kiro, OpenCode, Slate, Cursor, OpenClaw) is defined
as a typed TypeScript config object. Adding a new host means creating one file
and re-exporting it. Zero code changes to the generator, setup, or tooling.

## How it works

```
hosts/
├── claude.ts        # Primary host
├── codex.ts         # OpenAI Codex CLI
├── factory.ts       # Factory Droid
├── kiro.ts          # Amazon Kiro
├── opencode.ts      # OpenCode
├── slate.ts         # Slate (Random Labs)
├── cursor.ts        # Cursor
├── openclaw.ts      # OpenClaw (hybrid: config + adapter)
└── index.ts         # Registry: imports all, derives Host type
```

Each config file exports a `HostConfig` object that tells the generator:
- Where to put generated skills (paths)
- How to transform frontmatter (allowlist/denylist fields)
- What Claude-specific references to rewrite (paths, tool names)
- What binary to detect for auto-install
- What resolver sections to suppress
- What assets to symlink at install time

The generator, setup script, platform-detect, uninstall, health checks, worktree
copy, and tests all read from these configs. None of them have per-host code.
````

#### `docs/ADDING_A_HOST.md:34-147`

````markdown
## Step-by-step: add a new host

### 1. Create the config file

Copy an existing config as a starting point. `hosts/opencode.ts` is a good
minimal example. `hosts/factory.ts` shows tool rewrites and conditional fields.
`hosts/openclaw.ts` shows the adapter pattern for hosts with different tool models.

Create `hosts/myhost.ts`:

```typescript
import type { HostConfig } from '../scripts/host-config';

const myhost: HostConfig = {
  name: 'myhost',
  displayName: 'MyHost',
  cliCommand: 'myhost',        // binary name for `command -v` detection
  cliAliases: [],              // alternative binary names

  globalRoot: '.myhost/skills/gstack',
  localSkillRoot: '.myhost/skills/gstack',
  hostSubdir: '.myhost',
  usesEnvVars: true,           // false only for Claude (uses literal ~ paths)

  frontmatter: {
    mode: 'allowlist',         // 'allowlist' keeps only listed fields
    keepFields: ['name', 'description'],
    descriptionLimit: null,    // set to 1024 for hosts with limits
  },

  generation: {
    generateMetadata: false,   // true only for Codex (openai.yaml)
    skipSkills: ['codex'],     // codex skill is Claude-only
  },

  pathRewrites: [
    { from: '~/.claude/skills/gstack', to: '~/.myhost/skills/gstack' },
    { from: '.claude/skills/gstack', to: '.myhost/skills/gstack' },
    { from: '.claude/skills', to: '.myhost/skills' },
  ],

  runtimeRoot: {
    globalSymlinks: ['bin', 'browse/dist', 'browse/bin', 'gstack-upgrade', 'ETHOS.md'],
    globalFiles: { 'review': ['checklist.md', 'TODOS-format.md'] },
  },

  install: {
    prefixable: false,
    linkingStrategy: 'symlink-generated',
  },

  learningsMode: 'basic',
};

export default myhost;
```

### 2. Register in the index

Edit `hosts/index.ts`:

```typescript
import myhost from './myhost';

// Add to ALL_HOST_CONFIGS array:
export const ALL_HOST_CONFIGS: HostConfig[] = [
  claude, codex, factory, kiro, opencode, slate, cursor, openclaw, myhost
];

// Add to re-exports:
export { claude, codex, factory, kiro, opencode, slate, cursor, openclaw, myhost };
```

### 3. Add to .gitignore

Add `.myhost/` to `.gitignore` (generated skill docs are gitignored).

### 4. Generate and verify

```bash
# Generate skill docs for the new host
bun run gen:skill-docs --host myhost

# Verify output exists and has no .claude/skills leakage
ls .myhost/skills/gstack-*/SKILL.md
grep -r ".claude/skills" .myhost/skills/ | head -5
# (should be empty)

# Generate for all hosts (includes the new one)
bun run gen:skill-docs --host all

# Health dashboard shows the new host
bun run skill:check
```

### 5. Run tests

```bash
bun test test/gen-skill-docs.test.ts
bun test test/host-config.test.ts
```

The parameterized smoke tests automatically pick up the new host. Zero test
code to write. They verify: output exists, no path leakage, valid frontmatter,
freshness check passes, codex skill excluded.

### 6. Update README.md

Add install instructions for the new host in the appropriate section.

## Config field reference

See `scripts/host-config.ts` for the full `HostConfig` interface with JSDoc
comments on every field.
````

#### `docs/ADDING_A_HOST.md:165-182`

```markdown
## Adapter pattern (for hosts with different tool models)

If string-replace tool rewrites aren't enough (the host has fundamentally
different tool semantics), use the adapter pattern. See `hosts/openclaw.ts`
and `scripts/host-adapters/openclaw-adapter.ts`.

The adapter runs as a post-processing step after all generic rewrites. It
exports `transform(content: string, config: HostConfig): string`.

## Validation

The `validateHostConfig()` function in `scripts/host-config.ts` checks:
- Name: lowercase alphanumeric with hyphens
- CLI command: alphanumeric with hyphens/underscores
- Paths: safe characters only (alphanumeric, `.`, `/`, `$`, `{}`, `~`, `-`, `_`)
- No duplicate names, hostSubdirs, or globalRoots across configs

Run `bun run scripts/host-config-export.ts validate` to check all configs.
```

<!-- source-snippets:end -->
</details>
| 步骤 | 文件 |
|---|---|
| 定义 host | `hosts/<host>.ts` |
| 注册 host | `hosts/index.ts` |
| 验证配置 | `scripts/host-config.ts` / `host-config-export.ts` |
| 生成技能 | `bun run gen:skill-docs --host <host>` |
| 测试 | `bun test test/gen-skill-docs.test.ts test/host-config.test.ts` |

Sources: [docs/ADDING_A_HOST.md:91-139](../../../project-repos/gstack/docs/ADDING_A_HOST.md#L91-L139), [hosts/index.ts:20-67](../../../project-repos/gstack/hosts/index.ts#L20-L67), [scripts/host-config.ts:120-190](../../../project-repos/gstack/scripts/host-config.ts#L120-L190)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/ADDING_A_HOST.md:91-139`

````markdown
### 2. Register in the index

Edit `hosts/index.ts`:

```typescript
import myhost from './myhost';

// Add to ALL_HOST_CONFIGS array:
export const ALL_HOST_CONFIGS: HostConfig[] = [
  claude, codex, factory, kiro, opencode, slate, cursor, openclaw, myhost
];

// Add to re-exports:
export { claude, codex, factory, kiro, opencode, slate, cursor, openclaw, myhost };
```

### 3. Add to .gitignore

Add `.myhost/` to `.gitignore` (generated skill docs are gitignored).

### 4. Generate and verify

```bash
# Generate skill docs for the new host
bun run gen:skill-docs --host myhost

# Verify output exists and has no .claude/skills leakage
ls .myhost/skills/gstack-*/SKILL.md
grep -r ".claude/skills" .myhost/skills/ | head -5
# (should be empty)

# Generate for all hosts (includes the new one)
bun run gen:skill-docs --host all

# Health dashboard shows the new host
bun run skill:check
```

### 5. Run tests

```bash
bun test test/gen-skill-docs.test.ts
bun test test/host-config.test.ts
```

The parameterized smoke tests automatically pick up the new host. Zero test
code to write. They verify: output exists, no path leakage, valid frontmatter,
freshness check passes, codex skill excluded.

````

#### `hosts/index.ts:20-67`

```typescript
/** All registered host configs. Add new hosts here. */
export const ALL_HOST_CONFIGS: HostConfig[] = [claude, codex, factory, kiro, opencode, slate, cursor, openclaw, hermes, gbrain];

/** Map from host name to config. */
export const HOST_CONFIG_MAP: Record<string, HostConfig> = Object.fromEntries(
  ALL_HOST_CONFIGS.map(c => [c.name, c])
);

/** Union type of all host names, derived from configs. */
export type Host = (typeof ALL_HOST_CONFIGS)[number]['name'];

/** All host names as a string array (for CLI arg validation, etc.). */
export const ALL_HOST_NAMES: string[] = ALL_HOST_CONFIGS.map(c => c.name);

/** Get a host config by name. Throws if not found. */
export function getHostConfig(name: string): HostConfig {
  const config = HOST_CONFIG_MAP[name];
  if (!config) {
    throw new Error(`Unknown host '${name}'. Valid hosts: ${ALL_HOST_NAMES.join(', ')}`);
  }
  return config;
}

/**
 * Resolve a host name from a CLI argument, handling aliases.
 * e.g., 'agents' → 'codex', 'droid' → 'factory'
 */
export function resolveHostArg(arg: string): string {
  // Direct name match
  if (HOST_CONFIG_MAP[arg]) return arg;

  // Alias match
  for (const config of ALL_HOST_CONFIGS) {
    if (config.cliAliases?.includes(arg)) return config.name;
  }

  throw new Error(`Unknown host '${arg}'. Valid hosts: ${ALL_HOST_NAMES.join(', ')}`);
}

/**
 * Get hosts that are NOT the primary host (Claude).
 * These are the hosts that need generated skill docs.
 */
export function getExternalHosts(): HostConfig[] {
  return ALL_HOST_CONFIGS.filter(c => c.name !== 'claude');
}

// Re-export individual configs for direct import
```

#### `scripts/host-config.ts:120-190`

```typescript
export function validateHostConfig(config: HostConfig): string[] {
  const errors: string[] = [];

  if (!NAME_REGEX.test(config.name)) {
    errors.push(`name '${config.name}' must be lowercase alphanumeric with hyphens`);
  }
  if (!config.displayName) {
    errors.push('displayName is required');
  }
  if (!CLI_REGEX.test(config.cliCommand)) {
    errors.push(`cliCommand '${config.cliCommand}' contains invalid characters`);
  }
  if (config.cliAliases) {
    for (const alias of config.cliAliases) {
      if (!CLI_REGEX.test(alias)) {
        errors.push(`cliAlias '${alias}' contains invalid characters`);
      }
    }
  }
  if (!PATH_REGEX.test(config.globalRoot)) {
    errors.push(`globalRoot '${config.globalRoot}' contains invalid characters`);
  }
  if (!PATH_REGEX.test(config.localSkillRoot)) {
    errors.push(`localSkillRoot '${config.localSkillRoot}' contains invalid characters`);
  }
  if (!PATH_REGEX.test(config.hostSubdir)) {
    errors.push(`hostSubdir '${config.hostSubdir}' contains invalid characters`);
  }
  if (!['allowlist', 'denylist'].includes(config.frontmatter.mode)) {
    errors.push(`frontmatter.mode must be 'allowlist' or 'denylist'`);
  }
  if (!['real-dir-symlink', 'symlink-generated'].includes(config.install.linkingStrategy)) {
    errors.push(`install.linkingStrategy must be 'real-dir-symlink' or 'symlink-generated'`);
  }

  return errors;
}

export function validateAllConfigs(configs: HostConfig[]): string[] {
  const errors: string[] = [];

  // Per-config validation
  for (const config of configs) {
    const configErrors = validateHostConfig(config);
    errors.push(...configErrors.map(e => `[${config.name}] ${e}`));
  }

  // Cross-config uniqueness checks
  const hostSubdirs = new Map<string, string>();
  const globalRoots = new Map<string, string>();
  const names = new Map<string, string>();

  for (const config of configs) {
    if (names.has(config.name)) {
      errors.push(`Duplicate name '${config.name}' (also used by ${names.get(config.name)})`);
    }
    names.set(config.name, config.name);

    if (hostSubdirs.has(config.hostSubdir)) {
      errors.push(`Duplicate hostSubdir '${config.hostSubdir}' (${config.name} and ${hostSubdirs.get(config.hostSubdir)})`);
    }
    hostSubdirs.set(config.hostSubdir, config.name);

    if (globalRoots.has(config.globalRoot)) {
      errors.push(`Duplicate globalRoot '${config.globalRoot}' (${config.name} and ${globalRoots.get(config.globalRoot)})`);
    }
    globalRoots.set(config.globalRoot, config.name);
  }

  return errors;
}
```

<!-- source-snippets:end -->
</details>
## 迁移与发布

当版本改变 on-disk state，例如技能目录结构、配置 key 或 `~/.gstack/` 格式，贡献者需要在 `gstack-upgrade/migrations/v{VERSION}.sh` 添加幂等、非致命迁移脚本。Sources: [CONTRIBUTING.md:430-479](../../../project-repos/gstack/CONTRIBUTING.md#L430-L479)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:430-479`

````markdown
## Upgrade migrations

When a release changes on-disk state (directory structure, config format, stale
files) in ways that `./setup` alone can't fix, add a migration script so existing
users get a clean upgrade.

### When to add a migration

- Changed how skill directories are created (symlinks vs real dirs)
- Renamed or moved config keys in `~/.gstack/config.yaml`
- Need to delete orphaned files from a previous version
- Changed the format of `~/.gstack/` state files

Don't add a migration for: new features (users get them automatically), new
skills (setup discovers them), or code-only changes (no on-disk state).

### How to add one

1. Create `gstack-upgrade/migrations/v{VERSION}.sh` where `{VERSION}` matches
   the VERSION file for the release that needs the fix.
2. Make it executable: `chmod +x gstack-upgrade/migrations/v{VERSION}.sh`
3. The script must be **idempotent** (safe to run multiple times) and
   **non-fatal** (failures are logged but don't block the upgrade).
4. Include a comment block at the top explaining what changed, why the
   migration is needed, and which users are affected.

Example:

```bash
#!/usr/bin/env bash
# Migration: v0.15.2.0 — Fix skill directory structure
# Affected: users who installed with --no-prefix before v0.15.2.0
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
"$SCRIPT_DIR/bin/gstack-relink" 2>/dev/null || true
```

### How it runs

During `/gstack-upgrade`, after `./setup` completes (Step 4.75), the upgrade
skill scans `gstack-upgrade/migrations/` and runs every `v*.sh` script whose
version is newer than the user's old version. Scripts run in version order.
Failures are logged but never block the upgrade.

### Testing migrations

Migrations are tested as part of `bun test` (tier 1, free). The test suite
verifies that all migration scripts in `gstack-upgrade/migrations/` are
executable and parse without syntax errors.

````

<!-- source-snippets:end -->
</details>
社区 PR 积压时，贡献文档建议按主题 wave 批处理：分类、去重、collector branch、清晰关闭说明、单 PR ship。Sources: [CONTRIBUTING.md:413-428](../../../project-repos/gstack/CONTRIBUTING.md#L413-L428)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:413-428`

```markdown
## Community PR triage (wave process)

When community PRs accumulate, batch them into themed waves:

1. **Categorize** — group by theme (security, features, infra, docs)
2. **Deduplicate** — if two PRs fix the same thing, pick the one that
   changes fewer lines. Close the other with a note pointing to the winner.
3. **Collector branch** — create `pr-wave-N`, merge clean PRs, resolve
   conflicts for dirty ones, verify with `bun test && bun run build`
4. **Close with context** — every closed PR gets a comment explaining
   why and what (if anything) supersedes it. Contributors did real work;
   respect that with clear communication.
5. **Ship as one PR** — single PR to main with all attributions preserved
   in merge commits. Include a summary table of what merged and what closed.

See [PR #205](../../pull/205) (v0.8.3) for the first wave as an example.
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [安装与多宿主接入](setup-and-hosts.md)
- [技能生成系统](skill-generation.md)
- [测试、CI 与质量门](testing-ci-quality.md)
