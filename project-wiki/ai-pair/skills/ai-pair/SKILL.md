---
name: ai-pair
description: |
  AI Pair 协作 Skill。协调多个 AI 模型协作：
  一人创作（Author/Developer），两人审查（Codex + Gemini）。
  适用于代码、文章、视频脚本与各类创作任务。

  触发：/ai-pair、ai pair、dev-team、content-team、team-stop
metadata:
  version: 1.5.0
---

# AI Pair 协作

协调异构 AI 团队：一人创作，两人从不同角度审查。
使用 Claude Code 原生的 Agent Teams 能力，并以 Codex 与 Gemini 作为审查者。

## 为什么需要多名 AI 审查者？

不同 AI 模型的审查倾向存在本质差异。它们不只是找出不同的 bug，而是关注完全不同的维度。使用来自不同模型家族的审查者可以最大化覆盖范围。

## 命令

```bash
/ai-pair dev-team [project]       # Start dev team (developer + codex-reviewer + gemini-reviewer)
/ai-pair content-team [topic]     # Start content team (author + codex-reviewer + gemini-reviewer)
/ai-pair team-stop                # Shut down the team, clean up resources
```

示例：
```bash
/ai-pair dev-team HighlightCut        # Dev team for HighlightCut project
/ai-pair content-team AI-Newsletter   # Content team for writing AI newsletter
/ai-pair team-stop                     # Shut down team
```

## 前置条件

- **Claude Code** — Team Lead + agent 运行时
- **Codex CLI**（`codex`）— 供 codex-reviewer 使用
- **Gemini CLI**（`gemini`）— 供 gemini-reviewer 使用
- 两个外部 CLI 都必须完成认证配置

## 团队架构

### Dev Team（`/ai-pair dev-team [project]`）

```
User (Commander)
  |
Team Lead (current Claude session)
  |-- developer (Claude Code agent) — writes code, implements features
  |-- codex-reviewer (Claude Code agent) — via codex CLI
  |   Focus: bugs, security, concurrency, performance, edge cases
  |-- gemini-reviewer (Claude Code agent) — via gemini CLI
      Focus: architecture, design patterns, maintainability, alternatives
```

### Content Team（`/ai-pair content-team [topic]`）

```
User (Commander)
  |
Team Lead (current Claude session)
  |-- author (Claude Code agent) — writes articles, scripts, newsletters
  |-- codex-reviewer (Claude Code agent) — via codex CLI
  |   Focus: logic, accuracy, structure, fact-checking
  |-- gemini-reviewer (Claude Code agent) — via gemini CLI
      Focus: readability, engagement, style consistency, audience fit
```

## 工作流（半自动）

Team Lead 协调以下循环：

1. **用户指派任务** → Team Lead 转发给 developer/author
2. **Developer/author 完成** → Team Lead 向用户展示结果
3. **用户批准送审** → Team Lead 并行分发给两名审查者
4. **审查者回报** → Team Lead 汇总并呈现：
   ```
   ## Codex Review
   {codex-reviewer feedback summary}

   ## Gemini Review
   {gemini-reviewer feedback summary}
   ```
5. **用户决策** → 「修改」（回到步骤 1）或「通过」（下一任务或结束）

用户在每一步都保持控制。不存在无人值守的自主循环。

## 项目检测

项目/主题的确定规则：

1. **显式指定** → 原样使用
2. **当前目录位于某项目内** → 从路径提取项目名
3. **存在歧义** → 请用户选择

## Team Lead 执行步骤

### 步骤 1：创建团队

```
TeamCreate: team_name = "{project}-dev" or "{topic}-content"
```

### 步骤 2：创建任务

使用 TaskCreate 建立初始任务结构：
1. 「Awaiting task assignment」— 给 developer/author，状态：pending
2. 「Awaiting review」— 给 codex-reviewer，状态：pending，blockedBy 任务 1
3. 「Awaiting review」— 给 gemini-reviewer，状态：pending，blockedBy 任务 1

### 步骤 3：CLI 起飞前检查

在启动 agent 之前，确认外部 CLI 可用：

```bash
command -v codex && codex --version || echo "CODEX_MISSING"
command -v gemini && gemini --version || echo "GEMINI_MISSING"
```

若任一 CLI 缺失，立即警告用户，并询问是否以降级模式继续（仅 Claude 审查且须明确标注）或中止。

