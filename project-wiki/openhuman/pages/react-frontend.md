<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [app/package.json](../../project-repos/openhuman/app/package.json)
- [app/src/services/coreRpcClient.ts](../../project-repos/openhuman/app/src/services/coreRpcClient.ts)

</details>

# React 前端

前端是 **纯展示 + RPC 编排层**：Arco/React 组件、路由、国际化与 E2E 测试覆盖，但不复制 Rust 域逻辑。

## 技术栈

- React + TypeScript + Vite（经 `openhuman-app` 包）
- `@tauri-apps/api` 2.x 调用 native command
- `coreRpcClient.ts` 统一 JSON-RPC 2.0 请求

## coreRpcClient 行为

`callCoreRpc(method, params)` 解析流程：

1. 解析 core URL（`CORE_RPC_URL` / 持久化配置）
2. 桌面模式经 Tauri relay 或直连 HTTP
3. 附带 bearer token（`getStoredCoreToken`）
4. 超时默认 30s，慢 RPC 可 per-call override（如 `app_state_snapshot`）

iOS/remote profile 可通过 `setActiveCoreTransport` 切换 `CoreTransport`，同一 API 面多端复用。

## 目录要点

| 路径 | 作用 |
|------|------|
| `app/src/screens/` | 主功能页面 |
| `app/src/components/channels/` | 通道配置 UI |
| `app/src/utils/tauriCommands/` | 按域封装 RPC |
| `app/src/chat/` | 对话与 prompt injection guard |

**Insight**：`normalizeRpcMethod` 与后端 controller 注册表对齐——前端方法字符串是稳定契约，重构 Rust 内部模块不应改 method 名。

## 相关页面

- [JSON-RPC 通信桥](json-rpc-bridge.md)
- [Tauri 桌面壳层](tauri-shell.md)
- [消息通道](channels-messaging.md)

