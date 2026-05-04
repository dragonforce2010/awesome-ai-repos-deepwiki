# OpenCut DeepWiki

> **面向 Web、桌面与 WASM 的开源视频编辑器仓库说明：架构、渲染、时间线、存储与交付。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、动机、贡献焦点与本地启动 |
| 概览 | [仓库地图与阅读路线](pages/repository-map.md) | high | 目录职责与推荐阅读顺序 |
| 架构与平台 | [系统架构](pages/system-architecture.md) | high | Rust 真源与各 app 壳体分层 |
| 架构与平台 | [Web 应用（Next.js）](pages/web-nextjs-stack.md) | high | 脚本、环境、OpenNext |
| 架构与平台 | [Rust 工作区与 WASM 导出](pages/rust-wasm-bridge.md) | high | workspace、bridge 宏、wasm-pack |
| 架构与平台 | [桌面端（GPUI）](pages/desktop-gpui.md) | medium | 原生依赖与 `cargo run` |
| 渲染与数据 | [GPU 渲染、特效与预览](pages/gpu-effects-preview.md) | high | TS 定义与 `opencut-wasm` GPU 入口 |
| 渲染与数据 | [时间线、重定时与更新管线](pages/timeline-update-pipeline.md) | high | `update-pipeline` 与关键帧文档 |
| 渲染与数据 | [本地存储与版本迁移](pages/storage-migrations.md) | medium | IndexedDB 与迁移 runner |
| 服务端与交付 | [服务端、认证与数据层](pages/server-auth-data.md) | medium | Drizzle schema 与 Docker 依赖 |
| 服务端与交付 | [CI、Docker 与发布](pages/ci-docker-deploy.md) | medium | Bun CI、镜像与生产 compose |

## 仓库快照

```text
opencut/
├── apps/
│   ├── web/          # Next.js 16，主产品
│   └── desktop/      # GPUI 桌面（进行中）
├── rust/             # 跨平台核心与 wasm 包
├── docs/             # 子系统架构说明
├── docker-compose.yml
├── package.json      # Bun workspaces + turbo 脚本
└── Cargo.toml        # Rust workspace
```

## 核心入口

| 路径 | 说明 |
|------|------|
| [README.md](../../../project-repos/opencut/README.md) | 官方上手、Docker、WASM 本地链接 |
| [AGENTS.md](../../../project-repos/opencut/AGENTS.md) | 贡献者架构约定 |
| [package.json](../../../project-repos/opencut/package.json) | 根脚本与 `opencut-wasm` 依赖 |
| [apps/web/package.json](../../../project-repos/opencut/apps/web/package.json) | Next 应用脚本与运行时依赖 |
| [apps/web/src/services/renderer/gpu-renderer.ts](../../../project-repos/opencut/apps/web/src/services/renderer/gpu-renderer.ts) | Web 侧 GPU 封装入口 |
| [docker-compose.yml](../../../project-repos/opencut/docker-compose.yml) | 本地 db/redis/web 编排 |

## 快速导航

- **想先理解产品定位与怎么跑起来？** → [项目概览](pages/overview.md)
- **想搞清楚目录与迁移中的职责划分？** → [仓库地图与阅读路线](pages/repository-map.md) 与 [系统架构](pages/system-architecture.md)
- **要改特效、预览或 WGSL？** → [GPU 渲染、特效与预览](pages/gpu-effects-preview.md) 与仓库内 `docs/effects-renderer.md`
- **要改时间线、重定时或关键帧？** → [时间线、重定时与更新管线](pages/timeline-update-pipeline.md)
- **要看 CI、镜像与 Cloudflare 部署？** → [CI、Docker 与发布](pages/ci-docker-deploy.md)

## 可继续追问的主题

- **WASM 与 Rust 边界**：结合 [Rust 工作区与 WASM 导出](pages/rust-wasm-bridge.md) 阅读 `rust/README.md` 与 `gpu-renderer.ts` 中的 `opencut-wasm` 调用点，追问「某 API 是否已迁到 Rust」。
- **项目文件兼容性**：结合 [本地存储与版本迁移](pages/storage-migrations.md) 追问「从版本 N 升到 N+1 时哪些字段会改写」。
- **生产自托管**：结合 [服务端、认证与数据层](pages/server-auth-data.md) 与 [CI、Docker 与发布](pages/ci-docker-deploy.md) 对照 `docker-compose.yml` 中的环境变量占位。

## 来源说明

- 上游仓库：`https://github.com/opencut-app/opencut`
- 本地检出：`/Users/bytedance/workspace/deepwiki/project-repos/opencut`
- 文档生成时所依据的提交：`d1f4cb615b7fe5e08628119fceec075fbb5044a7`（`main`）
