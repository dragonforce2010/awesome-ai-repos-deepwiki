# OpenCut DeepWiki 导出

- 仓库: https://github.com/opencut-app/opencut
- 提交: d1f4cb615b7fe5e08628119fceec075fbb5044a7

## 目录

- [项目概览](pages/overview.md)
- [仓库地图与阅读路线](pages/repository-map.md)
- [系统架构](pages/system-architecture.md)
- [Web 应用（Next.js）](pages/web-nextjs-stack.md)
- [Rust 工作区与 WASM 导出](pages/rust-wasm-bridge.md)
- [桌面端（GPUI）](pages/desktop-gpui.md)
- [GPU 渲染、特效与预览](pages/gpu-effects-preview.md)
- [时间线、重定时与更新管线](pages/timeline-update-pipeline.md)
- [本地存储与版本迁移](pages/storage-migrations.md)
- [服务端、认证与数据层](pages/server-auth-data.md)
- [CI、Docker 与发布](pages/ci-docker-deploy.md)

---

<!-- page: overview -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](../../../project-repos/opencut/README.md)
- [package.json](../../../project-repos/opencut/package.json)
- [AGENTS.md](../../../project-repos/opencut/AGENTS.md)
- [Cargo.toml](../../../project-repos/opencut/Cargo.toml)
- [turbo.json](../../../project-repos/opencut/turbo.json)

</details>

# 项目概览

OpenCut 定位为**免费、开源**的视频编辑器，覆盖 **Web、桌面与移动**方向；当前仓库以 `apps/web` 的 Next.js 应用为主力，同时在 `rust/` 中沉淀跨平台核心逻辑，并通过 **WebAssembly** 暴露给浏览器。

README 将动机归纳为隐私（素材留在本地）、对标常见商业剪辑器的免费能力，以及「简单易用」的产品取向。工程上，官方明确 **Bun** 为包管理与脚本运行时，并推荐用 **Docker Compose** 拉起 Postgres 与 Redis（也可仅做前端时跳过）。

```mermaid
graph TD
  User["用户"] --> Web["apps/web Next.js"]
  User --> Desktop["apps/desktop GPUI 进行中"]
  Web --> Wasm["opencut-wasm 包"]
  Desktop --> RustCrates["rust/crates 原生依赖"]
  Wasm --> RustCrates
```

## 仓库与脚本入口

根 `package.json` 使用 **Turborepo** 任务编排：`dev:web` 过滤 `@opencut/web`，`build:wasm` 调用 `wasm-pack` 构建 `rust/wasm`，`dev:wasm` 用 `cargo-watch` 监听 Rust 变更。工作区声明为 `apps/*` 与 `packages/*`，与 README 中的「`apps/web` Web、`apps/desktop` 桌面、`rust/` 核心」叙述一致。

## 贡献焦点与边界

README 的 Contributing 段落列出**欢迎**与**暂时避免**的区域：时间线、项目管理、性能、Bug 与预览面板外的 UI 改进属于优先；预览面板增强与导出相关重构被标记为进行中，官方建议暂缓大改以免与「新的二进制渲染路径」冲突。

## 架构阅读顺序

`AGENTS.md` 用极短篇幅定义了长期迁移方向：**所有非 UI 逻辑以 `rust/` 为单一真源**，各 `apps/*` 只做交互与平台适配。阅读本 Wiki 时建议先建立该心智模型，再进入 Web 栈、GPU 与时间线页面。

Sources: [README.md:25-36](../../../project-repos/opencut/README.md#L25-L36), [package.json:1-23](../../../project-repos/opencut/package.json#L1-L23), [AGENTS.md:1-17](../../../project-repos/opencut/AGENTS.md#L1-L17)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:25-36`

```markdown
## Why?

- **Privacy**: Your videos stay on your device
- **Free features**: Most basic CapCut features are now paywalled 
- **Simple**: People want editors that are easy to use - CapCut proved that

## Project Structure

- `apps/web/`: Next.js web application
- `apps/desktop/`: Native desktop app built with GPUI (in progress)
- `rust/`: Platform-agnostic core: GPU compositor, effects, masks, and WASM bindings. We're actively migrating business logic here from TypeScript.
- `docs/`: Architecture and subsystem documentation
```

#### `package.json:1-23`

```json
{
  "name": "opencut",
  "packageManager": "bun@1.2.18",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build:tools": "turbo run build --filter=@opencut/tools",
    "build:wasm": "wasm-pack build rust/wasm --target bundler --out-dir pkg",
    "build:web": "turbo run build --filter=@opencut/web",
    "deploy:web": "turbo run deploy --filter=@opencut/web",
    "dev:tools": "turbo run dev --filter=@opencut/tools",
    "dev:wasm": "cargo watch -w rust/crates -w rust/wasm/src -s 'wasm-pack build rust/wasm --target bundler --out-dir pkg'",
    "dev:web": "turbo run dev --filter=@opencut/web",
    "format:web": "prettier apps/web/src/services/renderer --write",
    "generate:fonts": "npx tsx apps/web/scripts/generate-font-sprites.ts",
    "lint:web": "eslint apps/web/src --ext .ts,.tsx",
    "lint:web:fix": "eslint apps/web/src --ext .ts,.tsx --fix",
    "preview:web": "turbo run preview --filter=@opencut/web",
    "publish:wasm": "bun run build:wasm && npm publish rust/wasm/pkg --access public",
    "start:tools": "turbo run start --filter=@opencut/tools",
    "test": "bun test"
```

#### `AGENTS.md:1-17`

```markdown
# Agents.md

## Architecture

An ongoing migration is moving all business logic into `rust/`. Each app under `apps/` is a UI shell — it owns rendering, interaction, and platform-specific concerns, but never owns logic. The UI framework for any given app is a replaceable detail.

### `rust/`

The single source of truth for all non-UI code. Everything platform-agnostic belongs here: no components, no hooks, no framework imports.

### `apps/`

Each app is a frontend that calls into Rust. Logic is never duplicated between apps — only UI is, because each platform may use an entirely different framework and language to build it.

- `web/` — Next.js
- `desktop/` — GPUI

```

<!-- source-snippets:end -->
</details>
## 相关页面

- [仓库地图与阅读路线](repository-map.md)
- [系统架构](system-architecture.md)
- [CI、Docker 与发布](ci-docker-deploy.md)

---

<!-- page: repository-map -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](../../../project-repos/opencut/README.md)
- [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json)
- [apps/desktop/Cargo.toml](../../../project-repos/opencut/apps/desktop/Cargo.toml)
- [rust/README.md](../../../project-repos/opencut/rust/README.md)
- [docs/effects-renderer.md](../../../project-repos/opencut/docs/effects-renderer.md)

</details>

# 仓库地图与阅读路线

本页把顶层目录映射到**日常开发任务**，便于新贡献者选择阅读路径。

## 顶层目录职责

README 的「Project Structure」小节给出官方划分：`apps/web` 为 Next.js；`apps/desktop` 为 **GPUI** 原生壳；`rust/` 为与平台无关的核心（GPU 合成、特效、蒙版等），并强调业务逻辑正从 TypeScript **迁移**到 Rust；`docs/` 存放子系统说明（特效渲染、关键帧、动作等）。

```mermaid
graph TD
  Root["仓库根"] --> Apps["apps/"]
  Root --> RustDir["rust/"]
  Root --> Docs["docs/"]
  Apps --> WebPkg["web: Next 主应用"]
  Apps --> DesktopPkg["desktop: GPUI"]
  RustDir --> Crates["crates: gpu effects masks ..."]
  RustDir --> WasmPkg["wasm: JS 绑定产物"]
```

## Web 应用包清单

`apps/web/package.json` 将包名设为 `@opencut/web`，脚本包含 `next dev --turbopack`、`next build`、以及 **OpenNext Cloudflare** 的 `preview` 与 `deploy`。依赖侧同时出现 `drizzle-orm`、`better-auth`、`@upstash/redis` 与 `opencut-wasm`，说明该应用同时承担**编辑器前端、服务端数据面与边缘部署**相关职责。

## 桌面与 Rust 工作区

`apps/desktop/Cargo.toml` 将二进制命名为 `opencut`，依赖 **gpui** 固定小版本。根 `Cargo.toml` 的 `members` 列表把 `apps/desktop` 与多个 `rust/crates/*` 及 `rust/wasm` 纳入同一 workspace，与 `rust/README.md` 中「Web 经 WASM、桌面直接依赖 crate」的描述一致。

## 推荐阅读顺序

1. 先读 `AGENTS.md` 与 [系统架构](system-architecture.md) 理解「逻辑在 Rust、UI 在 apps」。
2. 若要改界面与路由： [Web 应用（Next.js）](web-nextjs-stack.md)。
3. 若要改特效或预览 GPU：`docs/effects-renderer.md` 与 [GPU 渲染、特效与预览](gpu-effects-preview.md)。
4. 若要改时间线语义：`docs/keyframes.md` 与 [时间线、重定时与更新管线](timeline-update-pipeline.md)。

