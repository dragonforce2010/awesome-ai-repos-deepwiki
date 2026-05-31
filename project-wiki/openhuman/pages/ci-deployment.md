<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [.github/workflows/build-desktop.yml](../../project-repos/openhuman/.github/workflows/build-desktop.yml)
- [.github/workflows/release-production.yml](../../project-repos/openhuman/.github/workflows/release-production.yml)
- [CONTRIBUTING.md](../../project-repos/openhuman/CONTRIBUTING.md)

</details>

# CI/CD 与发布

Monorepo CI 覆盖 **Rust + TS + Tauri 多平台 + E2E**。

## 工作流矩阵（节选）

| Workflow | 作用 |
|----------|------|
| `pr-ci.yml` / `test.yml` | 单元与 Rust check |
| `typecheck.yml` | TS compile |
| `build-desktop.yml` | macOS/Linux 桌面产物 |
| `build-windows.yml` | Windows MSI |
| `e2e-playwright.yml` | UI 全链路 |
| `release-production.yml` | 正式发布 |
| `coverage.yml` | 覆盖率门禁 |

贡献者路径：`pnpm install` → submodule init → `pnpm dev` / `pnpm --filter openhuman-app dev:app` → `cargo check -p openhuman --lib`。

## 发布渠道

- GitHub Releases（dmg/deb/AppImage/msi）  
- Homebrew tap `tinyhumansai/core`  
- 签名 apt repo  

**Insight**：`tauri-cef-pin-guard.yml` 单独守卫 CEF 版本 pin——浏览器内核与 Tauri 强耦合，升级需专门 workflow 防 drift。

## 相关页面

- [Tauri 桌面壳层](tauri-shell.md)
- [代码质量与重构建议](quality-risks-refactor.md)
- [项目概览](overview.md)

Sources: [github/workflows/build-desktop.yml:1-80](../../../project-repos/openhuman/.github/workflows/build-desktop.yml#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/build-desktop.yml:1-80`

```yaml
---
# Reusable workflow that owns the desktop build + sign + Sentry-DIF +
# artifact-upload matrix. Both `release-production.yml` and
# `release-staging.yml` `uses:` this workflow so the build code lives in
# exactly one place. Variation between the two flows (release vs debug
# profile, mac notarization on/off, GH Release vs Actions-artifact
# uploads, standalone-CLI sidecar build, env labels for telegram /
# Sentry / API base URL) is driven by inputs below.
#
# `secrets: inherit` on the caller side gives this workflow access to
# the repo's secrets without having to enumerate them; vars are read
# directly from the `vars` context.
name: Build Desktop (reusable)
on:
  workflow_call:
    inputs:
      build_ref:
        description: Git ref to check out for the build (tag or SHA).
        type: string
        required: true
      tag:
        description:
          Tag name used by GH Release uploads (e.g. v1.2.4) and by the staging
          standalone CLI artifact name (e.g. v1.2.4-staging).
        type: string
        required: true
      version:
        description: Plain SemVer version (no v prefix), used in SENTRY_RELEASE.
        type: string
        required: true
      sha:
        description: Full commit SHA the build is pinned to.
        type: string
        required: true
      short_sha:
        description:
          12-char prefix of `sha` matching the runtime truncation in config.ts /
          vite.config.ts / main.rs / app/src-tauri/src/lib.rs.
        type: string
        required: true
      base_url:
        description: Backend API base URL baked into the bundle.
        type: string
        required: true
      app_env:
        description: APP_ENVIRONMENT label baked into the bundle (production | staging).
        type: string
        required: true
      build_profile:
        description: Cargo profile to build (release | debug).
        type: string
        required: true
      telegram_bot_username:
        description: Telegram bot handle baked into the bundle.
        type: string
        required: true
      with_macos_signing:
        description:
          When true, run the sign + notarize + repackage-DMG path for the macOS
          matrix entries. Default true — both production and staging ship
          notarized macOS bundles so Gatekeeper accepts the staging build the
          same way it accepts production. Disable only for fast local-style
          dry runs that intentionally skip Apple's notary service.
        type: boolean
        default: true
      with_release_upload:
        description:
          When true, upload installer assets to the GitHub Release identified by
          `tag`. When false, upload bundles as Actions artifacts instead.
        type: boolean
        default: false
      release_id:
        description:
          Release ID used by the macOS re-upload script. Only consulted when
          `with_release_upload` and `with_macos_signing` are both true.
        type: string
        default: ""
      build_sidecar:
        description:
          When true, build the standalone openhuman-core CLI binary alongside
```

<!-- source-snippets:end -->
</details>
