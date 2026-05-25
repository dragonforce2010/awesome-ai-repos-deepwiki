<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/wrapper/types/runtime.ts](../../../project-repos/deputy-agent/src/wrapper/types/runtime.ts)
- [src/wrapper/types/capability.ts](../../../project-repos/deputy-agent/src/wrapper/types/capability.ts)
- [src/wrapper/adapters/claude/runtime.ts](../../../project-repos/deputy-agent/src/wrapper/adapters/claude/runtime.ts)
- [docs/PROVIDERS.md](../../../project-repos/deputy-agent/docs/PROVIDERS.md)

</details>

# Provider 适配层

Host 只认识 **`AgentRuntime`**：六个必选方法（`startSession`、`inject`、`abortTurn`、`closeSession`、`status`、`subscribe`）加上按 capability 可选的 `compact`、`contextUsage`、`resumeSession`、`isolationSelfCheck`。Claude Agent SDK 与 Codex app-server 的细节全部封在 `src/wrapper/adapters/*`，上层 tick 循环与 stage 机零 `#ifdef provider`。

## 接口形状

```typescript
// 概念摘录 — 见 runtime.ts
interface AgentRuntime {
  readonly providerId: ProviderId;
  readonly capabilities: RuntimeCapabilities;
  startSession(req: SessionRequest): Promise<SessionHandle>;
  inject(handle, input): Promise<InjectAck>;
  // ...
  compact?(handle, hint?): Promise<CompactOutcome>;  // 仅当 capability 为 true
}
```

`SessionRequest` 携带 model selector、thinking 配置、path guards、host tool registry 等；adapter 负责把统一请求翻译成 SDK 调用，并把原始事件 **normalize** 成 `SessionEvent` 联合类型（turn、tool、compact…）。

## 已实现的 adapter

| Provider | 目录 | 用途 |
|----------|------|------|
| `claude` | `adapters/claude/` | 生产默认；preflight hook 做 tool  enforcement |
| `codex` | `adapters/codex/` | 可选；OS sandbox `writableRoots` 约束写路径 |
| `stub` | `adapters/stub.ts` | 离线/测试，无真实 LLM |

`ProviderId` 类型还列出 `opencode`、`pi`，但 **无 runtime 实现**——绑定会沿 fallback 链警告，强制构建则 not-implemented 错误。

## 能力矩阵差异（可观测行为）

LIMITATIONS 文档列了几条会改变 Host 行为的差异：

| 能力点 | Claude | Codex | 对 Host 的影响 |
|--------|--------|-------|----------------|
| compact 摘要可观察 | 是 | 否 | Watcher compaction 模式 strict vs lenient |
| 自定义 compact 指令 | 是 | 否 | Codex 下忽略 custom summary instruction |
| Tool enforcement | preflight hook | sandbox 路径 | Meta 写 harness 时 Codex 降级为 prompt 约束 |
| Session resume | 不支持 fromProviderId | 支持 | Worker 多 attempt 恢复策略不同 |
| 禁用 auto-retry | 不支持 | 支持 | Claude 上 disable 请求 fail-fast |

Host 在调用可选成员前 **必须** 读 `capabilities`——adapter 通过「成员是否存在」表达支持，而不是运行时抛 vague error。

## 事件流与 Host tools

Adapter 把 tool call 桥接到 `HostToolRegistry`（`createHostToolRegistry`）。Worker 调 `sh_msg__notify_meta` 时，实际是 runtime 收到 tool_use → Host handler → messaging bus enqueue——Provider 侧只见 JSON schema 定义的 host tool。

