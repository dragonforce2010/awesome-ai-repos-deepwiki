<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [app/src-tauri/Cargo.toml](../../project-repos/openhuman/app/src-tauri/Cargo.toml)
- [gitbooks/developing/architecture/README.md](../../project-repos/openhuman/gitbooks/developing/architecture/README.md)

</details>

# Tauri 桌面壳层

Tauri v2 是 OpenHuman 的 **OS 集成层**：窗口、托盘、自动更新、CEF 子 WebView，以及 Rust core 的启动/健康检查。

桌面构建位于 `app/src-tauri/`（另有 `src-tauri-mobile` 面向 iOS/Android）。根 `Cargo.toml` 定义 `openhuman-core` 二进制；Tauri 通过 `CoreProcessHandle` 在同一进程或受控生命周期内托管 core HTTP 服务。

## 壳层职责

| 职责 | 典型位置 | 说明 |
|------|----------|------|
| 窗口与路由 | Tauri + React | 前端路由，非业务 |
| Core 令牌 | `invoke('core_rpc_token')` | 桌面 bearer 内存持有，不写 env |
| CEF WebView | 集成 OAuth | Gmail 等需浏览器登录态 |
| Sidecar 生命周期 | core 启停 | 与 UI boot gate 联动 |
| 打包发布 | `.github/workflows/build*.yml` | dmg/deb/msi/AppImage |

**Insight**：安全审计文档指出桌面 bearer 在 `CoreProcessHandle::new()` 生成，经 `run_server_embedded_with_ready` 注入嵌入式 server——与 CLI/Docker 读 `OPENHUMAN_CORE_TOKEN` 或 `core.token` 文件的路径刻意分离，减少 token 泄露到子进程环境。

## 与核心的边界

壳层 **不应** 实现 Memory Tree 逻辑或工具执行。任何"在 Tauri command 里直接调 SQLite"的反模式都应视为架构违规——UI 一律走 JSON-RPC 方法命名空间。

## 相关页面

- [系统架构](system-architecture.md)
- [JSON-RPC 通信桥](json-rpc-bridge.md)
- [React 前端](react-frontend.md)

Sources: [app/src-tauri/Cargo.toml:1-80](../../../project-repos/openhuman/app/src-tauri/Cargo.toml#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `app/src-tauri/Cargo.toml:1-80`

```toml
[package]
name = "OpenHuman"
version = "0.57.3"
description = "OpenHuman - AI-powered Super Assistant"
authors = ["OpenHuman"]
edition = "2021"
default-run = "OpenHuman"
autobins = false

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[lib]
# The `_lib` suffix may seem redundant but it is necessary
# to make the lib name unique and wouldn't conflict with the bin name.
# This seems to be only an issue on Windows, see https://github.com/rust-lang/cargo/issues/8519
name = "openhuman"
crate-type = ["staticlib", "cdylib", "rlib"]

[[bin]]
name = "OpenHuman"
path = "src/main.rs"

[build-dependencies]
tauri-build = { version = "2", features = [] }
serde_json = "1"

[dependencies]
# Tauri core and plugins.
#
# The only supported runtime is CEF (Chromium Embedded Framework) via
# `tauri-runtime-cef` — CI builds, release installers, and local `cargo tauri
# dev` all run against CEF. The `[patch.crates-io]` block at the bottom of this
# file pins every tauri crate and plugin to the `feat/cef` branch on github so
# CEF symbols are in scope, and `cef-dll-sys`'s build script auto-downloads the
# Chromium runtime for the current target on first build.
tauri = { version = "2.10", default-features = false, features = [
    "cef",
    "common-controls-v6",
    "devtools",
    "macos-private-api",
    "tray-icon",
    "unstable",
    "webview-data-url",
] }
tauri-plugin-deep-link = "2.0.0"
tauri-plugin-global-shortcut = "2"
tauri-plugin-notification = { path = "vendor/tauri-plugin-notification" }
tauri-plugin-opener = "2"
# Prevents a second launch from racing into CEF init and hitting the
# `cef::initialize(...) != 1` cache-lock panic seen in production
# (Sentry OPENHUMAN-TAURI-A). The plugin acquires a per-identifier
# lock before any tauri::Builder work happens, so the secondary
# process exits cleanly after handing its argv to the primary. The `deep-link`
# feature forwards second-launch deep-link payloads to the primary instance on
# Windows/Linux, which is required for hot-instance OAuth callbacks.
tauri-plugin-single-instance = { version = "2", features = ["deep-link"] }
# Auto-update for the Tauri shell itself. The core sidecar already has its own
# updater (see `core_update.rs`); this plugin handles the .app/.exe/.AppImage
# bundle. Both are needed because shipping a new RPC method requires both
# pieces in lockstep, and on macOS the .app bundle is what carries TCC grants.
tauri-plugin-updater = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"
directories = "5"
# Used by gmail/cdp_fetch for decoding binary IO.read chunks. Base64 is
# only emitted by CDP IO.read when the stream contains non-UTF-8 bytes,
# but we opt into the feature to stay robust against unexpected responses.
base64 = "0.22"
tokio = { version = "1", features = ["rt-multi-thread", "process", "sync", "time", "net"] }
tokio-util = { version = "0.7", features = ["rt"] }
# WebSocket client + server for two uses:
# - Client: Chrome DevTools Protocol connections to the embedded CEF
#   instance over `--remote-debugging-port=9222` (IndexedDB reads,
#   `Runtime.evaluate` for the WhatsApp recipe, DOMSnapshot / Network
#   calls for the Gmail connector).
# - Server: the `webview_apis` bridge at 127.0.0.1 that accepts
#   JSON-RPC frames from the core sidecar so core-side handlers can
#   reach the live-webview connectors via CDP.
tokio-tungstenite = { version = "0.24", default-features = false, features = ["connect", "handshake"] }
```

<!-- source-snippets:end -->
</details>
