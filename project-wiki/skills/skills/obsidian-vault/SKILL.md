---
name: obsidian-vault
description: 在 Obsidian 仓库中搜索、创建与管理笔记，支持 wikilink 与索引笔记。在用户希望查找、创建或整理 Obsidian 笔记时使用。
---

# Obsidian 仓库

## 仓库位置

`/mnt/d/Obsidian Vault/AI Research/`

根层级大多扁平。

## 命名约定

- **索引笔记**：聚合相关主题（如 `Ralph Wiggum Index.md`、`Skills Index.md`、`RAG Index.md`）
- 所有笔记名用 **Title Case**
- 不用文件夹做组织——用链接与索引笔记

## 链接

- 使用 Obsidian `[[wikilinks]]`：`[[Note Title]]`
- 笔记底部链向依赖/相关笔记
- 索引笔记仅为 `[[wikilinks]]` 列表

## 工作流

### 搜索笔记

```bash
# Search by filename
find "/mnt/d/Obsidian Vault/AI Research/" -name "*.md" | grep -i "keyword"

# Search by content
grep -rl "keyword" "/mnt/d/Obsidian Vault/AI Research/" --include="*.md"
```

或直接在仓库路径上用 Grep/Glob 工具。

### 创建新笔记

1. 文件名用 **Title Case**
2. 按仓库规则将内容写成学习单元
3. 底部添加相关笔记的 `[[wikilinks]]`
4. 若属编号序列，使用分层编号方案

### 查找相关笔记

在仓库中搜索 `[[Note Title]]` 找反向链接：

```bash
grep -rl "\\[\\[Note Title\\]\\]" "/mnt/d/Obsidian Vault/AI Research/"
```

### 查找索引笔记

```bash
find "/mnt/d/Obsidian Vault/AI Research/" -name "*Index*"
```
