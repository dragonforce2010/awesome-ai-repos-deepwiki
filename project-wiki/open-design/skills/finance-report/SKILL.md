---
name: finance-report
description: |
  Quarterly / monthly financial report — masthead with KPIs, revenue and
  burn charts, P&L summary table, top-line highlights, and an outlook
  paragraph. Use when the brief mentions "financial report", "Q3 report",
  "MRR review", "P&L", or "财报".
triggers:
  - "financial report"
  - "finance report"
  - "quarterly report"
  - "p&l"
  - "mrr review"
  - "财报"
  - "财务报告"
od:
  mode: prototype
  platform: desktop
  scenario: finance
  featured: 10
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Build me a Q3 financial report for an early-stage SaaS — MRR, burn, gross margin, top accounts."
---

# 财务报告技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成财务摘要、指标解读、表格和报告型页面。

## 协议快照

- 原始来源：`skills/finance-report/SKILL.md`
- Skill 名称：`finance-report`
- 触发词：`financial report`, `finance report`, `quarterly report`, `p&l`, `mrr review`, `财报`, `财务报告`
- `mode`: `prototype`
- `scenario`: `finance`
- `platform`: `desktop`
- `featured`: `10`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Finance Report Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Finance Report Skill

Produce a single-screen financial report in one self-contained HTML file.

## Workflow

1. **Read the active DESIGN.md.** Tables, KPI cards, and chart strokes use
   palette tokens — never invent new ones.
2. **Classify** the period (monthly / quarterly / yearly) and entity
   (startup, division, project) from the brief. If unspecified, assume a
   quarterly SaaS report and pick believable numbers.
3. **Layout** the page in this order:
   - Masthead: company / period / "Confidential — Finance" badge.
   - Headline KPI strip (4 cards): Revenue, Net new MRR, Gross margin, Cash runway.
   - Revenue trend chart (inline SVG line + area).
   - Cost breakdown chart (inline SVG bar) with a 2–3 bullet caption.
   - P&L summary table (Revenue / Gross profit / Opex / Net) with current vs prior period.
   - Top accounts table with logo placeholders, plan, ARR, status badge.
   - Outlook paragraph + footer with author + signature line.
4. **Write** one self-contained HTML doc (CSS in one inline `<style>` block).
5. **Self-check**: every number ties to a labelled chart or table; deltas
   show direction and percentage; accent colour used at most twice.

## Output contract

```
<artifact identifier="finance-report-q3" type="text/html" title="Q3 Finance Report">
<!doctype html>
<html>...</html>
</artifact>
```
