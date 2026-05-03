---
name: blog-post
description: |
  A long-form article / blog post — masthead, hero image placeholder,
  article body with figures and pull quotes, author byline, related posts.
  Use when the brief asks for "blog", "article", "post", "essay", or
  "case study".
triggers:
  - "blog"
  - "blog post"
  - "article"
  - "essay"
  - "case study"
  - "newsletter"
  - "博客"
  - "文章"
od:
  mode: prototype
  platform: desktop
  scenario: marketing
  featured: 11
  preview:
    type: html
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
---

# 长篇博客文章技能

> 这是 DeepWiki 生成的中文阅读镜像。当前环境的本机翻译模型不可用，因此这里保留完整原始 `SKILL.md` 正文，并在前面增加中文导读、协议快照和章节索引。复用该技能时，请以“原始正文”中的命令、路径、代码块、检查清单和输出契约为准。

## 中文摘要

用于生成带 masthead、hero、正文、引用、作者信息和相关文章的长篇文章页面。

## 协议快照

- 原始来源：`skills/blog-post/SKILL.md`
- Skill 名称：`blog-post`
- 触发词：`blog`, `blog post`, `article`, `essay`, `case study`, `newsletter`, `博客`, `文章`
- `mode`: `prototype`
- `scenario`: `marketing`
- `platform`: `desktop`
- `featured`: `11`
- `design_system.requires`: `true`

## 阅读建议

- 先确认该 skill 是否要求活动 `DESIGN.md`、`assets/template.html` 或 `references/checklist.md`。
- 保留原文中的命令、路径、HTML 片段、JSON/YAML 字段和输出标签，不要按中文语义改写这些机器可读内容。
- 如果该 skill 属于 deck、media 或 template 场景，优先阅读输出契约和 self-check 部分。

## 原文目录

- Blog Post Skill
  - Workflow
  - Output contract

## 原始正文（完整保留）

# Blog Post Skill

Produce a single long-form article page — editorial layout, no chrome.

## Workflow

1. **Read the active DESIGN.md** (injected above). Lean into the typography
   tokens — long-form is 70% type, 20% image, 10% chrome.
2. **Pick the topic** from the brief and write a real article — at least 600
   words across 4–6 H2 sections. No lorem ipsum.
3. **Sections**, in order:
   - **Masthead** — small wordmark + 4–6 nav links, plain.
   - **Article header** — category eyebrow, headline (display token, large),
     deck (1–2 sentence subhead), author name + role + date.
   - **Hero image** — a 16:9 placeholder block using a DS-tinted gradient or
     solid fill (no external images). Add a 1-line caption underneath.
   - **Body** — alternating prose paragraphs with at least:
     - 1 pull quote (large display type, accent rule on the left).
     - 1 figure (image placeholder + caption).
     - 1 list (numbered or bulleted).
     - 1 inline blockquote.
   - **Author footer** — author avatar (initials in a circle), bio paragraph.
   - **Related** — 3 cards linking to other posts. Each card: tiny image
     block, title, 1-line excerpt, date.
4. **Write** a single HTML document:
   - `<!doctype html>` through `</html>`, CSS inline.
   - Article body uses the DS body font, centered, max-width per DS layout
     rule (typically 680–720px).
   - Drop caps (`first-letter`) only if the DS mood is editorial / serif —
     skip on tech-y DSes.
   - `data-od-id` on the headline, hero, body, pull quote, related grid.
5. **Self-check**:
   - Type hierarchy is unambiguous — H1 is clearly the headline; H2s are
     section dividers; pull quotes do not compete with H1.
   - Line length 60–75 chars for body prose.
   - Accent appears at most twice (eyebrow + pull-quote rule, or one link).
   - The page reads like a magazine, not a marketing landing.

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="post-slug" type="text/html" title="Article Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.