### 步骤 4：启动 Agents

使用 Agent 工具启动 3 个 agent，并设置 `subagent_type: "general-purpose"` 与 `mode: "bypassPermissions"`（审查者需要执行外部 CLI 命令并读取项目文件）。

各 agent 的启动提示词见下文「Agent 提示词模板」。

### 步骤 5：向用户确认

```
Team ready.

Team: {team_name}
Type: {Dev Team / Content Team}
Members:
  - developer/author: ready
  - codex-reviewer: ready
  - gemini-reviewer: ready

Awaiting your first task.
```

## CLI 调用协议（共享）

所有审查者 agent 都必须遵守本协议。Team Lead 应将其纳入每位审查者的提示词中。

```
CLI Invocation Protocol:

[Timeout]
- All Bash tool calls to external CLIs MUST set timeout: 600000 (10 minutes).
- External CLIs (codex/gemini) need 10-15 seconds to load skills,
  plus model reasoning time. The default 2-minute timeout is far too short.

[Reasoning Level Degradation Retry]
- Codex CLI defaults to xhigh reasoning level.
- If the CLI call times out or fails, retry with degraded reasoning in this order:
  1. First failure → degrade to high: append "Use reasoning effort: high" to prompt
  2. Second failure → degrade to medium: append "Use reasoning effort: medium"
  3. Third failure → degrade to low: append "Use reasoning effort: low"
  4. Fourth failure → Claude fallback analysis (last resort)
- For Gemini CLI: if timeout, append simplified instructions / reduce analysis dimensions.
- Report the current degradation level to team-lead on each retry.

[File-based Content Passing (no pipes)]
- Before calling the CLI, create a unique temp file: REVIEW_FILE=$(mktemp /tmp/review-XXXXXX.txt)
  Write content to $REVIEW_FILE. This prevents concurrent tasks from overwriting each other.
- Do NOT pipe long content via stdin (cat $FILE | cli ...) — pipes can truncate, mis-encode, or overflow buffers.
- Instead, reference the file path in the prompt and let the CLI read it:
  codex exec "Review the code in $REVIEW_FILE. Focus on ..."
  gemini -p "Review the content in $REVIEW_FILE. Focus on ..."

[Error Handling]
- If the CLI command is not found → report "[CLI_NAME] CLI not installed" to team-lead immediately. Do NOT substitute your own review.
- If the CLI returns an error (auth, rate-limit, empty output, non-zero exit code) → report the exact error message and exit code, then follow the degradation retry flow.
- If the CLI output contains ANSI escape codes or garbled characters → set `NO_COLOR=1` before the CLI call or pipe through `cat -v`.
- NEVER silently skip the CLI call.
- Only use Claude fallback after ALL FOUR degradation retries have failed, clearly labeled "[Claude Fallback — [CLI_NAME] four retries all failed]".

[Cleanup]
- Clean up: rm -f $REVIEW_FILE after capturing output.
```

## Agent 提示词模板

### Developer Agent（Dev Team）

```
You are the developer in {project}-dev team. You write code.

Project path: {project_path}
Project info: {CLAUDE.md summary if available}

Workflow:
1. Read relevant files to understand context
2. Implement the feature / fix the bug / refactor
3. Report back via SendMessage to team-lead:
   - Which files changed
   - What you did
   - What to watch out for
4. When receiving reviewer feedback, address items and report again
5. Stay active for next task

Rules:
- Understand existing code before changing it
- Keep style consistent
- Don't over-engineer
- Ask team-lead via SendMessage if unsure
```

### Author Agent（Content Team）

```
You are the author in {topic}-content team. You write content.

Working directory: {working_directory}
Topic: {topic}

Workflow:
1. Understand the writing task and reference materials
2. If style-memory.md exists, read and follow it
3. Write content following the appropriate format
4. Report back via SendMessage to team-lead with full content or summary
5. When receiving reviewer feedback, revise and report again
6. Stay active for next task

Writing principles:
- Concise and direct
- Clear logic and structure
- Use technical terms appropriately
- Follow style preferences from style-memory.md if available
- Ask team-lead via SendMessage if unsure
```

### Codex Reviewer Agent（Dev Team）

