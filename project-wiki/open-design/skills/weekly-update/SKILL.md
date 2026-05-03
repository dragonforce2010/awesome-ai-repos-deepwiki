---
name: weekly-update
description: |
  Single-file horizontal-swipe slide deck for a weekly team update —
  shipped, in flight, blocked, metrics, asks. 6–8 slides. Use when the
  brief mentions "weekly update", "team update slides", "weekly status",
  "周报演示".
triggers:
  - "weekly update"
  - "team update slides"
  - "weekly status"
  - "weekly review"
  - "周报演示"
od:
  mode: deck
  scenario: operations
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Make a weekly update deck for the Growth squad — what shipped, in flight, blocked, metrics, asks for next week."
---

# 周更新技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成项目周报、团队更新、进度摘要和风险同步。

## 协议快照

- 原始来源：`skills/weekly-update/SKILL.md`
- Skill 名称：`weekly-update`
- 触发词：`weekly update`, `team update slides`, `weekly status`, `weekly review`, `周报演示`
- `mode`: `deck`
- `scenario`: `operations`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Weekly Update Deck Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Weekly Update Deck Skill

Produce a single-file horizontal-swipe HTML deck for a weekly team update.

## Workflow

1. Read DESIGN.md.
2. Identify squad name, week range, and audience (squad-internal vs cross-functional).
3. Slides:
   1. Cover (squad + week + author + date)
   2. Headline (one sentence + one number that matters this week)
   3. What shipped (3–5 items, link-style affordance)
   4. In flight (3–5 items, owner avatars)
   5. Blocked (1–3 items + clear ask)
   6. Metrics that matter (1–2 inline charts)
   7. Asks for next week (named owners)
   8. Closing + thanks
4. Arrow keys or click navigation. Each slide is 100vw wide.

## Output contract

```
<artifact identifier="weekly-update-w42" type="text/html" title="Weekly Update — Growth · W42">
<!doctype html>...</artifact>
```
