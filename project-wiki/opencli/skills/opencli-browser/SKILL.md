---
name: opencli-browser
description: 当 Agent 需要通过 opencli 驱动真实 Chrome 窗口时使用：检查页面、填写表单、点击登录态流程或临时抽取数据。本 skill 覆盖 selector-first 目标契约、复合表单字段、stale ref 处理、网络抓包和 CLI 返回的 Agent 原生 envelope。不要用它写 adapter；写 adapter 请看 opencli-adapter-author。
allowed-tools: Bash(opencli:*), Read, Edit, Write
---

# opencli-browser

这个 CLI 的第一读者是 Agent，不是人。每个子命令都会返回结构化 envelope，告诉你匹配了什么、置信度如何、失败后该怎么分支。依赖这些 envelope，不要猜。

本 skill 用于**驱动实时浏览器完成任务**。如果你要在 `~/.opencli/clis/<site>/` 下构建可复用 adapter，请改用 `opencli-adapter-author`。

## 前置条件

```bash
opencli doctor
```

在 `doctor` 变绿前，其他浏览器命令通常不可用。常见失败包括 Chrome 未运行、扩展未安装、debug port 被 1Password 或其他扩展占用。doctor 输出会说明具体问题。

## 窗口生命周期

- `opencli browser *` 会在多次调用间保持 automation session。窗口会一直存在，直到 `opencli browser close` 或 idle timeout。
- `--focus` 或 `OPENCLI_WINDOW_FOCUSED=1` 会把自动化窗口放到前台，适合观察页面。
- `--live` 或 `OPENCLI_LIVE=1` 主要用于浏览器型 adapter，例如 `opencli xiaohongshu note ...`。命令结束后保留窗口，便于检查最终页面状态。

## 心智模型

1. **selector-first target contract**：每个交互命令的 `<target>` 要么是 `state/find` 里的数字 ref，要么是 CSS selector。CSS 多匹配时用 `--nth <n>`。
2. **每个 envelope 都报告 `matches_n` 和 `match_level`**：`exact`、`stable`、`reidentified`。CLI 会帮你处理中等 DOM 漂移，但你要读置信度。
3. **先拿紧凑输出，需要时再取完整 payload**：`state` 是预算受控快照；`get html --as json` 支持预算；`network` 默认给 shape preview，再用 `--detail <key>` 取 body。
4. **结构化错误可机读**：失败时返回 `{error: {code, message, hint?, candidates?&#125;&#125;`。按 `code` 分支，不要解析自然语言 message。

## 关键规则

1. **先检查再操作**：先跑 `state` 或 `find`。不要跨会话硬编码 ref 或 selector。
2. **拿到数字 ref 后优先用 ref**：ref 有元素指纹，能抵抗轻微 DOM 漂移；手写 CSS 更脆。
3. **每次写操作后读取 `match_level`**：`exact` 可继续；`stable` 表示软属性漂移但身份稳定；`reidentified` 表示原 ref 消失后找到唯一替代元素，后续操作前要复核。
4. **表单控件用 `compound` 字段**：不要猜日期格式，不要二次 state 只为了拿 select 选项。compound 里有格式、选项、文件 accept/multiple 等。
5. **重要写操作要验证**：`type` 后跑 `get value`，`select` 后跑 `get value`。React controlled input、autocomplete、mask 都可能吞字符。
6. **页面变化后重新 `state`**：导航、提交、SPA route 会使旧 ref 失效。
7. **相关步骤用 `&&` 串起来**：同一 shell 内执行，减少 session 状态竞争。
8. **`eval` 只读**：包装成 IIFE 并返回 JSON。要修改页面时用结构化 `click/type/select/keys`。
9. **优先 network，不要硬刮 DOM**：如果页面数据来自 JSON API，API 通常比渲染 DOM 稳定。

## `<target>` 契约

```text
<target> ::= <numeric-ref> | <css-selector>
```

- **数字 ref**：来自 `state` 或 `find` 的 `[N]`，对轻微 DOM 漂移更稳。
- **CSS selector**：任何 `querySelectorAll` 支持的 selector。写操作必须唯一，或配合 `--nth <n>`。

成功示例：

```json
{ "clicked": true, "target": "3", "matches_n": 1, "match_level": "exact" }
```

```json
{ "value": "kalevin@example.com", "matches_n": 1, "match_level": "stable" }
```

