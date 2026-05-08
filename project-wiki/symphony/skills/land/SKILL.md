---
name: land
description:
  通过监控冲突、解决冲突、等待检查通过并 squash-merge 来合入 PR；当被要求合入、
  merge 或引导 PR 完成时使用。
---

# Land

## 目标

- 确保 PR 与 main 无冲突。
- 保持 CI 绿灯，出现失败时修复。
- 检查通过后 squash-merge PR。
- 在 PR 合入前**不要**让出控制权；持续运行 watcher 循环，除非被阻塞。
- 合入后无需删除远程分支；仓库会自动删除 head 分支。

## 前置条件

- `gh` CLI 已认证。
- 在 PR 分支上且工作树干净。

## 步骤

1. 找到当前分支的 PR。
2. 在任何 push 之前确认本地完整检查通过。
3. 如工作树有未提交变更，使用 `commit` skill 提交并使用 `push` skill 推送后再继续。
4. 检查与 main 的可合并性和冲突。
5. 如有冲突，使用 `pull` skill fetch/merge `origin/main` 并解决冲突，然后使用 `push` skill 发布更新的分支。
6. 确保 Codex review 评论（如有）已被确认，所有必要修复已处理后再合入。
7. 等待检查完成。
8. 如检查失败，拉取日志、修复问题、使用 `commit` skill 提交、使用 `push` skill 推送，然后重新运行检查。
9. 当所有检查通过且 review 反馈已处理，使用 PR title/body 作为 merge subject/body 进行 squash-merge。
10. **上下文守护**：在实现 review 反馈前，确认它不与用户的既定意图或任务上下文冲突。如有冲突，在行内回复理由并在修改代码前询问用户。
11. **推回模板**：当不同意时，行内回复：确认 + 理由 + 提供替代方案。
12. **歧义门控**：当歧义阻碍进展时，使用澄清流程（将 PR 分配给当前 GH 用户，提及他们，等待回复）。歧义解决前**不要**实现。
    - 如你确信自己的判断优于 reviewer，可以在不询问用户的情况下继续，但行内回复你的理由。
13. **逐评论模式**：对每条 review 评论，选择：接受、澄清或推回。在修改代码前行内回复（或在 issue 线程中回复 Codex review）说明模式。
14. **先回复再修改**：推送代码变更前**始终**先回复预期操作（review 评论用行内回复，Codex review 用 issue 线程）。

## 命令

```
# 确保分支和 PR 上下文
branch=$(git branch --show-current)
pr_number=$(gh pr view --json number -q .number)
pr_title=$(gh pr view --json title -q .title)
pr_body=$(gh pr view --json body -q .body)

# 检查可合并性和冲突
mergeable=$(gh pr view --json mergeable -q .mergeable)

if [ "$mergeable" = "CONFLICTING" ]; then
  # 运行 `pull` skill 处理 fetch + merge + 冲突解决。
  # 然后运行 `push` skill 发布更新的分支。
fi

# 推荐：使用下方的异步 Watch Helper。手动循环作为 Python 不可用
# 或 helper 脚本不存在时的后备方案。
# 等待 review 反馈：Codex review 以 issue 评论形式到达，以
# "## Codex Review — <persona>" 开头。像处理 reviewer 反馈一样对待：
# 回复 `[codex]` issue 评论确认发现及是否处理或推迟。
while true; do
  gh api repos/{owner}/{repo}/issues/"$pr_number"/comments \
    --jq '.[] | select(.body | startswith("## Codex Review")) | .id' | rg -q '.' \
    && break
  sleep 10
done

# 监控检查
if ! gh pr checks --watch; then
  gh pr checks
  # 识别失败的运行并检查日志
  # gh run list --branch "$branch"
  # gh run view <run-id> --log
  exit 1
fi

# Squash-merge（此仓库合入时自动删除远程分支）
gh pr merge --squash --subject "$pr_title" --body "$pr_body"
```

## 异步 Watch Helper

推荐：使用 asyncio watcher 并行监控 review 评论、CI 和 head 更新：

```
python3 .codex/skills/land/land_watch.py
```

退出码：

- 2: 检测到 review 评论（处理反馈）
- 3: CI 检查失败
- 4: PR head 已更新（检测到自动修复 commit）

## 失败处理

