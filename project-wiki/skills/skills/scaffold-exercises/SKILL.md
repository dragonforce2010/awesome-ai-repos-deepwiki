---
name: scaffold-exercises
description: 创建通过 lint 的习题目录结构，含小节、题目、解答与讲解材料。在用户希望搭建习题骨架、创建习题 stub，或新建课程小节时使用。
---

# 搭建习题

创建能通过 `pnpm ai-hero-cli internal lint` 的习题目录结构，然后 `git commit` 提交。

## 目录命名

- **小节**：`exercises/` 下的 `XX-section-name/`（如 `01-retrieval-skill-building`）
- **习题**：小节内的 `XX.YY-exercise-name/`（如 `01.03-retrieval-with-bm25`）
- 小节编号 = `XX`，习题编号 = `XX.YY`
- 名称用 dash-case（小写、连字符）

## 习题变体

每个习题至少需要下列子文件夹之一：

- `problem/` —— 学生工作区，含 TODO
- `solution/` —— 参考实现
- `explainer/` —— 概念材料，无 TODO

搭 stub 时，除非计划另有所指，默认 `explainer/`。

## 必需文件

每个子文件夹（`problem/`、`solution/`、`explainer/`）需要 `readme.md`，且：

- **非空**（须为真实内容，单行标题也可）
- 无坏链

搭 stub 时，用标题与描述写最小 readme：

```md
# Exercise Title

Description here
```

若子文件夹含代码，还需要 `>1` 行的 `main.ts`。仅 stub 时，仅 readme 的习题也可以。

## 工作流

1. **解析计划** —— 提取小节名、习题名与变体类型
2. **创建目录** —— 对每个路径 `mkdir -p`
3. **创建 stub readme** —— 每个变体文件夹一个带标题的 `readme.md`
4. **运行 lint** —— `pnpm ai-hero-cli internal lint` 校验
5. **修复错误** —— 迭代直到通过

## Lint 规则摘要

linter（`pnpm ai-hero-cli internal lint`）检查：

- 每个习题有子文件夹（`problem/`、`solution/`、`explainer/`）
- `problem/`、`explainer/` 或 `explainer.1/` 至少存在其一
- 主子文件夹存在**非空** `readme.md`
- 无 `.gitkeep`
- 无 `speaker-notes.md`
- readme 无坏链
- readme 中无 `pnpm run exercise` 命令
- 除非仅 readme，否则每子文件夹需要 `main.ts`

## 移动/重命名习题

重新编号或移动时：

1. 用 `git mv`（不用 `mv`）重命名目录——保留 git 历史
2. 更新数字前缀以保持顺序
3. 移动后重跑 lint

示例：

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 示例：由计划搭 stub

给定计划如：

```
Section 05: Memory Skill Building
- 05.01 Introduction to Memory
- 05.02 Short-term Memory (explainer + problem + solution)
- 05.03 Long-term Memory
```

创建：

```bash
mkdir -p exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer
mkdir -p exercises/05-memory-skill-building/05.02-short-term-memory/{explainer,problem,solution}
mkdir -p exercises/05-memory-skill-building/05.03-long-term-memory/explainer
```

再创建 readme stub：

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
