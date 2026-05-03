---
name: opencli-autofix
description: 当 opencli 命令失败时，自动修复损坏的 OpenCLI adapter。此 skill 引导你通过 OPENCLI_DIAGNOSTIC 收集诊断、修改 adapter、重试，并在验证修复后准备上游 GitHub issue。适用于任何 AI Agent。
allowed-tools: Bash(opencli:*), Bash(gh:*), Read, Edit, Write
---

# OpenCLI AutoFix：adapter 自动自修复

当 `opencli` 命令因为网站 DOM、API 或响应 schema 改变而失败时，应自动诊断、修复 adapter 并重试，不要只报告错误。

## 安全边界

开始修复前先检查硬停止条件：

- **`AUTH_REQUIRED`**（exit code 77）：停止，不改代码。让用户在 Chrome 中登录目标站点。
- **`BROWSER_CONNECT`**（exit code 69）：停止，不改代码。让用户运行 `opencli doctor`。
- **CAPTCHA / rate limiting**：停止，这不是 adapter 问题。

范围约束：

- **只修改 `RepairContext.adapter.sourcePath` 指向的文件**。这是权威 adapter 位置，可能在 repo 的 `clis/<site>/`，也可能是 npm 安装后的 `~/.opencli/clis/<site>/`。
- **不要修改** `src/`、`extension/`、`tests/`、`package.json` 或 `tsconfig.json`。

重试预算：每次失败最多 **3 轮** diagnose -> fix -> retry。3 轮仍不行就停止，并报告尝试过什么。

## 前置

```bash
opencli doctor
```

## 适用场景

用于可修复错误：

- `SELECTOR`：元素找不到，DOM 变化。
- `EMPTY_RESULT`：API response schema 变化，或数据移动。
- `API_ERROR` / `NETWORK`：endpoint 移动或失效。
- `PAGE_CHANGED`：页面结构不再匹配。
- `COMMAND_EXEC`：adapter 逻辑运行时错误。
- `TIMEOUT`：页面加载方式变化，等待条件错误。

## 进入修复前：空结果不一定是坏了

`EMPTY_RESULT` 和 selector 返回空经常不是 adapter bug。平台可能按反爬策略降级，也可能真实没有结果。先排除：

- 用替代 query 或入口重试。某个词 0 条，另一个更具体的词 20 条，adapter 可能没坏。
- 在普通 Chrome tab 里抽查。用户浏览器可见但 adapter 空，常是登录态、限流或软封禁。
- 注意 soft 404。小红书、微博、抖音等可能 HTTP 200 但 payload 空。
- 搜索 0 结果也是有效答案。如果 endpoint 200 且返回 `results: []`，不要修 adapter。

只有空结果跨重试和替代入口都可复现时，才进入 Step 1。

## Step 1：收集诊断上下文

```bash
OPENCLI_DIAGNOSTIC=1 opencli <site> <command> [args...] 2>diagnostic.json
```

stderr 中会在 `___OPENCLI_DIAGNOSTIC___` 标记之间输出 `RepairContext`：

