---
name: pm-spec
description: |
  Product spec / PRD as a single page — problem, success metrics, scope,
  user stories, design notes, rollout plan, open questions. Use when the
  brief mentions "PRD", "spec", "product spec", "feature brief", or "需求文档".
triggers:
  - "prd"
  - "spec"
  - "product spec"
  - "feature brief"
  - "feature doc"
  - "需求文档"
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
  example_prompt: "Write me a PRD for adding two-factor auth to our SaaS app — problem, scope, milestones, open questions."
---

# 产品规格文档技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成 PRD、功能规格、验收标准和产品决策记录。

## 协议快照

- 原始来源：`skills/pm-spec/SKILL.md`
- Skill 名称：`pm-spec`
- 触发词：`prd`, `spec`, `product spec`, `feature brief`, `feature doc`, `需求文档`
- `mode`: `prototype`
- `scenario`: `product`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Product Spec Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Product Spec Skill

Produce a one-page product spec / PRD.

## Workflow

1. Read the active DESIGN.md.
2. Identify the feature + audience from the brief.
3. Layout:
   - Header strip: title, status pill (Draft / Review / Approved), date, owner.
   - Three-line summary at the top — what, who, why now.
   - "Problem" panel with one paragraph and a quote from a customer or
     internal partner.
   - "Goals & non-goals" two-column block.
   - "Success metrics" table with metric / target / measurement.
   - "User stories" list with as-a / I-want / so-that format.
   - "Scope" milestone tracker (3–4 phases).
   - "Open questions" with assignee chips.
4. One inline `<style>`, semantic HTML, accent used twice max.

## Output contract

```
<artifact identifier="spec-name" type="text/html" title="Spec Title">
<!doctype html>...</artifact>
```
