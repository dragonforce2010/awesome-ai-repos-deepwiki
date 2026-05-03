---
name: finishing-a-development-branch
description: 当实施完成、所有测试通过、需要决定如何集成工作时使用 - 通过提供结构化选项来指导开发工作的完成，包括合并、PR 或清理
---

# 完成开发分支

## 概述

通过提供清晰选项和处理选择的工作流来指导开发工作的完成。

**核心原则：**验证测试 → 提供选项 → 执行选择 → 清理。

**开始时宣布：**"我正在使用 finishing-a-development-branch 技能来完成此工作。"

## 流程

### 步骤 1：验证测试

**在提供选项之前，验证测试通过：**

```bash
# 运行项目的测试套件
npm test / cargo test / pytest / go test ./...
```

**如果测试失败：**停止。不要进入步骤 2。

**如果测试通过：**继续步骤 2。

### 步骤 2：确定基准分支

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

或询问："此分支从 main 分出 - 正确吗？"

### 步骤 3：提供选项

展示恰好这 4 个选项：

```
实施完成。你想怎么做？

1. 本地合并回 <base-branch>
2. 推送并创建 Pull Request
3. 保持分支现状（我稍后处理）
4. 丢弃此工作

选择哪个选项？
```

**不要添加解释** - 保持选项简洁。

### 步骤 4：执行选择

#### 选项 1：本地合并

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
<test command>
# 如果测试通过
git branch -d <feature-branch>
```

然后：清理 worktree（步骤 5）

#### 选项 2：推送并创建 PR

```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## 摘要
<2-3 个变更要点>

## 测试计划
- [ ] <验证步骤>
EOF
)"
```

然后：清理 worktree（步骤 5）

#### 选项 3：保持现状

报告："保持分支 &lt;name&gt;。Worktree 保留在 &lt;path&gt;。"

**不清理 worktree。**

#### 选项 4：丢弃

**先确认：**等待输入精确的 "discard" 确认。

如果确认：
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

然后：清理 worktree（步骤 5）

### 步骤 5：清理 Worktree

**选项 1、2、4：**检查是否在 worktree 中，如果是则移除。

**选项 3：**保留 worktree。

## 红旗

**绝不：**
- 在测试失败时继续
- 未在合并结果上验证测试就合并
- 未经确认删除工作
- 未经明确请求强制推送

**始终：**
- 在提供选项前验证测试
- 展示恰好 4 个选项
- 选项 4 需要输入确认
- 仅选项 1 和 4 清理 worktree

## 集成

**被调用者：**
- **subagent-driven-development**（步骤 7）- 所有任务完成后
- **executing-plans**（步骤 5）- 所有批次完成后

**配对：**
- **using-git-worktrees** - 清理该技能创建的 worktree
