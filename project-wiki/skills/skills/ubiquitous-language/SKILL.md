---
name: ubiquitous-language
description: 从当前对话中提取 DDD 式统一语言词汇表，标出歧义并提出规范术语。保存到 UBIQUITOUS_LANGUAGE.md。在用户希望定义领域术语、建词汇表、收紧措辞、创建 ubiquitous language，或提到「领域模型」「DDD」时使用。
disable-model-invocation: true
---

# 统一语言（Ubiquitous Language）

从当前对话中提取并形式化领域术语，形成一致词汇表，写入本地文件。

## 流程

1. **扫描对话**，找出与领域相关的名词、动词与概念
2. **识别问题**：
   - 同一词指不同概念（歧义）
   - 不同词指同一概念（同义词）
   - 含糊或多义术语
3. **提出规范词汇表**，带明确术语选择
4. 用下方格式**写入工作目录的 `UBIQUITOUS_LANGUAGE.md`**
5. **在对话中内联输出摘要**

## 输出格式

将 `UBIQUITOUS_LANGUAGE.md` 写成如下结构：

```md
# Ubiquitous Language

## Order lifecycle

| Term        | Definition                                              | Aliases to avoid      |
| ----------- | ------------------------------------------------------- | --------------------- |
| **Order**   | A customer's request to purchase one or more items      | Purchase, transaction |
| **Invoice** | A request for payment sent to a customer after delivery | Bill, payment request |

## People

| Term         | Definition                                  | Aliases to avoid       |
| ------------ | ------------------------------------------- | ---------------------- |
| **Customer** | A person or organization that places orders | Client, buyer, account |
| **User**     | An authentication identity in the system    | Login, account         |

## Relationships

- An **Invoice** belongs to exactly one **Customer**
- An **Order** produces one or more **Invoices**

## Example dialogue

> **Dev:** "When a **Customer** places an **Order**, do we create the **Invoice** immediately?"
> **Domain expert:** "No — an **Invoice** is only generated once a **Fulfillment** is confirmed. A single **Order** can produce multiple **Invoices** if items ship in separate **Shipments**."
> **Dev:** "So if a **Shipment** is cancelled before dispatch, no **Invoice** exists for it?"
> **Domain expert:** "Exactly. The **Invoice** lifecycle is tied to the **Fulfillment**, not the **Order**."

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — these are distinct concepts: a **Customer** places orders, while a **User** is an authentication identity that may or may not represent a **Customer**.
```

## 规则

- **要有立场。** 同一概念多个词时，选最佳，其余列为应避免别名。
- **显式标出冲突。** 若对话中某词含糊，在「Flagged ambiguities」中说明并给建议。
- **只收录对领域专家有意义的术语。** 跳过模块或类名，除非它们在领域语言中有含义。
- **定义要紧。** 一句封顶。定义它**是**什么，不是它**做**什么。
- **展示关系。** 术语用粗体，在显然处写基数。
- **只含领域术语。** 跳过通用编程概念（array、function、endpoint），除非有领域特定含义。
- **自然簇多分表。** 可按子域、生命周期、参与者等聚类；每组自有标题与表。若同属一块领域，一表即可——不要硬拆。
- **写示例对话。** 开发者与领域专家间短对话（3–5 轮），自然展示术语如何协作。对话应厘清相关概念边界并展示精确用法。

<example>

## Example dialogue

> **Dev:** "How do I test the **sync service** without Docker?"

> **Domain expert:** "Provide the **filesystem layer** instead of the **Docker layer**. It implements the same **Sandbox service** interface but uses a local directory as the **sandbox**."

> **Dev:** "So **sync-in** still creates a **bundle** and unpacks it?"

> **Domain expert:** "Exactly. The **sync service** doesn't know which layer it's talking to. It calls `exec` and `copyIn` — the **filesystem layer** just runs those as local shell commands."

</example>

## 再次运行

同一会话再次调用时：

1. 读取现有 `UBIQUITOUS_LANGUAGE.md`
2. 合并后续讨论中的新术语
3. 若理解演进则更新定义
4. 重新标出新增歧义
5. 重写示例对话以纳入新术语
