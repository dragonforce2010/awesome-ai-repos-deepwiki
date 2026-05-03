---
name: hr-onboarding
description: |
  A new-hire onboarding plan as a single page — first week schedule,
  buddy + manager intro, learning track, equipment checklist, and "you're
  set when…" outcomes. Use when the brief mentions "onboarding",
  "new hire", "first week plan", or "入职".
triggers:
  - "onboarding"
  - "new hire"
  - "first week"
  - "入职"
  - "新员工"
od:
  mode: prototype
  platform: desktop
  scenario: hr
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Build a 30-day onboarding plan for a new product designer joining a 40-person startup."
---

# HR 入职引导技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成员工入职流程、材料、日程和引导页面。

## 协议快照

- 原始来源：`skills/hr-onboarding/SKILL.md`
- Skill 名称：`hr-onboarding`
- 触发词：`onboarding`, `new hire`, `first week`, `入职`, `新员工`
- `mode`: `prototype`
- `scenario`: `hr`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- HR Onboarding Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# HR Onboarding Skill

Produce a single-screen onboarding plan in HTML.

## Workflow

1. Read the active DESIGN.md.
2. Identify the role + tenure expectations from the brief. Default to a
   30/60/90-day shape if unspecified.
3. Layout:
   - Cover banner: name placeholder, role, start date, manager + buddy.
   - "Day 1" panel with the literal schedule (kickoff time, lunch, 1:1 slot).
   - First-week timeline (Mon → Fri, two activities per day).
   - 30 / 60 / 90 day milestone cards with three concrete outcomes each.
   - Resource list: handbook, Slack channels, key dashboards, payroll setup.
   - "You're set when…" checklist — five outcomes with checkboxes.
4. Single inline `<style>`, semantic HTML.

## Output contract

```
<artifact identifier="onboarding-plan" type="text/html" title="Onboarding Plan">
<!doctype html>...</artifact>
```
