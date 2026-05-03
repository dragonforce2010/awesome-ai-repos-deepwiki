---
name: video-shortform
description: |
  Short-form video generation skill — 3-10 second clips for product
  reveals, motion teasers, ambient loops. Defaults to Seedance 2 but
  works the same with Kling 3 / 4, Veo 3 or Sora 2. Output is one MP4
  saved to the project folder. When the workspace also ships an
  interactive-video / hyperframes skill, prefer composing several short
  shots into a single timeline rather than one long monolithic clip.
triggers:
  - "video"
  - "clip"
  - "shortform"
  - "reel"
  - "短视频"
  - "动效"
od:
  mode: video
  surface: video
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  example_prompt: |
    5-second product reveal — ceramic coffee mug rotating on a soft
    paper backdrop, warm side-light from camera-left, micro dust motes
    drifting through the beam. Cinematic, 16:9, slow drift on the camera.
---

# 短视频技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成短视频脚本、镜头、字幕、节奏和媒体生成 prompt。

## 协议快照

- 原始来源：`skills/video-shortform/SKILL.md`
- Skill 名称：`video-shortform`
- 触发词：`video`, `clip`, `shortform`, `reel`, `短视频`, `动效`
- `mode`: `video`
- `surface`: `video`
- `scenario`: `marketing`
- `design_system.requires`: `false`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Video Shortform Skill
  - Resource map
  - Workflow
    - Step 0 — Read the project metadata
    - Step 1 — Plan the shot
    - Step 2 — Compose the prompt
    - Step 3 — Dispatch via the media contract
    - Step 4 — Hand off
  - Hard rules

## 原始正文（完整保留）

# Video Shortform Skill

Short-form (≤ 10s) is the sweet spot for current text-to-video models —
they're great at one **shot** with one **idea**, weaker at multi-cut
narratives. Plan one shot per call.

Special case: `hyperframes-html` is **not** a photoreal text-to-video
model. It's a local HTML-to-MP4 renderer. For that model, do not roleplay
cinematography or "real-world" camera physics. Treat the brief as a motion
design card / title-frame / product interstitial, ask at most one
clarifying question, then dispatch immediately.

## Resource map

```
video-shortform/
├── SKILL.md
└── example.html
```

## Workflow

### Step 0 — Read the project metadata

`videoModel`, `videoLength` (seconds), `videoAspect`. These are
hard-locks — clamp the prompt to whatever the chosen model supports
(Seedance 2 caps at 10s; Kling 4 supports up to 10s + image-to-video;
Veo 3 supports 8s with audio).

### Step 1 — Plan the shot

Write the shotlist BEFORE calling the model:

| Slot | Content |
|---|---|
| Subject | What's in frame? |
| Camera | Static / pan / push-in / orbit? |
| Lighting | Key direction + temperature |
| Motion | What moves, at what pace? Subject motion vs camera motion. |
| Sound | Ambient bed? (only if the model supports audio) |

Normally, show this to the user as a one-sentence plan before
dispatching — they can redirect cheaply.

For `hyperframes-html`, skip the extra pre-dispatch narration once the
user has answered the discovery form. Collapse the plan into the actual
generation prompt and dispatch immediately.

### Step 2 — Compose the prompt

Use the format the upstream model prefers (Seedance: motion + camera +
mood; Kling: subject + camera + style; Veo: subject + cinematography +
sound). Bind the project's `videoAspect` and `videoLength` directly to
the API parameters; never put them in prose.

For `hyperframes-html`, write a concise motion-design brief instead of a
camera-realism prompt. Focus on subject, layout, palette, motion
character, and overall tone. Do not spend turns narrating environment
checks, missing side files, or "I am about to dispatch" status updates.

### Step 3 — Dispatch via the media contract

Use the unified dispatcher — do **not** call provider APIs by hand:

```bash
node "$OD_BIN" media generate \
  --project "$OD_PROJECT_ID" \
  --surface video \
  --model "<videoModel from metadata>" \
  --aspect "<videoAspect from metadata>" \
  --length <videoLength seconds> \
  --output "<short-slug>-<seconds>s.mp4" \
  --prompt "<assembled shot prompt from Step 2>"
```

The command prints one line of JSON: `{"file": {"name": "...", ...&#125;&#125;`.
The bytes land in the project; the FileViewer plays it automatically.

### Step 4 — Hand off

Reply with: shot summary, the filename returned by the dispatcher, and
one sentence on what to try if the user wants a variation.

For `hyperframes-html`, keep the reply especially short: what was
rendered, the filename, and one concrete variation idea.

## Hard rules

- One shot per turn. Multi-shot timelines belong in a hyperframes /
  interactive-video skill, not here.
- Match `videoAspect` exactly — re-renders are slow.
- Never ship a video without saving the file — the user expects
  something to play in the file viewer.
- When the underlying model fails (NSFW filter, content policy,
  timeout), report the error verbatim. Don't silently retry.
- Do not claim a render has been "sent", "started", or "is running"
  unless you have already called `od media generate`.
