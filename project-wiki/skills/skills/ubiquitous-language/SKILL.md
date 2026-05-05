---
name: ubiquitous-language
description: 从当前对话中提取 DDD 风格的统一语言词汇表，标出歧义并给出规范术语，写入 UBIQUITOUS_LANGUAGE.md。适用于用户要定义领域术语、建词汇表、固化说法、创建 ubiquitous language，或提到「领域模型」「DDD」时。
disable-model-invocation: true
---

# 统一语言（Ubiquitous Language）

从当前对话中提取并规范化领域术语，形成一致的词汇表，并写入本地文件。

## 流程

1. **扫描对话**，找出与领域相关的名词、动词与概念
2. **识别问题**：
   - 同一词指不同概念（歧义）
   - 不同词指同一概念（同义反复）
   - 含糊或负担过重的术语
3. **提出带立场的规范词汇表**，给出倾向性选词
4. **按下方格式写入工作目录的 `UBIQUITOUS_LANGUAGE.md`**
5. **在对话中输出一段摘要**

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

- **要有立场。**同一概念存在多种说法时，选定最佳用词，并把其余列为「应避免使用的别名」。
- **显式标出冲突。**若某词在对话中被混用，在「Flagged ambiguities」中点名，并给出清晰建议。
- **只收录对领域专家有意义的术语。**除非模块或类名在领域语言中有含义，否则跳过纯实现命名。
- **定义要短。**一句话封顶。定义它**是什么**，而不是罗列它**做什么**。
- **写清关系。**术语用加粗，并在明显处表达基数。
- **只收录领域术语。**跳过通用编程概念（array、function、endpoint），除非它们在领域中有特定含义。
- **自然聚类时拆多张表**（例如按子域、生命周期或角色分组）。每组有自己的标题与表。若所有术语属于同一内聚域，一张表即可——不要硬拆。
- **写示例对话。**开发同学与领域专家之间 3～5 轮短对话，演示术语如何自然协作；对话应澄清相关概念边界，并展示精确用法。

<example>

## Example dialogue

> **开发：**「不用 Docker 怎么测**同步服务**？」

> **领域专家：**「用**文件系统层**替代 **Docker 层**。它实现相同的 **Sandbox service** 接口，但把本地目录当作 **sandbox**。」

> **开发：**「那 **sync-in** 仍会创建 **bundle** 并解压吗？」

> **领域专家：**「对。**同步服务**不知道自己在跟哪一层对话。它调用 `exec` 和 `copyIn`——**文件系统层**只是把这些当作本地 shell 命令执行。」

</example>

## 再次运行

在同一会话中再次被调用时：

1. 读取已有的 `UBIQUITOUS_LANGUAGE.md`
2. 纳入后续讨论中的新术语
3. 若理解演进则更新定义
4. 重新标出新出现的歧义
5. 重写示例对话以纳入新术语
