---
name: design-an-interface
description: 用并行子代理为模块生成多种截然不同的接口设计。在用户希望设计 API、探索接口选项、比较模块形态，或提到「design it twice」时使用。
---

# 设计接口

出自《A Philosophy of Software Design》的「Design It Twice」：首个想法往往并非最佳。先生成多种截然不同的设计，再比较。

## 工作流

### 1. 收集需求

设计前理解：

- [ ] 该模块要解决什么问题？
- [ ] 调用方是谁？（其它模块、外部用户、测试）
- [ ] 关键操作有哪些？
- [ ] 有何约束？（性能、兼容、既有模式）
- [ ] 什么应藏在内部 vs 暴露？

询问：「模块需要做什么？谁会用它？」

### 2. 生成设计（并行子代理）

用 Task 工具同时 spawn 3+ 子代理。每个必须产出**截然不同**的方案。

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

1. **接口签名** —— 类型、方法、参数
2. **用法示例** —— 调用方实际如何使用
3. **隐藏了什么** —— 复杂度留在内部

顺序展示，让用户在比较前吸收每种思路。

### 4. 比较设计

展示全部后，从以下维度比较：

- **接口简单性**：更少方法、更简单参数
- **通用 vs 专精**：灵活 vs 聚焦
- **实现效率**：形状是否允许高效内部实现？
- **深度**：小接口藏大复杂度（好）vs 大接口薄实现（差）
- **正确使用容易** vs **误用容易**

用散文讨论权衡，不用表格。点出分歧最大处。

### 5. 综合

最佳设计常融合多种洞见。询问：

- 「哪种设计最贴合你的主用例？」
- 「其它设计里有没有值得吸收的元素？」

## 评估标准

来自《A Philosophy of Software Design》：

**接口简单性**：方法少、参数简单 = 更易学会正确使用。

**通用性**：可应对未来用例而无需改动。警惕过度泛化。

**实现效率**：接口形状是否允许高效实现？还是会逼出别扭内部？

**深度**：小接口藏大复杂度 = 深模块（好）。大接口薄实现 = 浅模块（避免）。

## 反模式

- 勿让子代理产出相似设计——强制 radically different
- 勿跳过比较——价值在对比
- 勿实现——纯讨论接口形状
- 勿按实现工作量评估
