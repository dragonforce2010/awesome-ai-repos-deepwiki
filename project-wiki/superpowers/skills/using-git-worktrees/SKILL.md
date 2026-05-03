---
name: using-git-worktrees
description: 在开始需要与当前工作区隔离的功能开发时使用，或在执行实施计划之前 - 创建隔离的 git worktree，带智能目录选择和安全验证
---

# 使用 Git Worktrees

## 概述

Git worktrees 创建共享同一仓库的隔离工作区，允许同时在多个分支上工作而无需切换。

**核心原则：**系统化目录选择 + 安全验证 = 可靠隔离。

**开始时宣布：**"我正在使用 using-git-worktrees 技能来设置隔离工作区。"

## 目录选择流程

按此优先级顺序：

### 1. 检查已有目录

```bash
ls -d .worktrees 2>/dev/null     # 首选（隐藏）
ls -d worktrees 2>/dev/null      # 替代
```

**如果找到：**使用该目录。如果两者都存在，`.worktrees` 优先。

### 2. 检查 CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**如果指定了偏好：**直接使用，不询问。

### 3. 询问用户

如果没有目录存在且没有 CLAUDE.md 偏好：

```
未找到 worktree 目录。应该在哪里创建？

1. .worktrees/（项目本地，隐藏）
2. ~/.config/superpowers/worktrees/<project-name>/（全局位置）

你偏好哪个？
```

## 安全验证

### 对于项目本地目录（.worktrees 或 worktrees）

**必须在创建 worktree 前验证目录被忽略：**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果未被忽略：**按"立即修复损坏的东西"原则：
1. 添加适当行到 .gitignore
2. 提交变更
3. 继续创建 worktree

**为什么关键：**防止意外将 worktree 内容提交到仓库。

### 对于全局目录（~/.config/superpowers/worktrees）

无需 .gitignore 验证 — 完全在项目之外。

## 创建步骤

### 1. 检测项目名称

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. 创建 Worktree

```bash
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. 运行项目设置

自动检测并运行适当设置：

```bash
if [ -f package.json ]; then npm install; fi
if [ -f Cargo.toml ]; then cargo build; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
if [ -f go.mod ]; then go mod download; fi
```

### 4. 验证干净基线

运行测试确保 worktree 从干净状态开始。

### 5. 报告位置

```
Worktree 就绪于 <full-path>
测试通过（<N> 个测试，0 个失败）
准备实施 <feature-name>
```

## 红旗

**绝不：**
- 未验证忽略就创建 worktree（项目本地）
- 跳过基线测试验证
- 未询问就在测试失败时继续
- 有歧义时假设目录位置