`match_level` 含义：

| level | 含义 | 你该做什么 |
|---|---|---|
| `exact` | tag 和强身份一致，最多有软属性漂移 | 继续。 |
| `stable` | tag 和强身份仍一致，但 aria-label、role、text 等软信号漂移 | 可继续；重要写操作后用 `get value` 或 `state` 复核。 |
| `reidentified` | 原 ref 不在了，CLI 找到唯一匹配指纹的替代元素 | 后续链式写操作前先确认点/输的是正确元素。 |

常见错误码：

| code | 含义 |
|---|---|
| `not_found` | 数字 ref 不在 DOM，重新 `state`。 |
| `stale_ref` | ref 存在但元素身份变了，重新 `state`。 |
| `invalid_selector` | CSS 无法被 `querySelectorAll` 接受。 |
| `selector_not_found` | CSS 匹配 0 个元素。 |
| `selector_ambiguous` | CSS 匹配多个且未传 `--nth`。 |
| `selector_nth_out_of_range` | `--nth` 超出范围。 |
| `option_not_found` | select 找不到对应 label/value，envelope 里会有 `available`。 |
| `not_a_select` | 对非 `<select>` 调用了 `select`。 |

## 命令速查

### Inspect

| 命令 | 用途 |
|---|---|
| `browser state` | 页面快照，带 `[N]` ref、滚动提示、hidden interactive 提示和 `compounds (N)`。 |
| `browser find --css <sel> [--limit N] [--text-max N]` | CSS 查询，返回 `{nth, ref, tag, role, text, attrs, visible, compound?}`。 |
| `browser frames` | 列出跨源 iframe，index 可传给 `eval --frame`。 |
| `browser screenshot [path]` | 视口 PNG。没有 path 时输出 base64；只需要结构时优先 `state`。 |

### Get

| 命令 | 返回 |
|---|---|
| `browser get title` | plain text |
| `browser get url` | plain text |
| `browser get text <target> [--nth N]` | `{value, matches_n, match_level}` |
| `browser get value <target> [--nth N]` | `{value, matches_n, match_level}` |
| `browser get attributes <target> [--nth N]` | `{value: {attr: val}, matches_n, match_level}` |
| `browser get html [--selector <css>] [--as html|json] ...` | 原始 HTML 或结构化树，预算截断会报告 `truncated`。 |

### Interact

| 命令 | 说明 |
|---|---|
| `browser click <target> [--nth N]` | 返回 `{clicked, target, matches_n, match_level}`。 |
| `browser type <target> <text> [--nth N]` | 先 click 再 type，返回 `autocomplete` 信号。 |
| `browser select <target> <option> [--nth N]` | 优先按 label 匹配，再按 value。 |
| `browser keys <key>` | `Enter`、`Escape`、`Tab`、`Control+a` 等。 |
| `browser scroll <direction> [--amount px]` | `up` 或 `down`，默认 500 px。 |

### Wait

```bash
browser wait selector "<css>" [--timeout ms]
browser wait text "<substring>" [--timeout ms]
browser wait time <seconds>
browser wait xhr "<regex>" [--timeout ms]
```

默认 timeout 是 `10000` ms。SPA route、登录跳转、懒加载列表需要 wait 后再 `state/get`。

### Extract

- `browser eval <js> [--frame N]`：在页面或跨源 frame 执行表达式。包装成 IIFE，返回 JSON；不要用它改页面。
- `browser extract [--selector <css>] [--chunk-size N] [--start N]`：把长文抽成 Markdown chunk，返回 `next_start_char`，循环直到为 `null`。

### Network

```bash
browser network
browser network --detail <key>
browser network --filter "field1,field2"
browser network --all
browser network --raw
browser network --ttl <ms>
```

列表项包含 `{key, method, status, url, ct, size, shape, body_truncated?}`。detail envelope 包含完整 body 和截断信息。缓存位于 `~/.opencli/cache/browser-network/`。

### Tabs 与 session

| 命令 | 用途 |
|---|---|
| `browser tab list` | 返回 `{index, page, url, title, active}` 数组。 |
| `browser tab new [url]` | 开新 tab 并打印 page identity。 |
| `browser tab select [targetId]` | 设为默认 tab。所有子命令也可传 `--tab <targetId>`。 |
| `browser tab close [targetId]` | 按 page identity 关闭 tab。 |
| `browser back` | 当前 tab 后退。 |
| `browser close` | 关闭 automation window。 |

