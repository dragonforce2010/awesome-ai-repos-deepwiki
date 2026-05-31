# PR Review Shepherd

将单个 open GitHub PR 一路推进到 **ready-for-merge** — CI 全绿、每条可执行的 reviewer/bot 评论已处理、已获得 approval。这是自主 Phase-6 工作：迭代 **check → fix → push → re-check** 循环，直到两道门禁都关闭，或 surfaced 真实阻塞并停止。

## 工具分工 — Composio 管 GitHub 状态，本地 git 管工作区

GitHub 状态操作 — PR 详情、评论（顶层与 inline review）、check runs、状态汇总、评论回复、标签 — 通过 Composio 的 `composio_execute({tool: "GITHUB_<ACTION>", arguments: {...}})` 完成。工作区 — clone fork 分支、编辑文件、运行测试、commit、force-with-lease push 到 fork — 留在本地 `git`。Composio 是唯一的权威 GitHub 身份（用户已连接账号，由 skill 的 `[github]` preflight 门控）；本地工作区才是实际修复落地处。**不要**对状态操作 shell 到 `gh` — preflight 只检查了 Composio，未检查 gh 的凭据存储，因此 `gh` 调用可能静默走另一个账号。

## 本 skill 何时算「完成」

必须同时满足：
1. **CI 全绿** — PR `#{pr}` 上每个 required check 均为 `success`（或 maintainer 在线程中明确 waive）。
2. **所有可执行评论已解决** — 每个人类 reviewer 或 bot（CodeRabbit、Codecov 等）的每条评论要么 (a) 通过 follow-up commit 处理 **且** 在线程回复，要么 (b) 有意 defer 并在线程用一行原因回复。

若 PR 已 **merged**（成功）或 **closed without merge**（记录原因并报告）也应停止。

## 步骤

1. **快照 PR 状态** — 对 `{repo}` 上 `#{pr}` 通过 Composio。模型可并行时并行发起 — 均为只读状态操作：
   ```
   composio_execute({
     "tool": "GITHUB_GET_A_PULL_REQUEST",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "pull_number": {pr} }
   })
   composio_execute({
     "tool": "GITHUB_LIST_REVIEW_COMMENTS_ON_A_PULL_REQUEST",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "pull_number": {pr} }
   })
   composio_execute({
     "tool": "GITHUB_LIST_ISSUE_COMMENTS",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "issue_number": {pr} }
   })
   composio_execute({
     "tool": "GITHUB_LIST_REVIEWS_FOR_A_PULL_REQUEST",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "pull_number": {pr} }
   })
   composio_execute({
     "tool": "GITHUB_GET_THE_COMBINED_STATUS_FOR_A_SPECIFIC_REFERENCE",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "ref": "<head-sha-from-pull-request>" }
   })
   composio_execute({
     "tool": "GITHUB_LIST_CHECK_RUNS_FOR_A_GIT_REFERENCE",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "ref": "<head-sha-from-pull-request>" }
   })
   ```
   GitHub API 中 PR 既可用 `pull_number`（PR 专用端点）也可用 `issue_number`（顶层评论在 issue 面）。check 汇总端点使用 PR 响应中的 head SHA。

   从 PR 的 `head.repo.owner.login` 推导 `<fork-owner>`（若提供 `{fork}` 则用之）。记录 head 分支名为 `<branch>`。记录：失败 check id、未解决评论线程（含 body + author + path/line 若为 inline）、approval 数量、merge 状态、PR 状态（`OPEN` / `MERGED` / `CLOSED`）。

   _TODO(composio-catalog): 若上述 slug 在 Composio catalog 中漂移，换成当前名称。形状（owner/repo/pull_number/issue_number/ref）稳定；偶尔变的是 slug 大小写。_

2. **先检查终止条件。**
   - PR `state` 为 `MERGED` → 报告 `"merged: <url>"` 并停止。
   - PR `state` 为 `CLOSED`（未 merge）→ 报告 `"closed: <one-line reason from the latest comment>"` 并停止。
   - 所有 required checks 为 `success` **且** 零条未解决可执行线程 **且** 至少一个 approval → 报告 `"ready for merge: <url>"` 并停止。
   - 否则 → 继续。

3. **全新 clone fork 分支** 到唯一本地目录（若本 run 上一轮目录已存在且在正确 HEAD 可跳过）。clone + 身份固定是本地 git 工作区操作：
   ```
   git clone --branch <branch> https://github.com/<fork-owner>/<repo-name> /tmp/<repo-name>-pr{pr}-<rand>
   ```
   在 clone 中固定本地 git 身份，使新 commit 在已认证账号下可验证。使用一次性 `GITHUB_GET_THE_AUTHENTICATED_USER` 的 `login` 和 `id`：
   ```
   composio_execute({ "tool": "GITHUB_GET_THE_AUTHENTICATED_USER", "arguments": {} })
   # then with <login> + <id> from the response:
   git -C <dir> config user.name  "<login>"
   git -C <dir> config user.email "<id>+<login>@users.noreply.github.com"
   ```

