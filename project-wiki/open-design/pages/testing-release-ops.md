<details>
<summary>相关源文件</summary>

- [package.json](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json) - 根脚本、CLI bin 和引擎约束。
- [e2e/package.json](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/package.json) - E2E/test 脚本。
- [e2e/specs/app.spec.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/specs/app.spec.ts) - Playwright/Vitest 场景和 mock run。
- [apps/daemon/tests/app-config.test.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/tests/app-config.test.ts) - app-config 读写过滤、并发语义和同源保护测试。
- [.github/workflows/ci.yml](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/ci.yml) - CI 验证流程。
- [.github/workflows/release-stable.yml](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/release-stable.yml) - 稳定版手动发布。
- [.github/workflows/release-beta.yml](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/release-beta.yml) - beta 手动发布。

</details>

# 测试、CI、发布与运维边界

Open Design 的质量边界覆盖 TypeScript 类型、monorepo 构建、E2E mock、sidecar prebuild 和平台打包。它的测试不是只跑一个前端命令，因为 daemon、desktop、packaged 和 web 都会影响最终体验。

## 根脚本

根 `package.json` 定义 `od` CLI bin、`tools-dev`、`tools-pack`、build、test、typecheck、lint/residual 等脚本。[package.json:9-25](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json) Node/pnpm 引擎约束也在根包里，CI 和本地开发都应遵守。[package.json:31-40](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json)

## E2E 覆盖

`e2e/package.json` 提供 vitest、typecheck、Playwright 和 live adapter test 等脚本。[e2e/package.json:6-12](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/package.json) `e2e/specs/app.spec.ts` 通过 localStorage mock、agents mock 和 run artifact SSE mock 覆盖入口流、问题表单限制和 artifact 交付。[e2e/specs/app.spec.ts:5-43](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/specs/app.spec.ts) [e2e/specs/app.spec.ts:93-174](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/specs/app.spec.ts) [e2e/specs/app.spec.ts:231-260](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/e2e/specs/app.spec.ts)

## App config 测试

最新主线增加了 app-config 单元测试，覆盖缺失/损坏 JSON、未知键过滤、无效字段过滤、合并与清空、agentModels 校验，以及 corrupted existing file 的写入恢复。[apps/daemon/tests/app-config.test.ts:30-187](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/tests/app-config.test.ts) HTTP guard 测试则验证无 Origin 的同源请求、可信 Web port、恶意 Origin 和错误 Host 的通过/拒绝行为。[apps/daemon/tests/app-config.test.ts:219-354](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/tests/app-config.test.ts)

## CI

`.github/workflows/ci.yml` 的 validate job 会设置 pnpm/Node、安装依赖、prebuild daemon/desktop/web sidecar，然后执行 typecheck、residual、test 和 build。[.github/workflows/ci.yml:27-87](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/ci.yml)

这说明 PR 不能只验证 Web 编译；daemon 和 desktop sidecar 预构建也是主线质量门。

## 发布

稳定版发布是手动 workflow，支持 `mac_signed` 输入，先生成 metadata，再做 verify，然后构建 mac 和 Windows 包。[.github/workflows/release-stable.yml:1-100](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/release-stable.yml) beta 发布也走手动 workflow，metadata 和 mac/win beta 构建分开。[.github/workflows/release-beta.yml:1-168](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/.github/workflows/release-beta.yml)

发布 workflow 中的注释显示某些测试会因 i18n drift 等原因被策略性跳过或分层处理，因此判断发布质量时要看 workflow 的真实步骤，而不是只看 package scripts。

## 运维排查顺序

| 症状 | 优先检查 |
| --- | --- |
| Web 打不开 daemon | daemon `/health`、Web bootstrap 配置、sidecar logs。 |
| Agent 不出现 | `apps/daemon/src/agents.ts` 探测、PATH、模型缓存、adapter detect。 |
| Run 中断或 UI 不恢复 | run store TTL、SSE replay、ProjectView reattach。 |
| Artifact 不能预览 | manifest 解析、srcdoc sandbox、FileViewer/PreviewModal。 |
| 桌面包启动失败 | packaged sidecar stamp/log、BrowserWindow web URL 轮询、平台 env。 |
| CI 失败但本地正常 | Node/pnpm 版本、prebuild sidecar、workflow 是否跳过某类测试。 |

## 相关页面

- [Desktop、Sidecar 与本地生命周期](desktop-packaging-lifecycle.md)
- [Agent 适配器与运行链路](agent-runtime.md)