Sources: [app/package.json:1-80](../../../project-repos/openhuman/app/package.json#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `app/package.json:1-80`

```json
{
  "name": "openhuman-app",
  "version": "0.57.3",
  "type": "module",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "dev": "vite",
    "dev:web": "vite",
    "dev:app": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && bash ../scripts/setup-chromium-safe-storage.sh && source ../scripts/load-dotenv.sh && APPLE_SIGNING_IDENTITY='OpenHuman Dev Signer' cargo tauri dev",
    "dev:app:win": "\"C:/Program Files/Git/bin/bash.exe\" ../scripts/run-dev-win.sh",
    "dev:cef": "pnpm dev:app",
    "dev:wry": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-dotenv.sh && cargo tauri dev --no-default-features --features wry",
    "core:stage": "echo '[core:stage] no-op — core is linked in-process; sidecar removed (PR #1061)'",
    "tauri:ensure": "bash ../scripts/ensure-tauri-cli.sh",
    "tauri:ios:init": "bash ../scripts/ios-init.sh",
    "tauri:ios:dev": "cd src-tauri-mobile && IPHONEOS_DEPLOYMENT_TARGET=${IPHONEOS_DEPLOYMENT_TARGET:-16.0} npx --package=@tauri-apps/cli@^2 tauri ios dev",
    "tauri:ios:build": "cd src-tauri-mobile && IPHONEOS_DEPLOYMENT_TARGET=${IPHONEOS_DEPLOYMENT_TARGET:-16.0} npx --package=@tauri-apps/cli@^2 tauri ios build",
    "tauri:android:init": "bash ../scripts/android-init.sh",
    "tauri:android:dev": "cd src-tauri-mobile && npx --package=@tauri-apps/cli@^2 tauri android dev",
    "tauri:android:build": "cd src-tauri-mobile && npx --package=@tauri-apps/cli@^2 tauri android build",
    "build": "tsc && vite build",
    "build:app": "tsc && vite build",
    "build:app:e2e": "tsc && vite build --mode development",
    "build:web:e2e": "bash ./scripts/e2e-web-build.sh",
    "build:web": "cross-env VITE_OPENHUMAN_TARGET=web tsc && cross-env VITE_OPENHUMAN_TARGET=web vite build",
    "compile": "tsc --noEmit",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:build:ui": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && cargo tauri build -- --bin OpenHuman",
    "macos:build:intel": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-dotenv.sh && cargo tauri build --bundles app dmg --target x86_64-apple-darwin -- --bin OpenHuman",
    "macos:build:intel:debug": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-dotenv.sh && cargo tauri build --debug --bundles app dmg --target x86_64-apple-darwin -- --bin OpenHuman",
    "macos:build:debug": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-dotenv.sh && cargo tauri build --debug --bundles app dmg -- --bin OpenHuman",
    "macos:build:release": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-dotenv.sh && cargo tauri build --bundles app dmg -- --bin OpenHuman",
    "macos:build:release:signed": "pnpm tauri:ensure && export CEF_PATH=\"$HOME/Library/Caches/tauri-cef\" && source ../scripts/load-env.sh && cargo tauri build --bundles app dmg -- --bin OpenHuman",
    "macos:build:sign:release": "pnpm macos:build:release:signed",
    "macos:run": "open '../target/debug/bundle/macos/OpenHuman.app'",
    "macos:dev": "pnpm macos:build:debug && open '../target/debug/bundle/macos/OpenHuman.app'",
    "test": "vitest run --config test/vitest.config.ts",
    "test:unit": "vitest run --config test/vitest.config.ts",
    "test:unit:watch": "vitest --config test/vitest.config.ts",
    "test:watch": "vitest --config test/vitest.config.ts",
    "test:coverage": "vitest run --config test/vitest.config.ts --coverage",
    "test:rust": "bash ../scripts/test-rust-with-mock.sh",
    "test:e2e:build": "bash ./scripts/e2e-build.sh",
    "test:e2e:web:build": "bash ./scripts/e2e-web-build.sh",
    "test:e2e:web": "pnpm test:e2e:web:build && bash ./scripts/e2e-web-session.sh",
    "test:e2e:mega": "pnpm test:e2e:build && bash ./scripts/e2e-run-spec.sh test/e2e/specs/mega-flow.spec.ts mega-flow",
    "test:e2e:login": "bash ./scripts/e2e-login.sh",
    "test:e2e:auth": "bash ./scripts/e2e-auth.sh",
    "test:e2e:service-connectivity": "OPENHUMAN_SERVICE_MOCK=1 bash ./scripts/e2e-run-spec.sh test/e2e/specs/service-connectivity-flow.spec.ts service-connectivity",
    "test:e2e:skills-registry": "bash ./scripts/e2e-run-spec.sh test/e2e/specs/skills-registry.spec.ts skills-registry",
    "test:e2e:cron-jobs": "bash ./scripts/e2e-run-spec.sh test/e2e/specs/cron-jobs-flow.spec.ts cron-jobs",
    "test:e2e": "pnpm test:e2e:web && pnpm test:e2e:mega",
    "test:e2e:all:flows": "bash ./scripts/e2e-run-all-flows.sh",
    "test:e2e:all": "pnpm test:e2e:web && pnpm test:e2e:all:flows",
    "test:e2e:session": "bash ./scripts/e2e-run-session.sh",
    "test:e2e:session:full": "pnpm test:e2e:build && pnpm test:e2e:session",
    "test:all": "pnpm test:coverage && pnpm test:rust && pnpm test:e2e",
    "rust:check": "cargo check --manifest-path src-tauri/Cargo.toml",
    "rust:format": "cargo fmt --manifest-path ../Cargo.toml --all && cargo fmt --manifest-path src-tauri/Cargo.toml --all",
    "rust:format:check": "cargo fmt --manifest-path ../Cargo.toml --all --check && cargo fmt --manifest-path src-tauri/Cargo.toml --all --check",
    "rust:clippy": "cargo clippy -p openhuman -- -D warnings",
    "format": "prettier --write . && pnpm rust:format",
    "format:check": "prettier --check . && pnpm rust:format:check",
    "lint": "eslint . --ext .ts,.tsx --cache",
    "lint:fix": "eslint . --ext .ts,.tsx --fix --cache",
    "lint:commands-tokens": "bash -c 'command -v rg >/dev/null 2>&1 || { echo \"lint:commands-tokens requires ripgrep. Install: brew install ripgrep (macOS) / apt install ripgrep (Debian/Ubuntu) / see https://github.com/BurntSushi/ripgrep#installation\" >&2; exit 1; }; ! rg -nU \"(bg|text|border|ring|shadow)-(neutral|primary|sage|amber|canvas|stone|slate)\" src/components/commands/'",
    "knip": "knip --config knip.json",
    "knip:production": "knip --config knip.json --production"
  },
  "dependencies": {
    "@noble/ciphers": "^1.2.1",
    "@noble/curves": "^2.2.0",
    "@noble/hashes": "^2.0.1",
    "@noble/secp256k1": "^3.0.0",
    "@radix-ui/react-dialog": "^1.1.15",
    "@reduxjs/toolkit": "^2.11.2",
    "@remotion/player": "4.0.454",
```

<!-- source-snippets:end -->
</details>
