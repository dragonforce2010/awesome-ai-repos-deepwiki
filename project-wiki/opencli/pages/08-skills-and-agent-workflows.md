# Skills 与 Agent 工作流

<details>
<summary>相关源文件</summary>

- `skills/opencli-usage/SKILL.md`
- `skills/opencli-browser/SKILL.md`
- `skills/opencli-adapter-author/SKILL.md`
- `skills/opencli-autofix/SKILL.md`
- `skills/smart-search/SKILL.md`
- `clis/antigravity/SKILL.md`

</details>

## Skills 目录的作用

仓库把 Agent 使用 opencli 的经验沉淀为 skills。它们不是运行时代码，但会显著影响 Agent 如何选择命令、调试 adapter 和处理浏览器交互。  
Sources: [skills/opencli-usage/SKILL.md:7-16](../skills/opencli-usage/SKILL.md#L7-L16), [skills/opencli-usage/SKILL.md:146-154](../skills/opencli-usage/SKILL.md#L146-L154)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-usage/SKILL.md:7-16`

```markdown
# opencli-usage

OpenCLI 把网站、Electron 桌面应用和外部 CLI 统一成 `opencli <site> <command>` 的接口，Agent 可以用它完成任务而不必自己做屏幕抓取。本 skill 是导航层；当你明确要做什么后，再加载下面的专用 skill。

## 三个支柱

- **Adapter 命令**：`opencli <site> <command> [...]`。内置 adapter 在 `clis/`，用户 adapter 在 `~/.opencli/clis/`。每个命令都有策略标签：`PUBLIC | COOKIE | HEADER | INTERCEPT | UI | LOCAL`，用于判断是否需要 Chrome 会话。
- **浏览器驱动**：`opencli browser *` 子命令，例如 `open`、`state`、`click`、`type`、`select`、`find`、`extract`、`network`。没有 adapter 或正在原型验证时使用，详见 `opencli-browser`。
- **外部 CLI 透传**：`opencli gh`、`opencli docker`、`opencli vercel` 等。通过 `opencli install <name>` 从 `external-clis.yaml` 自动安装，或用 `opencli register <name>` 注册自有工具。

```

#### `skills/opencli-usage/SKILL.md:146-154`

````markdown
```

## 下一步加载哪个 skill

| 你要做什么 | 加载 |
|---|---|
| 临时驱动真实浏览器 | `opencli-browser` |
| 写新 adapter 或给已有站点加命令 | `opencli-adapter-author` |
| 修一个失败的 adapter | `opencli-autofix` |
````

<!-- source-snippets:end -->
</details>

本 DeepWiki 已按要求在 `skills/` 目录下生成中文审阅副本，包括：

- `skills/opencli-usage/SKILL.md`
- `skills/opencli-browser/SKILL.md`
- `skills/opencli-adapter-author/SKILL.md`
- `skills/opencli-autofix/SKILL.md`
- `skills/smart-search/SKILL.md`
- `skills/antigravity/SKILL.md`

## opencli-usage：入口地图

`opencli-usage` 是顶层导航 skill。它解释三大支柱：adapter commands、browser driving、external CLI passthrough，并要求不要硬编码 adapter 列表，而是运行 `opencli list -f json` 获取实时 registry。  
Sources: [skills/opencli-usage/SKILL.md:11-16](../skills/opencli-usage/SKILL.md#L11-L16), [skills/opencli-usage/SKILL.md:44-55](../skills/opencli-usage/SKILL.md#L44-L55)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-usage/SKILL.md:11-16`

```markdown
## 三个支柱

- **Adapter 命令**：`opencli <site> <command> [...]`。内置 adapter 在 `clis/`，用户 adapter 在 `~/.opencli/clis/`。每个命令都有策略标签：`PUBLIC | COOKIE | HEADER | INTERCEPT | UI | LOCAL`，用于判断是否需要 Chrome 会话。
- **浏览器驱动**：`opencli browser *` 子命令，例如 `open`、`state`、`click`、`type`、`select`、`find`、`extract`、`network`。没有 adapter 或正在原型验证时使用，详见 `opencli-browser`。
- **外部 CLI 透传**：`opencli gh`、`opencli docker`、`opencli vercel` 等。通过 `opencli install <name>` 从 `external-clis.yaml` 自动安装，或用 `opencli register <name>` 注册自有工具。

```

#### `skills/opencli-usage/SKILL.md:44-55`

````markdown
## 发现已安装能力

不要读死文档，先跑命令：

```bash
opencli list                    # 表格，按站点分组
opencli list -f json            # 机器可读，适合 pipe 给 jq 或 Agent
opencli list | grep -i twitter  # 找特定站点
opencli <site> --help           # 查看站点命令和 flag
opencli <site> <command> --help # 查看参数和命令专属 flag
```

````

<!-- source-snippets:end -->
</details>

它还明确了不同 strategy 的前置条件：`PUBLIC/LOCAL` 不依赖浏览器，`COOKIE/HEADER/INTERCEPT/UI` 依赖已登录 Chrome 和 Browser Bridge 扩展。  
Sources: [skills/opencli-usage/SKILL.md:32-43](../skills/opencli-usage/SKILL.md#L32-L43)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-usage/SKILL.md:32-43`

```markdown
## 不同命令类型的前置条件

| `opencli list` 上的策略 | 需要什么 |
|---|---|
| `PUBLIC` | 不需要额外环境，纯 HTTP 或公开数据。 |
| `COOKIE` / `HEADER` | Chrome 已登录目标站点，并加载 opencli Browser Bridge 扩展。命令从实时会话捕获凭证，不要求重新登录。 |
| `INTERCEPT` | 同 COOKIE，并打开自动化窗口捕获签名请求。 |
| `UI` | 同 COOKIE，需要完整 DOM 交互。 |
| `LOCAL` | 不需要浏览器，访问本地或开发端点。 |

Electron 桌面应用（cursor、codex、chatwise、notion、discord-app、doubao-app、antigravity、chatgpt-app）通过 CDP 连接正在运行的应用。调用前确保应用已启动。

```

<!-- source-snippets:end -->
</details>

## opencli-browser：真实浏览器操作规范

`opencli-browser` 规定 Agent 使用浏览器命令时必须 inspect-first：先 `state` 或 `find`，再点击、输入或选择。它把 `match_level`、structured error codes、compound controls、network cache 都纳入操作规范。  
Sources: [skills/opencli-browser/SKILL.md:33-53](../skills/opencli-browser/SKILL.md#L33-L53), [skills/opencli-browser/SKILL.md:56-99](../skills/opencli-browser/SKILL.md#L56-L99), [skills/opencli-browser/SKILL.md:149-160](../skills/opencli-browser/SKILL.md#L149-L160)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-browser/SKILL.md:33-53`

````markdown

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
````

#### `skills/opencli-browser/SKILL.md:56-99`

````markdown

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
````

#### `skills/opencli-browser/SKILL.md:149-160`

```markdown
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
```

<!-- source-snippets:end -->
</details>

这个 skill 和 `src/cli.ts` 的实现是对齐的：代码确实为 click/type/select/get 输出结构化 envelope，为网络命令实现 cache 和 `--detail`。  
Sources: [src/cli.ts:1053-1140](../../../project-repos/opencli/src/cli.ts#L1053-L1140), [src/cli.ts:1307-1489](../../../project-repos/opencli/src/cli.ts#L1307-L1489)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/cli.ts:1053-1140`

> 未找到引用文件：`src/cli.ts`

#### `src/cli.ts:1307-1489`

> 未找到引用文件：`src/cli.ts`

<!-- source-snippets:end -->
</details>

## opencli-adapter-author：写 adapter 的闭环

`opencli-adapter-author` 是从站点侦察到 verify 的 runbook。它强调：

- 先 `opencli doctor`。
- 读站点记忆，但命中 endpoint 也必须重新验证。
- 用 `browser analyze`、network、state、bundle、token、intercept 找 endpoint。
- endpoint 200 且有目标数据后再定 strategy。
- 字段解码和网页肉眼值核对之后才回写 memory。

Sources: [skills/opencli-adapter-author/SKILL.md:29-100](../skills/opencli-adapter-author/SKILL.md#L29-L100), [skills/opencli-adapter-author/SKILL.md:104-151](../skills/opencli-adapter-author/SKILL.md#L104-L151)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-adapter-author/SKILL.md:29-100`

````markdown
## 顶层决策树

```
START
  │
  ▼
┌──────────────────────────┐
│ opencli doctor 通？      │── no ──→ 修桥接（doctor 输出里的提示）
└──────────────────────────┘
  │ yes
  ▼
┌────────────────────────────────────────────────────┐
│ 读站点记忆：                                        │
│   1. ~/.opencli/sites/<site>/endpoints.json         │
│   2. ~/.opencli/sites/<site>/notes.md               │
│   3. references/site-memory/<site>.md               │
└────────────────────────────────────────────────────┘
  │ 命中 endpoint + 字段 → 直接跳到【endpoint 验证】（不跳写 adapter！memory 可能过期）
  │ 没命中 → 继续
  ▼
┌──────────────────────────┐
│ 站点侦察（site-recon）    │  → Pattern A/B/C/D/E
└──────────────────────────┘
  │
  ▼
┌──────────────────────────┐
│ API 发现（api-discovery）│  §1 network → §2 state → §3 bundle → §4 token → §5 intercept
└──────────────────────────┘
  │ 拿到候选 endpoint
  ▼
┌────────────────────────────────────────────┐
│ 直接 fetch 验证 endpoint（memory 命中也要跑）│── 401/403 ──→ 回到 §4 排 token
│ 数据非空 + 200                              │── 空/HTML ──→ 回到 site-recon 换 Pattern
│ memory 里的值还活着吗？                     │── 站点换版 ──→ 标记旧 endpoint，回 api-discovery
└────────────────────────────────────────────┘
  │ OK
  ▼
┌───────────────────────────────────────┐
│ 字段解码（memory 里的 field-map 也要抽查）│  自解释 → 直接 / 已知代号 → field-conventions / 未知 → decode-playbook
│ 比一条已知字段和网页肉眼值，确认没错位     │
└───────────────────────────────────────┘
  │
  ▼
┌──────────────────────────┐
│ 设计 columns (output)    │  对照 output-design.md 的命名 / 类型 / 顺序
└──────────────────────────┘
  │
  ▼
┌──────────────────────────┐
│ opencli browser init      │  生成 ~/.opencli/clis/<site>/<name>.js 骨架
│ 复制最像的邻居 adapter    │
│ 改 name / URL / 映射三处  │
└──────────────────────────┘
  │
  ▼
┌──────────────────────────┐
│ opencli browser verify    │── 失败 ──→ autofix skill，回对应步骤
└──────────────────────────┘
  │ 成功
  ▼
┌──────────────────────────┐
│ 字段 vs 网页肉眼对一遍   │── 数值不对 ──→ 回字段解码
└──────────────────────────┘
  │ 对得上
  ▼
┌──────────────────────────┐
│ 回写 ~/.opencli/sites/   │  endpoints / field-map / notes / fixtures
└──────────────────────────┘
  │
  ▼
DONE
```
````

#### `skills/opencli-adapter-author/SKILL.md:104-151`

````markdown
## Runbook（一步一步勾选）

```
[ ] 1. opencli doctor 返回 "Everything looks good"
[ ] 2. 读站点记忆：
       [ ] ~/.opencli/sites/<site>/endpoints.json 存在？里面有想要的 endpoint？
       [ ] references/site-memory/<site>.md 存在？看"已知 endpoint"节
       [ ] 命中后：**跳到第 5（endpoint 验证） + 第 7（字段核对）**，不能直接跳第 9 写 adapter
       [ ] memory 写入超过 30 天（看 `verified_at`）→ 当作过期，按冷启动走 Step 3 → 4
[ ] 3. 侦察（site-recon.md）：
       [ ] **首选**：`opencli browser analyze <url>` 一步拿 pattern + 反爬 + 最近 adapter + next step
       [ ] `analyze` 结论模糊时再手跑：`open` → `wait time 2` (或 `wait xhr <regex>`) → `network`
       [ ] 定 Pattern（A / B / C / D / E）
[ ] 4. API 发现（api-discovery.md）按 Pattern 选 §：
       [ ] Pattern A → §1 network 精读
       [ ] Pattern B → §2 state 抽取 + §1 深层数据
       [ ] Pattern C → §3 bundle / script src 搜索
       [ ] Pattern D → §4 token 来源 + 降级 §5
       [ ] Pattern E → 找 HTTP 轮询接口；找不到才 §5
[ ] 5. 直接 fetch 候选 endpoint 验证：
       [ ] 返回 200
       [ ] 响应含目标数据（不是 HTML / 广告）
[ ] 6. 定鉴权策略：裸 fetch 通 → PUBLIC；要 cookie → COOKIE；要 header → HEADER；拿不到签名 → INTERCEPT
[ ] 7. 字段解码：
       [ ] 自解释 → 直接用 key
       [ ] 已知代号 → field-conventions.md 查表
       [ ] 未知代号 → field-decode-playbook.md（排序键对比 / 结构差分 / 常量排查）
[ ] 8. 设计 columns（output-design.md）：
       [ ] 命名 camelCase 且对齐邻居 adapter
       [ ] 类型 / 单位 / 百分比格式清楚
       [ ] 顺序：识别列 → 业务数字 → metadata
[ ] 9. 写 adapter（adapter-template.md）：
       [ ] opencli browser init <site>/<name>
       [ ] 找同站点或同类型最像的 adapter，cp 过来
       [ ] 改 name / URL / 字段映射
[ ] 10. opencli browser verify <site>/<name>
        [ ] 首轮通过后立刻 `--write-fixture` 生成 `~/.opencli/sites/<site>/verify/<cmd>.json` 种子
        [ ] 手改种子：加 `patterns`（URL / 日期 / ID 格式）+ `notEmpty`（核心字段）+ 收紧 `rowCount`
        [ ] 再跑一次 `opencli browser verify <site>/<name>`，确认 ✓ matches fixture
[ ] 11. 字段值 vs 网页肉眼比对（别只看 "Adapter works!"）
[ ] 12. 回写站点记忆（**verify 通过 + 肉眼比对对得上之后**，schema 见 `references/site-memory.md`）：
        [ ] `endpoints.json`：以 endpoint 的短名为 key，value = `{url, method, params.{required,optional}, response, verified_at: YYYY-MM-DD, notes}`
        [ ] `field-map.json`：只追加新代号。key = 字段代号，value = `{meaning, verified_at: YYYY-MM-DD, source}`；**已存在的 key 不要覆盖**，有冲突先和网页肉眼值对齐再写
        [ ] `notes.md`：顶部追加一段 `## YYYY-MM-DD by <agent/user>`，写本次写 adapter 时遇到的新坑 / 新结论
        [ ] `verify/<cmd>.json`：**必填。** `opencli browser verify` 的期望值（args / rowCount / columns / types / patterns / notEmpty），Step 10 已经让你生成了，这里只是 checklist
        [ ] `fixtures/<cmd>-<YYYYMMDDHHMM>.json`：存一份该 endpoint 的完整响应样本（去掉 cookie / token / 用户私有字段再存），给后续字段对比 / 离线 replay 用
        [ ] 调试过程中如果在 repo / adapter 目录 dump 过临时文件（`.dbg-*.html` / `raw-*.json` / 等），**在 commit 前清干净**——这些本来就该落在 `~/.opencli/sites/<site>/fixtures/` 或 `/tmp/`
```
````

<!-- source-snippets:end -->
</details>

## opencli-autofix：失败 adapter 自修复

`opencli-autofix` 只适用于 adapter 可修复失败，例如 selector 漂移、API schema 变化、endpoint 迁移、timeout 等。它设置了硬停止条件：`AUTH_REQUIRED`、`BROWSER_CONNECT`、验证码、限流都不是代码修复问题。  
Sources: [skills/opencli-autofix/SKILL.md:11-24](../skills/opencli-autofix/SKILL.md#L11-L24), [skills/opencli-autofix/SKILL.md:31-50](../skills/opencli-autofix/SKILL.md#L31-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-autofix/SKILL.md:11-24`

```markdown
## 安全边界

开始修复前先检查硬停止条件：

- **`AUTH_REQUIRED`**（exit code 77）：停止，不改代码。让用户在 Chrome 中登录目标站点。
- **`BROWSER_CONNECT`**（exit code 69）：停止，不改代码。让用户运行 `opencli doctor`。
- **CAPTCHA / rate limiting**：停止，这不是 adapter 问题。

范围约束：

- **只修改 `RepairContext.adapter.sourcePath` 指向的文件**。这是权威 adapter 位置，可能在 repo 的 `clis/<site>/`，也可能是 npm 安装后的 `~/.opencli/clis/<site>/`。
- **不要修改** `src/`、`extension/`、`tests/`、`package.json` 或 `tsconfig.json`。

重试预算：每次失败最多 **3 轮** diagnose -> fix -> retry。3 轮仍不行就停止，并报告尝试过什么。
```

#### `skills/opencli-autofix/SKILL.md:31-50`

```markdown

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
```

<!-- source-snippets:end -->
</details>

修复流程是：用 `OPENCLI_DIAGNOSTIC=1` 收集 RepairContext，分析 adapter source、DOM snapshot、networkRequests，然后只修改 `RepairContext.adapter.sourcePath`，最多 3 轮重试。  
Sources: [skills/opencli-autofix/SKILL.md:52-90](../skills/opencli-autofix/SKILL.md#L52-L90), [skills/opencli-autofix/SKILL.md:91-147](../skills/opencli-autofix/SKILL.md#L91-L147), [skills/opencli-autofix/SKILL.md:175-191](../skills/opencli-autofix/SKILL.md#L175-L191)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/opencli-autofix/SKILL.md:52-90`

````markdown
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

````

#### `skills/opencli-autofix/SKILL.md:91-147`

````markdown
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

````

#### `skills/opencli-autofix/SKILL.md:175-191`

````markdown
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
````

<!-- source-snippets:end -->
</details>

## smart-search：搜索路由器

`smart-search` 已经是中文。它要求每次使用前先 `opencli list -f yaml`，再用站点 help 和命令 help 确认实时签名。默认无指定站点时只选一个 AI 源，信息不足再补 1-2 个专用源，并在答案末尾追加搜索摘要。  
Sources: [skills/smart-search/SKILL.md:10-23](../skills/smart-search/SKILL.md#L10-L23), [skills/smart-search/SKILL.md:24-31](../skills/smart-search/SKILL.md#L24-L31), [skills/smart-search/SKILL.md:64-81](../skills/smart-search/SKILL.md#L64-L81)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/smart-search/SKILL.md:10-23`

```markdown
## 强制预检

每次使用前，必须先做下面两步：

- 运行 `opencli list -f yaml`
- 用 live registry 确认候选站点是否存在，并检查 `strategy`、`browser`、`domain`

选定站点后，必须再做下面两步：

- 运行 `opencli <site> -h` 查看该站点有哪些子命令
- 若已锁定某个子命令，再运行 `opencli <site> <command> -h` 查看参数、输出列、策略

不要在 skill 文档里硬编码参数或假设命令签名；以 `opencli ... -h` 的实时输出为准。

```

#### `skills/smart-search/SKILL.md:24-31`

```markdown
## 主路由规则

只使用这一条规则，不再维护多套优先级：

1. 当用户明确指定网站、平台或数据源时，直接使用对应网站。
2. 当用户没有指定网站时，优先只选择一个 AI 源：`grok`、`doubao`、`gemini` 三选一。
3. 当 AI 返回内容不足、缺少原始数据、需要权威佐证或需要垂直结果时，再补充 1-2 个专用源。

```

#### `skills/smart-search/SKILL.md:64-81`

````markdown
## 查询结束汇报

每次查询结束后，回答末尾必须追加一段简短的“搜索摘要”，至少包含下面三项：

- 使用了什么网站搜索
- 每个网站搜了什么词
- 每个网站搜了几次

如果有被限频跳过的站点，也要明确写出。

建议使用下面的固定格式：

```md
搜索摘要
- 网站：&lt;site1&gt; | 查询词：&lt;term1&gt; | 次数：&lt;n&gt;
- 网站：&lt;site2&gt; | 查询词：&lt;term2&gt;；&lt;term3&gt; | 次数：&lt;n&gt;
- 已跳过：&lt;site3&gt;，原因：达到频率上限
```
````

<!-- source-snippets:end -->
</details>

## Antigravity skill

`clis/antigravity/SKILL.md` 说明 opencli 可以自动检测、启动并连接 Antigravity Electron app，通过 CDP 控制桌面 UI。能力包括发送消息、读取历史、提取代码、切换模型、清空上下文和 watch。  
Sources: [clis/antigravity/SKILL.md:5-24](../../../project-repos/opencli/clis/antigravity/SKILL.md#L5-L24), [clis/antigravity/SKILL.md:25-38](../../../project-repos/opencli/clis/antigravity/SKILL.md#L25-L38)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `clis/antigravity/SKILL.md:5-24`

> 未找到引用文件：`clis/antigravity/SKILL.md`

#### `clis/antigravity/SKILL.md:25-38`

> 未找到引用文件：`clis/antigravity/SKILL.md`

<!-- source-snippets:end -->
</details>

## Skill 维护建议

这些 skills 和源码之间有明确对应关系：

| Skill | 对应源码面 |
|---|---|
| `opencli-usage` | `src/cli.ts`、`src/external.ts`、`src/doctor.ts` |
| `opencli-browser` | `src/cli.ts` browser 子命令、`src/browser/*` |
| `opencli-adapter-author` | `src/registry.ts`、`src/validate.ts`、`src/cli.ts browser init/verify` |
| `opencli-autofix` | `src/diagnostic.ts`、`src/execution.ts`、adapter source |
| `smart-search` | live registry 和站点 adapter |
| `antigravity` | `clis/antigravity/*.js`、`src/browser/cdp.ts` |

Sources: [src/cli.ts:1491-1698](../../../project-repos/opencli/src/cli.ts#L1491-L1698), [src/diagnostic.ts:1-13](../../../project-repos/opencli/src/diagnostic.ts#L1-L13), [src/browser/cdp.ts:50-92](../../../project-repos/opencli/src/browser/cdp.ts#L50-L92)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/cli.ts:1491-1698`

> 未找到引用文件：`src/cli.ts`

#### `src/diagnostic.ts:1-13`

> 未找到引用文件：`src/diagnostic.ts`

#### `src/browser/cdp.ts:50-92`

> 未找到引用文件：`src/browser/cdp.ts`

<!-- source-snippets:end -->
</details>