4. **依次处理每个信号。** push 前处理完所有 open 项 — 每轮变更合并为一次 push：

   - **CI check 失败** — 从步骤 1 的 check-runs 响应读失败详情（看失败 run 的 `output.summary` / `output.text`）。定位根因（先用 `codegraph_search` 搜失败测试名或错误字符串），应用最小修复，本地跑 targeted 测试确认通过（`cargo test -p <crate> <name>` / `pnpm test <pattern>` 等），commit 消息注明失败 check：
     ```
     git -C <dir> add <only-the-fixed-files>
     git -C <dir> commit -m "fix(<scope>): <one line> (CI: <check-name>)"
     ```
     **不要** 用 `--no-verify` 绕过，除非失败可验证与本 PR 无关。

   - **Reviewer 要求改代码（可执行，人类或 bot）** — 做编辑，commit 引用该评论：`git commit -m "address review: <one-line> (#{pr} review)"`。线程回复在步骤 6 push 之后。

   - **Bot 评论（CodeRabbit / Codecov 等）** — 默认可执行。若明显误报，在步骤 6 计划线程一行原因回复，而非做无意义代码改动。

   - **Reviewer 要求 defer / 接受已知限制** — 计划线程回复确认，必要时开 follow-up issue，在本轮摘要中记为「deferred」。

5. **将本轮修复 push 到 fork**，一次 push。push 分支是工作区操作，用本地 git：
   ```
   git -C <dir> push --force-with-lease "https://github.com/<fork-owner>/<repo-name>" <branch>
   ```
   使用 `--force-with-lease`（绝不用 plain `--force`），他人并发 push 时 push 会 abort 而非覆盖。若 `--force-with-lease` 因 remote 已移动而拒绝，重跑步骤 1（remote 分叉 — push 前先处理新 commit）。

6. **按 id 回复每条已处理评论**，让 reviewer 知道已处理 — 即使 diff 已很明显。所有回复是 Composio 调用：

   - **Inline review 评论**（file:line，步骤 1 有 `id`）：
     ```
     composio_execute({
       "tool": "GITHUB_CREATE_A_REPLY_FOR_A_REVIEW_COMMENT",
       "arguments": {
         "owner": "<upstream-owner>",
         "repo":  "<upstream-repo-name>",
         "pull_number": {pr},
         "comment_id":  <comment-id>,
         "body": "Fixed in <short-sha>. <one-line description>"
       }
     })
     ```
   - **顶层 review 或一般线程**：
     ```
     composio_execute({
       "tool": "GITHUB_CREATE_AN_ISSUE_COMMENT",
       "arguments": {
         "owner": "<upstream-owner>",
         "repo":  "<upstream-repo-name>",
         "issue_number": {pr},
         "body": "<reply>"
       }
     })
     ```
   - **Deferred / 不同意**：用一行原因回复而非改代码，同样用 `GITHUB_CREATE_A_REPLY_FOR_A_REVIEW_COMMENT`（inline）或 `GITHUB_CREATE_AN_ISSUE_COMMENT`（顶层）。

7. **在新 commit 上等待 CI 重跑** 再声明本轮完成。轮询是 Composio 循环 — 约每 30s 在新 head SHA 上重发 check-runs 读，直到每个 required check 到达终态：
   ```
   composio_execute({
     "tool": "GITHUB_LIST_CHECK_RUNS_FOR_A_GIT_REFERENCE",
     "arguments": { "owner": "<upstream-owner>", "repo": "<upstream-repo-name>", "ref": "<new-head-sha>" }
   })
   ```
   每个 required check 的 `status` 为 `completed` 时停止轮询（看 `conclusion` 判 success/failure）。每轮轮询上限约 30 分钟，避免 stuck CI 无限占用本 run。

8. **回到步骤 1 重循环。** 若已跑 `{max_rounds}` 轮（默认 5）仍两道门禁未关，以 `"blocked after N rounds — surfacing for human review"` 退出，并附上仍失败的 checks 与仍 open 的评论 id。

## 规则
- **GitHub 状态走 Composio，工作区走本地 git。** 绝不要 shell 到 `gh` — preflight 门控的是 Composio，不是 `gh` 凭据存储，`gh` 可能静默用错身份。
- **范围：** 仅修复 *本 PR* 的 review 反馈或 CI 失败。不做无关 refactor、不扩 scope、不碰其他 issue。
- **`--force-with-lease`，绝不用 `--force`。** 保护他人 push。
- **不要用 `--no-verify` 绕过 CI**，除非失败可验证与本 PR 无关 **且** 已在轮次摘要中说明。
- **回复每条可执行信号** — 已改并 push 的评论仍要在线程回复，让 reviewer 知道。
- **CI 全绿 ≠ 完成。** 评论仍重要；两道门禁都必须关闭。
- **Approval 不会自动 merge。** 记录 approval 并继续监控，直到 PR 实际 merged 或 closed。
- **不要 push 到 upstream。** 仅 push 到 fork。
- **停止** 于两道门禁关闭、PR merged/closed、达到轮次上限，或识别需人工介入的阻塞 — 无论哪种都 plain 报告状态。
