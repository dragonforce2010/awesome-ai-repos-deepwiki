<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/openhuman/memory_store/chunks/store.rs](../../project-repos/openhuman/src/openhuman/memory_store/chunks/store.rs)
- [gitbooks/developing/architecture/README.zh-CN.md](../../project-repos/openhuman/gitbooks/developing/architecture/README.zh-CN.md)

</details>

# Memory Tree 流水线

Memory Tree 解决 **长期上下文如何本地沉淀**：集成数据 → Markdown 分块 → SQLite + Obsidian vault → 嵌入/摘要树 → Agent 检索。

## 十步数据流（官方架构）

1. OAuth 连接集成  
2. 每 20 分钟 scheduler auto-fetch  
3. Provider 输出 canonical Markdown（provenance 标签）  
4. 切分为 ≤3k token chunks  
5. 写入 `memory_tree/chunks.db` + `wiki/*.md`  
6. 后台 embedding、实体、hotness  
7. 构建 source/topic 摘要树（历史 global/topic 树已迁移 purge）  
8. Agent 查询：search / drill / topic / fetch  
9. TokenJuice 压缩大块工具输出  
10. routing 选模型  

## 流水线图

```mermaid
flowchart TD
    Conn["OAuth 连接"]
    Fetch["auto-fetch scheduler"]
    Canon["canonicalize Markdown"]
    Chunk["chunk ≤3k tokens"]
    DB["chunks.db SQLite"]
    Vault["wiki/*.md"]
    Jobs["embed / entity / hotness jobs"]
    Sum["summary trees"]
    Agent["Agent recall tools"]
    Conn --> Fetch --> Canon --> Chunk
    Chunk --> DB
    Chunk --> Vault
    DB --> Jobs --> Sum
    Sum --> Agent
    DB --> Agent
```

## Chunk 生命周期

`mem_tree_chunks` 状态机：`pending_extraction` → `admitted` → `buffered` → `sealed` 或 `dropped`。Admission gate 过滤低信号内容。

**Insight**：`ConnectionCache`（#2206）把每 5s 轮询的开连接从 ~69K/天 降到单连接复用——说明 Memory Tree worker 并发写 `chunks.db` 曾是生产级 WAL/SHM I/O 告警源；`SQLITE_BUSY_TIMEOUT` 15s 是为 Windows 写锁争用调参。

## 核心业务时序：Auto-fetch _tick

```mermaid
sequenceDiagram
    participant Cron as cron/scheduler
    participant Sync as memory_sync
    participant Prov as composio provider
    participant Store as chunks store
    participant Jobs as mem_tree jobs
    Cron->>Sync: tick every 20min
    Sync->>Prov: pull active connections
    Prov-->>Sync: raw pages/emails
    Sync->>Store: upsert chunks idempotent
    Store->>Jobs: enqueue extract/embed
    Jobs->>Store: update status sealed
```

