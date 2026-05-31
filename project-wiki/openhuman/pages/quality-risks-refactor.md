<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [docs/TEST-COVERAGE-MATRIX.md](../../project-repos/openhuman/docs/TEST-COVERAGE-MATRIX.md)
- [docs/SECURITY_AUDIT.md](../../project-repos/openhuman/docs/SECURITY_AUDIT.md)
- [Cargo.toml](../../project-repos/openhuman/Cargo.toml)

</details>

# 代码质量与重构建议

工业级审计结论：**工程成熟度高（测试矩阵庞大）但域复杂度极高**，新贡献者应先选垂直 slice 而非横切 refactor。

## 质量评分（10 分制）

| 维度 | 分数 | 理由 |
|------|------|------|
| 可维护性 | 7 | 模块边界清晰，但 100+ domain 认知负担大 |
| 可扩展性 | 8 | tool_registry + MCP + composio 插件面成熟 |
| 健壮性 | 7 | 大量 e2e/raw_coverage，Beta 仍可能有 schema 变动 |
| 安全性 | 6.5 | 有 audit 与 jail，但 MCP/CEF/Composio 扩大面 |
| 性能 | 7 | TokenJuice + SQLite cache 优化到位；多 worker 写锁仍需关注 |

## 优先修复项

1. **SQLite 写争用** — 继续监控 `chunks.db` BUSY；考虑读写分离或 queue 单写者  
2. **托管依赖降级路径** — 文档化 fully-local 最小配置矩阵  
3. **RPC 面版本化** — 移动端/远程 transport 与 desktop method 契约测试  
4. **GPL 合规** — 衍生产品 legal review  

## 架构层优化方向

- 将 `openhuman` mega-crate 按 **memory / agent / channels** 拆 workspace crate（长期）  
- 统一 observability story（Sentry + OTEL 已部分接入）  
- Subconscious 与 Memory Tree job queue 合并调度，减 duplicate LLM tick  

## 重构落地方案（分阶段）

**Phase 1（低风险）**：为新 RPC 强制 schema 注册 + Playwright smoke  
**Phase 2**：Memory Tree 单写者 job runner，消除四 worker 轮询  
**Phase 3**：extract `inference` 与 `memory_store` 为独立 crate，缩短 compile time  

**Insight**：`tests/*raw_coverage_e2e.rs` 文件命名揭示团队用 **覆盖率驱动** 补齐 Composio/推理等高风险域——读测试目录比读文档更快建立心理地图。

## 相关页面

- [安全与隐私边界](security-privacy.md)
- [内存存储与数据库模型](memory-store-schema.md)
- [CI/CD 与发布](ci-deployment.md)

