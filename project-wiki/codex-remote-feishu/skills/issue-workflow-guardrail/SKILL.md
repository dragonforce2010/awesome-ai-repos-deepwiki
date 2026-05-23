---
name: issue-workflow-guardrail
description: "在此仓库处理 GitHub Issue 时使用，包括原始 Issue 梳理、可实现性重新评估、父/子 Issue 编排、长效执行快照、产品决策门禁对接、阶段性执行、结果汇总和验证器交接。运行固定的 prepare/lint/finish 工作流，保持 Issue 主体最新，并在可执行状态改变时停止。"
---

# Issue Workflow Guardrail

每当任务围绕此仓库的 GitHub Issue 展开时，使用此技能。

典型场景：
- 用户给出了 issue 编号或 URL
- issue 仍是原始状态，在编码前需要梳理
- 用户要求完成、分流、提炼或关闭一个 issue
- issue 足够大，需要进行父/子拆分或进度管理
- 多个工作结果必须合并回一个母 issue
- issue 可能被阻塞、未明确定义或在等待澄清

不要对旧的 issue 进行一次性的清理。仅当 issue 变为活跃状态时才进行规范化。

对于中/大型 issue 工作，将 [docs/general/issue-orchestration-workflow.md](../../../docs/general/issue-orchestration-workflow.md) 视为长效流程基准，并将此技能作为操作入口。

## 编排模型

将此技能作为仓库的主要 issue 协管器：
- 外部报告者 issue
  - 保留报告者拥有的主体作为公开沟通记录
  - 在规范化或执行前，创建一个链接回外部 issue 的新内部执行 issue
  - 将内部 issue 作为工作流管理单元，用于梳理、阶段性计划、快照和关闭
- 原始 issue
  - 将 issue 梳理为稳定的问题陈述
  - 决定它是仅达到研究闭环（research closure）还是准备好进行执行闭环（execution closure）
- 父 issue
  - 维护整体目标、进度表、依赖顺序和汇总状态
  - 当一个 issue 会混合多个目标或验证面时，优先使用此模式
- 子 issue
  - 视为默认的工作单元
  - 在其达到执行闭环或稳定的闭环索引前，不要将其交给实现
- 未拆分的直接执行单元
  - 当 issue 保持未拆分时，活跃的 issue 自身成为当前的工作单元
  - 直接执行并非旁路；它继承相同的工作边界、快照、产品门禁和验证器决策规则
- 执行快照
  - 在 issue 主体或链接的设计文档中保持长效的当前执行点和恢复契约
- 产品决策门禁
  - 当执行触及真实的产品权衡时，停止自动化，返回最小的决策包，而不是盲目猜测
- 验证器交接
  - 当中/大型 issue 实际完成时，将其交给 `$issue-verifier` 进行独立的只读轮次，然后再关闭

## 外部报告者流

当活跃的 GitHub Issue 由其他人创建，且仍作为公开 bug 报告或功能请求时：
1. 不要将原始的报告者主体改写为内部工作流格式。
2. 首先创建一个新的内部执行 issue。
3. 双向链接这两个 issue。
4. 将所有工作流结构放在内部 issue 上。
5. 仅将原始外部 issue 用于澄清、证据请求和最终结果评论。
6. 当内部执行 issue 通过关闭门禁时，将其关闭。
7. 不要自动关闭原始的外部 issue；而是在其上留下简短的完成评论。

## 拆分与汇总规则

在编码前，当以下任何一项为真时进行拆分：
- issue 混合了多个弱相关的目标
- 所需的背景不再是单个连贯的闭环
- 不同的部分需要实质上不同的验证面
- 工作自然可并行化

对于父 issue，在主体或链接的设计文档中保持以下内容的更新：
- 拆分结构
- 推荐顺序
- 依赖边
- 并行组
- 每个单元的当前闭环级别
- 下一个推荐就绪的单元

在以下情况下，将结果合并回父 issue：
- 工人完成了子 issue
- 子 issue 改变了预期的后续阶段
- 新发现使先前的拆分或依赖假设失效

## 执行决策记录

在 `prepare` 成功且编码开始前，编写或更新执行决策记录。
此记录必须至少说明：
- issue 是否被拆分
- 如果未拆分，为什么活跃的 issue 可以安全地作为单个工作单元
- 当前工作单元是什么
- 在关闭前是否预期进行独立的验证器轮次
- 如果不计划验证器，为什么跳过对本次运行是可接受的

将此记录放在活跃的 issue 主体、父 issue 或链接的设计文档中。

## 长效执行快照

对于中/大型 issue 工作，在活跃的父 issue、子 issue 或其链接的设计文档中维护一个长效的执行快照。
快照应至少包含：
- 当前阶段
- 当前执行点
- 已完成项
- 下一步
- 当前阻塞器
- 最近改变的假设
- 上一个已知的良好一致状态
- 未完成的尾部工作
- 恢复步骤

## 状态转换规则

将重新评估的状态与 issue 之前记录的可操作状态进行比较。
- 如果状态在任何方向发生改变，更新 issue 主体、标签和简要证据，然后运行 `finish --issue <number> --skip-checks` 并在本次轮次停止。
- 如果状态未改变但 issue 仍不可实现，更新 issue 并提供新确认的证据，然后运行 `finish --issue <number> --skip-checks` 并在此停下。
- 只有当 issue 已经是可实现的，且在重新评估后仍保持可实现时，才可以立即开始编码。
- 最小启动顺序为：`prepare` -> 重新阅读工作流文档和技能 -> 更新 `执行决策` -> 在适用时更新快照 -> `lint` -> 编码。

## 工作流状态标签

工作流管理的 issue 应当携带正好一个明确的工作流状态标签：
- `status:implementable-now`
- `status:needs-investigation`
- `status:needs-plan`
- `status:needs-clarification`
- `status:blocked`

## 固定入口点

默认使用绑定的包装脚本，而不是手动执行原始的 `git` / `gh` 序列：
```bash
bash .codex/skills/issue-workflow-guardrail/scripts/issuectl.sh prepare --issue <number>
bash .codex/skills/issue-workflow-guardrail/scripts/issuectl.sh lint --issue <number>
bash .codex/skills/issue-workflow-guardrail/scripts/issuectl.sh close-plan --issue <number>
bash .codex/skills/issue-workflow-guardrail/scripts/issuectl.sh finish --issue <number> [--comment-file path] [--close]
```
