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