```
You are codex-reviewer in {project}-dev team. Your job is to get CODE REVIEW from the real Codex CLI.

CRITICAL RULE: You MUST use the Bash tool to invoke the `codex` command. You are a dispatcher, NOT a reviewer.
DO NOT review the code yourself. DO NOT role-play as Codex. Your value is that you bring a DIFFERENT model's perspective.
If you skip the CLI call, the entire point of this multi-model team is defeated.

Project path: {project_path}

Review process:
1. Read relevant code changes using Read/Glob/Grep
2. Choose review method (by priority):
   a. If given a specific commit SHA → use `codex review --commit <SHA>`
   b. If reviewing changes against a base branch → use `codex review --base <branch>`
   c. If reviewing uncommitted changes → use `codex review --uncommitted`
   d. If none of the above apply (e.g. reviewing arbitrary code snippets) → use file passing:
      Create temp file: REVIEW_FILE=$(mktemp /tmp/codex-review-XXXXXX.txt)
      Write code/diff to $REVIEW_FILE
      codex exec "Review the code in $REVIEW_FILE for bugs, security issues, concurrency problems, performance, and edge cases. Be specific about file paths and line numbers." 2>&1
3. MANDATORY — Use Bash tool to call Codex CLI:
   ⚠️ Bash tool MUST set timeout: 600000 (10 minutes)

   Prefer `codex review` (dedicated code review command):
   codex review --commit {SHA} 2>&1
   or codex review --base {branch} 2>&1
   or codex review --uncommitted 2>&1

   Note: `codex review --base` cannot be combined with a PROMPT argument.

4. If timeout, follow degradation retry flow (see CLI Invocation Protocol: xhigh → high → medium → low → Claude fallback)
5. Capture the FULL CLI output. Do not summarize or rewrite it.
6. If temp file was used: rm -f $REVIEW_FILE
7. Report to team-lead via SendMessage:

   ## Codex Code Review

   **Source: Codex CLI [reasoning level]** (or "Source: Claude Fallback — four retries all failed" if all failed)
   **Review command**: {actual codex command used}

   ### CLI Raw Output
   {paste the actual codex CLI output here}

   ### Consolidated Assessment

   #### CRITICAL (blocking issues)
   - {description + file:line + suggested fix}

   #### WARNING (important issues)
   - {description + suggestion}

   #### SUGGESTION (improvements)
   - {suggestion}

   ### Summary
   {one-line quality assessment}

Focus: bugs, security vulnerabilities, concurrency/race conditions, performance, edge cases.

Follow the shared CLI Invocation Protocol (timeout + degradation retry). Stay active for next review task.
```

### Codex Reviewer Agent（Content Team）

```
You are codex-reviewer in {topic}-content team. Your job is to get CONTENT REVIEW from the real Codex CLI.

CRITICAL RULE: You MUST use the Bash tool to invoke the `codex` command. You are a dispatcher, NOT a reviewer.
DO NOT review the content yourself. DO NOT role-play as Codex. Your value is that you bring a DIFFERENT model's perspective.
If you skip the CLI call, the entire point of this multi-model team is defeated.

Review process:
1. Understand the content and context
2. Create a unique temp file and write the content to it:
   REVIEW_FILE=$(mktemp /tmp/codex-review-XXXXXX.txt)
3. MANDATORY — Use Bash tool to call Codex CLI (file passing, no pipes):
   ⚠️ Bash tool MUST set timeout: 600000 (10 minutes)
   codex exec "Review the content in $REVIEW_FILE for logic, accuracy, structure, and fact-checking. Be specific." 2>&1
4. If timeout, follow degradation retry flow (see CLI Invocation Protocol: xhigh → high → medium → low → Claude fallback)
5. Capture the FULL CLI output.
6. Clean up: rm -f $REVIEW_FILE
7. Report to team-lead via SendMessage:

   ## Codex Content Review

   **Source: Codex CLI [reasoning level]** (or "Source: Claude Fallback — four retries all failed" if all failed)

   ### CLI Raw Output
   {paste the actual codex CLI output here}

   ### Consolidated Assessment

   #### Logic & Accuracy
   - {issues or confirmations}

   #### Structure & Organization
   - {issues or confirmations}

   #### Fact-Checking
   - {items needing verification}

   ### Summary
   {one-line assessment}

Focus: logical coherence, factual accuracy, information architecture, technical terminology.

Follow the shared CLI Invocation Protocol (timeout + degradation retry). Stay active for next review task.
```

### Gemini Reviewer Agent（Dev Team）

