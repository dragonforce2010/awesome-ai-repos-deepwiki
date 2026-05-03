# Show Workflow

用户触发：
- `/lark-context 最近聊了啥` / `/lark-context 看看 <群> 这周`
- `/lark-context show --chat a --since 3d`
- 或：`/lark-context 打开文档 <token/url>` → 走 show-doc

**目标**：从本地 SQLite 读出最近消息 / 文档，渲染给 Claude 或用户看。**不调 lark-cli，不拉新数据**——需要先跑 `pull` 才能保证数据新。

---

## `show` 命令

```bash
lark-context show [--chat <alias>|all] [--since <duration>]
```

- **默认窗口** `--since 24h`
- `--chat <alias>` 单群；`--chat all` 或省略 → 所有 `enabled=1` 的群
- 无关注群 → 报错 `no whitelisted chats`

### 输出格式（`renderChatWindow` 产）

```
## 群 A  (2026-04-18 ~ 2026-04-19)

**张三** 2026-04-18 10:00
  消息内容
  （多行对齐）

**李四** 2026-04-18 10:05
  回复
```

- 回复线程前缀 `  ↳ `
- 空窗口输出 `(no messages)`
- 末尾可能带 `### 近期入库的文档` 区块（列出窗口内被 ingest 的文档）

## `show-doc` 命令

```bash
lark-context show-doc <token-or-url>
```

- 未入库 → 报错 `no ingested doc matches "<ref>"`，建议用户先 `lark-context ingest-doc <url>`
- 已入库 → 原样输出存下来的 markdown

## 给用户回复的剪裁原则

- **消息 > 100 条**：回给用户之前先提醒“窗口内有 N 条消息，是否收窄到某个群或更短时间？”让用户决定。不要默默粘一大坨
- **文档 > 5000 字**：摘要几个要点 + 给原文链接，不把全文塞回对话
- **没消息但窗口合理**：直接回 “(no messages)”——不要推测说“可能是群沉了”之类

## 示例

```bash
lark-context show --since 3d                         # 所有关注群最近 3 天
lark-context show --chat moy26_fe --since 1w         # 单群一周
lark-context show-doc AbCdEfGh1234                   # 看某份入库文档
lark-context show-doc https://x.feishu.cn/docx/AbCdEfGh1234  # URL 也行
```
