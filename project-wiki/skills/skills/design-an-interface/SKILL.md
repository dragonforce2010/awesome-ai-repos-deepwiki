---
name: design-an-interface
description: 使用并行子代理为模块生成多种截然不同的界面设计方案。适用于用户要设计 API、探索接口形态、对比模块边界，或提到「设计两遍（design it twice）」时。
---

# 设计接口

基于《软件设计的哲学》中的「设计两遍」：你的第一个想法往往未必最好。先生成多种截然不同的设计，再比较。

## 工作流

### 1. 收集需求

设计前先弄清：

- [ ] 该模块要解决什么问题？
- [ ] 调用方是谁？（其他模块、外部用户、测试）
- [ ] 关键操作有哪些？
- [ ] 有哪些约束？（性能、兼容性、既有模式）
- [ ] 哪些应藏在内部、哪些应暴露？

追问：「这个模块需要做什么？谁会用它？」

### 2. 生成设计（并行子代理）

用 Task 工具同时拉起 3 个及以上子代理。每个子代理必须产出**截然不同**的方案。

```
Prompt template for each sub-agent:

Design an interface for: [module description]

Requirements: [gathered requirements]

Constraints for this design: [assign a different constraint to each agent]
- Agent 1: "Minimize method count - aim for 1-3 methods max"
- Agent 2: "Maximize flexibility - support many use cases"
- Agent 3: "Optimize for the most common case"
- Agent 4: "Take inspiration from [specific paradigm/library]"

Output format:
1. Interface signature (types/methods)
2. Usage example (how caller uses it)
3. What this design hides internally
4. Trade-offs of this approach
```

### 3. 展示设计

对每个设计展示：

1. **接口签名**——类型、方法、参数
2. **使用示例**——调用方在实际中如何调用
3. **隐藏了什么**——复杂度留在内部

按顺序逐个展示，便于用户在对比前吸收每种思路。

### 4. 比较设计

展示完所有设计后，从以下维度比较：

- **接口简洁性**：方法更少、参数更简单
- **通用 vs 专用**：灵活度与聚焦度
- **实现效率**：形态是否便于高效实现？
- **深度**：小接口藏大复杂度（好）vs 大接口薄实现（差）
- **正确使用容易** vs **误用容易**

用叙述讨论取舍，不要用表格。突出分歧最大的地方。

### 5. 综合

最佳设计常常融合多种方案的洞见。追问：

- 「哪种设计最贴合你的主路径用例？」
- 「是否值得从其他设计里吸收某些元素？」

## 评估标准

来自《软件设计的哲学》：

**接口简洁性**：方法更少、参数更简单 = 更易学会、更易用对。

**通用性**：能应对未来用例而少改接口。但要警惕过度泛化。

**实现效率**：接口形态是否允许高效实现？还是会逼出别扭的内部实现？

**深度**：小接口藏大复杂度 = 深模块（好）。大接口薄实现 = 浅模块（应避免）。

## 反模式

- 不要让子代理产出相近设计——必须强制「截然不同」
- 不要跳过比较——价值正在于对照
- 不要落地实现——本技能只谈接口形态
- 不要按实现工作量来评估
