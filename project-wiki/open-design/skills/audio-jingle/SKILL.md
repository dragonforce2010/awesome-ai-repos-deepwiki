---
name: audio-jingle
description: |
  Audio generation skill — jingles, beds, voiceover, and sound effects.
  Routes music requests to Suno V5 / Udio / Lyria, speech to MiniMax
  TTS / FishAudio / ElevenLabs V3, and SFX to ElevenLabs SFX or
  AudioCraft. Output is one MP3/WAV file saved to the project folder.
triggers:
  - "music"
  - "jingle"
  - "bed"
  - "voiceover"
  - "tts"
  - "sound effect"
  - "音乐"
  - "配音"
  - "音效"
od:
  mode: audio
  surface: audio
  scenario: marketing
  preview:
    type: html
    entry: example.html
  design_system:
    requires: false
  example_prompt: |
    A 30-second upbeat indie-pop jingle for a coffee shop launch — warm
    electric piano lead, brushed drums, gentle bass, a single sun-soaked
    "ahhh" choir on the chorus. No vocals. Loop-friendly tail.
---

# 音频广告短铃技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于制作品牌 jingle、短音频标识、转场音和可交付的音频 prompt。

## 协议快照

- 原始来源：`skills/audio-jingle/SKILL.md`
- Skill 名称：`audio-jingle`
- 触发词：`music`, `jingle`, `bed`, `voiceover`, `tts`, `sound effect`, `音乐`, `配音`, `音效`
- `mode`: `audio`
- `surface`: `audio`
- `scenario`: `marketing`
- `design_system.requires`: `false`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Audio Jingle Skill
  - Resource map
  - Workflow
    - Step 0 — Read the project metadata
    - Step 1 — Plan
    - Step 2 — Compose the prompt
    - Step 3 — Dispatch via the media contract
    - Step 4 — Hand off
  - Hard rules

## 原始正文（完整保留）

# Audio Jingle Skill

Three sub-modes. The active project's `audioKind` decides which one
runs:

| `audioKind` | Models we route to | Plan focus |
|---|---|---|
| `music` | Suno V5 (default), Udio, Lyria 2 | genre + tempo + instrumentation |
| `speech` | MiniMax TTS (default), Fish, ElevenLabs V3 | script + voice + pacing |
| `sfx` | ElevenLabs SFX (default), AudioCraft | texture + impact + duration |

## Resource map

```
audio-jingle/
├── SKILL.md
└── example.html
```

## Workflow

### Step 0 — Read the project metadata

`audioKind`, `audioModel`, `audioDuration` (seconds), and (for speech)
`voice`. Branch by `audioKind` and use the values verbatim — no
clarifying form unless something is marked `(unknown — ask)`.

Important: `voice` is provider-specific. For `minimax-tts`, `--voice`
must be a valid MiniMax `voice_id` (for example `male-qn-qingse`), not
a natural-language description. If you only have a prose voice brief
("warm female narrator", "neutral Mandarin"), keep that in your plan
but omit `--voice` so the daemon's default voice id applies, or ask the
user to choose a specific id.

### Step 1 — Plan

**Music**
- Genre + reference artists (1-2)
- Tempo (BPM) + key
- Instrumentation (3-5 instruments max)
- Vocals: yes / no / hummed / choir
- Mood arc (intro → chorus → outro)

**Speech**
- Script (final, not draft — TTS runs verbatim)
- Voice target + pacing
  For MiniMax this means a real `voice_id`, not prose in `--voice`
- Pronunciation hints for proper nouns / acronyms

**SFX**
- Texture (impact / whoosh / ambience / foley)
- Duration + envelope (sharp attack vs. gentle swell)
- Layering note (single hit vs. stacked)

State the plan in 2-3 sentences before dispatching.

### Step 2 — Compose the prompt

Use the format the upstream model prefers. Bind `audioDuration` to the
API parameter directly; never put "make it 30 seconds" in prose.

### Step 3 — Dispatch via the media contract

Use the unified dispatcher — do **not** call provider APIs by hand:

```bash
node "$OD_BIN" media generate \
  --project "$OD_PROJECT_ID" \
  --surface audio \
  --audio-kind "<music|speech|sfx>" \
  --model "<audioModel from metadata>" \
  --duration <audioDuration seconds> \
  [--voice "<provider voice id (speech only)>"] \
  --output "<short-slug>-<duration>s.mp3" \
  --prompt "<assembled prompt from Step 2 — for speech, the literal script>"
```

The command prints one line of JSON: `{"file": {"name": "...", ...}}`.
The bytes land in the project; the FileViewer renders the audio
transport controls automatically.

### Step 4 — Hand off

Reply with: plan summary, the filename returned by the dispatcher, and
one sentence on what to try if the user wants a variation (e.g. "swap
tempo from 92 to 108 BPM" rather than "make it different").

## Hard rules

- TTS runs your script **literally**. Proof it before dispatching —
  even one stray comma changes the cadence.
- MiniMax TTS rejects free-form voice prose in `--voice`. Use a real
  MiniMax `voice_id` (for example `male-qn-qingse`) or omit the flag
  and let the daemon's default voice apply.
- Music: under 30s = single section; 30–90s = intro + body; 90s+ =
  full arc. Don't try to fit a 3-act song into 15 seconds.
- SFX: prefer one well-described layer over a paragraph of "make it
  cool" — generators reward specific texture words.
- Save the file every turn. The audio viewer shows transport controls
  the moment the file lands.
