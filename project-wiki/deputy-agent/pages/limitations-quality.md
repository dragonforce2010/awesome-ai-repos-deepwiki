<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [docs/LIMITATIONS.md](../../../project-repos/deputy-agent/docs/LIMITATIONS.md)
- [package.json](../../../project-repos/deputy-agent/package.json)
- [README.md](../../../project-repos/deputy-agent/README.md)

</details>

# 局限性与质量现状

Deputy 0.1.0 在 README 里被作者定位为 **reference implementation**——更高层设计 spec 不在本仓库，当前 TypeScript 近乎编译产物。读 DeepWiki 时要把「架构意图」与「shipped 代码边界」分开：下面每条都来自 LIMITATIONS 与 manifest/脚本的可观测事实。

## 成熟度与范围

- **非作者心中的 production-grade**；.harness 与 prompt 主要按 **Claude** 调优，Codex/GPT 表现较弱。
- **仅任务级记忆**：workspace 文件 + Worker 多 session 持久化；**跨任务经验复用、外部 know-how 注入** 在 0.1.0 未实现。
- **通用白领任务导向**，不是 coding agent 替代品——没有 repo index、PR、IDE LSP 一等公民集成。

## Provider 缺口

- 仅 **claude / codex / stub** 有 adapter；`opencode`、`pi` 在类型里占位但无实现。
- Capability 差异会改变 Watcher compaction、Meta harness 写保护、session resume 等**可观测行为**（详见 [Provider 适配层](provider-adapters.md)）。
- Codex adapter 对部分能力保守报 `false` 并附 `warn` diagnostic；Claude adapter 亦有 `claude_ts_api_unverified` 提示——Host 据此 fail-fast 而非假装支持。

## Host 与 Web 运维约束

- **每任务单 Host**；`host.pid.lock` 冲突即退出 code 6。
- 部分 CLI 操作要求 Host 未运行（如 `delete`）。
- Web：**loopback only**、无 auth、SSE 为 fs.watch + 2s reconcile，可能出现 `lag` 事件需 REST 重 hydrate；multipart submit 可 **partial success**（部分 upload 失败列入 `failed`）。

## 质量门禁

`package.json` scripts：

```json
"typecheck": "tsc -p tsconfig.json",
"build": "tsc -p tsconfig.build.json && node scripts/copy-web-static.mjs",
"check": "npm run typecheck && npm run build"
```

**无 jest/vitest/playwright**——开源导出包不含自动化测试目录。CI workflow 在本 inventory 中 **未检测到**。贡献者需依赖类型系统、手工跑 Web/CLI、以及作者内部测试（未公开）。

## 版本与演进风险

README 警告：因代码来自更高层 spec 的编译输出，**未来版本可能大幅变动**——fork 并期望 upstream merge 需心理预期。0.1.0 亦明确 cross-task memory 等为后续方向。

Sources: [docs/LIMITATIONS.md:6-16](../../../project-repos/deputy-agent/docs/LIMITATIONS.md#L6-L16), [docs/LIMITATIONS.md:84-87](../../../project-repos/deputy-agent/docs/LIMITATIONS.md#L84-L87), [README.md:37-51](../../../project-repos/deputy-agent/README.md#L37-L51)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/LIMITATIONS.md:6-16`

```markdown
## Scope and maturity

- **0.1.0 reference implementation.** This is a reference implementation; by the author's
  quality bar it is not yet production-grade and benefits from further polishing.
- **Tuned primarily for Claude.** Harness behavior is model-dependent; the system is tuned
  mainly for Claude, and Codex / GPT models currently perform less well (see *Providers* below
  for the concrete capability differences).
- **Task-level memory only.** Agents coordinate through workspace files and the worker's
  multi-session state persists on disk, but reuse of experience across tasks, and injection of
  external know-how / tools beyond what the harness bundles, are not implemented in this
  release.
```

#### `docs/LIMITATIONS.md:84-87`

```markdown
## Testing

- **No automated tests are included in this open-source export.** The package defines only
  `typecheck`, `build`, and `check` scripts; no test runner or test suite is shipped here.
```

#### `README.md:37-51`

```markdown
## Project status

This is the **0.1.0** release, and a *reference implementation* of a higher-level design: the
open-source TypeScript here is essentially the compiled output of that higher-level spec. The
spec and many of the detailed design principles are not part of this repository.

- Because the published code is a compiled artifact, **future versions may change
  substantially** — keep this in mind if you fork and intend to merge later releases.
- Behavior is currently tuned primarily for **Claude**; **Codex / GPT models perform less
  well** today, since harness behavior is model-dependent.
- It is **not yet production-grade** by the author's quality bar and needs further polishing,
  though it may already exceed the tuning of some shipped products.
- Cross-task memory and external know-how injection are **not implemented in 0.1.0** (only
  task-level, file-system memory exists today). See
  [docs/LIMITATIONS.md](docs/LIMITATIONS.md).
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [项目概览](overview.md) — 产品承诺 vs 0.1.0 边界
- [Provider 适配层](provider-adapters.md) — capability 差异表
- [CLI 与 Web GUI](cli-web-gui.md) — loopback 与 SSE 限制
