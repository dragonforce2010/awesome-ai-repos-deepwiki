---
name: meeting-notes
description: |
  Meeting notes page — title bar with attendees, agenda checklist, decisions
  block, action items table with owners + dates, and a "next meeting" footer.
  Use when the brief mentions "meeting notes", "minutes", "1:1 notes",
  "all-hands recap", or "会议纪要".
triggers:
  - "meeting notes"
  - "minutes"
  - "1:1 notes"
  - "all-hands recap"
  - "会议纪要"
od:
  mode: prototype
  platform: desktop
  scenario: operations
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Write up notes from a 60-minute Growth squad weekly — agenda, decisions, action items with owners, next meeting."
---

# 会议纪要技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成会议记录、决策、行动项和结构化摘要。

## 协议快照

- 原始来源：`skills/meeting-notes/SKILL.md`
- Skill 名称：`meeting-notes`
- 触发词：`meeting notes`, `minutes`, `1:1 notes`, `all-hands recap`, `会议纪要`
- `mode`: `prototype`
- `scenario`: `operations`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Meeting Notes Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Meeting Notes Skill

Produce a single-screen meeting notes page.

## Workflow

1. Read DESIGN.md.
2. Layout:
   - Header: meeting title, date, time, location/Zoom, attendees row.
   - Agenda checklist (4–6 items).
   - Decisions panel — bulleted list with strong styling.
   - Action items table with owner, due date, status.
   - "Open questions" + "next meeting" footer.
3. Subdued colour palette, clear hierarchy.

## Output contract

```
<artifact identifier="notes-name" type="text/html" title="Meeting Notes">
<!doctype html>...</artifact>
```
