---
name: commit
description:
  基于当前变更和会话历史创建规范的 git commit；当被要求提交、准备 commit message 或
  完成暂存工作时使用。
---

# Commit

## 目标

- 生成准确反映代码变更和会话上下文的 commit。
- 遵循通用 git 约定（type 前缀、简短 subject、换行 body）。
- 在 body 中包含摘要和理由。

## 输入

- Codex 会话历史，用于提取意图和理由。
- `git status`、`git diff` 和 `git diff --staged` 查看实际变更。
- 仓库特定的 commit 约定（如有文档记录）。

## 步骤

1. 阅读会话历史，识别范围、意图和理由。
2. 检查工作树和暂存区变更（`git status`、`git diff`、`git diff --staged`）。
3. 确认范围后暂存目标变更，包括新文件（`git add -A`）。
4. 检查新增文件；如有看起来随机或应被忽略的文件（构建产物、日志、临时文件），在提交前向用户标记。
5. 如果暂存不完整或包含无关文件，修正索引或请求确认。
6. 选择与变更匹配的 conventional type 和可选 scope（如 `feat(scope): ...`、`fix(scope): ...`、`refactor(scope): ...`）。
7. 用祈使语气写 subject 行，<= 72 字符，不带句号。
8. 写 body，包含：
   - 关键变更摘要（改了什么）。
   - 理由和权衡（为什么改）。
   - 已运行的测试或验证（或明确说明未运行的原因）。
9. 附加 `Co-authored-by` trailer，使用 `Codex <codex@openai.com>`，除非用户明确要求不同身份。
10. Body 行宽度限制 72 字符。
11. 使用 here-doc 或临时文件创建 commit message，并用 `git commit -F <file>` 提交，确保换行符正确（避免 `-m` 搭配 `\n`）。
12. 仅在 message 与暂存变更一致时提交：如果暂存 diff 包含无关文件或 message 描述了未暂存的工作，先修正索引或修改 message。

## 输出

- 通过 `git commit` 创建的单个 commit，其 message 反映当前会话。

## 模板

Type 和 scope 仅为示例；根据仓库和变更内容调整。

```
<type>(<scope>): <short summary>

Summary:
- <what changed>
- <what changed>

Rationale:
- <why>
- <why>

Tests:
- <command or "not run (reason)">

Co-authored-by: Codex <codex@openai.com>
```