Sources: [README.md:31-36](../../../project-repos/opencut/README.md#L31-L36), [apps/web/package.json:1-19](../../../project-repos/opencut/apps/web/package.json#L1-L19), [apps/desktop/Cargo.toml:1-12](../../../project-repos/opencut/apps/desktop/Cargo.toml#L1-L12), [rust/README.md:1-35](../../../project-repos/opencut/rust/README.md#L1-L35)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:31-36`

```markdown
## Project Structure

- `apps/web/`: Next.js web application
- `apps/desktop/`: Native desktop app built with GPUI (in progress)
- `rust/`: Platform-agnostic core: GPU compositor, effects, masks, and WASM bindings. We're actively migrating business logic here from TypeScript.
- `docs/`: Architecture and subsystem documentation
```

#### `apps/web/package.json:1-19`

```json
{
  "name": "@opencut/web",
  "version": "0.1.0",
  "private": true,
  "packageManager": "bun@1.2.18",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier src --write",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push:local": "cross-env NODE_ENV=development drizzle-kit push",
    "db:push:prod": "cross-env NODE_ENV=production drizzle-kit push"
  },
```

#### `apps/desktop/Cargo.toml:1-12`

```toml
[package]
name = "opencut-desktop"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "opencut"
path = "src/main.rs"

[dependencies]
gpui = "0.2.2"
```

#### `rust/README.md:1-35`

````markdown
# rust/

Shared Rust crates that power OpenCut across platforms (web via WASM, desktop natively).

## Adding a new crate

1. Create it under `rust/crates/`
2. Add `bridge` as a dependency
3. Annotate public functions with `#[export]`

## How `#[export]` works

```rust
use bridge::export;

#[export]
pub fn round_to_frame(time: f64, fps: f64) -> f64 {
    (time * fps).round() / fps
}
```

Without the `wasm` feature, the macro is a no-op. With `--features wasm`, it expands to:

```rust
#[wasm_bindgen(js_name = "roundToFrame")]
pub fn round_to_frame(time: f64, fps: f64) -> f64 { ... }
```

Desktop uses the crates directly as Cargo dependencies.

## Testing

```bash
cargo test -p <crate>
```
````

<!-- source-snippets:end -->
</details>
## 相关页面

- [项目概览](overview.md)
- [Web 应用（Next.js）](web-nextjs-stack.md)
- [Rust 工作区与 WASM 导出](rust-wasm-bridge.md)

---

<!-- page: system-architecture -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [AGENTS.md](../../../project-repos/opencut/AGENTS.md)
- [Cargo.toml](../../../project-repos/opencut/Cargo.toml)
- [package.json](../../../project-repos/opencut/package.json)
- [apps/web/src/services/renderer/gpu-renderer.ts](../../../project-repos/opencut/apps/web/src/services/renderer/gpu-renderer.ts)
- [docker-compose.yml](../../../project-repos/opencut/docker-compose.yml)

</details>

# 系统架构

OpenCut 的长期架构目标在 `AGENTS.md` 中写得很直白：**所有业务逻辑迁入 `rust/`**，`apps/*` 只是可替换 UI 壳；同一逻辑不在多个 app 间复制，只有因平台而异的展示与交互会分叉。

## 逻辑与 UI 的边界

文档将 `rust/` 描述为**唯一非 UI 代码源**（禁止组件、Hook 与框架导入），`apps/` 各自选择框架：`web` 用 Next.js，`desktop` 用 GPUI。该约束解释了为何 Web 侧大量「编排型」代码仍位于 TypeScript（例如特效参数 UI、时间线编辑），而数值密集与 GPU 相关路径持续向 **WASM / wgpu** 收敛。

```mermaid
graph TD
  subgraph UI["UI 壳层 apps"]
    WebUI["Next.js 交互与路由"]
    DesktopUI["GPUI 原生窗口"]
  end
  subgraph Core["rust 核心"]
    WasmSurface["wasm 绑定 opencut-wasm"]
    NativeCrates["crates 原生链接"]
  end
  WebUI --> WasmSurface
  DesktopUI --> NativeCrates
  WasmSurface --> NativeCrates
```

## Web 侧如何「下潜」到 Rust

`apps/web/src/services/renderer/gpu-renderer.ts` 从 `opencut-wasm` 引入 `initializeGpu`、`applyEffectPasses` 与 `applyMaskFeather`，在模块级维护 `gpuAvailable` 与一次性 `initPromise`。对外暴露 `initializeGpuRenderer`、`isGpuAvailable` 以及 `gpuRenderer.applyEffect` / `applyMaskFeather`：当 GPU 不可用或 passes 为空时直接返回源 `OffscreenCanvas`，属于典型的**渐进降级**策略。

## 运行拓扑（本地与容器）

`docker-compose.yml` 将 **Postgres 17**、**Redis 7**、`serverless-redis-http` 与基于 `apps/web/Dockerfile` 构建的 `web` 服务置于同一默认网络，并对 db/redis/web 配置健康检查；`web` 服务将容器内 `3000` 映射到宿主 `3100`，与 README「自托管在 3100」一致。该拓扑支撑 Drizzle 所需的关系库与 Upstash 兼容的 HTTP Redis 网关。

Sources: [AGENTS.md:3-16](../../../project-repos/opencut/AGENTS.md#L3-L16), [apps/web/src/services/renderer/gpu-renderer.ts:1-76](../../../project-repos/opencut/apps/web/src/services/renderer/gpu-renderer.ts#L1-L76), [docker-compose.yml:1-78](../../../project-repos/opencut/docker-compose.yml#L1-L78)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `AGENTS.md:3-16`

```markdown
## Architecture

An ongoing migration is moving all business logic into `rust/`. Each app under `apps/` is a UI shell — it owns rendering, interaction, and platform-specific concerns, but never owns logic. The UI framework for any given app is a replaceable detail.

### `rust/`

The single source of truth for all non-UI code. Everything platform-agnostic belongs here: no components, no hooks, no framework imports.

### `apps/`

Each app is a frontend that calls into Rust. Logic is never duplicated between apps — only UI is, because each platform may use an entirely different framework and language to build it.

- `web/` — Next.js
- `desktop/` — GPUI
```

#### `apps/web/src/services/renderer/gpu-renderer.ts:1-76`

```typescript
import {
	applyEffectPasses,
	applyMaskFeather as applyMaskFeatherWasm,
	initializeGpu,
} from "opencut-wasm";
import type { EffectPass, EffectUniformValue } from "@/effects/types";

let gpuAvailable = false;
let initPromise: Promise<void> | null = null;

export function initializeGpuRenderer(): Promise<void> {
	if (!initPromise) {
		initPromise = initializeGpu()
			.then(() => {
				gpuAvailable = true;
			})
			.catch((error: unknown) => {
				gpuAvailable = false;
				const message = error instanceof Error ? error.message : String(error);
				console.warn(`GPU renderer unavailable: ${message}`);
			});
	}
	return initPromise;
}

export function isGpuAvailable(): boolean {
	return gpuAvailable;
}

export const gpuRenderer = {
	applyEffect({
		source,
		width,
		height,
		passes,
	}: {
		source: OffscreenCanvas;
		width: number;
		height: number;
		passes: EffectPass[];
	}): OffscreenCanvas {
		if (passes.length === 0 || !gpuAvailable) {
			return source;
		}

		return applyEffectPasses({
			source,
			width,
			height,
			passes: serializeEffectPasses(passes),
		});
	},

	applyMaskFeather({
		maskCanvas,
		width,
		height,
		feather,
	}: {
		maskCanvas: OffscreenCanvas;
		width: number;
		height: number;
		feather: number;
	}): OffscreenCanvas {
		if (!gpuAvailable) {
			return maskCanvas;
		}

		return applyMaskFeatherWasm({
			mask: maskCanvas,
			width,
			height,
			feather,
		});
	},
};
```

#### `docker-compose.yml:1-78`

```yaml
services:
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: opencut
      POSTGRES_PASSWORD: opencut
      POSTGRES_DB: opencut
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U opencut"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 10s

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 10s

  serverless-redis-http:
    image: hiett/serverless-redis-http:latest
    ports:
      - "8079:80"
    environment:
      SRH_MODE: env
      SRH_TOKEN: example_token
      SRH_CONNECTION_STRING: "redis://redis:6379"
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --spider -q http://127.0.0.1:80 || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 10s

  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      args:
        - FREESOUND_CLIENT_ID=${FREESOUND_CLIENT_ID}
        - FREESOUND_API_KEY=${FREESOUND_API_KEY}
        - NEXT_PUBLIC_MARBLE_API_URL=${NEXT_PUBLIC_MARBLE_API_URL:-https://api.marblecms.com}
        - MARBLE_WORKSPACE_KEY=${MARBLE_WORKSPACE_KEY:-build-placeholder}
    restart: unless-stopped
    ports:
      - "3100:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://opencut:opencut@db:5432/opencut
      - BETTER_AUTH_SECRET=your-production-secret-key-here
      - UPSTASH_REDIS_REST_URL=http://serverless-redis-http:80
      - UPSTASH_REDIS_REST_TOKEN=example_token
      - NEXT_PUBLIC_SITE_URL=http://localhost:3100
      - NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com
      - MARBLE_WORKSPACE_KEY=${MARBLE_WORKSPACE_KEY:-placeholder}
      - FREESOUND_CLIENT_ID=${FREESOUND_CLIENT_ID}
      - FREESOUND_API_KEY=${FREESOUND_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      serverless-redis-http:
        condition: service_healthy
    healthcheck:
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [Rust 工作区与 WASM 导出](rust-wasm-bridge.md)
- [Web 应用（Next.js）](web-nextjs-stack.md)
- [GPU 渲染、特效与预览](gpu-effects-preview.md)

---

<!-- page: web-nextjs-stack -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json)
- [apps/web/src/env/web.ts](../../../project-repos/opencut/apps/web/src/env/web.ts)
- [apps/web/src/app/layout.tsx](../../../project-repos/opencut/apps/web/src/app/layout.tsx)
- [apps/web/next.config.ts](../../../project-repos/opencut/apps/web/next.config.ts)
- [apps/web/open-next.config.ts](../../../project-repos/opencut/apps/web/open-next.config.ts)

</details>

# Web 应用（Next.js）

`apps/web` 是 OpenCut 的主工程：Next **16.1.x**、React 19、Tailwind 4，并通过 **OpenNext Cloudflare** 扩展部署路径；同一包内集成 **Drizzle**、**better-auth** 与 **Upstash Redis** 相关依赖。

## 脚本与构建产物

`package.json` 中 `dev` 使用 `next dev --turbopack`；`build` 为标准 `next build`；`preview` 与 `deploy` 均先执行 `opennextjs-cloudflare build` 再调用对应子命令。数据库相关脚本使用 `drizzle-kit` 的 `generate` / `migrate` / `push`，并通过 `cross-env` 区分 `NODE_ENV`。

## 环境变量契约

`src/env/web.ts` 使用 **zod** 在启动期解析 `process.env`：强制校验 `DATABASE_URL` 以 `postgres://` 或 `postgresql://` 开头、`BETTER_AUTH_SECRET` 非空字符串、Upstash 的 URL 与 token、以及 `NEXT_PUBLIC_MARBLE_API_URL` 等站点与 CMS 相关变量。`NEXT_PUBLIC_SITE_URL` 默认为 `http://localhost:3000`。这解释了为何 Docker 构建阶段需要为 zod 提供「桩」环境变量（见 Dockerfile 页）。

## 根布局与观测脚本

`src/app/layout.tsx` 组合 `ThemeProvider`（`next-themes`）、`TooltipProvider`、`Toaster`，并在 `development` 下注入 `react-scan`；生产路径包含 **BotId** 客户端与 **Databuddy** 分析脚本（开发环境通过 `webEnv.NODE_ENV` 禁用部分追踪）。`metadata` 由 `baseMetaData` 导出。`next.config.ts` 启用 `reactStrictMode`、`productionBrowserSourceMaps` 与 `output: "standalone"`，与多阶段 Docker 镜像中复制 `.next/standalone` 的做法一致。

```mermaid
graph TD
  Req["HTTP 请求"] --> Next["Next.js App Router"]
  Next --> EnvGate["web.ts zod 环境校验"]
  Next --> RSC["布局与页面树"]
  RSC --> Client["客户端组件与编辑器"]
  Client --> Wasm["opencut-wasm GPU 初始化"]
```

Sources: [apps/web/package.json:6-19](../../../project-repos/opencut/apps/web/package.json#L6-L19), [apps/web/src/env/web.ts:1-30](../../../project-repos/opencut/apps/web/src/env/web.ts#L1-L30), [apps/web/src/app/layout.tsx:14-66](../../../project-repos/opencut/apps/web/src/app/layout.tsx#L14-L66), [apps/web/next.config.ts:5-12](../../../project-repos/opencut/apps/web/next.config.ts#L5-L12)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/web/package.json:6-19`

```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier src --write",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push:local": "cross-env NODE_ENV=development drizzle-kit push",
    "db:push:prod": "cross-env NODE_ENV=production drizzle-kit push"
  },
```

#### `apps/web/src/env/web.ts:1-30`

```typescript
import { z } from "zod";

const webEnvSchema = z.object({
	// Node
	NODE_ENV: z.enum(["development", "production", "test"]),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

	// Public
	NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z.url(),

	// Server
	DATABASE_URL: z.string().refine(
		(url) =>
			url.startsWith("postgres://") || url.startsWith("postgresql://"),
		"DATABASE_URL must be a postgres:// or postgresql:// URL",
	),

	BETTER_AUTH_SECRET: z.string(),
	UPSTASH_REDIS_REST_URL: z.url(),
	UPSTASH_REDIS_REST_TOKEN: z.string(),
	MARBLE_WORKSPACE_KEY: z.string(),
	FREESOUND_CLIENT_ID: z.string(),
	FREESOUND_API_KEY: z.string(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
```

#### `apps/web/src/app/layout.tsx:14-66`

```tsx
export const metadata = baseMetaData;

const protectedRoutes = [
	{
		path: "/none",
		method: "GET",
	},
];

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<BotIdClient protect={protectedRoutes} />
				{process.env.NODE_ENV === "development" && (
					<>
						<Script
							src="//unpkg.com/react-scan/dist/auto.global.js"
							crossOrigin="anonymous"
							strategy="beforeInteractive"
						/>
					</>
				)}
			</head>
			<body className={`${siteFont.className} font-sans antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					disableTransitionOnChange={true}
				>
					<TooltipProvider>
						<Toaster />
						<Script
							src="https://cdn.databuddy.cc/databuddy.js"
							strategy="afterInteractive"
							async
							data-client-id="UP-Wcoy5arxFeK7oyjMMZ"
							data-disabled={webEnv.NODE_ENV === "development"}
							data-track-attributes={false}
							data-track-errors={true}
							data-track-outgoing-links={false}
							data-track-web-vitals={false}
							data-track-sessions={false}
						/>
						{children}
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
```

#### `apps/web/next.config.ts:5-12`

```typescript
const nextConfig: NextConfig = {
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	reactStrictMode: true,
	productionBrowserSourceMaps: true,
	output: "standalone",
	images: {
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [GPU 渲染、特效与预览](gpu-effects-preview.md)
- [服务端、认证与数据层](server-auth-data.md)
- [CI、Docker 与发布](ci-docker-deploy.md)

---

<!-- page: rust-wasm-bridge -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [Cargo.toml](../../../project-repos/opencut/Cargo.toml)
- [rust/README.md](../../../project-repos/opencut/rust/README.md)
- [rust/wasm/README.md](../../../project-repos/opencut/rust/wasm/README.md)
- [rust/crates/bridge/src/bridge.rs](../../../project-repos/opencut/rust/crates/bridge/src/bridge.rs)
- [package.json](../../../project-repos/opencut/package.json)

</details>

# Rust 工作区与 WASM 导出

根 `Cargo.toml` 将 **resolver = "2"** 并列出 workspace members：`apps/desktop`、多个 `rust/crates/*` 子包以及 `rust/wasm`。这与 `rust/README.md` 的描述一致：共享 crate 同时服务 **WASM 绑定**与 **桌面原生链接**。

## bridge 过程宏

`rust/crates/bridge` 是一个 **proc-macro** crate（`Cargo.toml` 中 `proc-macro = true`）。`#[export]` 属性在 `bridge.rs` 中解析函数或常量：对函数，若带类型参数个数大于一则要求「单结构体选项参数」；在启用 `wasm` feature 时展开为 `wasm_bindgen` 的 `js_name`（蛇形转驼峰）。常量导出则额外生成 getter。该机制把「桌面直接调 Rust」与「JS 调 WASM」的符号策略统一在宏层。

```mermaid
graph TD
  Author["crate 作者"] --> ExportAttr["export 宏"]
  ExportAttr --> Desktop["无 wasm feature: 透传 Rust 符号"]
  ExportAttr --> WasmPath["wasm feature: wasm_bindgen js_name"]
  WasmPath --> Pkg["rust/wasm/pkg npm 包"]
```

## 根脚本与 wasm-pack

根 `package.json` 的 `build:wasm` 调用 `wasm-pack build rust/wasm --target bundler --out-dir pkg`；`publish:wasm` 在构建后执行 `npm publish rust/wasm/pkg`。`rust/wasm/README.md` 说明默认消费**已发布**的 `opencut-wasm`，本地开发可通过 `bun link` 将 `apps/web` 指到 `rust/wasm/pkg`。

Sources: [Cargo.toml:1-11](../../../project-repos/opencut/Cargo.toml#L1-L11), [rust/README.md:5-35](../../../project-repos/opencut/rust/README.md#L5-L35), [rust/crates/bridge/src/bridge.rs:5-40](../../../project-repos/opencut/rust/crates/bridge/src/bridge.rs#L5-L40), [package.json:9-22](../../../project-repos/opencut/package.json#L9-L22)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `Cargo.toml:1-11`

```toml
[workspace]
resolver = "2"
members = [
    "apps/desktop",
    "rust/crates/time",
    "rust/crates/bridge",
    "rust/crates/effects",
    "rust/crates/gpu",
    "rust/crates/masks",
    "rust/wasm", "rust/crates/compositor",
]
```

#### `rust/README.md:5-35`

````markdown
## Adding a new crate

1. Create it under `rust/crates/`
2. Add `bridge` as a dependency
3. Annotate public functions with `#[export]`

## How `#[export]` works

```rust
use bridge::export;

#[export]
pub fn round_to_frame(time: f64, fps: f64) -> f64 {
    (time * fps).round() / fps
}
```

Without the `wasm` feature, the macro is a no-op. With `--features wasm`, it expands to:

```rust
#[wasm_bindgen(js_name = "roundToFrame")]
pub fn round_to_frame(time: f64, fps: f64) -> f64 { ... }
```

Desktop uses the crates directly as Cargo dependencies.

## Testing

```bash
cargo test -p <crate>
```
````

#### `rust/crates/bridge/src/bridge.rs:5-40`

```rust
#[proc_macro_attribute]
pub fn export(_attr: TokenStream, item: TokenStream) -> TokenStream {
    match parse_macro_input!(item as Item) {
        Item::Fn(function) => export_fn(function),
        Item::Const(constant) => export_const(constant),
        other => syn::Error::new_spanned(other, "#[export] only supports fn and const items")
            .to_compile_error()
            .into(),
    }
}

fn export_fn(function: ItemFn) -> TokenStream {
    let param_count = function
        .sig
        .inputs
        .iter()
        .filter(|arg| matches!(arg, FnArg::Typed(_)))
        .count();

    if param_count > 1 {
        return syn::Error::new_spanned(
            &function.sig.inputs,
            "#[export] functions must accept a single options struct, not positional arguments. \
             Wrap parameters in a struct: `fn foo(FooOptions { a, b }: FooOptions)`",
        )
        .to_compile_error()
        .into();
    }

    let js_name = snake_to_camel(&function.sig.ident.to_string());

    quote! {
        #[cfg_attr(feature = "wasm", ::wasm_bindgen::prelude::wasm_bindgen(js_name = #js_name))]
        #function
    }
    .into()
```

#### `package.json:9-22`

```json
    "build:tools": "turbo run build --filter=@opencut/tools",
    "build:wasm": "wasm-pack build rust/wasm --target bundler --out-dir pkg",
    "build:web": "turbo run build --filter=@opencut/web",
    "deploy:web": "turbo run deploy --filter=@opencut/web",
    "dev:tools": "turbo run dev --filter=@opencut/tools",
    "dev:wasm": "cargo watch -w rust/crates -w rust/wasm/src -s 'wasm-pack build rust/wasm --target bundler --out-dir pkg'",
    "dev:web": "turbo run dev --filter=@opencut/web",
    "format:web": "prettier apps/web/src/services/renderer --write",
    "generate:fonts": "npx tsx apps/web/scripts/generate-font-sprites.ts",
    "lint:web": "eslint apps/web/src --ext .ts,.tsx",
    "lint:web:fix": "eslint apps/web/src --ext .ts,.tsx --fix",
    "preview:web": "turbo run preview --filter=@opencut/web",
    "publish:wasm": "bun run build:wasm && npm publish rust/wasm/pkg --access public",
    "start:tools": "turbo run start --filter=@opencut/tools",
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [系统架构](system-architecture.md)
- [GPU 渲染、特效与预览](gpu-effects-preview.md)
- [桌面端（GPUI）](desktop-gpui.md)

---

<!-- page: desktop-gpui -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/desktop/README.md](../../../project-repos/opencut/apps/desktop/README.md)
- [Cargo.toml](../../../project-repos/opencut/Cargo.toml)
- [README.md](../../../project-repos/opencut/README.md)
- [script/setup-rust](../../../project-repos/opencut/script/setup-rust)
- [apps/desktop/Cargo.toml](../../../project-repos/opencut/apps/desktop/Cargo.toml)

</details>

# 桌面端（GPUI）

`apps/desktop` 是 OpenCut 的**原生桌面壳**，基于 [GPUI](https://gpui.rs) 构建；README 标注该方向仍在推进（与 Web 主线的成熟度不同）。

## 本地运行三步

`apps/desktop/README.md` 规定顺序：**安装 Rust**（仓库提供 `./script/setup-rust` 与 Windows PowerShell 等价脚本）→ **安装原生依赖**（`./apps/desktop/script/setup` 或 ps1）→ **`cargo run -p opencut-desktop`**。这与根 `Cargo.toml` 将 `apps/desktop` 纳入 workspace 一致，二进制包名为 `opencut-desktop`、可执行名在 `Cargo.toml` 中为 `opencut`。

## 平台说明

同一份 README 覆盖 Linux（apt/dnf/pacman）、macOS（必要时安装 Xcode CLT）、Windows（检测 VS Build Tools）与 **WSLg** 场景，强调旧版 Windows 上渲染可能受限。该文档与根 README「桌面为可选」叙述互补：多数贡献者可以只开发 `apps/web`。

```mermaid
graph TD
  Dev["开发者"] --> RustTool["Rust toolchain"]
  Dev --> NativeDeps["系统图形与构建依赖"]
  RustTool --> CargoRun["cargo run -p opencut-desktop"]
  NativeDeps --> CargoRun
  CargoRun --> GpuiApp["GPUI 窗口应用"]
```

Sources: [apps/desktop/README.md:1-37](../../../project-repos/opencut/apps/desktop/README.md#L1-L37), [apps/desktop/Cargo.toml:1-12](../../../project-repos/opencut/apps/desktop/Cargo.toml#L1-L12), [README.md:78-82](../../../project-repos/opencut/README.md#L78-L82)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/desktop/README.md:1-37`

````markdown
# Desktop

The native desktop app, built with [GPUI](https://gpui.rs).

## Getting started

**1. Install Rust:**

```bash
# Linux / macOS / WSL
./script/setup-rust
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\script\setup-rust.ps1
```

Both scripts skip installation if Rust is already present. On Linux/macOS/WSL only: after a fresh install, reload your shell with `source "$HOME/.cargo/env"`

**2. Install native dependencies:**

```bash
# Linux / macOS / WSL
./apps/desktop/script/setup
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\apps\desktop\script\setup.ps1
```

**3. Run:**

```bash
cargo run -p opencut-desktop
```
````

#### `apps/desktop/Cargo.toml:1-12`

```toml
[package]
name = "opencut-desktop"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "opencut"
path = "src/main.rs"

[dependencies]
gpui = "0.2.2"
```

#### `README.md:78-82`

```markdown
### Desktop setup

Desktop is opt-in. If you're only working on the web app, skip this entirely.

If you want to get ready for `apps/desktop`, see [`apps/desktop/README.md`](apps/desktop/README.md). It's a two-step setup: Rust toolchain first, then desktop native dependencies.
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [Rust 工作区与 WASM 导出](rust-wasm-bridge.md)
- [系统架构](system-architecture.md)
- [CI、Docker 与发布](ci-docker-deploy.md)

---

<!-- page: gpu-effects-preview -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/web/src/services/renderer/gpu-renderer.ts](../../../project-repos/opencut/apps/web/src/services/renderer/gpu-renderer.ts)
- [docs/effects-renderer.md](../../../project-repos/opencut/docs/effects-renderer.md)
- [rust/crates/gpu/src/lib.rs](../../../project-repos/opencut/rust/crates/gpu/src/lib.rs)
- [rust/crates/gpu/src/context.rs](../../../project-repos/opencut/rust/crates/gpu/src/context.rs)
- [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json)

</details>

# GPU 渲染、特效与预览

OpenCut 的特效系统拆为两层：**TypeScript 定义**（参数 UI、pass 模板、`buildPasses` 动态展开）与 **Rust/wgpu** 侧的设备、纹理与 pass 执行。`docs/effects-renderer.md` 明确要求新增特效时注册 WGSL 文件，并在 pass 解析上统一走 `resolveEffectPasses`。

## Web 入口：gpu-renderer

`gpu-renderer.ts` 将 `EffectPass` 序列化为 `{ shader, uniforms: { name, value }[] }` 后交给 WASM 的 `applyEffectPasses`；`normalizeUniformValue` 将标量归一成单元素数组。初始化失败时仅 `console.warn` 并将 `gpuAvailable` 置为 `false`，后续 `applyEffect` 直接短路返回源画布。

```mermaid
graph TD
  TsDef["TS EffectDefinition"] --> Resolve["resolveEffectPasses"]
  Resolve --> GpuMod["gpuRenderer.applyEffect"]
  GpuMod --> Wasm["applyEffectPasses WASM"]
  Wasm --> Wgpu["wgpu 管线与纹理"]
```

## Rust GPU crate 表面

`rust/crates/gpu/src/lib.rs` 导出 `GpuContext` 与 `wgpu` 本身，并定义 `GPU_TEXTURE_FORMAT` 为 `Bgra8Unorm` 以及内嵌 `fullscreen.wgsl` 常量。`context.rs` 使用 `include_str!` 装载 `blit.wgsl` 等 shader 源，并在适配器不可用时映射到 `GpuError::AdapterUnavailable` 等枚举。文档将「浏览器画布数据进入 GPU」的边界描述为 `copy_external_image_to_texture()` 一类路径，强调坐标系一致性。

## 与已发布 wasm 包的关系

`apps/web/package.json` 将 `opencut-wasm` 固定为 **^0.2.10**，与根 `package.json` 的同名依赖一致；本地若链接自研构建，则走 README 中的 `bun link` 工作流（见 [Rust 工作区与 WASM 导出](rust-wasm-bridge.md)）。

Sources: [apps/web/src/services/renderer/gpu-renderer.ts:1-90](../../../project-repos/opencut/apps/web/src/services/renderer/gpu-renderer.ts#L1-L90), [docs/effects-renderer.md:1-66](../../../project-repos/opencut/docs/effects-renderer.md#L1-L66), [rust/crates/gpu/src/lib.rs:1-21](../../../project-repos/opencut/rust/crates/gpu/src/lib.rs#L1-L21), [rust/crates/gpu/src/context.rs:29-124](../../../project-repos/opencut/rust/crates/gpu/src/context.rs#L29-L124)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/web/src/services/renderer/gpu-renderer.ts:1-90`

```typescript
import {
	applyEffectPasses,
	applyMaskFeather as applyMaskFeatherWasm,
	initializeGpu,
} from "opencut-wasm";
import type { EffectPass, EffectUniformValue } from "@/effects/types";

let gpuAvailable = false;
let initPromise: Promise<void> | null = null;

export function initializeGpuRenderer(): Promise<void> {
	if (!initPromise) {
		initPromise = initializeGpu()
			.then(() => {
				gpuAvailable = true;
			})
			.catch((error: unknown) => {
				gpuAvailable = false;
				const message = error instanceof Error ? error.message : String(error);
				console.warn(`GPU renderer unavailable: ${message}`);
			});
	}
	return initPromise;
}

export function isGpuAvailable(): boolean {
	return gpuAvailable;
}

export const gpuRenderer = {
	applyEffect({
		source,
		width,
		height,
		passes,
	}: {
		source: OffscreenCanvas;
		width: number;
		height: number;
		passes: EffectPass[];
	}): OffscreenCanvas {
		if (passes.length === 0 || !gpuAvailable) {
			return source;
		}

		return applyEffectPasses({
			source,
			width,
			height,
			passes: serializeEffectPasses(passes),
		});
	},

	applyMaskFeather({
		maskCanvas,
		width,
		height,
		feather,
	}: {
		maskCanvas: OffscreenCanvas;
		width: number;
		height: number;
		feather: number;
	}): OffscreenCanvas {
		if (!gpuAvailable) {
			return maskCanvas;
		}

		return applyMaskFeatherWasm({
			mask: maskCanvas,
			width,
			height,
			feather,
		});
	},
};

function serializeEffectPasses(passes: EffectPass[]) {
	return passes.map((pass) => ({
		shader: pass.shader,
		uniforms: Object.entries(pass.uniforms).map(([name, value]) => ({
			name,
			value: normalizeUniformValue(value),
		})),
	}));
}

function normalizeUniformValue(value: EffectUniformValue): number[] {
	return typeof value === "number" ? [value] : value;
}
```

#### `docs/effects-renderer.md:1-66`

````markdown
# Effects & GPU Renderer

## How to add a new effect

1. Create a new file in `apps/web/src/lib/effects/definitions/` (e.g. `brightness.ts`)
2. Export an `EffectDefinition` — see `blur.ts` as a reference
3. Register it in `apps/web/src/lib/effects/definitions/index.ts`

An effect definition has:
- `type` — unique string identifier
- `name` — display name
- `keywords` — for search
- `params` — user-facing controls (sliders, toggles, etc.)
- `renderer` — GPU pass templates resolved into shader identifiers + uniforms

All effects use the shared GPU renderer. TypeScript decides which shader identifiers to run and which uniforms to pass. Rust/wgpu owns device creation, textures, and pass execution.

## Single-pass vs multi-pass

The renderer supports a `passes` array. Single-pass effects (e.g. color grading) just have one entry. Multi-pass is needed when an effect has to process its own output — blur (H then V), bloom (extract → blur → composite), glow, etc.

```typescript
renderer: {
  passes: [
    { shader: "my-effect-shader", uniforms: ({ effectParams }) => ({ ... }) },
  ],
}
```

### Dynamic pass counts with `buildPasses`

Some effects need a variable number of passes depending on their parameters (e.g. blur needs more iterations at high intensity to keep quality). For these, add a `buildPasses` function to the renderer:

```typescript
renderer: {
  passes: [ /* static fallback — used if buildPasses is absent */ ],
  buildPasses: ({ effectParams, width, height }) => {
    // return EffectPass[] with pre-computed uniforms
  },
}
```

When `buildPasses` is present, all rendering paths use it instead of the static `passes` array. The static array is kept as a structural reference and fallback for effects that don't need dynamic pass counts.

### Resolving passes — always use `resolveEffectPasses`

All code that consumes effect passes should go through the helper, never access `definition.renderer.passes` directly:

```typescript
import { resolveEffectPasses } from "@/lib/effects";

const passes = resolveEffectPasses({ definition, effectParams, width, height });
```

This handles the `buildPasses` vs static `passes` dispatch automatically.

### Pipeline

Linear effect chains go through `gpuRenderer.applyEffect()` in `apps/web/src/services/renderer/gpu-renderer.ts`.

TypeScript resolves `EffectPass[]` from effect definitions. Each pass contains:
- `shader` — a stable identifier such as `"gaussian-blur"`
- `uniforms` — resolved numeric values for that pass

Rust maps the shader identifier to a precompiled WGSL pipeline in `rust/crates/gpu/src/shader_registry.rs`. Non-linear GPU work such as signed-distance-field generation and mask feathering lives in dedicated Rust pipeline modules, not in TypeScript orchestration.

````

#### `rust/crates/gpu/src/lib.rs:1-21`

```rust
mod context;

use thiserror::Error;

pub use context::GpuContext;
pub use wgpu;

pub const GPU_TEXTURE_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Bgra8Unorm;
pub const FULLSCREEN_SHADER_SOURCE: &str = include_str!("shaders/fullscreen.wgsl");

#[derive(Debug, Error)]
pub enum GpuError {
    #[error("No WebGPU adapter is available")]
    AdapterUnavailable,
    #[error("Failed to request a WebGPU device: {0}")]
    RequestDevice(#[from] wgpu::RequestDeviceError),
    #[error("Failed to create a WebGPU surface: {0}")]
    CreateSurface(#[from] wgpu::CreateSurfaceError),
    #[error("The output surface does not support the required texture format")]
    UnsupportedSurfaceFormat,
}
```

#### `rust/crates/gpu/src/context.rs:29-124`

```rust
const BLIT_SHADER_SOURCE: &str = include_str!("shaders/blit.wgsl");

const FULLSCREEN_QUAD_POSITIONS: [[f32; 2]; 6] = [
    [-1.0, -1.0],
    [1.0, -1.0],
    [-1.0, 1.0],
    [-1.0, 1.0],
    [1.0, -1.0],
    [1.0, 1.0],
];

pub struct GpuContext {
    instance: wgpu::Instance,
    adapter: wgpu::Adapter,
    device: wgpu::Device,
    queue: wgpu::Queue,
    texture_format: wgpu::TextureFormat,
    fullscreen_quad: wgpu::Buffer,
    linear_sampler: wgpu::Sampler,
    nearest_sampler: wgpu::Sampler,
    texture_sampler_bind_group_layout: wgpu::BindGroupLayout,
    blit_pipeline: wgpu::RenderPipeline,
    supports_external_texture_copies: bool,
    /// The HTML canvas that the WebGL context is bound to. Only populated on the WebGL
    /// fallback path. Used by render_texture_via_gl_canvas to output frames on WebGL.
    #[cfg(all(feature = "wasm", target_arch = "wasm32"))]
    gl_canvas: Option<web_sys::HtmlCanvasElement>,
    #[cfg(all(feature = "wasm", target_arch = "wasm32"))]
    gl_surface: RefCell<Option<CachedCanvasSurface>>,
}

impl GpuContext {
    pub async fn new() -> Result<Self, GpuError> {
        #[cfg(all(feature = "wasm", target_arch = "wasm32"))]
        let (instance, adapter, device, queue, gl_canvas) = Self::acquire_device().await?;
        #[cfg(not(all(feature = "wasm", target_arch = "wasm32")))]
        let (instance, adapter, device, queue) = Self::acquire_device().await?;
        let texture_format = if adapter.get_info().backend == wgpu::Backend::Gl {
            wgpu::TextureFormat::Rgba8Unorm
        } else {
            wgpu::TextureFormat::Bgra8Unorm
        };
        let fullscreen_quad = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("gpu-fullscreen-quad-buffer"),
            contents: bytemuck::cast_slice(&FULLSCREEN_QUAD_POSITIONS),
            usage: wgpu::BufferUsages::VERTEX,
        });
        let linear_sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("gpu-linear-sampler"),
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            address_mode_w: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            mipmap_filter: wgpu::MipmapFilterMode::Nearest,
            ..Default::default()
        });
        let nearest_sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            label: Some("gpu-nearest-sampler"),
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            address_mode_w: wgpu::AddressMode::ClampToEdge,
            mag_filter: wgpu::FilterMode::Nearest,
            min_filter: wgpu::FilterMode::Nearest,
            mipmap_filter: wgpu::MipmapFilterMode::Nearest,
            ..Default::default()
        });
        let texture_sampler_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                label: Some("gpu-texture-sampler-bind-group-layout"),
                entries: &[
                    wgpu::BindGroupLayoutEntry {
                        binding: 0,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Texture {
                            multisampled: false,
                            view_dimension: wgpu::TextureViewDimension::D2,
                            sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        },
                        count: None,
                    },
                    wgpu::BindGroupLayoutEntry {
                        binding: 1,
                        visibility: wgpu::ShaderStages::FRAGMENT,
                        ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                        count: None,
                    },
                ],
            });
        let vertex_shader_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("gpu-fullscreen-shader"),
            source: wgpu::ShaderSource::Wgsl(FULLSCREEN_SHADER_SOURCE.into()),
        });
        let blit_shader_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("gpu-blit-shader"),
            source: wgpu::ShaderSource::Wgsl(BLIT_SHADER_SOURCE.into()),
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [Rust 工作区与 WASM 导出](rust-wasm-bridge.md)
- [时间线、重定时与更新管线](timeline-update-pipeline.md)
- [Web 应用（Next.js）](web-nextjs-stack.md)

---

<!-- page: timeline-update-pipeline -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/web/src/timeline/update-pipeline.ts](../../../project-repos/opencut/apps/web/src/timeline/update-pipeline.ts)
- [docs/keyframes.md](../../../project-repos/opencut/docs/keyframes.md)
- [apps/web/src/timeline/__tests__/update-pipeline.test.ts](../../../project-repos/opencut/apps/web/src/timeline/__tests__/update-pipeline.test.ts)
- [README.md](../../../project-repos/opencut/README.md)
- [docs/effects-renderer.md](../../../project-repos/opencut/docs/effects-renderer.md)

</details>

# 时间线、重定时与更新管线

时间线编辑在 OpenCut 中不仅是 UI 状态，还涉及**元素补丁**经规则链重写后的结构化结果；`update-pipeline.ts` 将「字段级变更」映射为对 `TimelineElement` 的派生更新（例如重定时 `retime` 与裁剪边界联动）。

## 更新规则模型

文件开头定义 `ElementUpdateRule`：`triggers` 为触发字段列表，`apply` 接收 `element`、`originalElement`、`patch` 与 `tracks` 上下文。`deriveRules` 数组首条规则处理 `retime`：在元素可重定时前提下，对 `rate` 调用 `clampRetimeRate`，并结合 `getSourceDuration` 与 `getSourceSpanAtClipTime` 等 helper 推导源时间轴上的跨度。该设计把「单字段编辑」与「跨字段一致性」封装在可组合规则中，便于单元测试覆盖。

```mermaid
graph TD
  Patch["用户 patch"] --> Match["匹配 triggers"]
  Match --> Rule["deriveRules.apply"]
  Rule --> Out["更新后的 element 与 changedFields"]
  Out --> Store["写回 tracks 状态"]
```

## 关键帧子系统（文档索引）

`docs/keyframes.md` 将关键帧拆为四层：**数据模型**（`ElementAnimations` 与 channel 类型）、**property-registry**（可读写字段路径）、**resolve**（在给定本地时间求值）以及 **Renderer**（`src/services/renderer/` 在绘制前解析动画值）。新增可动画属性需要同时改 `ANIMATION_PROPERTY_PATHS` 与 registry 条目。该文档为阅读渲染代码时的「地图」。

## 测试锚点

`update-pipeline.test.ts` 使用 `bun:test` 与 `@/wasm` 的 `mediaTime` / `ZERO_MEDIA_TIME` 构造最小 `VideoElement` 与 `SceneTracks`，直接调用 `applyElementUpdate` 断言变换结果，说明管线逻辑可在不启动浏览器的情况下验证。

Sources: [apps/web/src/timeline/update-pipeline.ts:1-60](../../../project-repos/opencut/apps/web/src/timeline/update-pipeline.ts#L1-L60), [docs/keyframes.md:1-38](../../../project-repos/opencut/docs/keyframes.md#L1-L38), [apps/web/src/timeline/__tests__/update-pipeline.test.ts:1-50](../../../project-repos/opencut/apps/web/src/timeline/__tests__/update-pipeline.test.ts#L1-L50)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/web/src/timeline/update-pipeline.ts:1-60`

```typescript
import { clampAnimationsToDuration } from "@/animation";
import {
	clampRetimeRate,
	getSourceSpanAtClipTime,
	getTimelineDurationForSourceSpan,
} from "@/retime";
import type { RetimeConfig, SceneTracks, TimelineElement } from "@/timeline";
import { isRetimableElement } from "@/timeline";
import { ZERO_MEDIA_TIME, roundMediaTime } from "@/wasm";

type ElementUpdateField = keyof TimelineElement | string;

export interface ElementUpdateContext {
	tracks: SceneTracks;
	trackId: string;
}

interface ElementUpdateRuleResult {
	element: TimelineElement;
	changedFields?: ElementUpdateField[];
}

interface ElementUpdateRuleParams {
	element: TimelineElement;
	originalElement: TimelineElement;
	patch: Partial<TimelineElement>;
	context: ElementUpdateContext;
}

interface ElementUpdateRule {
	triggers: ElementUpdateField[];
	apply: (params: ElementUpdateRuleParams) => ElementUpdateRuleResult;
}

const deriveRules: ElementUpdateRule[] = [
	{
		triggers: ["retime"],
		apply: ({ element, originalElement, patch }) => {
			if (!("retime" in patch) || !isRetimableElement(element)) {
				return { element };
			}

			const nextRetime = patch.retime
				? {
						...patch.retime,
						rate: clampRetimeRate({ rate: patch.retime.rate }),
					}
				: undefined;

			const sourceDuration = getSourceDuration({
				trimStart: originalElement.trimStart,
				trimEnd: originalElement.trimEnd,
				duration: originalElement.duration,
				sourceDuration: isRetimableElement(originalElement)
					? originalElement.sourceDuration
					: undefined,
				retime: isRetimableElement(originalElement)
					? originalElement.retime
					: undefined,
			});
```

#### `docs/keyframes.md:1-38`

````markdown
# Keyframe System

Keyframes allow element properties to change over time. The system is split into three layers: the **data model** (how keyframes are stored), the **registry** (which properties support keyframes and how to read/write them), and the **UI** (hooks and components that wire it all together).

## How It Works

### Data model

Every `BaseTimelineElement` has an optional `animations?: ElementAnimations` field:

```typescript
interface ElementAnimations {
    channels: Record<string, AnimationChannel | undefined>;
}
```

A channel is a typed bucket of keyframes keyed by property path (e.g. `"opacity"`, `"background.color"`). Three channel types exist: `NumberAnimationChannel`, `ColorAnimationChannel`, and `DiscreteAnimationChannel`.

### Registry

`src/lib/animation/property-registry.ts` defines which property paths are animatable and how to read/write their values on an element. `src/types/animation.ts` holds the canonical list of valid paths in `ANIMATION_PROPERTY_PATHS`.

### Resolver

`src/lib/animation/resolve.ts` provides functions that return the effective value of a property at a given local time — falling back to the element's static value when no keyframes exist.

### Renderer

Nodes in `src/services/renderer/` call the resolve functions before drawing so that animated properties interpolate correctly during export and preview.

### UI

Two hooks in `src/components/editor/panels/properties/hooks/` handle the keyframe-aware field logic:

- `useKeyframedNumberProperty` — for numeric fields (opacity, position, scale, etc.)
- `useKeyframedColorProperty` — for color pickers

Both hooks handle the toggle/add/remove keyframe flow and automatically switch between writing to the static property and writing to the animation channel depending on whether keyframes are active.
````

#### `apps/web/src/timeline/__tests__/update-pipeline.test.ts:1-50`

```typescript
import { describe, expect, test } from "bun:test";
import type { Transform } from "@/rendering";
import type { SceneTracks, VideoElement } from "@/timeline";
import { applyElementUpdate } from "@/timeline/update-pipeline";
import { mediaTime, ZERO_MEDIA_TIME } from "@/wasm";

function buildTransform(): Transform {
	return {
		scaleX: 1,
		scaleY: 1,
		position: { x: 0, y: 0 },
		rotate: 0,
	};
}

function buildVideoElement(overrides: Partial<VideoElement> = {}): VideoElement {
	return {
		id: "video-1",
		type: "video",
		name: "Video 1",
		startTime: ZERO_MEDIA_TIME,
		duration: mediaTime({ ticks: 10 }),
		trimStart: ZERO_MEDIA_TIME,
		trimEnd: ZERO_MEDIA_TIME,
		mediaId: "media-1",
		params: {
			"transform.positionX": 0,
			"transform.positionY": 0,
			"transform.scaleX": 1,
			"transform.scaleY": 1,
			"transform.rotate": 0,
			opacity: 1,
		},
		...overrides,
	};
}

function buildTracks(element: VideoElement): SceneTracks {
	return {
		overlay: [],
		main: {
			id: "main-track",
			type: "video",
			name: "Main",
			muted: false,
			hidden: false,
			elements: [element],
		},
		audio: [],
	};
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [GPU 渲染、特效与预览](gpu-effects-preview.md)
- [本地存储与版本迁移](storage-migrations.md)
- [项目概览](overview.md)

---

<!-- page: storage-migrations -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/web/src/services/storage/service.ts](../../../project-repos/opencut/apps/web/src/services/storage/service.ts)
- [apps/web/src/services/storage/migrations/runner.ts](../../../project-repos/opencut/apps/web/src/services/storage/migrations/runner.ts)
- [apps/web/src/services/storage/use-local-storage.ts](../../../project-repos/opencut/apps/web/src/services/storage/use-local-storage.ts)
- [README.md](../../../project-repos/opencut/README.md)
- [apps/web/src/services/storage/use-storage-persistence.ts](../../../project-repos/opencut/apps/web/src/services/storage/use-storage-persistence.ts)

</details>

# 本地存储与版本迁移

Web 编辑器需要在浏览器内持久化项目、媒体索引与用户偏好；`apps/web/src/services/storage` 目录集中了 **IndexedDB** 访问、版本化迁移与少量 **localStorage** 辅助逻辑。

## 存储服务骨架

`service.ts` 在文件头部从 `./migrations` 引入 `migrations` 与 `runStorageMigrations`，类内部以 `migrationsPromise` 缓存一次性迁移流程，并在打开数据库前 `await` 完成。文件后部（从代码结构看）还包含对 `indexedDB` 可用性的检测分支（例如 `return "indexedDB" in window` 一类守卫），用于在不支持的环境中降级或提示。

## 迁移 runner

`migrations/runner.ts` 将迁移数组按 `from` 版本排序，顺序执行 `from === currentVersion` 的条目；包含对迁移耗时的观测与对话框触发逻辑（从注释可见「首次展示迁移对话框」的时间戳记录）。大量 `v*-to-v*.test.ts` 文件（见仓库盘点）为每个 schema 步进提供回归测试，符合「项目文件版本频繁演进」的编辑器场景。

```mermaid
graph TD
  Open["打开存储"] --> SortMig["按 from 排序迁移"]
  SortMig --> Loop["顺序执行匹配 current 的迁移"]
  Loop --> Bump["更新 schema 版本"]
  Bump --> Ready["读写业务数据"]
```

## localStorage 辅助

`use-local-storage.ts` 对任意 key 做 JSON 序列化读写；`use-storage-persistence.ts` 使用固定 `DISMISSED_KEY` 记录用户是否关闭某提示，属于轻量 UI 状态，与 IndexedDB 中的重数据分离。

Sources: [apps/web/src/services/storage/service.ts:54-91](../../../project-repos/opencut/apps/web/src/services/storage/service.ts#L54-L91), [apps/web/src/services/storage/migrations/runner.ts:24-100](../../../project-repos/opencut/apps/web/src/services/storage/migrations/runner.ts#L24-L100), [apps/web/src/services/storage/use-local-storage.ts:21-38](../../../project-repos/opencut/apps/web/src/services/storage/use-local-storage.ts#L21-L38), [apps/web/src/services/storage/use-storage-persistence.ts:21-41](../../../project-repos/opencut/apps/web/src/services/storage/use-storage-persistence.ts#L21-L41)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/web/src/services/storage/service.ts:54-91`

```typescript
class StorageService {
	private projectsAdapter: IndexedDBAdapter<SerializedProject>;
	private savedSoundsAdapter: IndexedDBAdapter<SavedSoundsData>;
	private config: StorageConfig;
	private migrationsPromise: Promise<void> | null = null;

	constructor() {
		this.config = {
			projectsDb: "video-editor-projects",
			mediaDb: "video-editor-media",
			savedSoundsDb: "video-editor-saved-sounds",
			version: 1,
		};

		this.projectsAdapter = new IndexedDBAdapter<SerializedProject>({
			dbName: this.config.projectsDb,
			storeName: "projects",
			version: this.config.version,
		});

		this.savedSoundsAdapter = new IndexedDBAdapter<SavedSoundsData>({
			dbName: this.config.savedSoundsDb,
			storeName: "saved-sounds",
			version: this.config.version,
		});
	}

	private async ensureMigrations(): Promise<void> {
		if (this.migrationsPromise) {
			await this.migrationsPromise;
			return;
		}

		this.migrationsPromise = runStorageMigrations({ migrations }).then(
			() => undefined,
		);
		await this.migrationsPromise;
	}
```

#### `apps/web/src/services/storage/migrations/runner.ts:24-100`

```typescript
export async function runStorageMigrations({
	migrations,
	onProgress,
}: {
	migrations: StorageMigration[];
	onProgress?: (progress: MigrationProgress) => void;
}): Promise<StorageMigrationResult> {
	// One-time cleanup: delete the old global version database
	if (!hasCleanedUpMetaDb) {
		try {
			await deleteDatabase({ dbName: "video-editor-meta" });
		} catch {
			// Ignore errors - DB might not exist
		}
		hasCleanedUpMetaDb = true;
	}

	const projectsAdapter = new IndexedDBAdapter<ProjectRecord>(
		"video-editor-projects",
		"projects",
		1,
	);

	const projects = await projectsAdapter.getAll();

	const orderedMigrations = [...migrations].sort((a, b) => a.from - b.from);
	let migratedCount = 0;
	let migrationStartTime: number | null = null;

	for (const project of projects) {
		if (typeof project !== "object" || project === null) {
			continue;
		}

		let projectRecord = project as ProjectRecord;
		const projectId = getProjectId({ project: projectRecord });
		if (!projectId) {
			continue;
		}

		let currentVersion = getProjectVersion({ project: projectRecord });
		const targetVersion = orderedMigrations.at(-1)?.to ?? currentVersion;

		if (currentVersion >= targetVersion) {
			continue;
		}

		// Track when we first showed the migration dialog
		if (migrationStartTime === null) {
			migrationStartTime = Date.now();
		}

		const projectName = getProjectName({ project: projectRecord });
		onProgress?.({
			isMigrating: true,
			fromVersion: currentVersion,
			toVersion: targetVersion,
			projectName,
		});

		for (const migration of orderedMigrations) {
			if (migration.from !== currentVersion) {
				continue;
			}

			const result = await migration.run({
				projectId,
				project: projectRecord,
			});

			if (result.skipped) {
				break;
			}

			await projectsAdapter.set(projectId, result.project);
			migratedCount++;
			currentVersion = migration.to;
```

#### `apps/web/src/services/storage/use-local-storage.ts:21-38`

```typescript
			const storedValue = localStorage.getItem(key);
			if (storedValue !== null) {
				const parsedValue = JSON.parse(storedValue) as T;
				valueRef.current = parsedValue;
				setValue(parsedValue);
			}
		} catch {
			// localstorage might be unavailable
		}
		setIsReady(true);
	}, [key]);

	// sync to localstorage after hydration
	useEffect(() => {
		if (!isReady) return;

		try {
			localStorage.setItem(key, JSON.stringify(value));
```

#### `apps/web/src/services/storage/use-storage-persistence.ts:21-41`

```typescript
			const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
			if (dismissed) return;

			if (isFirefox()) {
				setShowDialog(true);
			} else {
				await navigator.storage.persist();
			}
		};

		run();
	}, []);

	const onConfirm = async () => {
		setShowDialog(false);
		await navigator.storage.persist();
	};

	const onDismiss = () => {
		setShowDialog(false);
		localStorage.setItem(DISMISSED_KEY, "true");
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [时间线、重定时与更新管线](timeline-update-pipeline.md)
- [Web 应用（Next.js）](web-nextjs-stack.md)
- [服务端、认证与数据层](server-auth-data.md)

---

<!-- page: server-auth-data -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [apps/web/src/db/schema.ts](../../../project-repos/opencut/apps/web/src/db/schema.ts)
- [apps/web/src/env/web.ts](../../../project-repos/opencut/apps/web/src/env/web.ts)
- [docker-compose.yml](../../../project-repos/opencut/docker-compose.yml)
- [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json)
- [turbo.json](../../../project-repos/opencut/turbo.json)

</details>

# 服务端、认证与数据层

`apps/web` 同时承载编辑器前端与 **服务端数据面**：`drizzle-orm` 描述 Postgres schema，`better-auth` 与 Upstash Redis 相关依赖出现在 `package.json`；`web.ts` 在进程启动时做强校验。

## Drizzle schema 概览

`schema.ts` 定义 `users`、`sessions`、`accounts`、`feedback`、`verifications` 等表，并对多数表调用 `.enableRLS()`。`users` 表含注释「todo: implement fully anonymous sign-in for privacy」，表明认证产品形态仍在演进。字段命名采用 camelCase 列映射到 snake_case 列名（`emailVerified` → `email_verified`）。

## 与 Docker Compose 的对齐

`docker-compose.yml` 中 `web` 服务环境变量写入 `DATABASE_URL=postgresql://opencut:opencut@db:5432/opencut`，与本地默认 db 服务一致；同时注入 `BETTER_AUTH_SECRET`、`UPSTASH_REDIS_REST_URL`（指向 `serverless-redis-http`）与 `UPSTASH_REDIS_REST_TOKEN`。这与 `webEnvSchema` 中要求的键一一对应。

```mermaid
graph TD
  Browser["浏览器"] --> NextApi["Next server 路由与 server actions"]
  NextApi --> Pg["Postgres users sessions"]
  NextApi --> RedisHttp["serverless-redis-http 网关"]
  RedisHttp --> Redis["Redis 实例"]
```

## Turbo 构建期 env 透传

根 `turbo.json` 的 `build` 任务列出 `DATABASE_URL`、`BETTER_AUTH_SECRET`、Upstash 与 Marble、Freesound 等键，确保在 **turbo 缓存与远程构建**场景下环境指纹参与哈希；这与 `apps/web/Dockerfile` 在 builder 阶段显式 `ENV` 桩值的做法互补。

Sources: [apps/web/src/db/schema.ts:1-49](../../../project-repos/opencut/apps/web/src/db/schema.ts#L1-L49), [apps/web/src/env/web.ts:13-26](../../../project-repos/opencut/apps/web/src/env/web.ts#L13-L26), [docker-compose.yml:62-72](../../../project-repos/opencut/docker-compose.yml#L62-L72), [turbo.json:7-18](../../../project-repos/opencut/turbo.json#L7-L18)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `apps/web/src/db/schema.ts:1-49`

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),

	// todo: implement fully anonymous sign-in for privacy
	// we don't have any auth flows currently so this is fine for now
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
}).enableRLS();

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
}).enableRLS();

export const accounts = pgTable("accounts", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}).enableRLS();
```

#### `apps/web/src/env/web.ts:13-26`

```typescript
	// Server
	DATABASE_URL: z.string().refine(
		(url) =>
			url.startsWith("postgres://") || url.startsWith("postgresql://"),
		"DATABASE_URL must be a postgres:// or postgresql:// URL",
	),

	BETTER_AUTH_SECRET: z.string(),
	UPSTASH_REDIS_REST_URL: z.url(),
	UPSTASH_REDIS_REST_TOKEN: z.string(),
	MARBLE_WORKSPACE_KEY: z.string(),
	FREESOUND_CLIENT_ID: z.string(),
	FREESOUND_API_KEY: z.string(),
});
```

#### `docker-compose.yml:62-72`

```yaml
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://opencut:opencut@db:5432/opencut
      - BETTER_AUTH_SECRET=your-production-secret-key-here
      - UPSTASH_REDIS_REST_URL=http://serverless-redis-http:80
      - UPSTASH_REDIS_REST_TOKEN=example_token
      - NEXT_PUBLIC_SITE_URL=http://localhost:3100
      - NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com
      - MARBLE_WORKSPACE_KEY=${MARBLE_WORKSPACE_KEY:-placeholder}
      - FREESOUND_CLIENT_ID=${FREESOUND_CLIENT_ID}
      - FREESOUND_API_KEY=${FREESOUND_API_KEY}
