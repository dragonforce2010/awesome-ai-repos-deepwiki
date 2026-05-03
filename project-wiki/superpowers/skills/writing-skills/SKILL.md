---
name: writing-skills
description: 在创建新技能、编辑现有技能或在部署前验证技能工作时使用
---

# 编写技能

## 概述

**编写技能就是将 TDD 应用于过程文档。**

**个人技能存放在代理特定目录（Claude Code 为 `~/.claude/skills`，Codex 为 `~/.agents/skills/`）**

你编写测试用例（带子代理的压力场景），看它们失败（基线行为），编写技能（文档），看测试通过（代理合规），然后重构（堵住漏洞）。

**核心原则：**如果你没看到代理在没有技能时失败，你不知道技能教了正确的东西。

**必需背景：**在使用此技能之前，你必须理解 superpowers:test-driven-development。该技能定义了基本的 RED-GREEN-REFACTOR 循环。此技能将 TDD 适配到文档。

## 什么是技能？

**技能**是经过验证的技术、模式或工具的参考指南。技能帮助未来的 Claude 实例找到并应用有效方法。

**技能是：**可复用的技术、模式、工具、参考指南

**技能不是：**关于你如何一次解决问题的叙述

## TDD 映射到技能

| TDD 概念 | 技能创建 |
|-----------|-------------|
| **测试用例** | 带子代理的压力场景 |
| **生产代码** | 技能文档（SKILL.md） |
| **测试失败（RED）** | 代理无技能时违反规则（基线） |
| **测试通过（GREEN）** | 代理有技能时合规 |
| **重构** | 堵住漏洞同时保持合规 |
| **先写测试** | 在编写技能前运行基线场景 |
| **看它失败** | 记录代理使用的精确合理化 |
| **最小代码** | 编写针对特定违规的技能 |
| **看它通过** | 验证代理现在合规 |
| **重构循环** | 找到新的合理化 → 堵住 → 重新验证 |

## 何时创建技能

**创建：**
- 技术不是直觉上显而易见的
- 你会跨项目引用
- 模式广泛适用（非项目特定）
- 其他人会受益

**不创建：**
- 一次性解决方案
- 其他地方已有良好文档的标准实践
- 项目特定约定（放 CLAUDE.md）
- 机械约束（如果可用正则/验证强制执行，自动化它 — 将文档留给需要判断的情况）

## 技能类型

### 技术
有步骤可遵循的具体方法（condition-based-waiting、root-cause-tracing）

### 模式
思考问题的方式（flatten-with-flags、test-invariants）

### 参考
API 文档、语法指南、工具文档

## 目录结构

```
skills/
  skill-name/
    SKILL.md              # 主文件（必需）
    supporting-file.*     # 仅在需要时
```

**扁平命名空间** - 所有技能在一个可搜索的命名空间中

**独立文件用于：**
1. **重型参考**（100+ 行）- API 文档、综合语法
2. **可复用工具** - 脚本、工具、模板

**保持内联：**
- 原则和概念
- 代码模式（< 50 行）
- 其他所有内容

## SKILL.md 结构

**Frontmatter（YAML）：**
- 两个必需字段：`name` 和 `description`
- 最多 1024 字符
- `name`：仅使用字母、数字和连字符
- `description`：第三人称，仅描述何时使用（不描述技能做什么）
  - 以 "Use when..." 开头聚焦触发条件
  - 包含具体症状、情况和上下文
  - **绝不总结技能的流程或工作流**
  - 尽量控制在 500 字符以内

## Claude 搜索优化（CSO）

**对发现至关重要：**未来的 Claude 需要找到你的技能

### 1. 丰富的描述字段

**关键：描述 = 何时使用，不是技能做什么**

测试发现，当描述总结了工作流时，Claude 可能直接遵循描述而非读取完整技能内容。

```yaml
# ❌ 错误：总结了工作流 - Claude 可能跳过技能正文
description: Use when executing plans - dispatches subagent per task with code review between tasks

# ✅ 正确：只有触发条件
description: Use when executing implementation plans with independent tasks in the current session
```

### 2. 关键词覆盖

使用 Claude 会搜索的词汇：
- 错误消息、症状、同义词、工具名称

### 3. 描述性命名

使用主动语态，动词优先：
- ✅ `creating-skills` 而非 `skill-creation`
- ✅ `condition-based-waiting` 而非 `async-test-helpers`

### 4. Token 效率

- 入门工作流：目标 < 150 词
- 频繁加载技能：目标 < 200 词
- 其他技能：目标 < 500 词

### 5. 交叉引用其他技能

使用技能名称，带明确必需标记：
- ✅ `**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development`
- ❌ `@skills/testing/test-driven-development/SKILL.md`（强制加载，浪费上下文）

**为什么不使用 @ 链接：**`@` 语法立即强制加载文件，在你需要它们之前消耗 200k+ 上下文。
