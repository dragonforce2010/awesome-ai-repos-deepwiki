---
name: pricing-page
description: |
  A standalone pricing page — header, plan tiers, feature comparison table,
  and an FAQ. Use when the brief asks for "pricing", "plans",
  "subscription tiers", or a "compare plans" page.
triggers:
  - "pricing"
  - "pricing page"
  - "plans"
  - "subscription"
  - "compare plans"
  - "定价"
  - "套餐"
od:
  mode: prototype
  platform: desktop
  scenario: sales
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
---

# 定价页技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成 SaaS/产品定价页、套餐对比和转化 CTA。

## 协议快照

- 原始来源：`skills/pricing-page/SKILL.md`
- Skill 名称：`pricing-page`
- 触发词：`pricing`, `pricing page`, `plans`, `subscription`, `compare plans`, `定价`, `套餐`
- `mode`: `prototype`
- `scenario`: `sales`
- `platform`: `desktop`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Pricing Page Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Pricing Page Skill

Produce a single-screen pricing page that respects the active DESIGN.md.

## Workflow

1. **Read the active DESIGN.md** (injected above). Use only its colors, type
   tokens, and component patterns.
2. **Classify** the product from the brief and pick a tier shape:
   - 3-tier (most common): Free / Pro / Team or Starter / Growth / Enterprise.
   - 4-tier when the brief says "scale" or "enterprise plus".
   - 2-tier when it says "individual / business" or "personal / pro".
3. **Sections**, in order:
   1. **Hero** — page title (e.g. "Pricing"), one-line subhead, optional
      monthly/annual toggle.
   2. **Plan cards** — one card per tier. Each card: tier name, price (use the
      display font + larger scale for the number), 1-line positioning, 4–6
      bullet features, primary CTA. Mark the recommended tier with the DS
      accent border or a small badge.
   3. **Comparison table** — feature rows × tier columns, ✓ / — / value cells.
      Group features into 2–3 logical sections (Core, Collaboration,
      Support, Security…). Sticky header.
   4. **FAQ** — 4–6 collapsible Q&A items. Use `<details><summary>` for the
      collapse — no JS.
   5. **Footer CTA** — single line + button, accent band sparingly.
4. **Write** one self-contained HTML document:
   - `<!doctype html>` through `</html>`, CSS in one inline `<style>`.
   - CSS Grid for the plan-card row; CSS Grid for the comparison table.
   - `data-od-id` on each tier card and each table row.
5. **Money rendering**: use the display font for the big number, body for the
   currency and "/mo" — sizes per DESIGN.md scale.
6. **Self-check**:
   - Prices are plausible for the product (not "$X / month").
   - Accent is on the recommended tier and one CTA only.
   - Comparison table renders cleanly at 1024px and stacks readably below
     768px (rotate column headers or scroll-x).
   - No fake feature names — every row reads as something a real product
     would actually offer.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="pricing-slug" type="text/html" title="Pricing — Product Name">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.
