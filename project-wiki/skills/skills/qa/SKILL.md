---
name: qa
description: 交互式 QA：用户口语化报告缺陷或问题，代理在后台探索代码库以写 GitHub 议题。在用户希望报 bug、做 QA、口语化建议题，或提到「QA session」时使用。
---

# QA 会话

运行交互式 QA。用户描述遇到的问题。你轻量澄清、在后台探索代码库获取上下文，并创建**耐久**、**用户导向**、使用**项目领域语言**的 GitHub 议题。

## 用户提出的每个议题

### 1. 倾听与轻量澄清

让用户用自己的话描述。最多问 **2–3 个短澄清问题**，聚焦：

- 预期 vs 实际
- 复现步骤（若非显然）
- 稳定出现还是间歇

不要过度访谈。描述已足够开 issue 就前进。

### 2. 后台探索代码库

与用户交谈同时，后台启动 Agent（subagent_type=Explore）了解相关区域。目标**不是**找修复——而是：

- 学习该区域使用的领域语言（查 UBIQUITOUS_LANGUAGE.md）
- 理解功能本应做什么
- 识别面向用户的行为边界

这有助于写更好的 issue——但 issue 正文**不应**引用具体文件、行号或内部实现细节。

### 3. 评估范围：单一议题还是拆分？

提交前判断是**单一 issue** 还是需**拆成多个**。

在以下情况拆分：

- 修复跨多个独立区域（例如「表单校验错**且**成功消息缺**且**重定向坏」）
- 有明显可分离、可并行由不同人处理的关切
- 用户描述含多种独立失效模式或症状

保持单一 issue 当：

- 单一行为在单一位置错误
- 症状同源

### 4. 提交 GitHub issue(s)

用 `gh issue create` 创建。**不要**先请用户审稿——直接提交并分享 URL。

议题须**耐久**——重大重构后仍有意义。从用户视角撰写。

#### 单一 issue

使用模板：

```
## What happened

[Describe the actual behavior the user experienced, in plain language]

## What I expected

[Describe the expected behavior]

## Steps to reproduce

1. [Concrete, numbered steps a developer can follow]
2. [Use domain terms from the codebase, not internal module names]
3. [Include relevant inputs, flags, or configuration]

## Additional context

[Any extra observations from the user or from codebase exploration that help frame the issue — e.g. "this only happens when using the Docker layer, not the filesystem layer" — use domain language but don't cite files]
```

#### 拆分（多个 issue）

按依赖顺序创建（先阻塞项），以便在「Blocked by」引用真实编号。

每个子 issue 用：

```
## Parent issue

#<parent-issue-number> (if you created a tracking issue) or "Reported during QA session"

## What's wrong

[Describe this specific behavior problem — just this slice, not the whole report]

## What I expected

[Expected behavior for this specific slice]

## Steps to reproduce

1. [Steps specific to THIS issue]

## Blocked by

- #<issue-number> (if this issue can't be fixed until another is resolved)

Or "None — can start immediately" if no blockers.

## Additional context

[Any extra observations relevant to this slice]
```

拆分时：

- **宁可多个薄 issue，不要少数厚 issue** —— 每个应可独立修复与验证
- **诚实标记阻塞** —— 若 B 真要等 A 修好才能测，写明。若独立，两者都标「None — can start immediately」
- **按依赖顺序创建** —— 以便「Blocked by」写真实编号
- **最大化并行** —— 目标：多人（或代理）可同时认领不同 issue

#### 所有 issue 正文规则

- **无文件路径或行号** —— 易过期
- **使用项目领域语言**（若存在则查 UBIQUITOUS_LANGUAGE.md）
- **描述行为，不写代码** —— 「同步服务未能应用补丁」而非「applyPatch() 在第 42 行抛错」
- **复现步骤必填** —— 若无法确定，问用户
- **保持简洁** —— 开发者应在约 30 秒内读完

提交后打印所有 issue URL（并摘要阻塞关系），问：「还有下一个 issue，还是结束？」

### 5. 继续会话

直到用户说结束。每个 issue 独立——不要批量处理。
