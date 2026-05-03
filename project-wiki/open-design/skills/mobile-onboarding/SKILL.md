---
name: mobile-onboarding
description: |
  A multi-screen mobile onboarding flow rendered as three phone frames
  side by side — splash, value-prop, sign-in. Status bar, swipe dots,
  primary CTA. Use when the brief mentions "mobile onboarding", "iOS
  onboarding", "phone signup", or "移动端引导".
triggers:
  - "mobile onboarding"
  - "ios onboarding"
  - "android onboarding"
  - "phone signup"
  - "app onboarding"
  - "移动端引导"
od:
  mode: prototype
  platform: mobile
  scenario: design
  featured: 5
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Design a 3-screen mobile onboarding flow for a meditation app — welcome, value props, sign-in."
---

# 移动端新手引导技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成移动端 onboarding、权限引导和首启流程。

## 协议快照

- 原始来源：`skills/mobile-onboarding/SKILL.md`
- Skill 名称：`mobile-onboarding`
- 触发词：`mobile onboarding`, `ios onboarding`, `android onboarding`, `phone signup`, `app onboarding`, `移动端引导`
- `mode`: `prototype`
- `scenario`: `design`
- `platform`: `mobile`
- `featured`: `5`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Mobile Onboarding Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Mobile Onboarding Skill

Produce a three-screen mobile onboarding flow on a single HTML page.

## Workflow

1. Read DESIGN.md.
2. Identify the app + audience.
3. Layout: three phone frames side by side. Each phone:
   - Status bar (time, battery, signal).
   - Hero artwork or icon.
   - Headline + supporting paragraph.
   - 3-dot pagination.
   - Primary CTA (full-width pill button).
   - "Skip" or alt action top-right.
4. Last phone is the sign-in / continue-with options screen.
5. Strong typography, gentle gradients, accessible contrast.

## Output contract

```
<artifact identifier="mobile-onboarding-name" type="text/html" title="Mobile Onboarding">
<!doctype html>...</artifact>
```
