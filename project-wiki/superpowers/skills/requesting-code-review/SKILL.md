---
name: requesting-code-review
description: 在完成任务、实施主要功能或合并前使用，以验证工作满足需求
---

# 请求代码审查

分派 superpowers:code-reviewer 子代理在问题级联之前捕获问题。审查者获得精确构建的上下文进行评估 — 永远不是你会话的历史。这让审查者专注于工作产物而非你的思考过程，并保留你自己的上下文用于继续工作。

**核心原则：**审查早且频繁。

## 何时请求审查

**强制：**
- 子代理驱动开发中每个任务之后
- 完成主要功能后
- 合并到 main 之前

**可选但有价值：**
- 卡住时（新视角）
- 重构前（基线检查）
- 修复复杂 bug 后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 分派 code-reviewer 子代理：**

使用 Task 工具，类型为 superpowers:code-reviewer，填写 `code-reviewer.md` 中的模板

**占位符：**
- `{WHAT_WAS_IMPLEMENTED}` - 你刚构建了什么
- `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交
- `{DESCRIPTION}` - 简要摘要

**3. 处理反馈：**
- 立即修复 Critical 问题
- 继续前修复 Important 问题
- 记录 Minor 问题供后续处理
- 如果审查者错了，用理由反驳

## 红旗

**绝不：**
- 因为"很简单"就跳过审查
- 忽略 Critical 问题
- 带着未修复的 Important 问题继续
- 反驳有效的技术反馈

**如果审查者错了：**
- 用技术理由反驳
- 展示证明它有效的代码/测试
- 请求澄清

参见模板：requesting-code-review/code-reviewer.md
