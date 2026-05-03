---
name: hackernews-frontpage
description: 抓取 Hacker News 首页标题、分数和评论数量的浏览器技能。
---

# hackernews-frontpage 中文审阅副本

> 来源：`browser-skills/hackernews-frontpage/SKILL.md`  
> 生成说明：本副本面向中文审阅，保留 `name`、命令、路径、代码块和原始行为要求。原始 `SKILL.md` 完整收录在下方折叠块中，便于逐条比对可执行指令。

## 中文概要

抓取 Hacker News 首页标题、分数和评论数量的浏览器技能。

## 审阅重点

- **触发语义**：确认此技能只在描述的任务场景中调用。
- **工具权限**：检查 `allowed-tools`、preamble、shell 命令和写入路径是否符合预期。
- **行为约束**：保留原文中的 `must`、`never`、`always`、STOP、AskUserQuestion、commit/test 等强制要求。
- **可执行内容**：代码块、命令、路径、环境变量、API 名称和占位符不做语义改写。

## 原始技能正文（完整保留）

<details>
<summary>展开原始 SKILL.md</summary>

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
  - latest hacker news stories
---

# Hacker News front-page scraper

Scrapes the Hacker News (`news.ycombinator.com`) front page and returns the
top 30 stories as JSON. Each story has its rank, title, link URL, point count,
and comment count.

## Usage

```
$ $B skill run hackernews-frontpage
{
  "stories": [
    { "rank": 1, "title": "...", "url": "...", "points": 412, "comments": 87 },
    ...
  ],
  "count": 30
}
```

## How it works

1. Navigates to `https://news.ycombinator.com` via the daemon.
2. Reads the page HTML.
3. Parses each story row (HN's stable `tr.athing` structure) into a typed
   `Story` record.
4. Emits a single JSON document on stdout.

## Why this is the reference skill

`hackernews-frontpage` is the smallest interesting browser-skill: no auth,
stable HTML, deterministic output, file-fixture-friendly. Every Phase 1
component (SDK, scoped tokens, three-tier lookup, spawn lifecycle) is
exercised by `$B skill run hackernews-frontpage` and the bundled
`script.test.ts`.

When the HN HTML rotates and our selectors break, the test fails against the
captured fixture before users notice. That's the point.
```

</details>
