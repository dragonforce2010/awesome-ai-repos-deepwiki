---
name: careful
description: 破坏性命令安全护栏，执行前提醒高风险操作。
---

# careful 中文审阅副本

> 来源：`careful/SKILL.md`  
> 生成说明：本副本面向中文审阅，保留 `name`、命令、路径、代码块和原始行为要求。原始 `SKILL.md` 完整收录在下方折叠块中，便于逐条比对可执行指令。

## 中文概要

破坏性命令安全护栏，执行前提醒高风险操作。

## 审阅重点

- **触发语义**：确认此技能只在描述的任务场景中调用。
- **工具权限**：检查 `allowed-tools`、preamble、shell 命令和写入路径是否符合预期。
- **行为约束**：保留原文中的 `must`、`never`、`always`、STOP、AskUserQuestion、commit/test 等强制要求。
- **可执行内容**：代码块、命令、路径、环境变量、API 名称和占位符不做语义改写。

## 原始技能正文（完整保留）

<details>
<summary>展开原始 SKILL.md</summary>

```markdown
---
name: careful
version: 0.1.0
description: |
  Safety guardrails for destructive commands. Warns before rm -rf, DROP TABLE,
  force-push, git reset --hard, kubectl delete, and similar destructive operations.
  User can override each warning. Use when touching prod, debugging live systems,
  or working in a shared environment. Use when asked to "be careful", "safety mode",
  "prod mode", or "careful mode". (gstack)
triggers:
  - be careful
  - warn before destructive
  - safety mode
allowed-tools:
  - Bash
  - Read
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "bash ${CLAUDE_SKILL_DIR}/bin/check-careful.sh"
          statusMessage: "Checking for destructive commands..."
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# /careful — Destructive Command Guardrails

Safety mode is now **active**. Every bash command will be checked for destructive
patterns before running. If a destructive command is detected, you'll be warned
and can choose to proceed or cancel.

```bash
mkdir -p ~/.gstack/analytics
echo '{"skill":"careful","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
```

## What's protected

| Pattern | Example | Risk |
|---------|---------|------|
| `rm -rf` / `rm -r` / `rm --recursive` | `rm -rf /var/data` | Recursive delete |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Data loss |
| `TRUNCATE` | `TRUNCATE orders;` | Data loss |
| `git push --force` / `-f` | `git push -f origin main` | History rewrite |
| `git reset --hard` | `git reset --hard HEAD~3` | Uncommitted work loss |
| `git checkout .` / `git restore .` | `git checkout .` | Uncommitted work loss |
| `kubectl delete` | `kubectl delete pod` | Production impact |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Container/image loss |

## Safe exceptions

These patterns are allowed without warning:
- `rm -rf node_modules` / `.next` / `dist` / `__pycache__` / `.cache` / `build` / `.turbo` / `coverage`

## How it works

The hook reads the command from the tool input JSON, checks it against the
patterns above, and returns `permissionDecision: "ask"` with a warning message
if a match is found. You can always override the warning and proceed.

To deactivate, end the conversation or start a new one. Hooks are session-scoped.
```

</details>
