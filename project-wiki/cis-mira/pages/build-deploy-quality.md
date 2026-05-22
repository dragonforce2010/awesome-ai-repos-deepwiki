<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [vite.config.ts](../../../project-repos/cis-mira/vite.config.ts)
- [package.json](../../../project-repos/cis-mira/package.json)
- [.env.intranet](../../../project-repos/cis-mira/.env.intranet)
- [.env.cn](../../../project-repos/cis-mira/.env.cn)
- [docs/color-token-governance.md](../../../project-repos/cis-mira/docs/color-token-governance.md)
- [.claude/skills/mira-design-system/SKILL.md](../../../project-repos/cis-mira/.claude/skills/mira-design-system/SKILL.md)

</details>

# 构建、部署与质量

Mira FE 用 **Vite mode** 区分内网与多区域 CDN 构建产物；仓库内 **没有** 检出到 GitHub/GitLab CI 配置，发布流程写在 README（Deploy 平台 + SCM + TCC）。质量门禁主要靠 husky、eslint、commitlint 和颜色 token 脚本。

## 构建模式

| 脚本 | mode | 输出目录（默认） |
|------|------|------------------|
| `build:intranet` | intranet | `dist/` |
| `build:cn` / `va` / `sg` | 各区域 | `dist/{mode}` |

`vite.config.ts` 从 `STATIC_RESOURCES_CDN_DOMAIN` + `CDN_PATH_PREFIX` 拼 `base`；`viteStaticCopy` 拷贝模型图标、扩展隐私页、pdfjs cmaps 等。`sourcemap: true` 便于线上 Slardar 反解。

Sources: [package.json:6-12](../../../project-repos/pages/package.json#L6-L12), [vite.config.ts:40-74](../../../project-repos/pages/vite.config.ts#L40-L74), [vite.config.ts:169-175](../../../project-repos/pages/vite.config.ts#L169-L175)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `package.json:6-12`

> 未找到引用文件：`package.json`

#### `vite.config.ts:40-74`

> 未找到引用文件：`vite.config.ts`

#### `vite.config.ts:169-175`

> 未找到引用文件：`vite.config.ts`

<!-- source-snippets:end -->
</details>

## 环境文件

`.env.intranet`、`.env.cn`、`.env.va`、`.env.sg` 配置各区域 CDN 域名（如内网 `goofy-cdn-tos.bytedance.net`、CN `lf-cdn-tos.bytescm.com` 等）。

Sources: [env.intranet:1-10](../../../project-repos/pages/env.intranet#L1-L10), [env.cn:1-10](../../../project-repos/pages/env.cn#L1-L10)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `env.intranet:1-10`

> 未找到引用文件：`env.intranet`

#### `env.cn:1-10`

> 未找到引用文件：`env.cn`

<!-- source-snippets:end -->
</details>

## 发布（README）

- **内网** `mira.byteintl.net`：`master` → deploy.bytedance.net app/132865
- **公网** `mira.bytedance.com`：SCM CDN + TCC 版本；主要靠 Mira 客户端免 VPN

本地开发用 Bifrost 把线上域名代理到 `localhost:5173`，并 exclude API 路径。

Sources: [README.md:31-49](../../../project-repos/pages/README.md#L31-L49), [README.md:80-96](../../../project-repos/pages/README.md#L80-L96)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:31-49`

> 未找到引用文件：`README.md`

#### `README.md:80-96`

> 未找到引用文件：`README.md`

<!-- source-snippets:end -->
</details>

## 质量与设计治理

- `pnpm lint`：ESLint（含 UD 插件）
- `check:color-tokens`：颜色 token 治理脚本
- `docs/color-token-governance.md` + Claude Skill `mira-design-system`：改 UI 必须跟 design token 体系

仓库 **无自动化测试目录**（盘点显示 Tests: None detected），回归依赖人工 + 内网 dogfood。

Sources: [package.json:13-18](../../../project-repos/pages/package.json#L13-L18), [docs/color-token-governance.md:1-30](../../../project-repos/pages/docs/color-token-governance.md#L1-L30), [00-repo-inventory.md:73-75](../../../project-repos/pages/00-repo-inventory.md#L73-L75)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `package.json:13-18`

> 未找到引用文件：`package.json`

#### `docs/color-token-governance.md:1-30`

> 未找到引用文件：`docs/color-token-governance.md`

#### `00-repo-inventory.md:73-75`

> 未找到引用文件：`00-repo-inventory.md`

<!-- source-snippets:end -->
</details>

## 相关页面

- [多端客户端](multi-platform-clients.md)
- [系统架构与分层](system-architecture.md)