```

#### `turbo.json:7-18`

```json
			"env": [
				"NODE_ENV",
				"NEXT_PUBLIC_SITE_URL",
				"NEXT_PUBLIC_MARBLE_API_URL",
				"DATABASE_URL",
				"BETTER_AUTH_SECRET",
				"UPSTASH_REDIS_REST_URL",
				"UPSTASH_REDIS_REST_TOKEN",
				"MARBLE_WORKSPACE_KEY",
				"FREESOUND_CLIENT_ID",
				"FREESOUND_API_KEY"
			]
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [Web 应用（Next.js）](web-nextjs-stack.md)
- [CI、Docker 与发布](ci-docker-deploy.md)
- [本地存储与版本迁移](storage-migrations.md)

---

<!-- page: ci-docker-deploy -->

<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [.github/workflows/bun-ci.yml](../../../project-repos/opencut/.github/workflows/bun-ci.yml)
- [apps/web/Dockerfile](../../../project-repos/opencut/apps/web/Dockerfile)
- [docker-compose.yml](../../../project-repos/opencut/docker-compose.yml)
- [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json)
- [turbo.json](../../../project-repos/opencut/turbo.json)

</details>

# CI、Docker 与发布

OpenCut 的自动化与交付路径围绕 **Bun + wasm-pack + Next build** 展开；自托管则通过根目录 `docker-compose.yml` 一键拉起依赖栈与生产镜像。

