---
name: image-poster
description: |
  Single-image generation skill for posters, key art, and editorial
  illustrations. Defaults to gpt-image-2 but is provider-agnostic — the
  same workflow drives Flux, Imagen, or Midjourney via the active
  upstream tooling. Output is one or more PNG/JPEG files saved to the
  project folder.
triggers:
  - "poster"
  - "key art"
  - "illustration"
  - "image"
  - "cover art"
  - "海报"
  - "插画"
od:
  mode: image
  surface: image
  scenario: design
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  example_prompt: |
    Editorial poster for an indie film festival — one bold abstract
    silhouette over a warm, slightly grainy paper background; hand-set
    sans serif title at the top, festival dates and venue at the bottom
    in monospace. Muted ochre + ink palette.
---

# 图像海报技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成单张海报、图像 prompt 和适配的视觉构图。

## 协议快照

- 原始来源：`skills/image-poster/SKILL.md`
- Skill 名称：`image-poster`
- 触发词：`poster`, `key art`, `illustration`, `image`, `cover art`, `海报`, `插画`
- `mode`: `image`
- `surface`: `image`
- `scenario`: `design`
- `design_system.requires`: `false`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Image Poster Skill
  - Resource map
  - Workflow
    - Step 0 — Read the project metadata
    - Step 1 — Compose the prompt
    - Step 2 — Dispatch via the media contract
    - Step 3 — Hand off
  - Hard rules

## 原始正文（完整保留）

# Image Poster Skill

Produce **one** finished image asset per turn unless the user asks for
variations. Image generation rewards a tight, structured prompt — your
job is to assemble that prompt from the user's brief, then dispatch.

## Resource map

```
image-poster/
├── SKILL.md         ← you're reading this
└── example.html     ← what the resulting card looks like in Examples
```

## Workflow

### Step 0 — Read the project metadata

The active project carries `imageModel`, `imageAspect`, and (optional)
`imageStyle` notes. Use them as the upstream model + canvas + style
anchor; only ask the user to fill them in if they're marked `(unknown
— ask)`.

### Step 1 — Compose the prompt

Plan in this exact order before calling any tool:

1. **Subject + composition** — what is in the frame, where, at what
   scale; eye-line and crop.
2. **Lighting + mood** — natural / studio / moody; warm / cool; key
   plus rim plus fill; time of day if outdoor.
3. **Palette + textures** — hex anchors when the user gave a brand
   palette; otherwise a 3-word mood tag (e.g. "muted ochre + ink").
4. **Camera / lens** — only if the user wants photographic realism
   ("85mm portrait, shallow DOF") or a specific film stock.
5. **What to avoid** — common AI-slop patterns ("no extra fingers, no
   warped text, no logo placeholders").

### Step 2 — Dispatch via the media contract

Use the unified dispatcher — do **not** call upstream provider APIs by
hand. Run from your shell tool:

```bash
node "$OD_BIN" media generate \
  --project "$OD_PROJECT_ID" \
  --surface image \
  --model "<imageModel from metadata>" \
  --aspect "<imageAspect from metadata>" \
  --output "<short-descriptive-name>.png" \
  --prompt "<the full assembled prompt from Step 1>"
```

The command prints one line of JSON: `{"file": {"name": "...", ...}}`.
The daemon writes the bytes into the project folder; the FileViewer
picks it up automatically.

### Step 3 — Hand off

Reply with a one-paragraph summary of the prompt you used and the
filename returned by the dispatcher (e.g. *I generated `hero-poster.png`
with `gpt-image-2` at 1:1.*). Do **not** emit an `<artifact>` tag.

## Hard rules

- One image per turn unless asked for variations.
- Honor `imageAspect` exactly — the upstream cost is the same; matching
  the aspect avoids a re-render.
- No filler typography in the image itself unless the user asked for
  in-frame text. Real copy beats lorem.
- Save every render — never describe an image without producing the
  file. The user expects something to open in the file viewer.
