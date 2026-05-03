# Ingest-Doc Workflow

用户触发：粘贴一条飞书文档 URL 说“收下 / 入库 / 把这个加进来”，或 `/lark-context ingest-doc <url>`。

**目标**：把一份飞书文档拉到本地 SQLite，之后可以通过 `show-doc` 看到，也会被 digest 当作材料之一。

---

## 支持的 URL 形态

| 形态 | 支持 | 备注 |
|---|---|---|
| `https://<host>/docx/<token>` | 支持 | 新版云文档 |
| `https://<host>/docs/<token>` | 视 CLI 返回 | lark-cli 若返回 `Unsupported document type: Legacy document` 则是老版文档，**透传**错误给用户（没别的办法） |
| `https://<host>/wiki/<token>` | 多数可用 | 底层是 `lark-cli docs +fetch` |
| `https://<host>/base/<token>` / `/file/<token>` | 按 CLI 返回判断 | 非 docs 类可能报不同错 |
| bare token（纯字母数字） | 支持 | URL query 部分（`?from=copy`）会被忽略 |

## 工作流

```bash
lark-context ingest-doc <url-or-token>
```

CLI 内部：
1. 从 URL 解析 token（`/docx/<token>`, `/docs/<token>` 等）
2. 调 `lark-cli docs +fetch --doc <ref>`
3. 拿 `data.title` + `data.content`（或 `markdown`/`text`/`body`）
4. UPSERT 到 `docs` 表（`source='manual'`）——**同 token 重复 ingest 幂等**

## 常见问题

- 粘贴含 query `?from=copy` → CLI 自动忽略，只取 `/docx/<token>` 部分
- URL 里 host 不含 `feishu` → CLI 报 `not a feishu URL`，换一个合法 URL 即可
- `lark-cli docs +fetch` 返回 `{ok: false}` → 透传 error message（比如文档权限缺失时会给 `permission` 错误，让用户去原文档页面点“允许” / 改权限）

## 示例

```bash
lark-context ingest-doc https://bytedance.feishu.cn/docx/AbCdEfGh1234
lark-context ingest-doc AbCdEfGh1234                  # bare token 也接受
```
