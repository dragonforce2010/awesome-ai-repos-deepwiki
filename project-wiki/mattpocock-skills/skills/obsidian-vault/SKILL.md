---
name: obsidian-vault
description: 在 Obsidian 库中用双向链接与索引笔记搜索、创建与管理笔记。适用于用户要在 Obsidian 中查找、创建或整理笔记时。
---

# Obsidian 库

## 库位置

`/mnt/d/Obsidian Vault/AI Research/`

根目录大体为扁平结构。

## 命名约定

- **索引笔记**：聚合相关主题（例如 `Ralph Wiggum Index.md`、`Skills Index.md`、`RAG Index.md`）
- 所有笔记名使用 **Title Case**
- 不用文件夹做组织——改用链接与索引笔记

## 链接

- 使用 Obsidian 的 `[[wikilinks]]` 语法：`[[Note Title]]`
- 笔记底部链接到依赖/相关笔记
- 索引笔记本质上就是 `[[wikilinks]]` 列表

## 工作流

### 搜索笔记

```bash
# Search by filename
find "/mnt/d/Obsidian Vault/AI Research/" -name "*.md" | grep -i "keyword"

# Search by content
grep -rl "keyword" "/mnt/d/Obsidian Vault/AI Research/" --include="*.md"
```

也可直接对库路径使用 Grep/Glob 工具。

### 创建新笔记

1. 文件名使用 **Title Case**
2. 按库规则把内容写成可独立消化的一则学习单元
3. 在底部添加指向相关笔记的 `[[wikilinks]]`
4. 若属于编号序列，使用层级编号方案

### 查找相关笔记

在库中搜索 `[[Note Title]]` 以找反向链接：

```bash
grep -rl "\\[\\[Note Title\\]\\]" "/mnt/d/Obsidian Vault/AI Research/"
```

### 查找索引笔记

```bash
find "/mnt/d/Obsidian Vault/AI Research/" -name "*Index*"
```
