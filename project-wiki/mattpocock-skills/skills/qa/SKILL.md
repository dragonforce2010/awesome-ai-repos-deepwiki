---
name: qa
description: 交互式 QA：用户用对话方式反馈缺陷或问题，由代理在理解代码库与领域语言后创建 GitHub Issue。适用于用户要报 bug、做 QA、用对话方式建 issue，或提到「QA session」时。
---

# QA 会话

进行交互式 QA。用户描述遇到的问题；你澄清、在后台探索代码库以获取上下文，并创建**耐久、面向用户、使用项目领域语言**的 GitHub Issue。

## 对用户提出的每个问题

### 1. 倾听并轻度澄清

让用户用自己的话描述。最多再问 **2～3 个简短澄清问题**，聚焦在：

- 预期行为 vs 实际行为
- 复现步骤（若不明显）
- 是否稳定复现或偶发

不要过度盘问。若已足够清晰可建 issue，就进入下一步。

### 2. 在后台探索代码库

与用户对话的同时，在后台启动 Explore 类子代理，了解相关区域。目的**不是找修复**，而是：

- 学习该区域的领域语言（查阅 UBIQUITOUS_LANGUAGE.md）
- 理解功能本应如何表现
- 划清面向用户的行为边界

这些上下文有助于把 issue 写好——但 issue 正文**不应**引用具体文件、行号或内部实现细节。

### 3. 评估范围：一条 issue 还是拆分？

在创建前判断：这是**单条 issue**，还是需要**拆成多条**。

适合拆分当：

- 修复横跨多个彼此独立的区域（例如「表单校验错了 AND 成功提示缺失 AND 跳转坏了」）
- 存在可分离的关注点，不同人可并行处理
- 用户描述里包含多种明显不同的失败模式或表象

保持单条当：

- 同一处行为错误
- 多种表象同源

### 4. 创建 GitHub Issue

用 `gh issue create` 创建。**不要**先让用户审阅——直接创建并分享 URL。

Issue 必须**耐久**——在大重构之后仍可读。从用户视角书写。

#### 单条 issue

使用下列模板：

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

#### 拆分（多条 issue）

按依赖顺序创建（阻塞项在前），以便引用真实 issue 编号。

每条子 issue 使用：

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

- **宁多勿少、宁薄勿厚**——每条应可独立修复与验证
- **如实标注阻塞**——若 B 在 A 修复前无法验证，要写清楚；若彼此独立，则都写「None — can start immediately」
- **按依赖顺序创建**，以便在「Blocked by」里写真实编号
- **尽量提高可并行度**——目标是多人（或多代理）可同时认领不同 issue

#### 所有 issue 正文的规则

- **不要写文件路径或行号**——容易过期
- **使用项目领域语言**（若有 UBIQUITOUS_LANGUAGE.md 则对照）
- **描述行为，不写代码**——例如「同步服务未能应用补丁」，而非「applyPatch() 在第 42 行抛错」
- **复现步骤必填**——若无法确定，再问用户
- **保持简洁**——开发者应在约 30 秒内读完

创建后打印所有 issue URL（并简要总结阻塞关系），再问：「还有下一个问题，还是结束？」

### 5. 继续会话

直到用户说结束。每条 issue 彼此独立——不要攒批处理。
