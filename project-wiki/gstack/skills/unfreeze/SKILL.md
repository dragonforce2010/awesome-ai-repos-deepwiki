---
name: unfreeze
description: 清除 freeze 边界，恢复全局编辑权限。
---

# unfreeze 中文审阅副本

> 来源：`unfreeze/SKILL.md`  
> 生成说明：本副本面向中文审阅，保留 `name`、命令、路径、代码块和原始行为要求。原始 `SKILL.md` 完整收录在下方折叠块中，便于逐条比对可执行指令。

## 中文概要

清除 freeze 边界，恢复全局编辑权限。

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
name: unfreeze
version: 0.1.0
description: |
  Clear the freeze boundary set by /freeze, allowing edits to all directories
  again. Use when you want to widen edit scope without ending the session.
  Use when asked to "unfreeze", "unlock edits", "remove freeze", or
  "allow all edits". (gstack)
triggers:
  - unfreeze edits
  - unlock all directories
  - remove edit restrictions
allowed-tools:
  - Bash
  - Read
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# /unfreeze — Clear Freeze Boundary

Remove the edit restriction set by `/freeze`, allowing edits to all directories.

```bash
mkdir -p ~/.gstack/analytics
echo '{"skill":"unfreeze","ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","repo":"'$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")'"}'  >> ~/.gstack/analytics/skill-usage.jsonl 2>/dev/null || true
```

## Clear the boundary

```bash
STATE_DIR="${CLAUDE_PLUGIN_DATA:-$HOME/.gstack}"
if [ -f "$STATE_DIR/freeze-dir.txt" ]; then
  PREV=$(cat "$STATE_DIR/freeze-dir.txt")
  rm -f "$STATE_DIR/freeze-dir.txt"
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result. Note that `/freeze` hooks are still registered for the
session — they will just allow everything since no state file exists. To re-freeze,
run `/freeze` again.
```

</details>
