---
name: executing-plans
description: 当你有书面实施计划需要在单独会话中执行并带审查检查点时使用
---

# 执行计划

## 概述

加载计划，批判性审查，执行所有任务，完成时报告。

**开始时宣布：**"我正在使用 executing-plans 技能来实施此计划。"

**注意：**告诉你的用户伙伴，Superpowers 在有子代理访问时效果更好。在有子代理支持的平台（如 Claude Code 或 Codex）上运行时，其工作质量会显著更高。如果子代理可用，使用 superpowers:subagent-driven-development 而非此技能。

## 流程

### 步骤 1：加载和审查计划
1. 读取计划文件
2. 批判性审查 - 识别关于计划的任何问题或疑虑
3. 如果有疑虑：在开始前向你的用户伙伴提出
4. 如果没有疑虑：创建 TodoWrite 并继续

### 步骤 2：执行任务

对于每个任务：
1. 标记为 in_progress
2. 严格遵循每个步骤（计划有小任务步骤）
3. 按指定运行验证
4. 标记为 completed

### 步骤 3：完成开发

所有任务完成并验证后：
- 宣布："我正在使用 finishing-a-development-branch 技能来完成此工作。"
- **必需子技能：**使用 superpowers:finishing-a-development-branch
- 遵循该技能验证测试、提供选项、执行选择

## 何时停止并请求帮助

**立即停止执行当：**
- 遇到阻塞（缺少依赖、测试失败、指令不清）
- 计划有关键差距阻止开始
- 你不理解指令
- 验证反复失败

**请求澄清而非猜测。**

## 记住
- 先批判性审查计划
- 严格遵循计划步骤
- 不要跳过验证
- 计划说引用技能时引用
- 阻塞时停止，不要猜测
- 未经用户明确同意，绝不在 main/master 分支上开始实施

## 集成

**必需工作流技能：**
- **superpowers:using-git-worktrees** - 必需：开始前设置隔离工作区
- **superpowers:writing-plans** - 创建此技能执行的计划
- **superpowers:finishing-a-development-branch** - 所有批次完成后完成开发
