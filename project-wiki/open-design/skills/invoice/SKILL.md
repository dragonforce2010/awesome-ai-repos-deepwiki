---
name: invoice
description: |
  A printable invoice page — sender + recipient block, line items table,
  tax breakdown, totals, and payment instructions. Use when the brief
  mentions "invoice", "bill", "billing statement", or "发票".
triggers:
  - "invoice"
  - "bill"
  - "billing statement"
  - "发票"
  - "账单"
od:
  mode: prototype
  platform: desktop
  scenario: finance
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Create an invoice from a freelance design studio billing a client for a brand identity project — three line items, 10% retainer, 9% sales tax."
---

# 发票/账单技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成发票、账单或交易凭证类页面。

## 协议快照

- 原始来源：`skills/invoice/SKILL.md`
- Skill 名称：`invoice`
- 触发词：`invoice`, `bill`, `billing statement`, `发票`, `账单`
- `mode`: `prototype`
- `scenario`: `finance`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Invoice Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Invoice Skill

Produce a single-page printable invoice.

## Workflow

1. Read DESIGN.md.
2. Layout:
   - Top band: studio brand on the left, "INVOICE" + number + date + due date on the right.
   - Two columns: From (sender) / Bill to (recipient) with addresses.
   - Project ref + payment-terms strip.
   - Line items table: description / qty / unit / amount.
   - Right-aligned totals block: subtotal, retainer, tax, total due.
   - Payment instructions (bank, wire, ACH).
   - Thank-you note + signature line.
3. Print stylesheet @media print to remove backgrounds.

## Output contract

```
<artifact identifier="invoice-name" type="text/html" title="Invoice">
<!doctype html>...</artifact>
```
