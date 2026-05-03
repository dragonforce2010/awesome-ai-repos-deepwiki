<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [sdk/dag-task-runner/README.md](../../sdk/dag-task-runner/README.md)
- [.cursor/skills/dag-task-runner/scripts/dag.ts](../../.cursor/skills/dag-task-runner/scripts/dag.ts)
- [.cursor/skills/dag-task-runner/scripts/run_dag.ts](../../.cursor/skills/dag-task-runner/scripts/run_dag.ts)

</details>

# DAG 任务流运行器

`dag-task-runner` 是 Cursor Cookbook 中最具代表性的高阶用法之一。它向开发者展示了如何面对极其庞杂的需求（例如“从头写一个具有后端的 Todo 命令行工具”）时，利用 **“分而治之”** 与 **有向无环图 (Directed Acyclic Graph, DAG)** 的原理对大型任务进行有效编排。

## 为什么需要 DAG 编排？

通常让单个 Agent 从零写完一个复杂的工程极易遇到问题：
1. **上下文窗口溢出**。
2. **逻辑迷失**：它可能会在写到后端逻辑时突然忘记了前端的路由约定。
3. **响应时间过长**。

将大任务拆解为细分的**层级任务流**（例如第一层做技术选型研究，第二层做设计，第三层并行写各模块代码，最后一层写测试），可以极大提高成功率与生成速度。

## 系统架构与工作流

```mermaid
flowchart TD
    A[输入: DAG JSON 定义] --> B[dag.ts 解析与校验]
    B --> C{是否成环?}
    C -- 是 --> Error[抛出异常拒绝执行]
    C -- 否 --> D[计算 Rank 拓扑层级 (Kahn算法)]
    
    D --> E[Rank 1 并发执行]
    D --> F[Rank 2 等待前置依赖]
    
    E -->|成功 (带输出结果)| G[合并为 Upstream Context]
    G --> F
    
    F --> H[子任务 Agent 生成]
    H --> I[实时状态推送 (Canvas Writer)]
```

### 1. 任务定义与解析 (`dag.ts`)
开发者需要手写或由另一个 Agent 生成一份结构化的 DAG JSON 文件（参考 `examples/example_dag.json`）。该文件明确指出每个任务节点的 `id`、前置依赖数组 `depends_on` 以及对应的复杂程度 `complexity`。
`dag.ts` 会先通过深度优先或卡恩算法（Kahn's Algorithm）进行环检测，如果发现相互依赖的死结则立刻报错。之后，它会将所有节点划分为多个 Rank 集合。

### 2. 并行调度与上下文拼接 (`run_dag.ts`)
- 同一个 Rank 内的节点之间彼此无依赖，因此 `run_dag.ts` 会直接采用 `Promise.all` 发起无锁并行执行。
- 重点在于 **上下文拼接 (Stitching Upstream Context)**。当一个处于 Rank 2 的子任务启动时，Runner 会将它所有父节点在 Rank 1 产生的文本产物截取前 2,000 个字符进行拼接，自动作为前置 Context 塞入这个子 Agent 的 Prompt 中。这样下游 Agent 就不需要再次花费 Token 重复去阅读先决环境了。

### 3. 容错与优雅降级机制
为了防止单个跑偏的 Agent 阻塞整条流水线，Runner 具备完备的安全退出设计：
- **`TimeoutError` 处理**：单个任务被分配了超时时钟（默认 20 分钟），或者空闲数据流超时（如 5 分钟未吐出有效字符）。一旦触发，该任务节点被标记为 `ERROR`。
- **自动 Skip**：当一个任务失败时，所有依赖于该任务的下游节点会被标记为 `SKIP` 并跳过，而与它无关的分支网络仍会正常运行。
- **信号捕获**：注册了 `SIGINT` / `SIGTERM` 钩子，保证在用户按下 `Ctrl+C` 时可以正确释放流与未完成の Agent 会话。

## 模型路由映射 (Complexity to Model)

为了优化费用和速度，工具支持根据每个节点声明的 `complexity` 来自动分发给不同的底层大模型进行处理：
- `HIGH` → `gpt-5.3-codex` （适用于底层核心算法逻辑生成）
- `MED` → `composer-2` （适用于普通组件搭建）
- `LOW` → `auto-low` （适用于写单测或注释，或者做信息搜集汇总）

你可以在运行时通过传入 `--models-file` 动态覆盖这些映射。

## 相关页面

- [Canvas 动态渲染集成](canvas-rendering.md)
- [Cursor 技能封装](cursor-skills.md)
