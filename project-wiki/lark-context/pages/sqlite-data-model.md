<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/db.ts](../../../project-repos/lark-context/src/db.ts)
- [src/commands/show.ts](../../../project-repos/lark-context/src/commands/show.ts)
- [src/commands/groups.ts](../../../project-repos/lark-context/src/commands/groups.ts)

</details>

# SQLite 数据模型

`raw.db` 用四张主表把**飞书侧对象**映射成 CLI 可查询的记录：`chats` 记录白名单群与同步游标，`messages` 存扁平化的消息行（含话题元数据），`docs` 存拉下来的 markdown，`kv` 给上层 workflow 放轻量状态（例如 digest 时间戳）。

```mermaid
erDiagram
  CHATS |""|--o{ MESSAGES : hosts
  CHATS {
    text alias PK
    text chat_id
    text last_cursor
    text last_pulled_at
    int enabled
  }
  MESSAGES {
    text id PK
    text chat_alias FK
    text thread_id
    int is_thread_reply
    text create_time
  }
  DOCS {
    text doc_token PK
    text content_md
    text fetched_at
  }
  KV {
    text key PK
    text value
  }
```

**线程建模**：`is_thread_reply` 区分顶层消息与话题子消息；`thread_id` 既可来自父消息，也可在子消息行上冗余，方便 `show` 用 `thread_id` 把子回复挂回父节点。

## 迁移与兼容性

`migrateMessagesColumns` 在旧库上 `ALTER TABLE` 补齐 `thread_id` / `is_thread_reply`，并用 `json_extract` 从 `content_json` 回填早期数据——这解释了为何 schema 字符串里不直接创建 `idx_messages_chat_thread`：**旧表缺列时建索引会失败**，所以索引创建被延迟到迁移之后。

## 与 `groups` 命令的一致性

`groups add` 同时更新 yaml 与 `chats` 行；`groups rm` 软禁用（`enabled=0`）而不是硬删消息，避免误操作丢历史。**pull** 在发现 yaml 有手写群但表缺行时也会 `INSERT OR REPLACE` 自愈。

