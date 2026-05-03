# 安全、隐私与边界

<details>
<summary>相关源文件</summary>

- `src/diagnostic.ts`
- `src/external.ts`
- `extension/src/background.ts`
- `extension/src/cdp.ts`
- `src/cli.ts`
- `extension/manifest.json`

</details>

## 主要风险面

opencli 连接真实浏览器、读取 cookie、执行页面 JS、抓网络响应、调用外部二进制。这些能力很强，因此源码里也有多层边界：

- 诊断输出脱敏和总量限制。
- 浏览器导航 URL scheme 限制。
- CDP passthrough allowlist。
- 外部 CLI 显式注册和安装命令解析。
- plugin 路径不能逃逸 repo root。

Sources: [src/diagnostic.ts:1-13](../../../project-repos/opencli/src/diagnostic.ts#L1-L13), [extension/src/background.ts:363-366](../../../project-repos/opencli/extension/src/background.ts#L363-L366), [extension/src/background.ts:816-860](../../../project-repos/opencli/extension/src/background.ts#L816-L860), [src/external.ts:89-123](../../../project-repos/opencli/src/external.ts#L89-L123), [src/plugin.ts:271-277](../../../project-repos/opencli/src/plugin.ts#L271-L277)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/diagnostic.ts:1-13`

> 未找到引用文件：`src/diagnostic.ts`

#### `extension/src/background.ts:363-366`

> 未找到引用文件：`extension/src/background.ts`

#### `extension/src/background.ts:816-860`

> 未找到引用文件：`extension/src/background.ts`

#### `src/external.ts:89-123`

> 未找到引用文件：`src/external.ts`

#### `src/plugin.ts:271-277`

> 未找到引用文件：`src/plugin.ts`

<!-- source-snippets:end -->
</details>

## 诊断输出脱敏

`OPENCLI_DIAGNOSTIC=1` 会输出 RepairContext，其中可能包含 adapter source、DOM snapshot、network requests、console errors。诊断模块设置了硬预算：

- 总输出 256 KiB。
- DOM snapshot 100k chars。
- adapter source 50k chars。
- network requests 50 条。
- 单个 request body 4k chars。
- stack 5k chars。

Sources: [src/diagnostic.ts:22-42](../../../project-repos/opencli/src/diagnostic.ts#L22-L42)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/diagnostic.ts:22-42`

> 未找到引用文件：`src/diagnostic.ts`

<!-- source-snippets:end -->
</details>

敏感信息会被处理：

- header 中的 authorization、cookie、set-cookie、csrf、api key 等替换为 `[REDACTED]`。
- URL query 中 token/key/secret/password/auth/session/csrf 等参数脱敏。
- 文本中的 Bearer token、JWT、cookie、token/password 等模式脱敏。

Sources: [src/diagnostic.ts:43-68](../../../project-repos/opencli/src/diagnostic.ts#L43-L68), [src/diagnostic.ts:103-127](../../../project-repos/opencli/src/diagnostic.ts#L103-L127), [src/diagnostic.ts:164-198](../../../project-repos/opencli/src/diagnostic.ts#L164-L198)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/diagnostic.ts:43-68`

> 未找到引用文件：`src/diagnostic.ts`

#### `src/diagnostic.ts:103-127`

> 未找到引用文件：`src/diagnostic.ts`

#### `src/diagnostic.ts:164-198`

> 未找到引用文件：`src/diagnostic.ts`

<!-- source-snippets:end -->
</details>

如果 JSON 超过总预算，先丢 page 中最大的 snapshot/network/captured payload；仍然过大时丢整个 page。  
Sources: [src/diagnostic.ts:335-360](../../../project-repos/opencli/src/diagnostic.ts#L335-L360)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/diagnostic.ts:335-360`

> 未找到引用文件：`src/diagnostic.ts`

<!-- source-snippets:end -->
</details>

## 浏览器导航和调试边界

扩展侧明确区分可调试 URL 和用户可导航 URL。导航只允许 `http://` 和 `https://`；可调试 URL 还允许 `about:blank` 和 `data:`，用于内部空页和调试场景。  
Sources: [extension/src/background.ts:354-366](../../../project-repos/opencli/extension/src/background.ts#L354-L366)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `extension/src/background.ts:354-366`

> 未找到引用文件：`extension/src/background.ts`

<!-- source-snippets:end -->
</details>

CDP attach 前会确认 tab URL 可调试；如果 tab 已经不可调试，会删除 attach cache 并报错。attach 也会做有限重试，避免被其他扩展暂时占用 debugger 时立即失败。  
Sources: [extension/src/cdp.ts:44-83](../../../project-repos/opencli/extension/src/cdp.ts#L44-L83), [extension/src/cdp.ts:87-139](../../../project-repos/opencli/extension/src/cdp.ts#L87-L139)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `extension/src/cdp.ts:44-83`

> 未找到引用文件：`extension/src/cdp.ts`

#### `extension/src/cdp.ts:87-139`

> 未找到引用文件：`extension/src/cdp.ts`

<!-- source-snippets:end -->
</details>

## CDP allowlist

daemon 下发的 `cdp` action 不是万能通道。扩展只允许一组方法：

- Agent DOM context：Accessibility、DOM、DOMSnapshot。
- Native input events：Input dispatch。
- Page metrics 与截图。
- `Runtime.enable`。
- screenshot 所需 Emulation 方法。

不在 allowlist 的方法会返回 `CDP method not permitted`。  
Sources: [extension/src/background.ts:816-860](../../../project-repos/opencli/extension/src/background.ts#L816-L860)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `extension/src/background.ts:816-860`

> 未找到引用文件：`extension/src/background.ts`

<!-- source-snippets:end -->
</details>

## Cookie 读取边界

扩展的 cookie handler 要求传 domain 或 url；没有 scope 会拒绝，避免 dump 全部 cookie。返回字段包括 name、value、domain、path、secure、httpOnly、expirationDate。  
Sources: [extension/src/background.ts:781-799](../../../project-repos/opencli/extension/src/background.ts#L781-L799)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `extension/src/background.ts:781-799`

> 未找到引用文件：`extension/src/background.ts`

<!-- source-snippets:end -->
</details>

## 外部 CLI 边界

external CLI 只从内置或用户 registry 加载，不会自动执行 PATH 上任意命令。未知命令 fallback 只提示用户注册。  
Sources: [src/external.ts:35-67](../../../project-repos/opencli/src/external.ts#L35-L67), [src/cli.ts:2129-2141](../../../project-repos/opencli/src/cli.ts#L2129-L2141)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/external.ts:35-67`

> 未找到引用文件：`src/external.ts`

#### `src/cli.ts:2129-2141`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>

自动安装命令必须能被安全拆成 binary + args。`parseCommand` 拒绝 shell operator、重定向、变量展开和换行，执行时使用 `execFileSync(binary,args)`。  
Sources: [src/external.ts:89-123](../../../project-repos/opencli/src/external.ts#L89-L123), [src/external.ts:130-142](../../../project-repos/opencli/src/external.ts#L130-L142)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/external.ts:89-123`

> 未找到引用文件：`src/external.ts`

#### `src/external.ts:130-142`

> 未找到引用文件：`src/external.ts`

<!-- source-snippets:end -->
</details>

## 扩展权限现实

扩展 manifest 需要 `debugger`、`tabs`、`cookies` 和 `<all_urls>`，这是它能做真实浏览器自动化的前提。对使用者而言，最重要的操作边界是：只在可信环境加载扩展，不要把诊断输出和抓包缓存上传到不可信位置。  
Sources: [extension/manifest.json:1-15](../../../project-repos/opencli/extension/manifest.json#L1-L15), [src/diagnostic.ts:1-13](../../../project-repos/opencli/src/diagnostic.ts#L1-L13)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `extension/manifest.json:1-15`

> 未找到引用文件：`extension/manifest.json`

#### `src/diagnostic.ts:1-13`

> 未找到引用文件：`src/diagnostic.ts`

<!-- source-snippets:end -->
</details>

## 安全审阅清单

| 改动类型 | 必查点 |
|---|---|
| 新 browser action | 是否需要 URL scheme 限制、workspace/tab 校验、结构化错误 |
| 新 CDP passthrough | 是否必须加入 allowlist，是否可能读取敏感数据 |
| 新诊断字段 | 是否脱敏、截断、计入总预算 |
| 新 external CLI | 安装命令是否能通过 `parseCommand`，是否需要用户确认 |
| 新 plugin manifest 能力 | path 是否限制在 repo root，lock file 是否事务写入 |
| 新 adapter | 是否避免把 cookie/token、原始抓包、HTML dump 放进 repo |

Sources: [skills/opencli-adapter-author/SKILL.md:144-150](../skills/opencli-adapter-author/SKILL.md#L144-L150), [src/plugin.ts:271-277](../../../project-repos/opencli/src/plugin.ts#L271-L277), [src/external.ts:100-123](../../../project-repos/opencli/src/external.ts#L100-L123)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-adapter-author/SKILL.md:144-150`

```markdown
[ ] 12. 回写站点记忆（**verify 通过 + 肉眼比对对得上之后**，schema 见 `references/site-memory.md`）：
        [ ] `endpoints.json`：以 endpoint 的短名为 key，value = `{url, method, params.{required,optional}, response, verified_at: YYYY-MM-DD, notes}`
        [ ] `field-map.json`：只追加新代号。key = 字段代号，value = `{meaning, verified_at: YYYY-MM-DD, source}`；**已存在的 key 不要覆盖**，有冲突先和网页肉眼值对齐再写
        [ ] `notes.md`：顶部追加一段 `## YYYY-MM-DD by <agent/user>`，写本次写 adapter 时遇到的新坑 / 新结论
        [ ] `verify/<cmd>.json`：**必填。** `opencli browser verify` 的期望值（args / rowCount / columns / types / patterns / notEmpty），Step 10 已经让你生成了，这里只是 checklist
        [ ] `fixtures/<cmd>-<YYYYMMDDHHMM>.json`：存一份该 endpoint 的完整响应样本（去掉 cookie / token / 用户私有字段再存），给后续字段对比 / 离线 replay 用
        [ ] 调试过程中如果在 repo / adapter 目录 dump 过临时文件（`.dbg-*.html` / `raw-*.json` / 等），**在 commit 前清干净**——这些本来就该落在 `~/.opencli/sites/<site>/fixtures/` 或 `/tmp/`
```

#### `src/plugin.ts:271-277`

> 未找到引用文件：`src/plugin.ts`

#### `src/external.ts:100-123`

> 未找到引用文件：`src/external.ts`

<!-- source-snippets:end -->
</details>
