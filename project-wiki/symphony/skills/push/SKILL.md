---
name: push
description:
  将当前分支变更推送到 origin 并创建或更新对应的 pull request；当被要求推送、发布更新
  或创建 pull request 时使用。
---

# Push

## 前置条件

- `gh` CLI 已安装且在 `PATH` 中可用。
- `gh auth status` 在此仓库的 GitHub 操作中成功。

## 目标

- 安全地将当前分支变更推送到 `origin`。
- 如分支没有 PR 则创建，否则更新已有 PR。
- 远程移动时保持分支历史干净。

## 相关 Skills

- `pull`：当 push 被拒绝或同步不干净时使用（non-fast-forward、merge 冲突风险或过期分支）。

## 步骤

1. 识别当前分支并确认远程状态。
2. push 前运行本地验证（`make -C elixir all`）。
3. 将分支推送到 `origin`，如需要设置 upstream tracking，使用已配置的远程 URL。
4. 如 push 不干净/被拒绝：
   - 如失败是 non-fast-forward 或同步问题，运行 `pull` skill merge `origin/main`，解决冲突，重跑验证。
   - 再次 push；仅在历史被重写时使用 `--force-with-lease`。
   - 如失败是由于配置的远程上的认证、权限或工作流限制，停止并显示确切错误，而非作为变通方案重写远程或切换协议。
5. 确保分支有 PR：
   - 无 PR 则创建。
   - 有开放的 PR 则更新。
   - 分支关联到已关闭/合入的 PR 则创建新分支 + PR。
   - 写一个清晰描述变更结果的 PR 标题。
   - 分支更新时，明确重新考虑当前 PR 标题是否仍匹配最新范围；不匹配则更新。
6. 使用 `.github/pull_request_template.md` 明确写/更新 PR body：
   - 用此变更的具体内容填写每个 section。
   - 替换所有占位符注释（`<!-- ... -->`）。
   - 模板期望的地方保留 bullets/checkboxes。
   - 如 PR 已存在，刷新 body 内容使其反映 PR 的完整范围（分支上所有预期工作），不仅是最新 commit，包括新增、移除或方法变更的工作。
   - **不要**复用早期迭代的过时描述文本。
7. 用 `mix pr_body.check` 验证 PR body 并修复所有报告的问题。
8. 用 `gh pr view` 回复 PR URL。

## 命令

```sh
# 识别分支
branch=$(git branch --show-current)

# 最小验证门控
make -C elixir all

# 初始 push：尊重当前 origin remote。
git push -u origin HEAD

# 如因远程移动而失败，使用 pull skill。pull-skill 解决和重新验证后，重试正常 push：
git push -u origin HEAD

# 如配置的远程因认证、权限或工作流限制拒绝 push，停止并显示确切错误。

# 仅当本地历史被重写时：
git push --force-with-lease origin HEAD

# 确保 PR 存在（仅缺失时创建）
pr_state=$(gh pr view --json state -q .state 2>/dev/null || true)
if [ "$pr_state" = "MERGED" ] || [ "$pr_state" = "CLOSED" ]; then
  echo "Current branch is tied to a closed PR; create a new branch + PR." >&2
  exit 1
fi

# 写一个清晰、人类友好的标题总结交付的变更。
pr_title="<clear PR title written for this change>"
if [ -z "$pr_state" ]; then
  gh pr create --title "$pr_title"
else
  # 每次分支更新时重新考虑标题；范围变化时编辑。
  gh pr edit --title "$pr_title"
fi

# 在验证前写/编辑 PR body 使其匹配 .github/pull_request_template.md。
# 示例工作流：
# 1) 打开模板并为此 PR 起草 body 内容
# 2) gh pr edit --body-file /tmp/pr_body.md
# 3) 分支更新时，重新检查标题/body 是否仍匹配当前 diff

tmp_pr_body=$(mktemp)
gh pr view --json body -q .body > "$tmp_pr_body"
(cd elixir && mix pr_body.check --file "$tmp_pr_body")
rm -f "$tmp_pr_body"

# 显示 PR URL 用于回复
gh pr view --json url -q .url
```

## 注意事项

- **不要**使用 `--force`；仅作为最后手段使用 `--force-with-lease`。
- 区分同步问题和远程认证/权限问题：
  - 对 non-fast-forward 或过期分支问题使用 `pull` skill。
  - 直接显示认证、权限或工作流限制，而非更改远程或协议。
