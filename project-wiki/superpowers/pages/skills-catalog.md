<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [skills/brainstorming/SKILL.md:1-10](../../../project-repos/superpowers/skills/brainstorming/SKILL.md#L1-L10)
- [skills/writing-plans/SKILL.md:1-10](../../../project-repos/superpowers/skills/writing-plans/SKILL.md#L1-L10)
- [skills/subagent-driven-development/SKILL.md:1-10](../../../project-repos/superpowers/skills/subagent-driven-development/SKILL.md#L1-L10)
- [skills/test-driven-development/SKILL.md:1-10](../../../project-repos/superpowers/skills/test-driven-development/SKILL.md#L1-L10)
- [skills/systematic-debugging/SKILL.md:1-10](../../../project-repos/superpowers/skills/systematic-debugging/SKILL.md#L1-L10)
- [skills/requesting-code-review/SKILL.md:1-10](../../../project-repos/superpowers/skills/requesting-code-review/SKILL.md#L1-L10)
- [skills/finishing-a-development-branch/SKILL.md:1-10](../../../project-repos/superpowers/skills/finishing-a-development-branch/SKILL.md#L1-L10)
- [skills/using-git-worktrees/SKILL.md:1-10](../../../project-repos/superpowers/skills/using-git-worktrees/SKILL.md#L1-L10)
- [skills/receiving-code-review/SKILL.md:1-10](../../../project-repos/superpowers/skills/receiving-code-review/SKILL.md#L1-L10)
- [skills/verification-before-completion/SKILL.md:1-10](../../../project-repos/superpowers/skills/verification-before-completion/SKILL.md#L1-L10)
- [skills/executing-plans/SKILL.md:1-10](../../../project-repos/superpowers/skills/executing-plans/SKILL.md#L1-L10)
- [skills/dispatching-parallel-agents/SKILL.md:1-10](../../../project-repos/superpowers/skills/dispatching-parallel-agents/SKILL.md#L1-L10)
- [skills/writing-skills/SKILL.md:1-10](../../../project-repos/superpowers/skills/writing-skills/SKILL.md#L1-L10)
- [skills/using-superpowers/SKILL.md:1-10](../../../project-repos/superpowers/skills/using-superpowers/SKILL.md#L1-L10)

</details>

# 技能目录

Superpowers 提供 14 个技能，覆盖从需求探索到代码交付的完整工程生命周期。

## 技能分类索引

### 🔵 工作流核心（必须按顺序使用）

| 技能 | 触发条件 | 产出 |
|------|---------|------|
| `brainstorming` | 开始任何创造性工作（新建功能、组件、修改行为） | 设计文档（spec） |
| `using-git-worktrees` | 开始功能开发，需要隔离工作区 | 隔离的 Worktree + 干净基线 |
| `writing-plans` | 有 spec 或需求，需要拆解为任务 | 实现计划（plan） |
| `subagent-driven-development` | 有实施计划，任务相对独立，需高速迭代 | 完成的任务列表 |
| `finishing-a-development-branch` | 实现完成，所有测试通过，需要整合决策 | 合并/PR/保留/丢弃决策 |

### 🟢 测试与质量

| 技能 | 触发条件 | 核心原则 |
|------|---------|---------|
| `test-driven-development` | 实现任何功能或修复 bug | RED-GREEN-REFACTOR 铁律 |
| `systematic-debugging` | 遇到任何 bug、测试失败或异常行为 | 找到根因前不修复 |
| `verification-before-completion` | 任务声称完成，需要验证 | 不宣布胜利直到验证过 |
| `requesting-code-review` | 任务间或最终需要代码评审 | 按严重程度分类问题 |
| `receiving-code-review` | 收到评审反馈，需要处理 | 区分有效反馈与风格偏好 |

### 🟡 协作与执行

| 技能 | 触发条件 | 特点 |
|------|---------|------|
| `executing-plans` | 有实施计划，在同一会话中批量执行 | 与 SDD 相比，无子智能体分派 |
| `dispatching-parallel-agents` | 有多个独立任务，需要并行执行 | 并行度高于 SDD |

### 🟣 Meta 技能

| 技能 | 触发条件 | 产出 |
|------|---------|------|
| `writing-skills` | 创建或修改任何技能 | 经过 TDD 验证的技能文档 |
| `using-superpowers` | 每次会话启动 | 技能加载规范与触发检查 |

## 技能触发优先级

当多个技能可能适用时，按以下顺序优先：

1. **Process skills first**：`brainstorming`、`debugging`——这些决定如何接近任务
2. **Implementation skills second**：具体的实现技能

```
"我们要做什么功能" → brainstorming → writing-plans → subagent-driven-development
"修复这个 bug" → debugging → (TDD 修复)
```

## 能力快速查找

| 需求 | 对应技能 |
|------|---------|
| 防止智能体跳过设计直接写代码 | `brainstorming` |
| 在隔离环境开发，不污染主分支 | `using-git-worktrees` |
| 把设计变成可执行的步骤清单 | `writing-plans` |
| 快速推进多个独立任务 | `subagent-driven-development` |
| 确保每次改动都有测试 | `test-driven-development` |
| 修复 bug 而不是修症状 | `systematic-debugging` |
| 修复后验证真的修好了 | `verification-before-completion` |
| 结构化评审代码 | `requesting-code-review` |
| 优雅处理评审反馈 | `receiving-code-review` |
| 决定如何整合完成的工作 | `finishing-a-development-branch` |
| 创建新技能 | `writing-skills` |

## 相关页面

- [技能框架](skills-system) — 技能的编写规范与 TDD 驱动开发
- [Brainstorming](brainstorming) — 完整设计探索流程
- [Subagent-Driven Development](subagent-driven-development) — 主流执行模式
- [TDD](test-driven-development) — 测试驱动开发铁律
