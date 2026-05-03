---
name: opencli-usage
description: 在任何 OpenCLI 会话开始时使用。这是 opencli 能力地图，说明如何发现 adapter、哪些 flag 和输出格式是通用的，以及下一步该加载哪个专用 skill。当 Agent 问“opencli 能做什么”或“我该怎么找命令”时指向这里。
allowed-tools: Bash(opencli:*), Read
---

# opencli-usage

OpenCLI 把网站、Electron 桌面应用和外部 CLI 统一成 `opencli <site> <command>` 的接口，Agent 可以用它完成任务而不必自己做屏幕抓取。本 skill 是导航层；当你明确要做什么后，再加载下面的专用 skill。

## 三个支柱

- **Adapter 命令**：`opencli <site> <command> [...]`。内置 adapter 在 `clis/`，用户 adapter 在 `~/.opencli/clis/`。每个命令都有策略标签：`PUBLIC | COOKIE | HEADER | INTERCEPT | UI | LOCAL`，用于判断是否需要 Chrome 会话。
- **浏览器驱动**：`opencli browser *` 子命令，例如 `open`、`state`、`click`、`type`、`select`、`find`、`extract`、`network`。没有 adapter 或正在原型验证时使用，详见 `opencli-browser`。
- **外部 CLI 透传**：`opencli gh`、`opencli docker`、`opencli vercel` 等。通过 `opencli install <name>` 从 `external-clis.yaml` 自动安装，或用 `opencli register <name>` 注册自有工具。

## 安装

```bash
# npm 全局安装
npm install -g @jackwener/opencli          # binary: opencli, requires Node >= 21
opencli doctor                              # 做浏览器相关工作前先跑

# 从源码运行
git clone git@github.com:jackwener/OpenCLI.git
cd OpenCLI && npm install
npx tsx src/main.ts <command>               # 与全局安装同一命令面
```

`opencli doctor` 输出结构化的 `DoctorReport`，包含 daemon 状态、扩展连接、版本检查。它只诊断 **Browser Bridge**（daemon + extension + Chrome wiring）。`PUBLIC`/`LOCAL` adapter、`opencli list`、`validate`、`verify`、plugin 命令和 external CLI passthrough 不要求 doctor 全绿；只有 `COOKIE`、`HEADER`、`INTERCEPT`、`UI` adapter 和 `opencli browser *` 需要。常用 flag：`--no-live`、`--sessions`、`-v`。

## 不同命令类型的前置条件

| `opencli list` 上的策略 | 需要什么 |
|---|---|
| `PUBLIC` | 不需要额外环境，纯 HTTP 或公开数据。 |
| `COOKIE` / `HEADER` | Chrome 已登录目标站点，并加载 opencli Browser Bridge 扩展。命令从实时会话捕获凭证，不要求重新登录。 |
| `INTERCEPT` | 同 COOKIE，并打开自动化窗口捕获签名请求。 |
| `UI` | 同 COOKIE，需要完整 DOM 交互。 |
| `LOCAL` | 不需要浏览器，访问本地或开发端点。 |

Electron 桌面应用（cursor、codex、chatwise、notion、discord-app、doubao-app、antigravity、chatgpt-app）通过 CDP 连接正在运行的应用。调用前确保应用已启动。

## 发现已安装能力

不要读死文档，先跑命令：

```bash
opencli list                    # 表格，按站点分组
opencli list -f json            # 机器可读，适合 pipe 给 jq 或 Agent
opencli list | grep -i twitter  # 找特定站点
opencli <site> --help           # 查看站点命令和 flag
opencli <site> <command> --help # 查看参数和命令专属 flag
```

不要硬编码 adapter 列表。站点和命令数每周都会变化，`opencli list -f json` 是事实来源；它每个命令输出 `{site, name, aliases, description, strategy, browser, args, columns, ...}`。

## 通用 flag

| flag | 效果 |
|---|---|
| `-f, --format <fmt>` | `table`（TTY 默认）、`yaml`（非 TTY 默认）、`json`、`plain`、`md`、`csv`。Agent 通常应显式传 `-f json`。 |
| `-v, --verbose` | 输出 debug 日志和失败栈，并为进程设置 `OPENCLI_VERBOSE=1`。 |

命令专属 flag（如 `--limit`、`--tab`、`--filter`）不是通用的；用 `<site> <command> --help` 查询。

## 输出格式

- `json`：2 空格缩进，Agent 默认首选。
- `plain`：对 chat 类命令打印单个主字段（`response`/`content`/`text`/`value`），适合管道。
- `yaml`：非 TTY 且未显式 `-f` 时的 fallback。
- `table`：彩色表格，给人看。
- `md`、`csv`：直接表格化导出。

