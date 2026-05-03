# mcporter DeepWiki

> **面向 Model Context Protocol（MCP）的 TypeScript 运行时、CLI 与代码生成工具集 — 让 MCP 像调用本地函数一样直观。**

本 DeepWiki 以 [steipete/mcporter](https://github.com/steipete/mcporter) 仓库 commit `324fb7a00edc6fa4eacf1deeb4ac33a2a7341c09`（main 分支）为底，按 deepwiki-open 风格组织成结构化页面，全部内容源于源码、配置与文档。

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、能力矩阵、API 切面、阅读路径 |
| 系统架构 | [系统架构](pages/system-architecture.md) | high | 五大子系统的边界与请求路径 |
| 配置与导入 | [配置加载与导入](pages/configuration.md) | high | mcporter.json/jsonc 的 layer、7 种 IDE 导入 |
| 运行时 | [运行时与传输层](pages/runtime-transport.md) | high | createRuntime 池、StreamableHTTP→SSE、stdio patch |
| CLI | [CLI 命令体系](pages/cli-commands.md) | high | list / call / auth / config / daemon / generate-cli / emit-ts |
| 调用语法 | [调用语法、自动纠错与临时服务器](pages/call-syntax.md) | medium | key=value / 函数式 / URL / 自动纠错 / `--http-url` |
| 代码生成 | [代码生成：generate-cli 与 emit-ts](pages/code-generation.md) | high | 单文件 CLI / Bun 二进制 / `.d.ts` / 客户端模块 |
| Daemon | [Keep-Alive 守护进程](pages/daemon.md) | medium | 为 chrome-devtools 等 stdio MCP 共享长连接 |
| OAuth | [OAuth 流程与凭证仓库](pages/oauth.md) | medium | PersistentOAuthClientProvider + vault |
| 质量 | [测试、CI 与可观测性](pages/testing-ci.md) | low | Vitest × 106 测试、跨 OS CI、hang 调试 |

## 仓库快照

```text
mcporter/
├── src/
│   ├── cli.ts                     # CLI 入口
│   ├── index.ts                   # npm 库公共导出（仅 9 行）
│   ├── runtime.ts                 # createRuntime / callOnce
│   ├── server-proxy.ts            # camelCase Proxy + schema 默认
│   ├── config.ts                  # loadServerDefinitions + imports
│   ├── config-schema.ts           # Zod schema (RawEntry / ServerDefinition)
│   ├── config-normalize.ts        # RawEntry → ServerDefinition
│   ├── config/
│   │   ├── path-discovery.ts
│   │   ├── read-config.ts
│   │   └── imports/external.ts    # Cursor / Claude / Codex / VSCode 解析
│   ├── runtime/
│   │   ├── transport.ts           # StreamableHTTP→SSE 回退、stdio
│   │   ├── oauth.ts               # connectWithAuth + retry
│   │   ├── errors.ts
│   │   └── utils.ts
│   ├── oauth.ts                   # PersistentOAuthClientProvider
│   ├── oauth-persistence.ts       # Vault + Directory + Composite
│   ├── oauth-vault.ts             # ~/.mcporter/credentials.json
│   ├── daemon/
│   │   ├── host.ts                # Unix socket 守护
│   │   ├── client.ts              # DaemonClient
│   │   ├── runtime-wrapper.ts     # KeepAliveRuntime
│   │   └── protocol.ts            # 私有 JSON 协议
│   ├── lifecycle.ts               # keep-alive 名单
│   ├── tool-filters.ts            # allowedTools/blockedTools
│   ├── result-utils.ts            # CallResult helpers
│   ├── error-classifier.ts        # auth/offline/http/stdio-exit/other
│   ├── sdk-patches.ts             # StdioClientTransport.close 修补
│   ├── generate-cli.ts            # generate-cli 主流程
│   └── cli/                       # 所有命令 handler + generate 子模块
├── tests/                         # Vitest × 106 测试（含 fixtures + live）
├── docs/                          # adhoc/call-syntax/daemon/mcp 等专题
├── scripts/                       # build-bun / test-runner / generate-json-schema
├── config/mcporter.json           # 默认 project 配置位置
└── .github/workflows/ci.yml       # Linux + macOS + Windows × Node 24
```

## 核心入口

| 角色 | 入口 | 备注 |
|------|------|------|
| 库使用者 | [`createRuntime`](../mcporter/repos/mcporter/src/runtime.ts), [`createServerProxy`](../mcporter/repos/mcporter/src/server-proxy.ts), [`callOnce`](../mcporter/repos/mcporter/src/runtime.ts) | 仅 9 行 `src/index.ts` 导出 |
| CLI 使用者 | `mcporter` 二进制（`bin/mcporter` → `dist/cli.js`） | 命令路由见 [src/cli.ts](../mcporter/repos/mcporter/src/cli.ts) |
| 配置作者 | `config/mcporter.json` 或 `~/.mcporter/mcporter.json{,c}` | schema 见 [src/config-schema.ts](../mcporter/repos/mcporter/src/config-schema.ts) |
| 守护进程 | `mcporter daemon start/status/stop/restart` | 协议见 [src/daemon/protocol.ts](../mcporter/repos/mcporter/src/daemon/protocol.ts) |
| 代码生成 | `mcporter generate-cli` / `mcporter emit-ts` / `mcporter inspect-cli` | 入口在 [src/generate-cli.ts](../mcporter/repos/mcporter/src/generate-cli.ts) 与 [src/cli/emit-ts-command.ts](../mcporter/repos/mcporter/src/cli/emit-ts-command.ts) |

## 快速导航

- **想了解 mcporter 是什么？** → [项目概览](pages/overview.md)
- **想理解整体设计？** → [系统架构](pages/system-architecture.md)
- **想嵌入到自己的 Agent / 脚本？** → [运行时与传输层](pages/runtime-transport.md) + [CLI 命令体系](pages/cli-commands.md)
- **想用 `mcporter call` 调工具？** → [调用语法、自动纠错与临时服务器](pages/call-syntax.md)
- **想生成单文件 CLI 或 .d.ts？** → [代码生成](pages/code-generation.md)
- **想接入 chrome-devtools / mobile-mcp？** → [Keep-Alive 守护进程](pages/daemon.md)
- **想理解 OAuth 流程？** → [OAuth 流程与凭证仓库](pages/oauth.md)
- **想调试 hang / flake / Node fd 泄漏？** → [测试、CI 与可观测性](pages/testing-ci.md)

## 关键事实速查

- **Node 版本**：要求 Node ≥ 24（`package.json:engines.node`），CI 不再回测 22。
- **包管理**：pnpm 10.33.2，CI `--frozen-lockfile`。
- **MCP SDK**：`@modelcontextprotocol/sdk ^1.29.0`，三种 Transport：StreamableHTTP / SSE / stdio。
- **公共 API**：`src/index.ts` 仅 9 行，全部导出来自 `runtime.ts` / `config.ts` / `result-utils.ts` / `server-proxy.ts`。
- **Daemon 名单**：默认 `chrome-devtools / mobile-mcp / playwright`，环境变量 `MCPORTER_KEEPALIVE` / `MCPORTER_DISABLE_KEEPALIVE` 可覆盖。
- **OAuth 持久化**：默认 `~/.mcporter/credentials.json` vault；`tokenCacheDir` 可叠加目录式仓库；老路径自动 migrate。
- **强制退出**：CLI 默认 `process.exit(0)` 收尾，`MCPORTER_NO_FORCE_EXIT=1` 关闭以排查 stdio hang。

## 可继续追问的主题

- `<runtime / OAuth>`：当远端只接受静态 bearer 时如何与 vault token 共存？阅读 [src/runtime/transport.ts](../mcporter/repos/mcporter/src/runtime/transport.ts) 的 `applyCachedOAuthHeaderIfAvailable` 与 `removeAuthorizationHeader`。
- `<daemon / lifecycle>`：自定义 keep-alive 服务器的合理 `idleTimeoutMs` 怎么估？读 [src/daemon/request-utils.ts](../mcporter/repos/mcporter/src/daemon/request-utils.ts) 的 `evictIdleServers` 与 [src/lifecycle.ts](../mcporter/repos/mcporter/src/lifecycle.ts) 的 env override 策略。
- `<config / imports>`：当 Cursor 改了配置但 mcporter 没生效，如何定位？看 [src/config.ts](../mcporter/repos/mcporter/src/config.ts) 的 `merged.sources` 与 `--verbose` / `--sources`。
- `<generate-cli / metadata>`：把生成的 CLI 重新发布给团队后，如何升级而不丢历史选项？读 [src/cli-metadata.ts](../mcporter/repos/mcporter/src/cli-metadata.ts) 的 `__mcporter_inspect` 协议与 `inspect-cli`。
- `<call-syntax / 自动纠错>`：mcporter 怎么决定用什么阈值自动纠正名字？阅读 [src/cli/identifier-helpers.ts](../mcporter/repos/mcporter/src/cli/identifier-helpers.ts) 的 `AUTO_THRESHOLD_RATIO/MIN`。

## 来源

- 仓库：&lt;https://github.com/steipete/mcporter.git&gt;
- 分支：`main`
- 提交：`324fb7a00edc6fa4eacf1deeb4ac33a2a7341c09`（"build: require node 24 and tsgo"）
- 本地路径：`/Users/bytedance/workspace/deepwiki/project-repos/mcporter`
- 输出根：`/Users/bytedance/workspace/deepwiki/mcporter`
- 生成时间：2026-05-01

未检测到源码内置 skills 目录，因此本 DeepWiki 不包含 `skills/` 翻译树。
