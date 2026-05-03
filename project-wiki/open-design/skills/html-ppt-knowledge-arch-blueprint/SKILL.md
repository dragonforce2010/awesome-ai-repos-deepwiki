---
name: html-ppt-knowledge-arch-blueprint
description: 奶油蓝图架构 deck — 奶油纸 #F0EAE0 底色 + 单一锈红 #B5392A 高亮、48px 蓝图网格 mask、2px 黑边硬卡片、pipeline 步骤盒（其中一个抬高）、右侧锈红 insight callout、Playfair 衬线大字、SVG 虚线反馈环。零渐变零软阴影，认真且印刷友好。
triggers:
  - "architecture"
  - "blueprint"
  - "system design"
  - "架构图"
  - "data flow"
  - "engineering whitepaper"
od:
  mode: deck
  scenario: engineering
  featured: 29
  upstream: "https://github.com/lewislulu/html-ppt-skill"
  preview:
    type: html
    entry: index.html
  design_system:
    requires: false
  speaker_notes: true
  animations: true
  example_prompt: "用 html-ppt-knowledge-arch-blueprint 模板做一份系统架构介绍 PPT。奶油纸底 + 锈红高亮 + 蓝图网格 + pipeline 抬高一格 + 衬线大字。先告诉我系统名 + 5-7 个核心模块 + 数据流方向，再写 8-10 页。"
---

# 知识架构蓝图 HTML PPT 技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成知识架构、系统蓝图和层级结构导向的演示文稿。

## 协议快照

- 原始来源：`skills/html-ppt-knowledge-arch-blueprint/SKILL.md`
- Skill 名称：`html-ppt-knowledge-arch-blueprint`
- 触发词：`architecture`, `blueprint`, `system design`, `架构图`, `data flow`, `engineering whitepaper`
- `mode`: `deck`
- `scenario`: `engineering`
- `featured`: `29`
- `design_system.requires`: `false`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- HTML PPT · 奶油蓝图架构
  - When this card is picked
  - How to author the deck
  - Attribution

## 原始正文（完整保留）

# HTML PPT · 奶油蓝图架构

A focused entry point into the [`html-ppt`](../html-ppt/SKILL.md) master skill that lands the user directly on the **`knowledge-arch-blueprint`** full-deck template.

## When this card is picked

The Examples gallery wires "Use this prompt" to the example_prompt above. When you accept that prompt, this card is the right pick if the user wants exactly the visual identity of `knowledge-arch-blueprint` (see the upstream [full-decks catalog](../html-ppt/references/full-decks.md) for screenshots and rationale).

## How to author the deck

1. **Read the master skill first.** All authoring rules live in
   [`skills/html-ppt/SKILL.md`](../html-ppt/SKILL.md) — content/audience checklist,
   token rules, layout reuse, presenter mode, the keyboard runtime, and the
   "never put presenter-only text on the slide" rule.
2. **Start from the matching template folder:**
   `skills/html-ppt/templates/full-decks/knowledge-arch-blueprint/` — copy `index.html` and
   `style.css` into the project, keep the `.tpl-knowledge-arch-blueprint` body class.
3. **Bring the shared runtime with the template.** The upstream
   `index.html` links the shared CSS/JS via `../../../assets/...` because it
   sits three folders deep inside `skills/html-ppt/templates/full-decks/`.
   Once you copy `index.html` into the project, those parent-relative URLs
   no longer resolve and `base.css`, `animations.css`, and `runtime.js`
   will 404 — meaning the deck never activates and slide navigation is
   dead. Pick one of these two recipes per project:
   - **Recipe A — copy + rewrite (preferred):** copy
     `skills/html-ppt/assets/fonts.css`, `skills/html-ppt/assets/base.css`,
     `skills/html-ppt/assets/animations/animations.css`, and
     `skills/html-ppt/assets/runtime.js` into a project-local
     `assets/` (with `assets/animations/animations.css`), then rewrite the
     four `<link>`/`<script>` tags in `index.html` from
     `../../../assets/...` to the matching project-local paths
     (`assets/fonts.css`, `assets/base.css`,
     `assets/animations/animations.css`, `assets/runtime.js`).
   - **Recipe B — inline:** read the same four files and replace each
     `<link rel="stylesheet" href="../../../assets/...">` with a
     `<style>...</style>` containing the file's contents, and the
     `<script src="../../../assets/runtime.js">` with a
     `<script>...</script>` containing `runtime.js`. Yields a single
     self-contained `index.html`.
   Either way, do not ship the upstream `../../../assets/...` URLs
   verbatim into a project artifact — they only work in-tree.
4. **Pick a theme.** Default tokens look fine; if the user wants a different
   feel, swap in any of the 36 themes from `skills/html-ppt/assets/themes/*.css`
   via `<link id="theme-link">` and let `T` cycle.
5. **Replace demo content, not classes.** The `.tpl-knowledge-arch-blueprint` scoped CSS only
   recognises the structural classes shipped in the template — keep them.
6. **Speaker notes go inside `<aside class="notes">` or `<div class="notes">`** — never as visible text on the slide.

## Attribution

Visual system, layouts, themes and the runtime keyboard model come from
the upstream MIT-licensed [`lewislulu/html-ppt-skill`](https://github.com/lewislulu/html-ppt-skill). The
LICENSE file ships at `skills/html-ppt/LICENSE`; please keep it in place when
redistributing.