少数命令可通过 `cmd.defaultFormat` 覆盖默认格式，例如 chat 命令常默认 `plain`，不要不看 help 就假设。

## 环境变量

| 变量 | 默认值 | 用途 |
|---|---|---|
| `OPENCLI_DAEMON_PORT` | `19825` | daemon 与扩展桥接端口。 |
| `OPENCLI_BROWSER_CONNECT_TIMEOUT` | `30` | 等待 Browser Bridge 的秒数。 |
| `OPENCLI_BROWSER_COMMAND_TIMEOUT` | `60` | 单命令 timeout。 |
| `OPENCLI_BROWSER_EXPLORE_TIMEOUT` | `120` | 长时间侦察、plugin 或 adapter scaffolding。 |
| `OPENCLI_CDP_ENDPOINT` | 无 | 手动 CDP endpoint 覆盖。 |
| `OPENCLI_CACHE_DIR` | `~/.opencli/cache` | 网络抓包和浏览器状态缓存。 |
| `OPENCLI_WINDOW_FOCUSED` | `false` | `1` 时自动化窗口前台打开。 |
| `OPENCLI_VERBOSE` | `false` | verbose 日志，也可由 `-v` 触发。 |
| `OPENCLI_DIAGNOSTIC` | `false` | `1` 时 adapter 失败会输出结构化 `RepairContext`，供 `opencli-autofix` 使用。 |

## 自修复

当 adapter 因站点变化失败（selector 漂移、API 轮换、response schema 改动），CLI 会提示 `# AutoFix: re-run with OPENCLI_DIAGNOSTIC=1 ...`。按提示重跑，读取 `RepairContext`，修改 `RepairContext.adapter.sourcePath` 指向的 adapter，然后重试。最多 3 轮修复，完整流程见 `opencli-autofix`。

## 写自己的 adapter

两种存储路径：

- **私有**：`~/.opencli/clis/<site>/<command>.js`，无构建步骤，立即可用，不进入公共包。
- **公共/PR**：`clis/<site>/<command>.js`，用于上游贡献，需要 build。

脚手架和验证：

```bash
opencli browser init <site>/<command>   # 生成骨架
opencli validate [target]               # 校验 registry，无网络无浏览器
opencli verify [target] [--smoke]       # 校验并可选跑 smoke
opencli browser verify <site>/<command> # 通过 bridge 端到端验证
```

adapter 只应导入 `@jackwener/opencli/registry` 和 `@jackwener/opencli/errors`。`columns` 必须和 `func` 返回对象的 key 名和顺序一致。完整流程见 `opencli-adapter-author`。

## Plugins

Plugins 是从 git 拉取的第三方扩展，和主 adapter registry 分离：

```bash
opencli plugin install github:user/repo
opencli plugin list [-f json]
opencli plugin update [name] | --all
opencli plugin uninstall <name>
opencli plugin create <name>
```

## 外部 CLI passthrough

把已有命令行工具包进同一个 `opencli ...` 入口：

```bash
opencli install gh
opencli register my-tool \
    --binary my-tool \
    --install "npm i -g my-tool" \
    --desc "My internal CLI"
opencli gh pr list --limit 5
opencli docker ps
```

内置条目在 `src/external-clis.yaml`，用户覆盖和新增项在 `~/.opencli/external-clis.yaml`。常见内置项包括 `gh`、`docker`、`vercel`、`lark-cli`、`dws`、`wecom-cli`、`obsidian`。

## Shell completion

```bash
opencli completion bash   # 也支持 zsh、fish
# 输出 completion 脚本到 stdout；按 shell 习惯 source 或保存
```

## 下一步加载哪个 skill

| 你要做什么 | 加载 |
|---|---|
| 临时驱动真实浏览器 | `opencli-browser` |
| 写新 adapter 或给已有站点加命令 | `opencli-adapter-author` |
| 修一个失败的 adapter | `opencli-autofix` |
| 把搜索/查询/研究请求路由到合适 adapter | `smart-search` |

## 已移除的命令

以下命令在 PR #1094 consolidation 后已移除：

- `opencli explore <url>`：改用 `opencli browser network` + `opencli browser find`，或 adapter-author 工作流。
- `opencli record <url>`：手动抓包改由 `opencli browser network --detail` 处理。
- 顶层 `opencli web read` / `opencli desktop *`：折叠进对应 adapter。`opencli web read` 作为 `web` adapter 的 `read` 命令仍可能存在，但没有独立顶层 group。

## 不要这样做

- 不要把本 skill 的命令列表复制进计划，它会过期。任务开始时调用 `opencli list -f json`。
- 不要假设每个 adapter 都需要浏览器；检查 `strategy`。
- adapter 失败时不要静默改用手写 `fetch`；先用 `OPENCLI_DIAGNOSTIC=1`，它通常会告诉你该改哪里。
