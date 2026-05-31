# GitHub Issue Crusher

端到端修复输入中指定的 **单个** GitHub issue，然后通过 **fork 工作流** 打开 **DRAFT** pull request — issue 在 upstream `{repo}`，修复 push 到 fork，跨仓库 draft PR 回到 `{repo}`。严格限定范围；这是自主运行，工作直到 draft PR 打开或遇到真实阻塞为止，然后停止。

## 工具分工 — Composio 管 GitHub 状态，本地 git 管工作区

GitHub 状态操作 — issue、PR、评论、review、checks、标签、作为远程 ref 的分支、仓库元数据 — 通过 Composio 的 `composio_execute({tool: "GITHUB_<ACTION>", arguments: {...}})` 完成。工作区 — clone、checkout、编辑、`git status`/`diff`、运行测试、本地 commit、将分支 push 到 fork — 留在本地 `git`。Composio 是唯一的权威 GitHub 身份（用户已连接账号，由 skill 的 `[github]` preflight 门控）；本地工作区才是实际改代码的地方。**不要**对状态操作 shell 到 `gh` — preflight 只检查了 Composio，未检查 gh 的凭据存储，因此 `gh` 调用可能静默走另一个账号。

## 两个仓库

- **Upstream** = `{repo}` — `#{issue}` 所在处，draft PR 打开处（base = `{pr_base}`，或 upstream 默认分支）。
- **Fork** = 若提供 `{fork}` 则用之，否则使用已认证 GitHub 账号下 `{repo}` 的现有 fork。在开头解析一次已认证账号：
  ```
  composio_execute({
    "tool": "GITHUB_GET_THE_AUTHENTICATED_USER",
    "arguments": {}
  })
  ```
  响应中的 `login` 即 `<fork-owner>`。若尚无 fork，则创建：
  ```
  composio_execute({
    "tool": "GITHUB_CREATE_A_FORK",
    "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>" }
  })
  ```

## 步骤

1. **阅读 issue。** 通过 Composio 拉取 `{repo}` 中 `#{issue}`（标题、body、评论）：
   ```
   composio_execute({
     "tool": "GITHUB_GET_AN_ISSUE",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "issue_number": {issue} }
   })
   composio_execute({
     "tool": "GITHUB_LIST_ISSUE_COMMENTS",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "issue_number": {issue} }
   })
   ```
   明确 issue 要求修改的确切文件/变更。

2. **确保 fork 存在。** 通过 `GITHUB_GET_THE_AUTHENTICATED_USER` 解析 `<fork-owner>`（本次运行缓存）。若 fork 不存在，用 `GITHUB_CREATE_A_FORK` 创建（幂等 — 已存在时为 no-op）。

3. **全新 clone。** 将 `{repo}` clone 到唯一目录（如 `/tmp/<repo-name>-{issue}-<rand>`）。若目录来自先前运行已存在，先删除再 clone，保证干净起点。这是本地 git 操作：
   ```
   git clone https://github.com/{repo} /tmp/<repo-name>-{issue}-<rand>
   ```

4. **在 clone 中固定本地 git 身份**，使 commit 在已认证账号下可验证。使用步骤 2 已有的 `login` 和 `id` — 绝不用 `--global`，绝不要覆盖主机全局配置：
   ```
   git -C <dir> config user.name  "<login>"
   git -C <dir> config user.email "<id>+<login>@users.noreply.github.com"
   ```

5. **定位根因。** 先用 `codegraph_search` 搜索 issue 的关键符号 / 错误字符串 / 字面短语 — 首次调用会自动索引（全新 clone 约 30–90s，属正常非 hang）。检查结果：
   - `coverage: full` → 阅读 top 命中并确认确切修改位置。
   - `coverage: partial` → 在 codegraph 返回的目录内用 `grep`  refine。
   - `coverage: none` 或零命中 → 回退到盲 `grep` / `glob`。

6. **应用最小修复。** 仅编辑步骤 5 识别的文件。重新读每个文件或 `git diff` 确认变更符合意图 — 绝不要依赖记忆。

7. **验证。** 运行适用于变更文件的测试/lint 命令（如 i18n 用 `pnpm i18n:check`，Rust 用 `cargo test -p <crate>`，TS 用 `pnpm test <pattern>`）。若变更仅为文档/字符串则跳过。

8. **分支、commit、push 到 fork** — push 是工作区操作，用本地 git：
   ```
   git -C <dir> checkout -b fix/{issue}-<short-slug>
   git -C <dir> add <only-the-changed-files>          # never git add -A
   git -C <dir> commit -m "<type>(scope): <short description> (#{issue})"
   git -C <dir> push -u "https://github.com/<fork-owner>/<repo-name>" fix/{issue}-<short-slug>
   ```

9. **通过 Composio 打开 DRAFT 跨仓库 PR。** 这是跨仓库 PR 的规范 Composio 调用 — `head` 值 `<fork-owner>:<branch>` 告诉 GitHub 从 fork 取分支：
   ```
   composio_execute({
     "tool": "GITHUB_CREATE_A_PULL_REQUEST",
     "arguments": {
       "owner": "<upstream-owner>",
       "repo":  "<upstream-repo-name>",
       "title": "<type>(scope): <short description> (#{issue})",
       "body":  "Closes #{issue}\n\n## Root cause\n<one paragraph>\n\n## Fix\n<one paragraph>\n\n## Verified\n<what you ran>",
       "head":  "<fork-owner>:fix/{issue}-<short-slug>",
       "base":  "{pr_base}",
       "draft": true
     }
   })
   ```
   自主运行中 `draft: true` 不可协商 — CI 运行且人工 review 后才 promote 为 ready。

10. **将 Phase 6 交给 shepherd，然后退出。** draft PR URL 到手后，以全新后台运行调用 `pr-review-shepherd` skill，使 CI + review 循环自主继续，而 **本** skill 干净退出：
    ```
    run_skill {
      "skill_id": "pr-review-shepherd",
      "inputs": { "repo": "{repo}", "pr": <pr-number-just-opened> }
    }
    ```
    调用立即返回 shepherd 的 `run_id` + `log` 路径。在最终响应中包含两者以便用户跟踪 shepherd，然后停止 — 不要自己轮询 CI，那是 shepherd 的工作。

## 规则
- **GitHub 状态走 Composio，工作区走本地 git。** 绝不要 shell 到 `gh` — preflight 门控的是 Composio，不是 `gh` 凭据存储，`gh` 可能静默用错身份。
- **范围：** 仅修复 `#{issue}` 所需变更。不做无关清理，不碰其他 issue。
- **事实来源** 是文件系统 + `git` + `codegraph` — 重新读/重新搜索，不要依赖回忆。
- **每次定位先 codegraph_search**（自动索引）；`grep` / `glob` 仅作 refine 或回退。
- **始终 DRAFT** — 自主运行绝不要以 ready-to-merge 开 PR。
- **停止** 于 draft PR 已开，或 surfaced 真实阻塞并停止 — 不要空转。