## 复合表单控件

date/time、select、file input 都带 `compound`。必须使用它，不要 regex 猜属性。

日期族示例：

```json
{
  "control": "date",
  "format": "YYYY-MM-DD",
  "current": "2026-04-21",
  "min": "2026-01-01",
  "max": "2026-12-31"
}
```

select 示例：

```json
{
  "control": "select",
  "multiple": false,
  "current": "United States",
  "options": [
    { "label": "United States", "value": "us", "selected": true },
    { "label": "Canada", "value": "ca" }
  ],
  "options_total": 137
}
```

file 示例：

```json
{
  "control": "file",
  "multiple": true,
  "current": ["report.pdf", "cover.png"],
  "accept": "application/pdf,image/*"
}
```

不要编造文件路径。上传仍通过正常点击流程完成，并尊重 `accept`。

## 成本指南

| 命令 | 粗略成本 | 何时使用 |
|---|---|---|
| `state` | 中 | 每个页面首次调用、每次导航后、需要 refs 时。 |
| `find --css <sel>` | 小 | 已知 selector。 |
| `get title/url` | 极小 | 步骤间 sanity check。 |
| `get text/value/attributes` | 小 | 验证单个字段。 |
| `get html` | 可能很大 | 必须配 `--selector` 和预算。 |
| `screenshot` | 大 | CAPTCHA、图表等视觉页面。 |
| `extract` | 中 | 长文阅读。 |
| `network` | 小 | API 初探。 |
| `network --detail <key>` | 视 body 而定 | 只拉一个 body。 |
| `network --raw` | 很大 | 只在 filter 缩小候选后使用。 |

经验法则：一次页面转换一个 `state`，一个后续查询一个 `find`，一个动作一个 `get/click/type`。

## 示例

填写登录表单：

```bash
opencli browser open "https://example.com/login"
opencli browser state
opencli browser type 4 "me@example.com"
opencli browser type 5 "hunter2"
opencli browser get value 4
opencli browser click 6
opencli browser wait selector "[data-testid=account-menu]" --timeout 15000
opencli browser state
```

通过 network 抽列表：

```bash
opencli browser open "https://news.ycombinator.com"
opencli browser network --filter "title,score"
opencli browser network --detail topstories-a1b2
```

读取长文章：

```bash
opencli browser open "https://blog.example.com/long-post"
opencli browser extract --chunk-size 8000
opencli browser extract --start 8000 --chunk-size 8000
```

跨源 iframe：

```bash
opencli browser frames
opencli browser eval "(() => document.querySelector('input[name=cardnumber]')?.value)()" --frame 0
```

## 常见坑

- 不要用 `eval "document.forms[0].submit()"` 提交表单，现代站点常拦截并丢弃。
- 不要跨页面转换复用 ref。wait 新状态后重新 `state`。
- `match_level: reidentified` 是警告不是错误；关键链路要复核。
- 预算型命令会截断，看到 `truncated` 就提高预算或缩小 selector。
- `autocomplete: true` 表示建议弹层出现，通常要 `keys Enter` 或点击候选。
- `network --filter` 是 AND 语义，不是 regex。
- 截图给人看，不是 Agent 默认路径；优先 `state/find`。

## 排障

| 现象 | 修复 |
|---|---|
| `opencli doctor` 显示 Browser not connected | 启动 Chrome 或重装/重载扩展。 |
| `attach failed: chrome-extension://...` | 暂时禁用 1Password 或其他占用 CDP 的扩展。 |
| `selector_not_found` 紧跟 `state` 出现 | 页面变了，`wait selector "..."` 后重试。 |
| 每个命令都 `stale_ref` | 你在复用旧页面 ref，重新 `state`。 |
| click 成功但没反应 | 点到装饰 wrapper，换更窄 selector 或内部元素。 |
| type 后 value 不对 | autocomplete、mask 或 React 重渲染，`get value` 验证并补 `keys Enter`。 |
| `get html` 巨大 | 加 `--selector --as json --depth 3 --children-max 20 --text-max 200`。 |
| network cache 过期 | 降低 `--ttl` 或重跑 `browser network`。 |

## 另见

- `opencli-adapter-author`：把临时浏览器探索沉淀成可复用 adapter。
- `opencli-autofix`：已有 adapter 失败时，用诊断和修复流程处理。
