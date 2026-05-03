---
name: social-carousel
description: |
  A three-card social-media carousel laid out as 1080×1080 squares —
  three cinematic, on-brand panels with display headlines that connect
  across the series ("onwards." → "to the next one." → "looking ahead.").
  Each card has a brand mark, a number / total, a caption, and a "loop"
  affordance. Use when the brief asks for a "carousel post", "social
  carousel", "Instagram carousel", "LinkedIn series", "X thread cards",
  or "三连发".
triggers:
  - "social carousel"
  - "carousel post"
  - "instagram carousel"
  - "linkedin carousel"
  - "x thread cards"
  - "social series"
  - "三连发"
  - "轮播图"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  featured: 7
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Design a 3-card cinematic social carousel — ‘onwards.’, ‘to the next one.’, ‘looking ahead.’. 1080×1080 squares, drop-into-Instagram ready."
---

# 社交媒体轮播技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成社交平台多页轮播图、封面和卡片文案。

## 协议快照

- 原始来源：`skills/social-carousel/SKILL.md`
- Skill 名称：`social-carousel`
- 触发词：`social carousel`, `carousel post`, `instagram carousel`, `linkedin carousel`, `x thread cards`, `social series`, `三连发`, `轮播图`
- `mode`: `prototype`
- `scenario`: `marketing`
- `platform`: `desktop`
- `featured`: `7`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Social Carousel Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Social Carousel Skill

Produce a 3-panel social carousel on a single dark stage. Each panel is a
1080×1080 cinematic still — connected as a series, but each readable on its
own.

## Workflow

1. **Read the active DESIGN.md** (injected above). Pick the loudest serif
   token for the headline lockups and a mono token for stamps / counters.
2. **Pick the theme + 3 captions** from the brief. The captions must read
   as one sentence when stacked: ("onwards." → "to the next one." →
   "looking ahead." or "input." → "iterate." → "ship.").
3. **Stage** — full-bleed dark page. Top header strip:
   - Left: serif italic display "Three posts. One beat."
   - Just below the title: a one-line description in muted mono ("1080×1080
     · cinematic video loops · minimal type. Drop into Instagram, LinkedIn,
     or X — each post stands on its own or runs as a three-part series.").
   - Right: small mono badge "SERIES · 01 → 03".
4. **Cards** — 3 squares in a horizontal row (wraps to stack on narrow
   viewports). Each card is `aspect-ratio: 1 / 1` with rounded 12px corners
   and a subtle 1px border, plus a soft drop shadow.
   - Background: a layered gradient that *suggests* a cinematic photo — for
     example, panel 1 = warm dawn meadow (stacked greens with a cyan sky
     wash); panel 2 = forest dusk (warm oranges fading into deep teals);
     panel 3 = pink-mountain ridge (rosy peaks against a dim violet sky).
     Use `radial-gradient` + `linear-gradient` only — no images.
   - Top-left chip: brand wordmark in serif italic ("Jerrod Lew") with a
     small accent dot.
   - Top-left below chip: micro mono index "AI · 01 / 03" (and 02, 03).
   - Bottom-left: the headline lockup in white serif display, italic accent
     on one word.
   - Bottom-right corner: a `1× LOOP` mono stamp inside a thin border.
   - Bottom strip caption: small caps mono describing the imagined frame
     ("Man, walking forward — close.", "Woman, stepping into frame.",
     "Woman, overlooking the city.").
5. **Write** a single HTML document:
   - `<!doctype html>` through `</html>`, CSS inline.
   - Cards are sized via `width: clamp(280px, 30vw, 380px)` so 3 fit
     comfortably across most desktops and stack at < 1100px.
   - `data-od-id` on stage, each card, each headline.
6. **Self-check**:
   - The three headlines together form one sentence and feel cinematic.
   - Mono is used only for the wordmark index, the loop stamp, and the
     bottom captions. The headlines stay serif.
   - Each panel's color story is distinct — no two share a dominant hue.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="carousel-slug" type="text/html" title="Carousel — Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.
