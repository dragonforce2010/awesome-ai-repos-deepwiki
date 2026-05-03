---
name: motion-frames
description: |
  A single-frame motion-design composition with looping CSS animations —
  rotating type ring, animated globe, ticking timer, parallax labels.
  Renders as a hero video poster you can hand straight to HyperFrames or
  any keyframe-based exporter. Use when the brief asks for "motion design",
  "animated hero", "loop", "video poster", "title card", or pairs Open
  Claude Design with HyperFrames for a kinetic export.
triggers:
  - "motion design"
  - "motion graphic"
  - "animated hero"
  - "loop animation"
  - "video poster"
  - "title card"
  - "hyperframes"
  - "kinetic typography"
  - "动态设计"
  - "动效"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  featured: 6
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "Design an animated hero — a rotating type ring around a wireframe globe, with the headline ‘Reach every country.’ Loop at 12s, ready for HyperFrames export."
---

# 动效分镜技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成 motion storyboard、关键帧和动画说明。

## 协议快照

- 原始来源：`skills/motion-frames/SKILL.md`
- Skill 名称：`motion-frames`
- 触发词：`motion design`, `motion graphic`, `animated hero`, `loop animation`, `video poster`, `title card`, `hyperframes`, `kinetic typography`, `动态设计`, `动效`
- `mode`: `prototype`
- `scenario`: `marketing`
- `platform`: `desktop`
- `featured`: `6`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Motion Frames Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Motion Frames Skill

Produce a single full-bleed motion composition. Inline CSS animations only —
the page is the loop. Treat it as a poster frame that an exporter (HyperFrames,
Lottie, etc.) can capture into a video.

## Workflow

1. **Read the active DESIGN.md** (injected above). Motion lives or dies on
   typography contrast — pick the most expressive serif / display token in
   the DS for the headline; the body / mono token labels everything else.
2. **Compose** the canvas as a 16:9 hero with these layers, back to front:
   - **Stage** — full-bleed `<main>`. Off-white or DS-canvas background, very
     subtle dotted grid texture (CSS background, `radial-gradient` dots at
     22–32px intervals).
   - **Concentric rings** — 2–3 SVG circles radiating from a focal point.
     Ultra-thin strokes (0.5–1px) in DS-foreground at low opacity. These
     rotate at different speeds (60s, 90s, 180s).
   - **Focal mark** — a wireframe globe, a stylized object, or a typographic
     monogram drawn as inline SVG. ~28% of the canvas wide.
   - **Ring labels** — short words / phonetic tokens placed around one of
     the rings (e.g. "Hola · Bonjour · 你好 · नमस्ते"). They co-rotate with
     the ring, with `<text>` paths counter-rotated so the words stay upright.
   - **Headline** — bottom-left or center-bottom. Display serif, italic
     accent on one word. Add a subtle `letterSpacing` + opacity reveal
     animation (`@keyframes type-in`).
   - **Frame chrome** — corner stamps (top-left lab tag, top-right brand or
     issue number) and a thin baseline rule. Static.
3. **Animate** with `@keyframes` only — no JS:
   - `rotate-slow`, `rotate-med`, `rotate-fast` for rings.
   - `globe-spin` for the focal mark.
   - `pulse` for the focal dot, ~2s, easing.
   - `marquee-fade` to reveal headline once on load.
4. **Write** a single HTML document:
   - `<!doctype html>` through `</html>`, CSS inline.
   - All motion uses CSS — no scripts, so HyperFrames or any frame-grabber
     can capture it deterministically.
   - `data-od-id` on stage, focal, ring, headline, chrome.
5. **Self-check**:
   - The composition still reads as a poster with motion paused at frame 0.
   - At least 3 layers move at different speeds (depth comes from delta
     velocity, not parallax tricks).
   - Accent appears once — usually the italic word in the headline.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="motion-slug" type="text/html" title="Motion — Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.