Sources: [src/openhuman/memory_store/chunks/store.rs:54-63](../../../project-repos/openhuman/src/openhuman/memory_store/chunks/store.rs#L54-L63)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/openhuman/memory_store/chunks/store.rs:54-63`

```rust
/// Chunk lifecycle: freshly persisted, awaiting the async extract job.
pub const CHUNK_STATUS_PENDING_EXTRACTION: &str = "pending_extraction";
/// Chunk lifecycle: extract ran and the chunk passed admission.
pub const CHUNK_STATUS_ADMITTED: &str = "admitted";
/// Chunk lifecycle: appended to the L0 buffer of its source tree.
pub const CHUNK_STATUS_BUFFERED: &str = "buffered";
/// Chunk lifecycle: rolled into a sealed L1 summary.
pub const CHUNK_STATUS_SEALED: &str = "sealed";
/// Chunk lifecycle: rejected by the admission gate (too low signal).
pub const CHUNK_STATUS_DROPPED: &str = "dropped";
```

<!-- source-snippets:end -->
</details>

## 相关页面

- [内存存储与数据库模型](memory-store-schema.md)
- [集成与 Composio](integrations-composio.md)
- [TokenJuice 压缩](tokenjuice-compression.md)

Sources: [src/openhuman/memory_store/chunks/store.rs:1-80](../../../project-repos/openhuman/src/openhuman/memory_store/chunks/store.rs#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/openhuman/memory_store/chunks/store.rs:1-80`

```rust
//! SQLite-backed persistence for ingested chunks (Phase 1 / issue #707).
//!
//! The store lives at `<workspace>/memory_tree/chunks.db`. Schema is applied
//! lazily on first access via `with_connection`, so the DB is created on
//! demand without an explicit migration step.
//!
//! Upsert semantics: writes are idempotent on `chunk.id` so re-ingesting the
//! same raw source yields no duplicates.
//!
//! ## Connection cache (#2206)
//!
//! `with_connection()` previously opened a new SQLite connection and re-ran
//! the full schema init (8 tables, 15+ indexes, 8+ migrations) on **every**
//! call. With 4 workers polling every 5 s this amounted to ~69K connection
//! opens/day, and a family of WAL/SHM cold-start I/O codes (1546
//! IOERR_TRUNCATE, 4618 IOERR_SHMOPEN, 4874 IOERR_SHMSIZE, 14 CANTOPEN)
//! flooded Sentry with ~19K events in 4 days.
//!
//! Fix: a process-level `ConnectionCache` keyed by DB path. Each entry holds
//! one `parking_lot::Mutex<Connection>` that is initialised once (schema +
//! migrations + legacy-embedding migration) and then reused for all subsequent
//! calls. A per-entry `CircuitBreaker` stops retrying after 3 consecutive
//! init failures for 30 s so a broken install does not busy-loop.

use anyhow::{Context, Result};
use chrono::{DateTime, TimeZone, Utc};
use rusqlite::{params, Connection, OptionalExtension, Transaction};
use std::collections::{HashMap, HashSet};
#[cfg(test)]
use std::sync::Arc;
use std::time::Duration;

use crate::openhuman::config::Config;
use crate::openhuman::memory::util::redact::{self, redact as redact_value};
use crate::openhuman::memory_store::chunks::types::{Chunk, Metadata, SourceKind, SourceRef};
use crate::openhuman::memory_store::content::StagedChunk;

const DB_DIR: &str = "memory_tree";
const DB_FILE: &str = "chunks.db";
const DEFAULT_LIST_LIMIT: usize = 100;
const MAX_LIST_LIMIT: usize = 10_000;
// 15s gives the busy-handler enough headroom that transient write-lock
// contention (4 job workers + scheduler + ingest producers all writing the
// same `memory_tree/chunks.db`) is absorbed inside rusqlite instead of
// surfacing as `SQLITE_BUSY` to callers. Workers still treat busy as a
// soft signal (see `memory_tree::jobs::worker`) so even if this is
// exceeded, the only effect is a one-poll backoff — but 15s is
// comfortably above realistic peer-write durations and shrinks the rate
// at which we have to fall back to that path. The previous 5s was tight
// enough on contended Windows hosts that we were observing avoidable
// busy returns (see OPENHUMAN-TAURI-BP).
const SQLITE_BUSY_TIMEOUT: Duration = Duration::from_secs(15);

/// Chunk lifecycle: freshly persisted, awaiting the async extract job.
pub const CHUNK_STATUS_PENDING_EXTRACTION: &str = "pending_extraction";
/// Chunk lifecycle: extract ran and the chunk passed admission.
pub const CHUNK_STATUS_ADMITTED: &str = "admitted";
/// Chunk lifecycle: appended to the L0 buffer of its source tree.
pub const CHUNK_STATUS_BUFFERED: &str = "buffered";
/// Chunk lifecycle: rolled into a sealed L1 summary.
pub const CHUNK_STATUS_SEALED: &str = "sealed";
/// Chunk lifecycle: rejected by the admission gate (too low signal).
pub const CHUNK_STATUS_DROPPED: &str = "dropped";

// `PRAGMA foreign_keys = ON` is intentionally NOT in SCHEMA — it is
// a connection-local pragma that resets to off on every new
// `Connection::open`. SCHEMA only runs once per DB path (first-init);
// applying foreign_keys here would leak FK-off into every later
// `with_connection()` call that hits the fast path. The pragma is
// set per-connection in `open_connection()` instead.

/// `PRAGMA user_version` value once the one-shot legacy→sidecar embedding
/// migration (#1574 §7) has run. `0` (fresh/legacy DB) triggers the copy on
/// next open; `>= 1` skips it. Bump only for a new one-shot data migration.
const TREE_EMBEDDING_MIGRATION_VERSION: i64 = 1;

/// `PRAGMA user_version` value once the global/topic-tree purge has run.
/// The global (time-axis) and topic (subject-axis) trees were removed; this
/// one-shot migration deletes their rows + on-disk summary folders. `< 2`
/// triggers the purge on next open; `>= 2` skips it.
```

<!-- source-snippets:end -->
</details>
