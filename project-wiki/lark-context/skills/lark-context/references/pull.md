# Pull 工作流

用户触发：
- `/lark-context 拉最近 N 天` / `/lark-context 同步一下`
- `/lark-context 更新 <群名>`
- 首次关注新群后要把历史拉下来

**目标**：把飞书群最新消息增量拉到本地 SQLite。不调 LLM，纯 CLI。

---

## 默认窗口

| 情况 | 用什么 |
|---|---|
| **首次拉某个 alias**（db 里没 `last_cursor`） | `--since 90d` |
| **已拉过的 alias**（增量） | 忽略 `--since`，自动从 `last_cursor` 续拉 |
| 用户说了具体窗口（"拉最近 3 天"） | 按用户说的 |

**90d 的由来**：首次拉的默认值是 skill 约定，不是 CLI 默认值。CLI 本身对首次无默认——所以 skill 必须显式传 `--since 90d`。

## 映射

- `--chat <alias>` 指定群
- `--chat all` 或省略 → 所有 `enabled=1` 的群
- alias 未注册 → CLI 抛错并列已知 alias。让用户先走 `groups add`

## 200 页上限

首次拉历史消息每群最多 200 页（约 10k 条）。到上限后 stderr 有：

```
<alias>: hit MAX_PAGES=200 cap; re-run to continue
```

把这条原样转述给用户，**并建议**再跑一次 `lark-context pull --chat <alias>` 续拉。

## 常见错误（透传 + 操作建议）

| CLI stderr 特征 | 原因 | 给用户的建议 |
|---|---|---|
| `permission_violations` / `required scope` | lark-cli auth 缺 scope | `lark-cli auth login --scope "im:message im:chat"`（具体 scope 按错误信息给） |
| `chat_not_found` | 用户被踢出群了 | `lark-context groups rm <alias>` 或留着忽略 |
| `ENOENT` / `lark-cli not found` | lark-cli 没装 | `bnpm i -g @larksuite/cli` |
| 某个 chat 被 CLI 自动 disable（`<alias>: DISABLED`） | 单群失败不中断全流程；其他群继续 | 看 stderr 哪个 alias 被禁，解决后 `groups add` 重加（重加会把 enabled 翻回 1） |

## 示例

```bash
# 首次关注后的完整流程
lark-context groups add oc_xxxxx --alias proj_a --name "项目 A"
lark-context pull --chat proj_a --since 90d        # 首次：显式 90d
lark-context pull --chat proj_a                     # 续拉：自动续

# 全量增量
lark-context pull
```
