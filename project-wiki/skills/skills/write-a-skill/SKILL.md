---
name: write-a-skill
description: 按规范结构创建新的 agent 技能，支持渐进式披露并打包配套资源。当用户希望创建、撰写或构建新技能时使用。
---

# 撰写技能

## 流程

1. **收集需求** — 向用户确认：
   - 技能覆盖的任务/领域？
   - 需处理哪些具体场景？
   - 需要可执行脚本还是仅需说明？
   - 是否包含参考材料？

2. **起草技能** — 产出：
   - 简明扼要的 SKILL.md
   - 若正文超过约 500 行，拆出额外参考文件
   - 若有确定性操作需求，提供实用脚本

3. **与用户复核** — 展示草稿并询问：
   - 是否覆盖你的使用场景？
   - 是否有遗漏或不清楚之处？
   - 哪些段落需要更详/更略？

## 技能目录结构

```
skill-name/
├── SKILL.md           # 主说明（必填）
├── REFERENCE.md       # 详细文档（按需）
├── EXAMPLES.md        # 使用示例（按需）
└── scripts/           # 实用脚本（按需）
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

## 对 description 的要求

**description 是代理决定加载哪个技能时唯一能看到的字段**。它会与其他已安装技能的描述一起出现在系统提示中。代理阅读这些描述，并根据用户请求选择对应技能。

**目标**：让代理刚好足够判断：

1. 本技能提供什么能力
2. 何时/为何触发（具体关键词、上下文、文件类型）

**格式**：

- 最长 1024 字符
- 使用第三人称
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

坏例子无法与其他文档类技能区分。

## 何时添加脚本

在以下情况添加实用脚本：

- 操作是确定性的（校验、格式化）
- 同一段代码会被反复生成
- 错误需要显式处理

相较每次生成代码，脚本能省 token、提高可靠性。

## 何时拆分文件

在以下情况拆成多个文件：

- SKILL.md 超过约 100 行
- 内容属于不同领域（如财务与销售 schema）
- 高级功能很少用到

## 复核清单

起草完成后核对：

- [ ] description 含触发条件（「Use when...」）
- [ ] SKILL.md 控制在约 100 行以内
- [ ] 无时效性信息（易过期内容）
- [ ] 术语一致
- [ ] 含具体示例
- [ ] 引用仅一层深度（避免链式嵌套）
