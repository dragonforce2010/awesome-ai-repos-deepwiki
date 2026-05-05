---
name: to-prd
description: 将当前对话上下文转成 PRD 并发布到项目议题追踪。在用户希望从当前上下文创建 PRD 时使用。
---

本 skill 将当前对话上下文与对代码库的理解合成为 PRD。**不要**访谈用户——仅综合已知信息。

议题追踪与分类标签词汇应已提供——若否则运行 `/setup-matt-pocock-skills`。

## 流程

1. 若尚未探索，则探索仓库以了解代码库现状。PRD 全文使用项目领域词汇，并尊重所涉区域的 ADR。

2. 勾勒完成实现需构建或修改的主要模块。主动寻找可抽成**深层模块**、可隔离测试的机会。

深层模块（相对浅层）将大量功能封装在简单、可测试且很少变动的接口之后。

与用户确认这些模块是否符合预期。确认用户希望对哪些模块编写测试。

3. 用下方模板撰写 PRD，然后发布到项目议题追踪。应用 `needs-triage` 标签以进入常规划分流程。

<prd-template>

## Problem Statement

从用户视角，用户面临的问题。

## Solution

从用户视角，问题的解决方案。

## User Stories

**长**编号用户故事列表。每条格式：

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

列表应极其详尽，覆盖功能各方面。

## Implementation Decisions

已做出的实现决策列表，可包括：

- 将构建/修改的模块
- 将修改的那些模块的接口
- 开发者确认的技术澄清
- 架构决策
- Schema 变更
- API 契约
- 具体交互

**不要**包含具体文件路径或代码片段——它们会很快过时。

## Testing Decisions

测试决策列表，包含：

- 何为好的测试（只测对外行为，不测实现细节）
- 将测试哪些模块
- 测试先例（代码库中类似测试）

## Out of Scope

本 PRD 范围之外的内容说明。

## Further Notes

关于该功能的其他说明。

</prd-template>
