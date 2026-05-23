---
name: feishu-ui-state-machine-guardrail
description: 在修改了飞书卡片状态机逻辑载体（如回调 schema/解析、卡片操作路由、内联替换与仅追加决策、生命周期戳记或旧卡片处理）后，审计并更新此仓库的规范飞书卡片 UI 状态机。在实现稳定后且提交前使用。
---

# Feishu UI State Machine Guardrail

将 [docs/general/feishu-card-ui-state-machine.md](../../../docs/general/feishu-card-ui-state-machine.md) 视为当前飞书卡片 UI / 回调层表现的规范参考。

当改动涉及飞书卡片状态机逻辑载体时，触发此技能，即使预期的 UX 表现“不应该改变”。

典型触发词：
- 回调 payload schema 或解析逻辑
- 卡片拥有者 / 类型 / 动作路由逻辑
- 内联替换还是仅追加的决策逻辑
- 命令菜单 / 选择提示 / 请求提示的导航逻辑
- 生命周期戳记、旧卡片拒绝或回调新鲜度决策逻辑
- 决定现有卡片是否仍能操作或执行什么状态变异的 projector / gateway 逻辑

对于纯文案、样式、日志、测试或未改变这些逻辑载体的重构，不要触发此技能。

每次实现过程中使用此技能一次，在代码和测试基本稳定后且在提交前使用。不要在每次微调后都触发它。

## 工作流

1. 阅读规范状态机文档和改动涉及的飞书 UI 代码路径。
2. 更新文档以匹配当前实现：
   - 拥有者分类
   - 回调 `kind` 和 payload 字段
   - 表单提交约定
   - 内联替换与仅追加的边界
   - `daemon_lifecycle_id` 戳记与旧卡片语义
   - 当前测试基线
3. 审计改动后的表现，排查飞书 UI 死胡同或过时动作泄露：
   - 相同上下文的导航动作意外追加了新卡片而不是替换
   - 改变状态的动作现在替换了当前卡片并隐藏了真实结果
   - 过期的卡片仍能改变产品状态
   - projector 和 gateway 在 payload 键或字段名称上产生漂移
   - 依赖当前守护进程新鲜度的卡片上缺少生命周期戳记
4. 如果审计发现 bug 级问题，在提交前修复它，添加或更新测试，然后重新运行一次此审计流。
5. 如果残留的问题是产品权衡而非 bug，将其追加到规范文档的 `## 待讨论取舍` 下。

## 更新规则

1. 将“当前实现的表现”与“未来的控制器 / 架构构想”分开。
2. 当改动同样影响 attach/use/follow/new/request-gate 产品语义时，在同一轮次中运行 remote surface 守护防线。
3. 当规范文档路径或分类改变时，更新 `docs/README.md`。
4. 如果此守护防线的默认触发场景集改变，更新 `AGENTS.md`。

## 验证基线

1. 针对涉及的飞书 UI 路径运行针对性测试：
   - `go test ./internal/adapter/feishu ./internal/app/daemon ./internal/core/control ./internal/core/orchestrator`
2. 如果 projector 和 gateway 对当前卡片可以发出的回调 payload 存在分歧，不得提交。
3. 如果过期的卡片在没有故意且有文档记录的兼容性原因的情况下，仍能执行产品状态变异，不得提交。
4. 如果新的 UI 流程导致用户留有可点击的旧卡片但没有任何明确的下一步操作，不得提交。

## 范围提醒

此技能是核心 remote surface 守护防线在飞书卡片端的对应部分。它覆盖飞书 UI 会话、payload 和新鲜度表现，不独立涵盖完整的 attach/follow/queue product state graph by itself。