Sources: [docs/TEST-COVERAGE-MATRIX.md:1-80](../../../project-repos/openhuman/docs/TEST-COVERAGE-MATRIX.md#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `docs/TEST-COVERAGE-MATRIX.md:1-80`

```markdown
# Test Coverage Matrix

Canonical mapping of every product feature to its test source(s). Drives gap-fill PRs (#967, #968, #969, #970, #971) under epic #773.

**Status legend**

| Symbol | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| ✅     | Covered — at least one test asserts the behaviour                       |
| 🟡     | Partial — touched by a broader spec, no dedicated assertion             |
| ❌     | Missing — no test today                                                 |
| 🚫     | Not driver-automatable — manual smoke (release-cut checklist, see #971) |

**Layer abbreviations**

| Code | Layer                                                                                |
| ---- | ------------------------------------------------------------------------------------ |
| `RU` | Rust unit (`#[cfg(test)]` inside `src/`)                                             |
| `RI` | Rust integration (`tests/*.rs`)                                                      |
| `VU` | Vitest unit (`app/src/**/*.test.ts(x)`)                                              |
| `WD` | WDIO E2E (`app/test/e2e/specs/*.spec.ts`) — Linux `tauri-driver` + macOS Appium Mac2 |
| `MS` | Manual smoke (release-cut checklist)                                                 |

**Update contract** — when a PR adds, removes, or changes a feature leaf, the matrix row must be updated in the same PR. Tracking guard: see #965.

---

## 0. Application Lifecycle

### 0.1 Application Download

| ID    | Feature                      | Layer | Test path(s)                    | Status | Notes                                 |
| ----- | ---------------------------- | ----- | ------------------------------- | ------ | ------------------------------------- |
| 0.1.1 | Direct Download Access       | MS    | release-manual-smoke (see #971) | 🚫     | DMG hosting + version landing page    |
| 0.1.2 | Version Compatibility Check  | MS    | release-manual-smoke            | 🚫     | Driver cannot assert OS-version gates |
| 0.1.3 | Corrupted Installer Handling | MS    | release-manual-smoke            | 🚫     | Mutated DMG validation; manual repro  |

### 0.2 Installation & Launch

| ID    | Feature                         | Layer | Test path(s)         | Status | Notes                                    |
| ----- | ------------------------------- | ----- | -------------------- | ------ | ---------------------------------------- |
| 0.2.1 | DMG Installation Flow           | MS    | release-manual-smoke | 🚫     | OS-level Finder drag                     |
| 0.2.2 | Gatekeeper Validation           | MS    | release-manual-smoke | 🚫     | OS-level signature check                 |
| 0.2.3 | Code Signing Verification       | MS    | release-manual-smoke | 🚫     | `codesign --verify` capture in checklist |
| 0.2.4 | First Launch Permissions Prompt | MS    | release-manual-smoke | 🚫     | TCC prompts non-driver-automatable       |

### 0.3 Updates & Reinstallation

| ID    | Feature                       | Layer | Test path(s)                                       | Status | Notes                                 |
| ----- | ----------------------------- | ----- | -------------------------------------------------- | ------ | ------------------------------------- |
| 0.3.1 | Auto Update Check             | RU+RI+MS | `src/openhuman/update/` (Rust unit), `tests/json_rpc_e2e.rs`, release smoke | 🟡     | Core check/update policy covered; desktop prompt + release upgrade still manual |
| 0.3.2 | Forced Update Handling        | MS    | release-manual-smoke                               | 🚫     | End-to-end gating verified at release |
| 0.3.3 | Reinstall with Existing State | MS    | release-manual-smoke                               | 🚫     | Workspace persistence on reinstall    |
| 0.3.4 | Clean Uninstall               | MS    | release-manual-smoke                               | 🚫     | OS removal paths                      |

---

## 1. Authentication & Identity

### 1.1 Multi-Provider Authentication

| ID    | Feature           | Layer | Test path(s)                            | Status | Notes                                           |
| ----- | ----------------- | ----- | --------------------------------------- | ------ | ----------------------------------------------- |
| 1.1.1 | Google Login      | WD    | `app/test/e2e/specs/login-flow.spec.ts` | ✅     | Deep-link branch covered                        |
| 1.1.2 | GitHub Login      | WD    | `login-flow.spec.ts`                    | ✅     | Deep-link branch covered                        |
| 1.1.3 | Twitter (X) Login | WD    | `login-flow.spec.ts`                    | 🟡     | Generic OAuth path; assert provider tag in #968 |
| 1.1.4 | Discord Login     | WD    | `login-flow.spec.ts`                    | 🟡     | Same — discord branch unasserted                |

### 1.2 Account Management

| ID    | Feature                    | Layer | Test path(s)                                  | Status | Notes                                        |
| ----- | -------------------------- | ----- | --------------------------------------------- | ------ | -------------------------------------------- |
| 1.2.1 | Account Creation & Mapping | WD+RI | `login-flow.spec.ts`, `tests/json_rpc_e2e.rs` | ✅     |                                              |
| 1.2.2 | Multi-Provider Linking     | WD    | _missing_ — tracked #968                      | ❌     | Need spec linking 4 providers to one account |
| 1.2.3 | Duplicate Account Handling | WD    | _missing_ — tracked #968                      | ❌     | Collision UX path                            |

### 1.3 Session Management

| ID    | Feature                | Layer | Test path(s)                            | Status | Notes                     |
| ----- | ---------------------- | ----- | --------------------------------------- | ------ | ------------------------- |
```

<!-- source-snippets:end -->
</details>