## GitHub Actions：Bun CI

`.github/workflows/bun-ci.yml` 在 `push`/`pull_request` 到 `main` 时触发（忽略仅 Markdown 变更），矩阵覆盖 **ubuntu、windows、macOS**。Job 步骤包括：安装 `wasm32-unknown-unknown` 目标、用 `jetli/wasm-pack-action` 安装 wasm-pack、缓存 `~/.cargo` 与 `target`、执行 `wasm-pack build rust/wasm --target bundler --out-dir pkg`，随后在 `apps/web` 下 `bun install` 与 `bun run build`。测试步骤当前为占位 `echo "No tests implemented yet"` 且 `continue-on-error: true`，说明 CI 主门禁仍是**可构建性**而非单测覆盖率。环境变量块注入数据库、Auth、Upstash、Marble 与 Freesound 的桩值以满足构建期校验。

## Web 多阶段镜像

`apps/web/Dockerfile` 基于 `oven/bun:alpine`：builder 阶段仅复制清单文件后 `bun install`，再复制 `apps/web` 源码；在镜像内设置多组 `ENV` 以满足 zod（参见 [Web 应用（Next.js）](web-nextjs-stack.md)），于 `/app/apps/web` 执行 `bun run build`。runner 阶段以非 root `nextjs` 用户运行，复制 `.next/standalone` 与静态资源，暴露 `3000`。

