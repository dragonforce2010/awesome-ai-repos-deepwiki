---
name: scaffold-exercises
description: 创建含小节、题目、解答与讲解目录结构的练习集，并确保通过 lint。当用户需要脚手架练习、生成练习占位或搭建新课程小节时使用。
---

# 脚手架：练习目录

创建能通过 `pnpm ai-hero-cli internal lint` 的练习目录结构，随后用 `git commit` 提交。

## 目录命名

- **小节**：位于 `exercises/` 下，格式 `XX-section-name/`（例如 `01-retrieval-skill-building`）
- **练习**：位于小节内，格式 `XX.YY-exercise-name/`（例如 `01.03-retrieval-with-bm25`）
- 小节编号 = `XX`，练习编号 = `XX.YY`
- 名称使用 dash-case（小写、连字符）

## 练习变体

每个练习至少包含以下子目录之一：

- `problem/` — 学员工作区，含 TODO
- `solution/` — 参考实现
- `explainer/` — 概念材料，无 TODO

占位时，除非计划另有规定，默认使用 `explainer/`。

## 必需文件

每个子目录（`problem/`、`solution/`、`explainer/`）均需 `readme.md`，且必须：

- **非空**（须有实质内容，单行标题亦可）
- 无损坏链接

占位时，创建最简 readme：标题 + 说明。

```md
# Exercise Title

Description here
```

若子目录含代码，还需 `main.ts`（多于一行）。占位阶段仅 readme 亦可。

## 工作流

1. **解析计划** — 提取小节名、练习名、变体类型
2. **创建目录** — 对每个路径执行 `mkdir -p`
3. **创建占位 readme** — 每个变体目录各一份含标题的 `readme.md`
4. **运行 lint** — `pnpm ai-hero-cli internal lint` 校验
5. **修复错误** — 迭代直至通过

## Lint 规则摘要

linter（`pnpm ai-hero-cli internal lint`）检查：

- 每个练习包含子目录（`problem/`、`solution/`、`explainer/`）
- `problem/`、`explainer/`、`explainer.1/` 至少其一存在
- 主用子目录中存在且非空的 `readme.md`
- 无 `.gitkeep`
- 无 `speaker-notes.md`
- readme 中无损坏链接
- readme 中无 `pnpm run exercise` 命令
- 除非仅为 readme，否则每个子目录需 `main.ts`

## 移动/重命名练习

重新编号或移动练习时：

1. 使用 `git mv`（勿用 `mv`）重命名目录 — 保留 git 历史
2. 更新数字前缀以保持顺序
3. 移动后重新运行 lint

示例：

```bash
git mv exercises/01-retrieval/01.03-embeddings exercises/01-retrieval/01.04-embeddings
```

## 示例：按计划占位

计划示例：

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

再创建 readme 占位：

```
exercises/05-memory-skill-building/05.01-introduction-to-memory/explainer/readme.md -> "# Introduction to Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/explainer/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/problem/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.02-short-term-memory/solution/readme.md -> "# Short-term Memory"
exercises/05-memory-skill-building/05.03-long-term-memory/explainer/readme.md -> "# Long-term Memory"
```