- 如检查失败，用 `gh pr checks` 和 `gh run view --log` 拉取详情，本地修复，使用 `commit` skill 提交，使用 `push` skill 推送，重新运行 watch。
- 使用判断力识别不稳定的失败。如某个失败是 flaky 的（如仅一个平台超时），可以不修复继续进行。
- 如 CI 推送了自动修复 commit（由 GitHub Actions 作者），它不会触发新的 CI 运行。检测更新的 PR head，本地 pull，如需要 merge `origin/main`，添加一个真实作者 commit，force-push 以重触发 CI，然后重启检查循环。
- 如所有 job 因 merge commit 上的 pnpm lockfile 损坏错误而失败，修复方法是 fetch 最新 `origin/main`，merge，force-push，重跑 CI。
- 如可合并性为 `UNKNOWN`，等待并重新检查。
- 有未处理的 review 评论（人类或 Codex review）时**不要**合入。
- Codex review job 失败时会重试且不阻塞；使用 `## Codex Review — <persona>` issue 评论的存在（而非 job 状态）作为 review 反馈可用的信号。
- **不要**启用 auto-merge；此仓库没有 required checks 所以 auto-merge 可能跳过测试。
- 如远程 PR 分支因你之前的 force-push 或 merge 而前进，避免冗余 merge；如需要本地重跑 formatter 并 `git push --force-with-lease`。

## Review 处理

- Codex review 现以 GitHub Actions 发布的 issue 评论形式到达。以 `## Codex Review — <persona>` 开头，包含 reviewer 的方法论和护栏。**必须**在合入前确认这些反馈。
- 人类 review 评论是阻塞性的，**必须**在请求新 review 或合入前处理（回复并解决）。
- 如多个 reviewer 在同一线程评论，回复每条评论（可批量）后再关闭线程。
- 通过 `gh api` 获取 review 评论并以带前缀的评论回复。
- 使用 review 评论端点（非 issue 评论）查找行内反馈：
  - 列出 PR review 评论：
    ```
    gh api repos/{owner}/{repo}/pulls/<pr_number>/comments
    ```
  - PR issue 评论（顶层讨论）：
    ```
    gh api repos/{owner}/{repo}/issues/<pr_number>/comments
    ```
  - 回复特定 review 评论：
    ```
    gh api -X POST /repos/{owner}/{repo}/pulls/<pr_number>/comments \
      -f body='[codex] <response>' -F in_reply_to=<comment_id>
    ```
- `in_reply_to` 必须是数字 review 评论 id（如 `2710521800`），不是 GraphQL node id（如 `PRRC_...`），端点必须包含 PR 编号（`/pulls/<pr_number>/comments`）。
- 如 GraphQL review reply mutation 被禁止，使用 REST。
- reply 的 404 通常意味着端点错误（缺少 PR 编号）或权限不足；先列出评论验证。
- 此 agent 生成的所有 GitHub 评论**必须**以 `[codex]` 为前缀。
- 对 Codex review issue 评论，在 issue 线程中回复（不是 review 线程），带 `[codex]`，说明是否立即处理反馈或推迟（包含理由）。
- 如反馈需要修改：
  - 对行内 review 评论（人类），用预期修复回复（`[codex] ...`）**作为对原始 review 评论的行内回复**，使用 review 评论端点和 `in_reply_to`（不要使用 issue 评论）。
  - 实现修复，commit，push。
  - 在确认反馈的同一位置回复修复详情和 commit sha（`[codex] ...`）。
  - land watcher 将 Codex review issue 评论视为未解决，直到有更新的 `[codex]` issue 评论确认发现。
- 仅在需要重跑时请求新的 Codex review（如新 commit 后）。没有变更不要请求。
  - 请求新 Codex review 前，重跑 land watcher 确保零未处理的 review 评论（所有都有 `[codex]` 行内回复）。
  - 推送新 commit 后，Codex review 工作流会在 PR 同步时重跑（或可手动重跑）。发布简洁的根级别总结评论让 reviewer 了解最新 delta：
    ```
    [codex] Changes since last review:
    - <short bullets of deltas>
    Commits: <sha>, <sha>
    Tests: <commands run>
    ```
  - 仅在上次请求后至少有一个新 commit 时才请求新 review。
  - 合入前等待下一条 Codex review 评论。

## 范围 + PR 元数据

- PR 标题和描述应反映变更的完整范围，不仅是最近的修复。
- 如 review 反馈扩大了范围，决定是否现在包含或推迟。可以接受、推迟或拒绝反馈。推迟或拒绝时，在根级别 `[codex]` 更新中说明简短原因（如超出范围、与意图冲突、不必要）。
- review 评论中提出的正确性问题应该被处理。如计划推迟或拒绝正确性关切，先验证并解释为何该关切不适用。
- 将每条 review 评论分类为：correctness、design、style、clarification、scope。
- 对 correctness 反馈，在关闭前提供具体验证（测试、日志或推理）。
- 接受反馈时，在根级别更新中包含一行理由。
- 拒绝反馈时，提供简短替代方案或后续触发条件。
- 一批修复后优先使用单个整合的"review addressed"根级别评论，而非多个小更新。
- 对文档反馈，确认文档变更与行为一致（不要仅为应付 review 做文档修改）。
