---
name: gitnexus-cli
description: "当用户需要执行 GitNexus CLI（analyze 索引、status 检查、clean 清理、wiki 生成、list 列出仓库）时使用。示例：「索引这个仓库」「重新分析代码库」「生成 wiki」"
---

# GitNexus CLI 命令

所有命令均可通过 `npx` 执行，无需全局安装。

## 命令说明

### analyze — 构建或刷新索引

```bash
npx gitnexus analyze
```

在项目根目录运行。会解析源码、构建知识图谱、写入 `.gitnexus/`，并生成 `CLAUDE.md` / `AGENTS.md` 等上下文文件。

| 标志 | 作用 |
|------|------|
| `--force` | 即使索引仍新也强制全量重建 |
| `--embeddings` | 开启嵌入以支持语义检索（默认关闭） |
| `--drop-embeddings` | 重建时丢弃已有嵌入；若未带 `--embeddings` 的 `analyze` 默认会保留已有嵌入 |

**何时运行：** 首次进入项目、重大变更后，或 `gitnexus://repo/{name}/context` 提示索引陈旧时。

### status — 检查索引新鲜度

```bash
npx gitnexus status
```

显示当前仓库是否有索引、上次更新时间、符号与关系数量，用于判断是否需要重新索引。

### clean — 删除索引

```bash
npx gitnexus clean
```

删除 `.gitnexus/` 并从全局注册表注销该仓库。适用于索引损坏或从项目中移除 GitNexus 之前。

| 标志 | 作用 |
|------|------|
| `--force` | 跳过确认提示 |
| `--all` | 清理所有已索引仓库，而非仅当前仓库 |

### wiki — 从图谱生成文档

```bash
npx gitnexus wiki
```

基于知识图谱调用 LLM 生成仓库文档。首次使用需配置 API Key（会保存到 `~/.gitnexus/config.json`）。

| 标志 | 作用 |
|------|------|
| `--force` | 强制全量重新生成 |
| `--model <model>` | LLM 模型（默认 minimax/minimax-m2.5） |
| `--base-url <url>` | LLM API base URL |
| `--api-key <key>` | LLM API Key |
| `--concurrency <n>` | 并行 LLM 调用数（默认 3） |
| `--gist` | 将 wiki 发布为公开 GitHub Gist |

### list — 列出所有已索引仓库

```bash
npx gitnexus list
```

列出 `~/.gitnexus/registry.json` 中注册的仓库；与 MCP 工具 `list_repos` 信息等价。

## 索引完成后

1. **读取 `gitnexus://repo/{name}/context`** 确认索引已加载
2. 根据任务选择其他 GitNexus 技能（`exploring`、`debugging`、`impact-analysis`、`refactoring`）

## 故障排查

- **"Not inside a git repository"**：请在 Git 仓库内的目录执行
- **重新 analyze 后仍显示陈旧**：重启 Claude Code 以重新加载 MCP 服务
- **嵌入过慢**：去掉 `--embeddings`（默认即关闭），或配置 `OPENAI_API_KEY` 使用更快的 API 嵌入
