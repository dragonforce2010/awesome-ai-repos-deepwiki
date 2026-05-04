<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md:installation章节:40-90](../../../project-repos/superpowers/README.md#L40-L90)
- [docs/README.codex.md:1-30](../../../project-repos/superpowers/docs/README.codex.md#L1-L30)
- [docs/README.opencode.md:1-30](../../../project-repos/superpowers/docs/README.opencode.md#L1-L30)
- [.claude-plugin/plugin.json:1-5](../../../project-repos/superpowers/.claude-plugin/plugin.json#L1-L5)

</details>

# 多平台支持

Superpowers 通过不同的插件封装，统一的 Hook + 技能注入机制，同时支持 6 个主流 AI 编程平台。

## 各平台安装方式

### Claude Code

```bash
# 官方 marketplace（推荐）
/plugin install superpowers@claude-plugins-official

# 自建 marketplace
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add obra/superpowers-marketplace
copilot plugin install superpowers@superpowers-marketplace
```

### OpenAI Codex

- 在 Codex 应用中点击侧边栏的 Plugins
- 在 Coding 分区找到 Superpowers
- 点击 `+` 并跟随提示安装

### Cursor

```text
/add-plugin superpowers
```

或在插件市场搜索 "superpowers" 并安装。

### Gemini CLI

```bash
gemini extensions install https://github.com/obra/superpowers

# 更新
gemini extensions update superpowers
```

### OpenCode

告诉 OpenCode：
```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

## 跨平台一致性保证

所有平台共享同一套 Hook 脚本（`hooks/session-start`）和技能文件（`skills/`）。版本通过 `.version-bump.json` 统一管理，所有平台插件的 `version` 字段同步更新。

**平台差异仅在于**：
- 插件注册格式（JSON vs JavaScript）
- 安装命令（各平台 CLI 不同）
- 上下文注入字段名（`additionalContext` vs `hookSpecificOutput.additionalContext`）

**不影响技能行为**——技能本身是平台无关的 Markdown 文件。

## 工具映射

不同平台的工具名称不同，技能中使用的工具名是最常用的（Claude Code），其他平台需要对照：

| 功能 | Claude Code | Copilot CLI | Codex | Cursor | Gemini CLI |
|------|-----------|------------|-------|--------|-----------|
| 调用技能 | `Skill` | `skill` | `skill` | `skill` | `activate_skill` |
| 搜索文件 | `grep` | `grep` | `grep` | `grep` | `grep` |
| 读取文件 | `Read` | `Read` | `Read` | `Read` | `Read` |

`using-superpowers` 技能的 References 目录包含各平台的工具映射文档：
- `references/copilot-tools.md`
- `references/codex-tools.md`
- `references/gemini-tools.md`

Sources: [skills/using-superpowers/references/copilot-tools.md:1-20](../../../project-repos/superpowers/skills/using-superpowers/references/copilot-tools.md#L1-L20)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/using-superpowers/references/copilot-tools.md:1-20`

```markdown
# Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Copilot CLI equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| `Bash` (run commands) | `bash` |
| `Grep` (search file content) | `grep` |
| `Glob` (search files by name) | `glob` |
| `Skill` tool (invoke a skill) | `skill` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `task` (see [Agent types](#agent-types)) |
| Multiple `Task` calls (parallel) | Multiple `task` calls |
| Task status/output | `read_agent`, `list_agents` |
| `TodoWrite` (task tracking) | `sql` with built-in `todos` table |
| `WebSearch` | No equivalent — use `web_fetch` with a search engine URL |
| `EnterPlanMode` / `ExitPlanMode` | No equivalent — stay in the main session |
```

<!-- source-snippets:end -->
</details>

## 新平台集成的验收测试

README 中的 AGENTS.md 明确要求：任何新增 harness 支持必须通过验收测试：

> 发送消息："Let's make a react todo list"
>
> 一个正常工作的集成会自动触发 `brainstorming` 技能——在写任何代码之前。

如果 brainstorming 没有自动触发，说明插件没有正确加载 bootstrap，这个集成会被拒绝。

## 相关页面

- [插件系统](plugin-system) — 各平台插件的详细注册机制
- [Hook 机制](hook-system) — 统一的上下文注入逻辑
