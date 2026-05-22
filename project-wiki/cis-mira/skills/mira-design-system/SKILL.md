---
name: mira-design-system
description: Mira 全局设计系统规范。生成或修改 UI、组件样式、颜色 token、字体层级、间距、圆角、阴影、暗黑模式、Tailwind class、CSS 变量、Figma 视觉落地时必须遵循。本 skill 同时是开发者文档和 AI 操作手册：优先使用 Miracle Design System npm 包、UD/本地组件和语义化 token，禁止 hardcode。
version: 2.3.0
last_aligned_with: "@miracle-design/design-system@0.2.0-token.2"
applies_to:
  - "src/**/*.{ts,tsx,css,less,scss}"
  - "src/**/*.md"
---

# Mira Design System

这是 Mira 的全局设计系统 skill，不是单一 color token 文档。

## 规约入口

- Color token 唯一详细规约源：`docs/color-token-governance.md`
- 组件目录、分层、API、README/CHANGELOG 的工程规范：`mira-component-development-guide`

## AI 操作流程

AI 在修改 UI 前按这个顺序做：

1. 先看附近组件如何写：同一模块已有 class、组件、token、状态写法优先复用。
2. 判断是否已有 UD 组件或本地封装能表达需求，优先用组件 props / variant。
3. 样式只补“组件表达不了的差异”，不要整块重写视觉体系。
4. 涉及颜色时必须遵守 `docs/color-token-governance.md`；不要从截图色号直接落代码。
5. 改完自检：hardcode、暗黑模式、hover/active、文本溢出、可访问性。

## TL;DR

1. 视觉值优先来自 `@miracle-design/design-system` 和项目已有组件。
2. 主业务颜色优先显式使用 `var(--color-*)`；具体选择、白名单、shadcn/Radix bridge 例外见 `docs/color-token-governance.md`。
3. 字体、间距、圆角、阴影优先复用现有 class、组件 variant 和 CSS 变量。
4. 交互元素必须考虑 default、hover、pressed、disabled、loading、selected/focus 等状态。
5. 暗黑模式默认交给 DS token 自动适配，业务代码不要用 hardcode 或额外 `.dark` 去修 token。

## Typography / Spacing / Radius / Shadow

1. 能用组件或已有 class 时，优先用组件 / class：例如 `mira-text-body-1`、`text-sm leading-[22px]` 等项目既有模式。
2. 标题、正文、说明文字要有明确层级，不要只靠颜色或字重制造层级。
3. 不要随意 hardcode `font-size`、`line-height`、`font-weight`；如果附近模块已有同类样式，复用它。
4. 间距、圆角、阴影优先复用 Tailwind scale、现有组件 variant 和项目 CSS 变量。
5. 阴影颜色必须来自 DS token；复杂阴影可使用 `color-mix(in srgb, var(--color-*) x%, transparent)`。

## 组件与交互状态

组件优先级：

1. `@universe-design/react` 组件及其 props / variant。
2. `src/components/ui`、`src/components/*` 已有本地封装。
3. 当前 feature 内已有组件和 hook。
4. 最后才新增组件或样式。

交互组件必须覆盖：

- default：默认可读、可点击。
- hover：使用 DS token 或组件内建状态。
- active/pressed：使用 DS token 或组件内建状态。
- disabled/loading：降低可操作感，不能只靠 opacity 破坏可读性。
- selected/focus：键盘可见，边框或背景要有明确语义。

## AI Self-check Protocol

AI 在提交修改前必须自检：

1. 是否先复用了已有组件、class、token，而不是新造样式？
2. 是否遵守 `docs/color-token-governance.md`，没有新增 hardcode、旧 alias 或私有 token？
3. 所有颜色是否能说清语义：文本、背景、边框、状态、品牌、功能色？
4. hover、active、disabled、loading、selected/focus 是否完整且实际生效？
5. 暗黑模式是否依赖 DS token，而不是局部 hardcode？
6. 文本是否考虑溢出、换行、截断、中英文混排？
7. 新增全局 CSS 是否必要，是否可以收敛到组件或已有 bridge？
8. UI / 样式改动后运行或确保通过 `pnpm check:color-tokens`。

## 版本记录

- `2.3.0`：将 color token 详细规则归一到 `docs/color-token-governance.md`，本 skill 保留 AI 操作入口和非颜色设计系统规则。
- `2.2.0`：将主业务颜色引用改为显式 `var(--color-*)` 优先，补充 primary action light/dark 规则、Prompt send 例外、高风险短类 guard 和白名单。
- `2.1.0`：恢复为全局设计系统 skill，将 color token 作为重点章节，同时补充 typography、spacing、radius、shadow、组件状态、dark mode 和 AI 自检。
- `1.0.0`：初版设计系统使用说明。
