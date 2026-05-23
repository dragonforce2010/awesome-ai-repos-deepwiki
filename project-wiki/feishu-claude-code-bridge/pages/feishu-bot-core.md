<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/bot/channel.ts](../../../project-repos/feishu-claude-code-bridge/src/bot/channel.ts)
- [src/bot/pending-queue.ts](../../../project-repos/feishu-claude-code-bridge/src/bot/pending-queue.ts)
- [src/bot/process-pool.ts](../../../project-repos/feishu-claude-code-bridge/src/bot/process-pool.ts)

</details>

# 飞书 Bot 消息与连接管理

飞书开放平台为低开销机器人提供了 WebSocket（长连接）消息网关服务。在 `feishu-claude-code-bridge` 中，WebSocket 长连接的管理、事件的捕获分配，以及消息的高并发调度，皆由 `src/bot/channel.ts` 作为核心管线串联起来。

## 飞书 WebSocket 网络参数调优

长连接建立与保活是 Bot 健壮性的根基。项目使用了飞书 Node SDK 的底层长连接能力，并在配置上做出了极其针对性的优化：

- **`wsConfig.pingTimeout: 3`**：将 WebSocket 层的 liveness 心跳无响应超时阈值压缩到 3 秒。一旦在 3 秒内心跳丢包或网络死角导致无响应，网关会果断强制触发连接自愈重连。
- **`handshakeTimeoutMs: 8000`**：长连接握手超时时间限定为 8 秒，缩短了不稳定网络下的失败重连周期。
- **`safety.chatQueue: { enabled: false }`**：禁用飞书 SDK 自带的串行队列。
  > [!NOTE]
  > 飞书 SDK 默认对同一个聊天会话的所有消息强行串行化消费，这会导致用户连发的消息必须等上一条完全回复后才能处理，阻断了合并与抢占的可能。为了自己掌握调度主动权，宿主将其关闭。