```mermaid
graph TD
  Ci["GitHub Actions"] --> WasmBuild["wasm-pack build"]
  WasmBuild --> WebBuild["bun run build in apps/web"]
  DockerFile["Dockerfile builder"] --> WebBuildImg["standalone 输出"]
  Compose["docker-compose up"] --> WebBuildImg
  Compose --> Db["Postgres"]
  Compose --> RedisStack["Redis plus SRH"]
```

## Compose 与本地端口

`docker-compose.yml` 将内置 Next 监听 `3000` 的容器映射到宿主 **3100**；db 与 redis 分别暴露 5432 与 6379。健康检查确保 `web` 仅在依赖就绪后启动。README 同时描述「仅前端」时可跳过 Docker，与 CI 中仍提供数据库 URL 桩的做法并不矛盾。

Sources: [github/workflows/bun-ci.yml:17-80](../../../project-repos/opencut/.github/workflows/bun-ci.yml#L17-L80), [apps/web/Dockerfile:1-38](../../../project-repos/opencut/apps/web/Dockerfile#L1-L38), [docker-compose.yml:50-62](../../../project-repos/opencut/docker-compose.yml#L50-L62)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/bun-ci.yml:17-80`

```yaml
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    env:
      DATABASE_URL: "postgresql://opencut:opencut@localhost:5432/opencut"
      BETTER_AUTH_SECRET: "supersecret"
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
      UPSTASH_REDIS_REST_URL: "https://your-upstash-redis-url"
      UPSTASH_REDIS_REST_TOKEN: "your-upstash-redis-token"
      NEXT_PUBLIC_MARBLE_API_URL: "https://placeholder.example.com"
      MARBLE_WORKSPACE_KEY: "placeholder"
      FREESOUND_CLIENT_ID: "placeholder"
      FREESOUND_API_KEY: "placeholder"
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Rust wasm target
        run: rustup target add wasm32-unknown-unknown

      - name: Install wasm-pack
        uses: jetli/wasm-pack-action@v0.4.0
        with:
          version: latest

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-cargo-${{ hashFiles('Cargo.lock') }}

      - name: Build WASM
        run: wasm-pack build rust/wasm --target bundler --out-dir pkg

      - name: Install Bun
        uses: oven-sh/setup-bun@735343b667d3e6f658f44d0eca948eb6282f2b76
        with:
          bun-version: 1.2.18

      - name: Cache Bun modules
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-1.2.18-${{ hashFiles('apps/web/bun.lock') }}

      - name: Install dependencies
        working-directory: apps/web
        run: bun install

      - name: Build
        working-directory: apps/web
        run: bun run build

      - name: Run tests
        working-directory: apps/web
        run: echo "No tests implemented yet"
```

#### `apps/web/Dockerfile:1-38`

```
FROM oven/bun:alpine AS base

FROM base AS builder

WORKDIR /app

ARG FREESOUND_CLIENT_ID
ARG FREESOUND_API_KEY
ARG NEXT_PUBLIC_MARBLE_API_URL=https://api.marblecms.com
ARG MARBLE_WORKSPACE_KEY=build-placeholder

COPY package.json package.json
COPY bun.lock bun.lock
COPY turbo.json turbo.json

COPY apps/web/package.json apps/web/package.json
RUN bun install

COPY apps/web/ apps/web/

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env stubs to pass zod validation
ENV DATABASE_URL="postgresql://opencut:opencut@localhost:5432/opencut"
ENV BETTER_AUTH_SECRET="build-time-secret"
ENV UPSTASH_REDIS_REST_URL="http://localhost:8079"
ENV UPSTASH_REDIS_REST_TOKEN="example_token"
ENV NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_MARBLE_API_URL=$NEXT_PUBLIC_MARBLE_API_URL
ENV MARBLE_WORKSPACE_KEY=$MARBLE_WORKSPACE_KEY

ENV FREESOUND_CLIENT_ID=$FREESOUND_CLIENT_ID
ENV FREESOUND_API_KEY=$FREESOUND_API_KEY

WORKDIR /app/apps/web
RUN bun run build

```

#### `docker-compose.yml:50-62`

```yaml
  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      args:
        - FREESOUND_CLIENT_ID=${FREESOUND_CLIENT_ID}
        - FREESOUND_API_KEY=${FREESOUND_API_KEY}
        - NEXT_PUBLIC_MARBLE_API_URL=${NEXT_PUBLIC_MARBLE_API_URL:-https://api.marblecms.com}
        - MARBLE_WORKSPACE_KEY=${MARBLE_WORKSPACE_KEY:-build-placeholder}
    restart: unless-stopped
    ports:
      - "3100:3000"
    environment:
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [项目概览](overview.md)
- [服务端、认证与数据层](server-auth-data.md)
- [Web 应用（Next.js）](web-nextjs-stack.md)

---