Sources: [src/wrapper/types/runtime.ts:1-38](../../../project-repos/deputy-agent/src/wrapper/types/runtime.ts#L1-L38), [docs/LIMITATIONS.md:18-53](../../../project-repos/deputy-agent/docs/LIMITATIONS.md#L18-L53), [docs/ARCHITECTURE.md:145-154](../../../project-repos/deputy-agent/docs/ARCHITECTURE.md#L145-L154)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/wrapper/types/runtime.ts:1-38`

```typescript
/**
 * The top-level AgentRuntime interface: the stable surface the wrapper exposes to the host.
 * Each provider implements one.
 *
 * Optional members (compact / contextUsage / resumeSession / isolationSelfCheck) are present only
 * when the matching capability is true; the host must check the capability before calling them.
 */
import type { ProviderId, Unsubscribe } from "./common.js";
import type { CompactHint, CompactOutcome, RuntimeCapabilities } from "./capability.js";
import type { ContextUsage, SessionEvent } from "./events.js";
import type { IsolationSelfCheckResult } from "./isolation.js";
import type {
  CloseOptions,
  InjectAck,
  InjectInput,
  SessionCloseResult,
  SessionHandle,
  SessionRequest,
  SessionResumeTarget,
  SessionStatus,
} from "./session.js";

export interface AgentRuntime {
  readonly providerId: ProviderId;
  readonly capabilities: RuntimeCapabilities;

  startSession(req: SessionRequest): Promise<SessionHandle>;
  inject(handle: SessionHandle, input: InjectInput): Promise<InjectAck>;
  abortTurn(handle: SessionHandle, reason?: string): Promise<void>;
  closeSession(handle: SessionHandle, options?: CloseOptions): Promise<SessionCloseResult>;
  status(handle: SessionHandle): SessionStatus;
  subscribe(handle: SessionHandle, listener: (event: SessionEvent) => void): Unsubscribe;

  compact?(handle: SessionHandle, hint?: CompactHint): Promise<CompactOutcome>;
  contextUsage?(handle: SessionHandle): Promise<ContextUsage>;
  resumeSession?(handle: SessionHandle, target: SessionResumeTarget): Promise<void>;
  isolationSelfCheck?(handle: SessionHandle): Promise<IsolationSelfCheckResult>;
}
```

#### `docs/LIMITATIONS.md:18-53`

```markdown
## Providers

- **Only `claude` and `codex` are implemented.** The `ProviderId` type also lists `opencode`
  and `pi`, and they appear in `ALL_PROVIDER_IDS`, but no runtime adapter exists for them
  (the adapter set is `claude`, `codex`, and a `stub`). Binding a role to `opencode` or `pi`
  via `deputy.config.json` falls back along the role-binding priority chain with a warning; if
  a binding forces an unimplemented provider's runtime to be built, it raises a clear
  not-implemented error rather than starting.

- **Provider capabilities differ, and the difference is observable.** Each provider publishes
  a `RuntimeCapabilities` matrix and the host checks it before using an optional member. Some
  capabilities present on one provider are absent on another, so a role's behavior depends on
  the provider it is bound to:
  - *Context-compaction summary observation* — Claude reports `compact.canObserveSummary:
    true`; Codex reports `false`. When the watcher is bound to a provider that cannot observe
    the summary, the watcher compaction mode falls back to `lenient` (the host manages the
    summary itself) instead of the default `strict`.
  - *Custom compaction instructions* — Claude accepts custom summary instructions
    (`acceptsCustomInstructions: true`); Codex does not (`false`), so such instructions are
    not applied under Codex.
  - *Tool enforcement* — Claude enforces tools via a preflight hook and can disable high-risk
    built-ins; Codex has no preflight-hook path and bounds writes via an OS sandbox
    (`writableRoots`) instead. As a result, when Codex acts as meta, the harness write
    protection that Claude enforces via a hook is not enforced and degrades to a prompt-level
    constraint.
  - *Session resume* — Codex can resume from a provider session id (`fromProviderId: true`);
    Claude cannot (`false`). Neither adapter resumes from a file or forks at an entry.
  - *Auto-retry disable* — Codex can disable auto-retry; the Claude adapter reports
    `canDisable: false`, so a request to disable auto-retry under Claude fails fast with
    `not_supported`.

- **Some Codex capabilities are reported as unavailable pending verification.** The Codex
  adapter attaches `warn` diagnostic hints (e.g. isolation transport, OAuth provisioning,
  built-in tool control) and conservatively reports the corresponding capabilities as `false`
  rather than claiming support. The Claude adapter similarly attaches a
  `claude_ts_api_unverified` hint covering its TS SDK surface.
```

#### `docs/ARCHITECTURE.md:145-154`

```markdown
## Provider adapter layer (summary)

The host talks only to an `AgentRuntime`: start / inject / abort / close a session, query
its status, and subscribe to its normalized events — plus optional members (`compact`,
`contextUsage`, `resumeSession`, `isolationSelfCheck`) that exist only when the matching
capability is declared. Each provider publishes a `RuntimeCapabilities` matrix; the host
checks a capability before calling its optional member rather than discovering a gap at
runtime. Roles are bound to providers per task and resolved to a concrete
`(runtime, model, isolation)` triple before any session starts. Full surface in
[PROVIDERS.md](PROVIDERS.md).
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [Host 守护进程与 Tick 循环](host-daemon-runtime.md) — RoleResolver 与会话启动
- [局限性与质量现状](limitations-quality.md) — 0.1.0 对 Claude 调优、Codex 弱表现
- [Host 工具与 Harness](host-tools-harness.md) — 工具如何注册进 runtime