Sources: [src/bot/channel.ts:140-174](../../../project-repos/feishu-claude-code-bridge/src/bot/channel.ts#L140-L174)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/bot/channel.ts:140-174`

```typescript
  const opts: LarkChannelOptions = {
    appId: cfg.accounts.app.id,
    appSecret,
    domain: cfg.accounts.app.tenant === 'lark' ? Domain.Lark : Domain.Feishu,
    source: 'lark-channel-bridge',
    loggerLevel: LoggerLevel.info,
    logger: buildQuietLogger(),
    policy: {
      dmMode: 'open',
      requireMention: false,
      respondToMentionAll: false,
    },
    // Disable per-chat serialization so we can implement our own
    // debounce + run-chain policy (see pending-queue + runChain below).
    safety: {
      chatQueue: { enabled: false },
    },
    // Attach raw Feishu event body to normalized events so we can read fields
    // the normalizer drops (e.g. action.form_value on CardKit 2.0 form submits).
    includeRawEvent: true,
    outbound: {
      streamThrottleMs: 400,
    },
    // SDK 1.65.0-alpha.3+ knobs.
    wsConfig: {
      // 3s liveness watchdog: if no inbound message arrives within 3s after
      // the last ping, SDK presumes connection dead and forces a reconnect.
      pingTimeout: 3,
    },
    // 8s handshake timeout (replaces hardcoded 15s). Fast-fail + fast-retry
    // beats slow-fail in unstable networks.
    handshakeTimeoutMs: 8_000,
    // Optional WS-layer proxy agent (only when HTTPS_PROXY / HTTP_PROXY env set).
    ...(netOverrides.agent ? { agent: netOverrides.agent } : {}),
  };
```

<!-- source-snippets:end -->
</details>

## 消息防抖并发排队策略 (PendingQueue)

在多人协作、群聊或网络延迟引发消息重发的场景中，为了防止频繁调起 Claude Code CLI 子进程造成算力资源浪费，Bridge 宿主开发了自研的防抖队列 `PendingQueue`。

`PendingQueue` 的设计基于以下机制：
1. 每个聊天会话（`scope`）都有一个独立的消息数组缓冲区。
2. 当有新消息进入时，会启动一个 **600ms 的静默窗口** 定时器（`DEBOUNCE_MS = 600`）。
3. 如果在此窗口内没有收到该会话的新消息，则“冲刷 (flush)”缓冲区，将这段时间内的所有消息合并成一个 `Batch` 并推向进程池执行。
4. **运行锁机制 (Blocking)**：在 `Batch` 推送给子进程执行的瞬间，`PendingQueue` 会将该 `scope` **加锁阻塞**。即使在运行中用户再次发送新消息，消息也只会被推入缓冲区堆积而**绝不会触发新的进程执行**。
5. 当子进程执行完毕释放后，系统解除对 `scope` 的阻塞并重新计算 600ms 的静默窗口，将运行期间堆积的消息作为下一个 `Batch` 一并送出。

```mermaid
graph TD
  UserMsg["用户发消息 (A)"] --> PQ["PendingQueue 接收"]
  PQ --> |"设置 600ms 定时器"| Timer["防抖定时器"]
  
  alt 600ms 内又有新消息 (B)
    UserMsg2["用户发消息 (B)"] --> PQ
    PQ --> |"重置 600ms 定时器"| Timer
  else 600ms 内无新消息 (定时器触发)
    Timer --> |"加锁 Block 该 scope"| Exec["创建进程执行 ❲A, B❳"]
  end
  
  alt 执行期间新进消息 (C)
    UserMsg3["用户发消息 (C)"] --> PQ
    Note over PQ: 消息 C 进入缓存区堆积，不触发执行
  end
  
  Exec --> |"执行结束"| Unlock["解锁 Unblock 该 scope"]
  Unlock --> |"重新启动 600ms 计时"| Timer2["防抖定时器"]
  Timer2 --> |"触发执行"| Exec2["创建进程执行 ❲C❳"]
```

Sources: [src/bot/pending-queue.ts:1-120](../../../project-repos/feishu-claude-code-bridge/src/bot/pending-queue.ts#L1-L120)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/bot/pending-queue.ts:1-120`

```typescript
import type { NormalizedMessage } from '@larksuiteoapi/node-sdk';
import { log } from '../core/logger';

interface PendingEntry {
  messages: NormalizedMessage[];
  timer?: NodeJS.Timeout;
}

export type FlushHandler = (scope: string, batch: NormalizedMessage[]) => void;

/**
 * Per-scope debounce queue. `scope` is the session scope string (typically
 * `chatId` for p2p / regular group, `chatId:threadId` for topic groups).
 * Accumulates messages within the same scope inside a quiet window, then
 * flushes as a single batch.
 *
 * `block(scope)` pauses the debounce timer while an agent run is active on
 * that scope — pushed messages still accumulate but no flush fires until
 * `unblock(scope)`, which arms a fresh quiet window.
 *
 * Commands should bypass this queue — they're cheap and should be responsive.
 */
export class PendingQueue {
  private readonly map = new Map<string, PendingEntry>();
  private readonly blocked = new Set<string>();
  private readonly delayMs: number;
  private readonly onFlush: FlushHandler;

  constructor(delayMs: number, onFlush: FlushHandler) {
    this.delayMs = delayMs;
    this.onFlush = onFlush;
  }

  push(scope: string, msg: NormalizedMessage): number {
    const existing = this.map.get(scope);
    if (existing) {
      if (existing.timer) clearTimeout(existing.timer);
      existing.messages.push(msg);
      existing.timer = this.blocked.has(scope) ? undefined : this.armTimer(scope);
      return existing.messages.length;
    }
    this.map.set(scope, {
      messages: [msg],
      timer: this.blocked.has(scope) ? undefined : this.armTimer(scope),
    });
    return 1;
  }

  cancel(scope: string): NormalizedMessage[] {
    const entry = this.map.get(scope);
    if (!entry) return [];
    if (entry.timer) clearTimeout(entry.timer);
    this.map.delete(scope);
    return entry.messages;
  }

  cancelAll(): void {
    for (const entry of this.map.values()) {
      if (entry.timer) clearTimeout(entry.timer);
    }
    this.map.clear();
    this.blocked.clear();
  }

  /** Pause the debounce timer; pushed messages keep accumulating. */
  block(scope: string): void {
    if (this.blocked.has(scope)) return;
    this.blocked.add(scope);
    const entry = this.map.get(scope);
    if (entry?.timer) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
    }
    log.info('queue', 'blocked', { scope, queued: entry?.messages.length ?? 0 });
  }

  /** Resume the debounce timer; arms a fresh quiet window if anything queued. */
  unblock(scope: string): void {
    if (!this.blocked.has(scope)) return;
    this.blocked.delete(scope);
    const entry = this.map.get(scope);
    log.info('queue', 'unblocked', { scope, queued: entry?.messages.length ?? 0 });
    if (!entry || entry.messages.length === 0) return;
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = this.armTimer(scope);
  }

  private armTimer(scope: string): NodeJS.Timeout {
    return setTimeout(() => this.flush(scope), this.delayMs);
  }

  private flush(scope: string): void {
    const entry = this.map.get(scope);
    if (!entry) return;
    this.map.delete(scope);
    try {
      this.onFlush(scope, entry.messages);
    } catch (err) {
      log.fail('queue', err, { scope, batchSize: entry.messages.length });
    }
  }
}
```

<!-- source-snippets:end -->
</details>

## 并发控制进程池 (ProcessPool)

由于本地 Claude 运行时高度消耗 CPU 及内存资源，宿主设计了基于 Semaphore（信号量）的 `ProcessPool`。
- **动态读取配置**：每次进程池在获取（`acquire`）运行时，都会实时读取 `preferences.maxConcurrentRuns` 的当前值，实现了不需要重启 Bot 即可在飞书内通过 `/config` 实时更改并发数限额。
- **全链路锁机制**：获取到空闲卡槽后才会真正进入 `runAgentBatch`，执行完毕后在 `finally` 块中归还卡槽，确保了本地运行环境不被大量并发请求压垮。

Sources: [src/bot/process-pool.ts:1-75](../../../project-repos/feishu-claude-code-bridge/src/bot/process-pool.ts#L1-L75)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/bot/process-pool.ts:1-75`

```typescript
import { log } from '../core/logger';

/**
 * FIFO concurrency cap for claude runs. Especially useful in topic-group
 * scenarios where each topic spawns its own run — without a cap, a single
 * busy group could trivially explode to dozens of concurrent claude
 * subprocesses, drowning RAM and Anthropic API rate limit.
 *
 * Use:
 *   const pool = new ProcessPool();
 *   const release = await pool.acquire();
 *   try { ... } finally { release(); }
 *
 * The cap is read fresh each `acquire()`, so `/config maxConcurrentRuns`
 * takes effect for the next run that asks for a slot.
 */
export class ProcessPool {
  private active = 0;
  private readonly waiters: Array<() => void> = [];
  /** Snapshot of the cap captured at the moment acquire() decided to wait. */
  private cap: () => number;

  constructor(cap: () => number) {
    this.cap = cap;
  }

  async acquire(): Promise<() => void> {
    if (this.active < this.cap()) {
      this.active++;
      log.info('pool', 'acquired', { active: this.active, cap: this.cap() });
      return () => this.release();
    }
    log.info('pool', 'wait', { active: this.active, cap: this.cap(), waiting: this.waiters.length + 1 });
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active++;
    log.info('pool', 'acquired', { active: this.active, cap: this.cap() });
    return () => this.release();
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    log.info('pool', 'released', { active: this.active });
    // Wake the next waiter if there's headroom. If cap was just lowered
    // via /config, this naturally throttles by not waking.
    if (this.active < this.cap() && this.waiters.length > 0) {
      const next = this.waiters.shift();
      if (next) next();
    }
  }

  snapshot(): { active: number; waiting: number; cap: number } {
    return { active: this.active, waiting: this.waiters.length, cap: this.cap() };
  }
}
```

<!-- source-snippets:end -->
</details>

## 预期 API 错误静音适配器

在调试和使用飞书文档的高级功能时，系统往往需要试探性地去查询 wiki 目录或云文档评论。如果节点或评论不存在，飞书 API 会返回诸如 `131005` 或 `1069307` 等状态码，这属于正常的业务逻辑分支。
- **痛点**：飞书官方 Node SDK 在捕获这些 API 返回码时，会以强烈的 `error` 级别将整个堆栈打印在控制台和输出日志里，造成严重的日志噪音干扰。
- **解法**：通过 `buildQuietLogger` 自定义了一个 Quiet Logger，过滤掉 `SUPPRESSED_API_ERROR_CODES` 中的特定错误码，避免误导系统管理员。

Sources: [src/bot/channel.ts:50-92](../../../project-repos/feishu-claude-code-bridge/src/bot/channel.ts#L50-L92)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/bot/channel.ts:50-92`

```typescript
// Lark SDK logs API errors at error level even when the caller catches them.
// These specific codes are EXPECTED in our flow (wiki-node lookup that
// usually misses, fileComment.get that we deliberately let fall back to
// .list) and the surrounding noise is already covered by our own logs.
const SUPPRESSED_API_ERROR_CODES = new Set([
  131005, // wiki.space.getNode "not found" — the doc isn't a wiki node
  1069307, // drive.fileComment.get "not exist" — fall back to .list
  1069302, // drive.fileCommentReply.create — whole-doc comments don't accept replies; fall back to fileComment.create
]);

function buildQuietLogger(): {
  error: (...m: unknown[]) => void;
  warn: (...m: unknown[]) => void;
  info: (...m: unknown[]) => void;
  debug: (...m: unknown[]) => void;
  trace: (...m: unknown[]) => void;
} {
  // Match either `{ code: <feishu-code> }` (the response data SDK logs as
  // its second arg) or an AxiosError where the feishu code lives at
  // `err.response.data.code` (which the SDK logs raw).
  const codeFromObj = (m: unknown): number | undefined => {
    if (!m || typeof m !== 'object') return undefined;
    const top = (m as { code?: unknown }).code;
    if (typeof top === 'number') return top;
    const nested = (m as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
    return typeof nested === 'number' ? nested : undefined;
  };
  const isSuppressed = (msg: unknown): boolean => {
    if (Array.isArray(msg)) return msg.some(isSuppressed);
    const code = codeFromObj(msg);
    return code !== undefined && SUPPRESSED_API_ERROR_CODES.has(code);
  };
  return {
    error: (...args: unknown[]) => {
      if (args.some(isSuppressed)) return;
      log.warn('sdk', 'error', { args: stringifyArgs(args) });
    },
    warn: (...args: unknown[]) => log.warn('sdk', 'warn', { args: stringifyArgs(args) }),
    info: (...args: unknown[]) => log.info('sdk', 'info', { args: stringifyArgs(args) }),
    debug: () => {},
    trace: () => {},
  };
}
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [系统架构与进程模型](system-architecture.md) — 探究宿主与进程的宏观连接
- [Claude CLI 集成与适配器](claude-integration.md) — 合并后的 Prompt 是如何输入给适配器的
- [交互式卡片渲染与分发](interactive-cards.md) — 消息流完成后最终展示给用户的卡片设计
