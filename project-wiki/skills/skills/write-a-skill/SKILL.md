---
name: write-a-skill
description: 按正确结构、渐进披露与捆绑资源创建新的 agent skills。在用户希望创建、撰写或构建新 skill 时使用。
---

# 撰写 Skills

## 流程

1. **收集需求** —— 询问用户：
   - skill 覆盖什么任务/领域？
   - 应处理哪些具体场景？
   - 需要可执行脚本还是仅说明？
   - 是否包含参考材料？

2. **起草 skill** —— 创建：
   - 含简明说明的 SKILL.md
   - 若内容超过约 500 行则拆附加参考文件
   - 若操作确定性则需要工具脚本

3. **与用户评审** —— 展示草稿并问：
   - 是否覆盖用例？
   - 缺什么或哪里不清？
   - 某节应更详还是更略？

## Skill 结构

```
skill-name/
├── SKILL.md           # 主说明（必填）
├── REFERENCE.md       # 详细文档（按需）
├── EXAMPLES.md        # 用法示例（按需）
└── scripts/           # 工具脚本（按需）
    └── helper.js
```

## SKILL.md 模板

```md
---
name: skill-name
description: Brief description of capability. Use when [specific triggers].
---

# Skill Name

## Quick start

[Minimal working example]

## Workflows

[Step-by-step processes with checklists for complex tasks]

## Advanced features

[Link to separate files: See [REFERENCE.md](REFERENCE.md)]
```

## description 要求

**description 是代理决定用哪个 skill 时唯一可见的字段。** 它与其它已安装 skills 的说明一起出现在系统提示中。代理读这些描述并根据用户请求挑选 skill。

**目标**：给代理刚好足够的信息以知晓：

1. 本 skill 提供什么能力
2. 何时/为何触发（具体关键词、上下文、文件类型）

**格式**：

- 最多 1024 字符
- 第三人称
- 第一句：做什么
- 第二句：「Use when [具体触发条件]」

**好例子**：

```
Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when user mentions PDFs, forms, or document extraction.
```

**坏例子**：

```
Helps with documents.
```

坏例子无法与其它文档类 skill 区分。

## 何时加脚本

在以下情况加工具脚本：

- 操作确定性（校验、格式化）
- 同样代码会反复生成
- 需要显式错误处理

相对生成代码，脚本省 token、更可靠。

## 何时拆分文件

在以下情况拆成独立文件：

- SKILL.md 超过约 100 行
- 内容分属不同领域（如财务 vs 销售 schema）
- 高级功能很少需要

## 评审检查清单

起草后核对：

- [ ] description 含触发语（「Use when...」）
- [ ] SKILL.md 约 100 行内
- [ ] 无时效敏感信息
- [ ] 术语一致
- [ ] 含具体示例
- [ ] 引用仅一层深