```json
{
  "error": {
    "code": "SELECTOR",
    "message": "Could not find element: .old-selector",
    "hint": "The page UI may have changed."
  },
  "adapter": {
    "site": "example",
    "command": "example/search",
    "sourcePath": "/path/to/clis/example/search.js",
    "source": "// full adapter source code"
  },
  "page": {
    "url": "https://example.com/search",
    "snapshot": "// DOM snapshot with [N] indices",
    "networkRequests": [],
    "consoleErrors": []
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

提取 JSON：

```bash
cat diagnostic.json | sed -n '/___OPENCLI_DIAGNOSTIC___/{n;p;}'
```

## Step 2：分析失败

读取 diagnostic 和 adapter source，判断根因：

| Error Code | 可能原因 | 修复策略 |
|---|---|---|
| `SELECTOR` | DOM 重构，class/id 改名 | 探索当前 DOM，找新 selector |
| `EMPTY_RESULT` | API schema 改变或数据移动 | 看 network，找新 response path |
| `API_ERROR` | endpoint URL 改变或新参数 | 通过 network intercept 找新 API |
| `AUTH_REQUIRED` | 登录态过期或登录流变化 | 停止，让用户登录 |
| `TIMEOUT` | 页面加载方式变化 | 更新 wait 条件 |
| `PAGE_CHANGED` | 大改版 | 可能需要重写 adapter |

必须回答：

1. adapter 想做什么？
2. 失败时页面是什么样？
3. 有哪些 network request？
4. adapter 预期与页面实际差在哪里？

## Step 3：探索当前网站

用 `opencli browser` 检查实时网站。不要继续调用损坏 adapter。

DOM 变化：

```bash
opencli browser open https://example.com/target-page && opencli browser state
```

API 变化：

```bash
opencli browser open https://example.com/target-page && opencli browser state
opencli browser click <N> && opencli browser network
opencli browser network --filter author,text,likes
opencli browser network --detail <key>
```

## Step 4：修改 adapter

读取 `RepairContext.adapter.sourcePath` 指向的文件，只做定向修复。

常见修复：

```typescript
// selector 改名
// Before: page.evaluate('document.querySelector(".old-class")...')
// After:  page.evaluate('document.querySelector(".new-class")...')
```

```typescript
// endpoint 变化
// Before: const resp = await page.evaluate(`fetch('/api/v1/old-endpoint')...`)
// After:  const resp = await page.evaluate(`fetch('/api/v2/new-endpoint')...`)
```

```typescript
// schema 变化
// Before: const items = data.results
// After:  const items = data.data.items
```

```typescript
// wait 条件变化
// Before: await page.wait({ selector: '.loading-spinner', hidden: true })
// After:  await page.wait({ selector: '[data-loaded="true"]' })
```

修复规则：

1. 最小改动，只修坏点，不重构。
2. 保持输出结构兼容，`columns` 和返回格式不要随意变化。
3. 能用 API 就不要 DOM scraping。
4. 只用 `@jackwener/opencli/*` imports，不加第三方依赖。
5. 修改后立即测试。
6. 不要放宽 fixture 来掩盖失败。只有站点本身语义变化时才更新 fixture，并记录到 `~/.opencli/sites/<site>/notes.md`。

## Step 5：验证修复

```bash
opencli <site> <command> [args...]
```

仍失败则回到 Step 1 收集新诊断。最多 3 轮。

## Step 6：准备上游 issue

如果重试通过，说明本地 adapter 已经偏离上游。准备 GitHub issue，让修复回流 `jackwener/OpenCLI`。

不要为这些情况建 issue：

- `AUTH_REQUIRED`、`BROWSER_CONNECT`、`ARGUMENT`、`CONFIG`
- CAPTCHA 或限流
- 3 轮后仍未修复

只在本地修复已验证通过后准备 issue。模板：

```markdown
## Summary
OpenCLI autofix repaired this adapter locally, and the retry passed.

## Adapter
- Site: `<site>`
- Command: `<command>`
- OpenCLI version: `<version from opencli --version>`

## Original failure
- Error code: `<error_code>`

~~~
<error_message>
~~~

## Local fix summary

~~~
<1-2 sentence description of what you changed and why>
~~~

_Issue filed by OpenCLI autofix after a verified local repair._
```

建 issue 前必须询问用户，展示 title 和 body。用户确认且 `gh auth status` 成功后：

```bash
gh issue create --repo jackwener/OpenCLI \
  --title "[autofix] <site>/<command>: <error_code>" \
  --body "<the body above>"
```

如果 `gh` 未安装或未登录，说明原因并跳过。

## 停止条件

硬停止：

- `AUTH_REQUIRED` / `BROWSER_CONNECT`
- CAPTCHA
- rate limited / IP blocked

软停止：

- 3 轮修复预算耗尽
- 功能已经下线
- 大改版，需要用 `opencli-adapter-author` 重写

停止时清楚告诉用户发生了什么，不要继续做无效 patch。