Sources: [src/db.ts:5-91](../../../project-repos/lark-context/src/db.ts#L5-L91), [src/commands/show.ts:50-123](../../../project-repos/lark-context/src/commands/show.ts#L50-L123), [src/commands/groups.ts:31-89](../../../project-repos/lark-context/src/commands/groups.ts#L31-L89)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/db.ts:5-91`

```typescript
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS chats (
  alias           TEXT PRIMARY KEY,
  chat_id         TEXT NOT NULL UNIQUE,
  name            TEXT,
  last_cursor     TEXT,
  last_pulled_at  TEXT,
  enabled         INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  chat_alias      TEXT NOT NULL REFERENCES chats(alias),
  sender_id       TEXT,
  sender_name     TEXT,
  msg_type        TEXT,
  content_json    TEXT NOT NULL,
  content_text    TEXT,
  reply_to        TEXT,
  create_time     TEXT NOT NULL,
  thread_id       TEXT,
  is_thread_reply INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_time
  ON messages(chat_alias, create_time);
CREATE TABLE IF NOT EXISTS docs (
  doc_token   TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  title       TEXT,
  content_md  TEXT NOT NULL,
  fetched_at  TEXT NOT NULL,
  source      TEXT
);
CREATE TABLE IF NOT EXISTS kv (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

export function connect(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  return db;
}

export function initSchema(dbPath: string): void {
  const db = connect(dbPath);
  try {
    db.exec(SCHEMA);
    migrateMessagesColumns(db);
  } finally {
    db.close();
  }
}

function migrateMessagesColumns(db: Database.Database): void {
  const cols = db
    .prepare("PRAGMA table_info(messages)")
    .all() as Array<{ name: string }>;
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("thread_id")) {
    db.exec("ALTER TABLE messages ADD COLUMN thread_id TEXT");
  }
  if (!have.has("is_thread_reply")) {
    db.exec(
      "ALTER TABLE messages ADD COLUMN is_thread_reply INTEGER NOT NULL DEFAULT 0",
    );
  }
  // Backfill thread_id from the stored raw JSON for rows that pre-date
  // the thread_id column. Safe to run repeatedly — only touches rows
  // where thread_id is still NULL.
  db.exec(
    "UPDATE messages " +
      "SET thread_id = json_extract(content_json, '$.thread_id') " +
      "WHERE thread_id IS NULL " +
      "AND json_valid(content_json) " +
      "AND json_extract(content_json, '$.thread_id') IS NOT NULL",
  );
  // Cannot live in SCHEMA: legacy messages tables lack thread_id, so the CREATE
  // INDEX would fail there even with IF NOT EXISTS (that clause checks the
  // index name, not column validity).
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_messages_chat_thread " +
      "ON messages(chat_alias, thread_id, create_time)",
  );
}
```

#### `src/commands/show.ts:50-123`

```typescript
  const pieces: string[] = [];
  const db = connect(dbPath);
  try {
    const topStmt = db.prepare(
      "SELECT id, sender_name, content_text, create_time, thread_id " +
        "FROM messages WHERE chat_alias=? AND is_thread_reply=0 AND create_time >= ? " +
        "ORDER BY create_time",
    );
    const replyStmt = db.prepare(
      "SELECT sender_name, content_text, create_time " +
        "FROM messages WHERE chat_alias=? AND thread_id=? AND is_thread_reply=1 " +
        "ORDER BY create_time",
    );

    for (const g of targets) {
      const tops = topStmt.all(g.alias, cutoff) as Array<{
        id: string;
        sender_name: string;
        content_text: string;
        create_time: string;
        thread_id: string | null;
      }>;
      const messages: Array<{
        sender_name: string;
        content_text: string;
        create_time: string;
        is_thread_reply?: boolean;
      }> = [];
      for (const top of tops) {
        messages.push({
          sender_name: top.sender_name,
          content_text: top.content_text,
          create_time: top.create_time,
          is_thread_reply: false,
        });
        if (top.thread_id) {
          const replies = replyStmt.all(g.alias, top.thread_id) as Array<{
            sender_name: string;
            content_text: string;
            create_time: string;
          }>;
          for (const r of replies) {
            messages.push({
              sender_name: r.sender_name,
              content_text: r.content_text,
              create_time: r.create_time,
              is_thread_reply: true,
            });
          }
        }
      }
      pieces.push(
        renderChatWindow({
          chatName: g.name || g.alias,
          windowStart: cutoff.slice(0, 10),
          windowEnd: now.toISOString().slice(0, 10),
          messages,
        }),
      );
    }
    const docs = db
      .prepare(
        "SELECT doc_token, title, url FROM docs WHERE fetched_at >= ? ORDER BY fetched_at DESC",
      )
      .all(cutoff) as Array<{ doc_token: string; title: string; url: string }>;
    if (docs.length > 0) {
      pieces.push("### 近期入库的文档\n");
      for (const d of docs) {
        pieces.push(`- [${d.title || d.doc_token}](${d.url})  (token=\`${d.doc_token}\`)`);
      }
      pieces.push("");
    }
  } finally {
    db.close();
```

#### `src/commands/groups.ts:31-89`

```typescript
export async function runAdd(opts: AddOpts): Promise<void> {
  const cfg = loadConfig(opts);
  const dbPath = join(cfg.rawDir, "raw.db");
  ensureInitialized(dbPath);
  const name = opts.name ?? "";
  const resolvedAlias = opts.alias ?? slugify(name || opts.chatId);
  if (cfg.groups.some((g) => g.alias === resolvedAlias)) {
    throw new Error(`alias "${resolvedAlias}" already in use`);
  }
  const newGroup: GroupConfig = {
    alias: resolvedAlias,
    chatId: opts.chatId,
    name,
    enabled: true,
  };
  const next: Config = { ...cfg, groups: [...cfg.groups, newGroup] };
  saveConfig(next);
  const db = connect(dbPath);
  try {
    db.prepare(
      "INSERT INTO chats(alias, chat_id, name, enabled) VALUES (?, ?, ?, 1) " +
        "ON CONFLICT(alias) DO UPDATE SET chat_id=excluded.chat_id, name=excluded.name, enabled=1",
    ).run(resolvedAlias, opts.chatId, name);
  } finally {
    db.close();
  }
  process.stdout.write(`added ${resolvedAlias} -> ${opts.chatId}\n`);
}

export async function runList(opts: ListOpts = {}): Promise<void> {
  const cfg = loadConfig(opts);
  const write = opts.write ?? ((s: string) => process.stdout.write(s));
  if (cfg.groups.length === 0) {
    write("(no groups)\n");
    return;
  }
  write(`${"alias".padEnd(20)} ${"chat_id".padEnd(22)} 名称\n`);
  for (const g of cfg.groups) {
    write(`${g.alias.padEnd(20)} ${g.chatId.padEnd(22)} ${g.name}\n`);
  }
}

export async function runRm(opts: RmOpts): Promise<void> {
  const cfg = loadConfig(opts);
  const dbPath = join(cfg.rawDir, "raw.db");
  ensureInitialized(dbPath);
  const remaining = cfg.groups.filter((g) => g.alias !== opts.alias);
  if (remaining.length === cfg.groups.length) {
    throw new Error(`alias "${opts.alias}" not in whitelist`);
  }
  const next: Config = { ...cfg, groups: remaining };
  saveConfig(next);
  const db = connect(dbPath);
  try {
    db.prepare("UPDATE chats SET enabled=0 WHERE alias=?").run(opts.alias);
  } finally {
    db.close();
  }
  process.stdout.write(`removed ${opts.alias}\n`);
```

<!-- source-snippets:end -->
</details>
## 相关页面

- [增量拉取与话题回复](pull-and-threads.md) — 如何写入 messages  
- [文档入库与展示](docs-ingest-show.md) — docs 的时间窗附录  
- [系统架构](system-architecture.md) — 配置与路径  
