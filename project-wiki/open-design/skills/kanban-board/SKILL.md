---
name: kanban-board
description: |
  Kanban / task board with columns (To do / In progress / In review / Done),
  draggable-looking cards, assignee avatars, swimlanes, and a top filter
  bar. Use when the brief mentions "kanban", "task board", "sprint board",
  "trello", "看板".
triggers:
  - "kanban"
  - "task board"
  - "sprint board"
  - "trello"
  - "jira board"
  - "看板"
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
  example_prompt: "Make me a kanban board for a 5-person growth squad mid-sprint — backlog, doing, review, done."
---

# 看板技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成任务看板、状态列、卡片和团队工作流界面。

## 协议快照

- 原始来源：`skills/kanban-board/SKILL.md`
- Skill 名称：`kanban-board`
- 触发词：`kanban`, `task board`, `sprint board`, `trello`, `jira board`, `看板`
- `mode`: `prototype`
- `scenario`: `operations`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Kanban Board Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Kanban Board Skill

Produce a single-screen kanban board.

## Workflow

1. Read the active DESIGN.md.
2. Identify squad name, sprint number, columns, and member roster from the brief.
3. Layout:
   - Top bar: project crumb, sprint chip, filter row (members, labels, status), search.
   - 4 columns: Backlog, In progress, In review, Done. Each column has a count chip and an "+ add" affordance.
   - 3–6 cards per column. Each card: tag chip, title, assignee avatar, point estimate, progress (if applicable).
   - Sidebar (collapsible feel): "Sprint pulse" with progress bar, top assignees, blocked-tickets callout.
4. One inline `<style>`, semantic HTML.

## Output contract

```
<artifact identifier="kanban-board" type="text/html" title="Sprint Board">
<!doctype html>...</artifact>
```