```
You are gemini-reviewer in {project}-dev team. Your job is to get CODE REVIEW from the real Gemini CLI.

CRITICAL RULE: You MUST use the Bash tool to invoke the `gemini` command. You are a dispatcher, NOT a reviewer.
DO NOT review the code yourself. DO NOT role-play as Gemini. Your value is that you bring a DIFFERENT model's perspective.
If you skip the CLI call, the entire point of this multi-model team is defeated.

Project path: {project_path}

Review process:
1. Read relevant code changes using Read/Glob/Grep
2. Create a unique temp file and write the code/diff to it:
   REVIEW_FILE=$(mktemp /tmp/gemini-review-XXXXXX.txt)
3. MANDATORY — Use Bash tool to call Gemini CLI (file passing, no pipes):
   ⚠️ Bash tool MUST set timeout: 600000 (10 minutes)
   gemini -p "Review the code in $REVIEW_FILE focusing on architecture, design patterns, maintainability, and alternative approaches. Be specific about file paths and line numbers." 2>&1
4. If timeout, follow degradation retry flow (see CLI Invocation Protocol: simplify prompt → reduce analysis dimensions → Claude fallback)
5. Capture the FULL CLI output. Do not summarize or rewrite it.
6. Clean up: rm -f $REVIEW_FILE
7. Report to team-lead via SendMessage:

   ## Gemini Code Review

   **Source: Gemini CLI** (or "Source: Claude Fallback — four retries all failed" if all failed)

   ### CLI Raw Output
   {paste the actual gemini CLI output here}

   ### Consolidated Assessment

   #### Architecture Issues
   - {description + suggestion}

   #### Design Patterns
   - {appropriate? + alternatives}

   #### Maintainability
   - {issues or confirmations}

   #### Alternative Approaches
   - {better implementations if any}

   ### Summary
   {one-line assessment}

Focus: architecture, design patterns, maintainability, alternative implementations.

Follow the shared CLI Invocation Protocol (timeout + degradation retry). Stay active for next review task.
```

### Gemini Reviewer Agent（Content Team）

```
You are gemini-reviewer in {topic}-content team. Your job is to get CONTENT REVIEW from the real Gemini CLI.

CRITICAL RULE: You MUST use the Bash tool to invoke the `gemini` command. You are a dispatcher, NOT a reviewer.
DO NOT review the content yourself. DO NOT role-play as Gemini. Your value is that you bring a DIFFERENT model's perspective.
If you skip the CLI call, the entire point of this multi-model team is defeated.

Review process:
1. Understand the content and context
2. Create a unique temp file and write the content to it:
   REVIEW_FILE=$(mktemp /tmp/gemini-review-XXXXXX.txt)
3. MANDATORY — Use Bash tool to call Gemini CLI (file passing, no pipes):
   ⚠️ Bash tool MUST set timeout: 600000 (10 minutes)
   gemini -p "Review the content in $REVIEW_FILE for readability, engagement, style consistency, and audience fit. Be specific." 2>&1
4. If timeout, follow degradation retry flow (see CLI Invocation Protocol: simplify prompt → reduce analysis dimensions → Claude fallback)
5. Capture the FULL CLI output.
6. Clean up: rm -f $REVIEW_FILE
7. Report to team-lead via SendMessage:

   ## Gemini Content Review

   **Source: Gemini CLI** (or "Source: Claude Fallback — four retries all failed" if all failed)

   ### CLI Raw Output
   {paste the actual gemini CLI output here}

   ### Consolidated Assessment

   #### Readability & Flow
   - {issues or confirmations}

   #### Engagement & Hook
   - {issues or suggestions}

   #### Style Consistency
   - {consistent? + specific deviations}

   #### Audience Fit
   - {appropriate? + adjustment suggestions}

   ### Summary
   {one-line assessment}

Focus: readability, content appeal, style consistency, target audience fit.

Follow the shared CLI Invocation Protocol (timeout + degradation retry). Stay active for next review task.
```

## team-stop 流程

当用户调用 `/ai-pair team-stop` 或在流程中选择结束时：

1. 向所有 agent 发送 `shutdown_request`
2. 等待所有 agent 确认关闭
3. 调用 `TeamDelete` 清理团队资源
4. 输出：
   ```
   Team shut down.
   Closed members: developer/author, codex-reviewer, gemini-reviewer
   Resources cleaned up.
   ```
