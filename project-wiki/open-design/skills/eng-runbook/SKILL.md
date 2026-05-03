---
name: eng-runbook
description: |
  An engineering runbook — service overview, alerts table, dashboards
  links, common procedures with copy-pasteable commands, on-call rotation,
  and an incident-response checklist. Use when the brief mentions
  "runbook", "ops doc", "on-call guide", "SRE doc", or "运维手册".
triggers:
  - "runbook"
  - "ops doc"
  - "on-call"
  - "sre doc"
  - "service runbook"
  - "运维手册"
od:
  mode: prototype
  platform: desktop
  scenario: engineering
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Write a runbook for our auth service — alerts, dashboards, common procedures, on-call rotation."
---

# 工程运行手册技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成排障、值班、发布或事故响应 runbook。

## 协议快照

- 原始来源：`skills/eng-runbook/SKILL.md`
- Skill 名称：`eng-runbook`
- 触发词：`runbook`, `ops doc`, `on-call`, `sre doc`, `service runbook`, `运维手册`
- `mode`: `prototype`
- `scenario`: `engineering`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Engineering Runbook Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Engineering Runbook Skill

Produce a single-page engineering runbook.

## Workflow

1. Read DESIGN.md.
2. Identify the service from the brief.
3. Layout:
   - Header: service name, owner team, severity tier, version.
   - Service summary paragraph + dependency list.
   - Alerts table: alert name / severity / what it means / first response.
   - Dashboards & links list.
   - Common procedures block (3–4) with code blocks (deploy, rollback, rotate keys).
   - On-call rotation table (week / primary / secondary / backup).
   - Incident response checklist (5 numbered steps).
4. One inline `<style>`, semantic HTML, monospace for code blocks.

## Output contract

```
<artifact identifier="runbook-name" type="text/html" title="Service Runbook">
<!doctype html>...</artifact>
```
