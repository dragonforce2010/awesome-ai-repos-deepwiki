---
name: team-okrs
description: |
  OKR tracker page — quarter banner, three objectives with their key
  results as progress bars, owner avatars, status pills, and a "this
  quarter at a glance" sidebar. Use when the brief mentions "OKRs",
  "key results", "objectives", or "目标".
triggers:
  - "okr"
  - "okrs"
  - "key results"
  - "objectives"
  - "目标"
od:
  mode: prototype
  platform: desktop
  scenario: product
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Build an OKR tracker for Q4 — three objectives, three key results each, progress bars, owners, status pills."
---

# 团队 OKR 技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成团队目标、关键结果、进展和复盘页面。

## 协议快照

- 原始来源：`skills/team-okrs/SKILL.md`
- Skill 名称：`team-okrs`
- 触发词：`okr`, `okrs`, `key results`, `objectives`, `目标`
- `mode`: `prototype`
- `scenario`: `product`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Team OKRs Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Team OKRs Skill

Produce a single-screen OKR tracker.

## Workflow

1. Read DESIGN.md.
2. Layout:
   - Quarter banner: Q4 FY25, dates, overall progress chip.
   - Three objective cards. Each has:
     - Objective title + owner avatar + status pill (On track / At risk / Off track)
     - 3 key results, each a row with metric / current → target / progress bar
   - Right sidebar: at-a-glance KPIs, top movers, blockers callout.
3. Clear progress visualisation, calm palette, one accent.

## Output contract

```
<artifact identifier="okr-q4" type="text/html" title="OKRs Q4">
<!doctype html>...</artifact>
```
