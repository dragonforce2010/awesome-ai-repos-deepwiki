---
name: pull
description:
  将最新的 origin/main 拉入当前本地分支并解决合并冲突（即 update-branch）。当 Codex
  需要与 origin 同步、执行基于 merge 的更新（不是 rebase）以及指导冲突解决最佳实践时使用。
---

# Pull

## 工作流

1. 验证 git status 干净，或在 merge 前 commit/stash 变更。
2. 确保本地启用 rerere：
   - `git config rerere.enabled true`
   - `git config rerere.autoupdate true`
3. 确认远程和分支：
   - 确保 `origin` remote 存在。
   - 确保当前分支是接收 merge 的分支。
4. Fetch 最新 refs：
   - `git fetch origin`
5. 先同步远程 feature 分支：
   - `git pull --ff-only origin $(git branch --show-current)`
   - 这会拉取远程分支的更新（例如 GitHub auto-commit），在 merge `origin/main` 之前。
6. 按顺序 merge：
   - 优先使用 `git -c merge.conflictstyle=zdiff3 merge origin/main` 获取更清晰的冲突上下文。
7. 如出现冲突，解决后（见下方冲突指导）：
   - `git add <files>`
   - `git commit`（或 `git merge --continue` 如 merge 暂停中）
8. 通过项目检查验证（遵循 `AGENTS.md` 中的仓库策略）。
9. 总结 merge：
   - 说明最有挑战性的冲突/文件及解决方式。
   - 记录任何假设或后续事项。

## 冲突解决指导（最佳实践）

- 编辑前先检查上下文：
  - 使用 `git status` 列出冲突文件。
  - 使用 `git diff` 或 `git diff --merge` 查看冲突 hunk。
  - 使用 `git diff :1:path/to/file :2:path/to/file` 和 `git diff :1:path/to/file :3:path/to/file` 比较 base vs ours/theirs，获取文件级别的意图视图。
  - 使用 `merge.conflictstyle=zdiff3` 时，冲突标记包含：
    - `<<<<<<<` ours, `|||||||` base, `=======` split, `>>>>>>>` theirs。
    - 起止处的匹配行被修剪出冲突区域，聚焦差异核心。
  - 总结双方变更的意图，决定语义正确的结果，然后编辑：
    - 陈述每侧试图实现什么（bug 修复、重构、重命名、行为变更）。
    - 识别共同目标（如有），以及一方是否取代另一方。
    - 先决定最终行为；然后才编写匹配该决策的代码。
    - 除非冲突明确表示有意变更，否则优先保持不变量、API 契约和用户可见行为。
  - 选择解决方案前打开文件理解双方意图。
- 优先最小化、保意图的编辑：
  - 保持行为与分支目的一致。
  - 避免意外删除或静默行为变更。
- 每次解决一个文件，每个逻辑批次后重跑测试。
- 仅在确定一方应完全胜出时使用 `ours/theirs`。
- 对复杂冲突，搜索相关文件或定义以与代码库其余部分对齐。
- 对生成的文件，先解决非生成的冲突，再重新生成：
  - 优先解决源文件和手写逻辑，再处理生成产物。
  - 运行产生该生成文件的 CLI/工具命令干净重建，然后暂存重新生成的输出。
- 对意图不明确的 import 冲突，先接受双方：
  - 临时保留所有候选 import，完成 merge，然后运行 lint/类型检查安全移除未使用或错误的 import。
- 解决后确保无冲突标记残留：
  - `git diff --check`
- 不确定时，记录假设并在完成 merge 前请求确认。

## 何时询问用户（尽量减少）

除非没有安全、可逆的替代方案，**不要**请求输入。优先做最佳判断，记录理由，然后继续。

仅在以下情况询问用户：

- 正确的解决方案依赖于无法从代码、测试或附近文档推断的产品意图或行为。
- 冲突涉及用户可见的契约、API 表面或 migration，选错可能破坏外部消费者。
- 冲突要求在技术优劣相当且无明确本地信号的两个互斥设计中选择。
- merge 引入数据丢失、schema 变更或不可逆副作用且无明显安全默认值。
- 分支不是预期目标，或远程/分支名不存在且无法本地确定。

其他情况下，继续 merge，在笔记中简要解释决策，留下清晰可审查的 commit 历史。
