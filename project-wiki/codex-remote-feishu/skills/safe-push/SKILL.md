---
name: safe-push
description: "在此仓库推送已提交的改动时使用，尤其是当 git push 可能因远程分支已推进而失败时。优先使用获取、并在需要时变基、在变基成功后重新运行测试并推送的辅助脚本。"
---

# safe-push

当任务是推送此仓库中已经提交的本地改动时，使用此技能。

优先从仓库根运行此命令：
```bash
./safe-push.sh
```

在反复检查分支是否就绪前，优先运行：
```bash
bash scripts/dev/worktree-facts.sh
```

当此辅助脚本适合该任务时，不要默认运行原始的 `git push origin <branch>`。

## 默认表现

该辅助脚本仅自动处理安全的 Happy Path：
1. 要求工作区是干净的 (clean worktree)
2. `git fetch` 目标分支
3. 如果远程分支已推进，则 `git rebase` 到其上
4. 只有在真正发生变基时，才重新运行 `go test ./...`
5. 如果发生了变基，在推送前要求进行显式的变基后审查
6. 如果未发现偏差，继续推送；如果发现偏差，先修复再推送

## 重要限制

- 它不会自动解决变基冲突。
- 它不会自动处理测试失败。
- 在发生冲突或测试失败时，它会停止并保留仓库状态以供手动处理。
- 在非交互式 Shell 中，通过以下命令确认审查：
  ```bash
  ./safe-push.sh --confirm-rebase-review
  ```
