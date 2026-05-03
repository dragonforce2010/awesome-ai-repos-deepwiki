---
name: sprite-animation
description: |
  A pixel / sprite-style animated explainer slide — full-bleed cream stage,
  bold display year, animated pixel-art mascot (e.g. Hanafuda card, mushroom,
  or 8-bit console), kinetic Japanese display type, ticking timeline ribbon.
  Reads like a single frame of an educational motion video — looping CSS
  keyframes, no JS, ready to be screen-recorded into a vertical video.
  Use when the brief asks for a "sprite animation", "pixel-art video",
  "8-bit explainer", "history of X explainer", "kinetic typography history",
  "Nintendo-style", "精灵图动画", "像素动画", or "复古动画".
triggers:
  - "sprite animation"
  - "pixel art animation"
  - "8-bit explainer"
  - "retro animation"
  - "kinetic typography"
  - "history explainer"
  - "nintendo style"
  - "精灵图"
  - "像素动画"
  - "复古动画"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  featured: 8
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Create a sprite-based animation introducing trivia about Nintendo's history. Combine pixel mascots, animated text, and a Hanafuda accent. Use color and type that feel like the Nintendo brand."
---

# 精灵动画技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成 sprite、逐帧动画或轻量动效演示。

## 协议快照

- 原始来源：`skills/sprite-animation/SKILL.md`
- Skill 名称：`sprite-animation`
- 触发词：`sprite animation`, `pixel art animation`, `8-bit explainer`, `retro animation`, `kinetic typography`, `history explainer`, `nintendo style`, `精灵图`, `像素动画`, `复古动画`
- `mode`: `prototype`
- `scenario`: `marketing`
- `platform`: `desktop`
- `featured`: `8`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Sprite Animation Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Sprite Animation Skill

Produce a single animated frame of an educational explainer — the kind you
might screen-record into a vertical video. Pixel-art mascots, big year
display, looping CSS animations, kinetic Japanese / English display type.

## Workflow

1. **Read the active DESIGN.md** (injected above). Pick the loudest serif
   token for the year, a sturdy sans for headlines, and a mono token for
   timeline / index labels.
2. **Pick the topic** from the brief (e.g. "Nintendo · 1889 — Hanafuda").
   You always need: a year, a one-line headline, an animated subject (a
   pixel sprite — character, object, or icon), and a short caption.
3. **Stage** — full-bleed cream / off-white background (`#f5efe2`) with a
   subtle paper grain. Keep margins generous; this is one beat of a video.
4. **Top bar** — small mono row:
   - Left: title slug ("名次の/番組" or "EP. 01 / NINTENDO")
   - Right: progress dots ("01 / 12") and a "REC" stamp
5. **Subject animations** — at least three independent looping animations
   on the page:
   - **Big year**: the headline year (e.g. "1889年") fills the lower-left,
     in a serif display weight. It has a subtle vertical glitch / scanline
     animation (clip-path keyframes), and a 1-frame "pop" every loop.
   - **Pixel sprite card**: a 96×128 pixel-art card or character (use an
     inline SVG with crisp `shape-rendering: crispEdges` rectangles, or a
     `box-shadow` pixel grid). Subtle bobbing animation (±4px, 1.6s).
   - **Kinetic kana**: 1–2 Japanese / kanji characters that fade-and-slide
     in sync with the bob (e.g. "花" — *hana* — flower).
   - **Tick ribbon**: bottom of the stage, a tape/ribbon with year ticks
     (1889 · 1907 · 1949 · 1977 · 1985 · 2006 · 2017) sliding left at a
     slow constant speed.
6. **Caption block** — small mono caption explaining the trivia:
   "Nintendo started as a Hanafuda playing-card maker in Kyoto, 1889.
    Mario didn't show up for another ninety-six years."
7. **Write** a single HTML document:
   - `<!doctype html>` through `</html>`, CSS inline, no external JS.
   - All animations use `@keyframes` + `animation: ... infinite`.
   - Stage uses a fixed canvas ratio (e.g. 16:9 letterboxed) so the loop
     reads as a single frame from a video.
   - `data-od-id` on stage, year, sprite, caption, and tick ribbon.
8. **Self-check**:
   - The page is one cohesive scene, not a collage. The eye lands on the
     year first, then the sprite, then the caption.
   - At least 3 independent looping animations are visible.
   - The color palette is restrained (cream + a single accent red + ink).
   - No external assets — all sprites are inline SVG or CSS.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="sprite-anim-slug" type="text/html" title="Sprite animation — Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.
