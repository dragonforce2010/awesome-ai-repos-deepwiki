---
name: git-guardrails-claude-code
description: 配置 Claude Code 钩子，在执行前拦截危险 git 命令（push、reset --hard、clean、branch -D 等）。在用户希望防止破坏性 git 操作、添加 git 安全钩子，或在 Claude Code 中阻止 git push/reset 时使用。
---

# 设置 Git 护栏

设置 PreToolUse 钩子，在 Claude 执行前拦截并阻止危险 git 命令。

## 会阻止什么

- `git push`（含 `--force` 等所有变体）
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

被阻止时，Claude 会看到提示：无权使用这些命令。

## 步骤

### 1. 询问范围

问用户：仅**本项目**（`.claude/settings.json`）还是**所有项目**（`~/.claude/settings.json`）？

### 2. 复制钩子脚本

捆绑脚本路径：[scripts/block-dangerous-git.sh](scripts/block-dangerous-git.sh)

按范围复制到目标位置：

- **项目**：`.claude/hooks/block-dangerous-git.sh`
- **全局**：`~/.claude/hooks/block-dangerous-git.sh`

用 `chmod +x` 赋予执行权限。

### 3. 将钩子加入 settings

写入对应 settings 文件：

**项目**（`.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**全局**（`~/.claude/settings.json`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

若 settings 已存在，将钩子**合并**进现有 `hooks.PreToolUse` 数组——勿覆盖其它设置。

### 4. 询问是否定制

问用户是否要在阻止列表中增删模式。按需编辑已复制脚本。

### 5. 验证

快速测试：

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
```

应退出码 2 并在 stderr 打印 BLOCKED 信息。
