---
name: issue-doc-sync
description: "在将已关闭的 GitHub Issue 同步回仓库文档时使用。通过 updatedAt 增量扫描关闭的 Issue，重用跟踪的状态缓存，仅展示自上次提取以来发生变化的候选 Issue，并为此仓库记录跳过/合并/新文档决策。"
---

# issue-doc-sync

当用户要求做以下操作时，使用此技能：
- 将已关闭的 GitHub Issue 同步回 `docs/`
- 从已关闭的 Issue 中提取长效的设计知识
- 避免重新阅读未改变的已关闭 Issue
- 在此仓库中维护跟踪的 issue-to-doc 同步状态

## 工作流

1. 首先同步当前分支。
   - 运行 `git pull --ff-only`。
   - 不要针对过期的本地代码或过期的跟踪缓存来评估 Issue。
2. 仅列出发生变化的已关闭 Issue。
   - 优先使用 `scripts/issue-doc-sync/review.sh plan`。
   - 这会比较 GitHub 的 `updatedAt` 与 `.codex/state/issue-doc-sync/state.json`。
   - 默认的处理顺序是按 `closedAt` 从旧到新，同一时间关闭的则以 issue 编号作为兜底逻辑。
3. 审查每个候选 Issue。
   - 优先使用 `scripts/issue-doc-sync/review.sh inspect [issue-number]`。
   - 如果没有给出 issue 编号，运行器会自动打开最旧的待处理候选 Issue。
   - 如果当前的文档已经覆盖了长效结论，跳过它并记录原因。
   - 如果某个现有的规范文档是合适的归宿，将其合并到该文档中。
   - 如果没有合适的文档存在，在正确的生命周期目录下创建新文档。
4. 更新文档。
   - 每一个 `docs/**/*.md` 文件都必须在标题下保留可见的元数据块：
     - `Type`
     - `Updated`
     - `Summary`
   - 如果你添加或移动了生命周期文档，在同一个改动中更新 `docs/README.md`。
5. 在跟踪的状态缓存中记录决策。
   - 优先使用 `scripts/issue-doc-sync/review.sh record [issue-number] --decision ... --reason ...`。
   - 如果未提供 issue 编号，运行器会针对最旧的待处理候选进行记录。
   - 必填字段：
     - `--issue`
     - `--decision skip|merge|new-doc`
     - `--reason`
   - 当决策为 `merge` 或 `new-doc` 时，针对每个改动的文档路径添加一次 `--target-doc`。
   - 底层的 `record` 命令现在会在未提供时自动从 GitHub 填充 Issue 元数据。
   - 如果目标文档已被更新的同步 Issue 修改过，`record` 默认会拒绝，并需要 `--force` 来进行手动的回填。
6. 验证。
   - 运行器在 `record` 之后会自动重新运行 `plan`。
   - 也可以运行 `scripts/issue-doc-sync/review.sh plan` 并确认未改变的 Issue 从候选集中消失。

## 决策规则

- 默认文档目标：
  - 对于功能级别的已实现行为，存放到 `docs/implemented/`
  - 只有在结论是长期的仓库基准或规范流程时，才存放到 `docs/general/`
- 在以下情况下跳过：
  - 当前文档已覆盖长效结论
  - 该 Issue 主要是过程讨论、文案微调或低价值的运维历史

## 状态缓存

- 缓存路径：`.codex/state/issue-doc-sync/state.json`
- 该缓存文件被有意置于 git 跟踪之下。
- 每一个决策都应该与匹配的文档改动一起提交。
- 期望的跟踪状态字段：
  - issue 编号
  - GitHub `updatedAt`
  - 决策
  - 原因
  - 目标文档路径
  - 源 issue URL
