<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](../../../project-repos/GitNexus/README.md)
- [ARCHITECTURE.md](../../../project-repos/GitNexus/ARCHITECTURE.md)
- [gitnexus-claude-plugin/skills/gitnexus-guide/SKILL.md](../../../project-repos/GitNexus/gitnexus-claude-plugin/skills/gitnexus-guide/SKILL.md)
- [gitnexus-cursor-integration/skills/gitnexus-exploring/SKILL.md](../../../project-repos/GitNexus/gitnexus-cursor-integration/skills/gitnexus-exploring/SKILL.md)
- [gitnexus/package.json](../../../project-repos/GitNexus/gitnexus/package.json)

</details>

# 代理插件与 Skills

仓库在 `.claude/`、`gitnexus-claude-plugin/`、`gitnexus-cursor-integration/` 等路径下维护 **面向代理的工作流说明（Skills）** 与插件元数据，与 npm 包内随附的 skills 目录共同构成「先读资源、再调工具」的使用范式。

## 工作流范式

以 `gitnexus-guide` 技能为例：任何代码理解类任务应先 **读取 `gitnexus://repo/{name}/context`** 检查索引新鲜度，再按任务类型切换到 exploring、impact-analysis、debugging、refactoring 等技能文件中的清单与工具序列。

`gitnexus-exploring`（Cursor 集成变体）给出典型步骤：`READ gitnexus://repos` → `READ .../context` → `query` → `context` → 可选读取 `process` 资源。

## 编辑器差异

README 的表格总结：**Claude Code** 同时具备 MCP、Skills 与 PreToolUse/PostToolUse 钩子；**Cursor / Codex / OpenCode** 以 MCP + Skills 为主；部分编辑器无 hooks。集成目录分别为 `gitnexus-claude-plugin` 与 `gitnexus-cursor-integration`，技能命名空间有重叠但文件内容可能因平台而异。

## 本 DeepWiki 的 skills 副本

本输出树在 `skills/` 下提供各 `SKILL.md` 的**中文翻译副本**（保留 YAML `name` 与可执行片段），便于离线审阅。

## 相关页面

- [MCP、CLI 与 HTTP 桥](mcp-cli-http-interfaces.md)
- [测试、CI 与运维](testing-ci-and-ops.md)

Sources: [README.md:109-123](../../../project-repos/GitNexus/README.md#L109-L123), [ARCHITECTURE.md:12-14](../../../project-repos/GitNexus/ARCHITECTURE.md#L12-L14), [gitnexus-claude-plugin/skills/gitnexus-guide/SKILL.md:1-42](../../../project-repos/GitNexus/gitnexus-claude-plugin/skills/gitnexus-guide/SKILL.md#L1-L42), [gitnexus-cursor-integration/skills/gitnexus-exploring/SKILL.md:1-46](../../../project-repos/GitNexus/gitnexus-cursor-integration/skills/gitnexus-exploring/SKILL.md#L1-L46), [gitnexus/package.json:33-40](../../../project-repos/GitNexus/gitnexus/package.json#L33-L40)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:109-123`

```markdown
### MCP Setup

`gitnexus setup` auto-detects your editors and writes the correct global MCP config. You only need to run it once.

### Editor Support

| Editor                | MCP | Skills | Hooks (auto-augment) | Support        |
| --------------------- | --- | ------ | -------------------- | -------------- |
| **Claude Code** | Yes | Yes    | Yes (PreToolUse + PostToolUse) | **Full** |
| **Cursor**      | Yes | Yes    | —                   | MCP + Skills   |
| **Codex**       | Yes | Yes    | —                   | MCP + Skills   |
| **Windsurf**    | Yes | —     | —                   | MCP            |
| **OpenCode**    | Yes | Yes    | —                   | MCP + Skills   |

> **Claude Code** gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that enrich searches with graph context + PostToolUse hooks that detect a stale index after commits and prompt the agent to reindex.
```

#### `ARCHITECTURE.md:12-14`

```markdown
| `.claude/`, `gitnexus-claude-plugin/`, `gitnexus-cursor-integration/` | Agent skills and plugin metadata. |
| `eval/` | Evaluation harnesses for benchmarking tool usage. |
| `.github/` | CI workflows + composite actions (`setup-gitnexus/`, `setup-gitnexus-web/`). |
```

#### `gitnexus-claude-plugin/skills/gitnexus-guide/SKILL.md:1-42`

```markdown
---
name: gitnexus-guide
description: "Use when the user asks about GitNexus itself — available tools, how to query the knowledge graph, MCP resources, graph schema, or workflow reference. Examples: \"What GitNexus tools are available?\", \"How do I use GitNexus?\""
---

# GitNexus Guide

Quick reference for all GitNexus MCP tools, resources, and the knowledge graph schema.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task                                         | Skill to read       |
| -------------------------------------------- | ------------------- |
| Understand architecture / "How does X work?" | `gitnexus-exploring`         |
| Blast radius / "What breaks if I change X?"  | `gitnexus-impact-analysis`   |
| Trace bugs / "Why is X failing?"             | `gitnexus-debugging`         |
| Rename / extract / split / refactor          | `gitnexus-refactoring`       |
| Tools, resources, schema reference           | `gitnexus-guide` (this file) |
| Index, status, clean, wiki CLI commands      | `gitnexus-cli`               |

## Tools Reference

| Tool             | What it gives you                                                        |
| ---------------- | ------------------------------------------------------------------------ |
| `query`          | Process-grouped code intelligence — execution flows related to a concept |
| `context`        | 360-degree symbol view — categorized refs, processes it participates in  |
| `impact`         | Symbol blast radius — what breaks at depth 1/2/3 with confidence         |
| `detect_changes` | Git-diff impact — what do your current changes affect                    |
| `rename`         | Multi-file coordinated rename with confidence-tagged edits               |
| `cypher`         | Raw graph queries (read `gitnexus://repo/{name}/schema` first)           |
| `list_repos`     | Discover indexed repos                                                   |

```

#### `gitnexus-cursor-integration/skills/gitnexus-exploring/SKILL.md:1-46`

````markdown
---
name: gitnexus-exploring
description: Navigate unfamiliar code using GitNexus knowledge graph
---

# Exploring Codebases with GitNexus

## When to Use
- "How does authentication work?"
- "What's the project structure?"
- "Show me the main components"
- "Where is the database logic?"
- Understanding code you haven't seen before

## Workflow

```
1. READ gitnexus://repos                          → Discover indexed repos
2. READ gitnexus://repo/{name}/context             → Codebase overview, check staleness
3. gitnexus_query({query: "<what you want to understand>"})  → Find related execution flows
4. gitnexus_context({name: "<symbol>"})            → Deep dive on specific symbol
5. READ gitnexus://repo/{name}/process/{name}      → Trace full execution flow
```

> If step 2 says "Index is stale" → run `npx gitnexus analyze` in terminal.

## Checklist

```
- [ ] READ gitnexus://repo/{name}/context
- [ ] gitnexus_query for the concept you want to understand
- [ ] Review returned processes (execution flows)
- [ ] gitnexus_context on key symbols for callers/callees
- [ ] READ process resource for full execution traces
- [ ] Read source files for implementation details
```

## Resources

| Resource | What you get |
|----------|-------------|
| `gitnexus://repo/{name}/context` | Stats, staleness warning (~150 tokens) |
| `gitnexus://repo/{name}/clusters` | All functional areas with cohesion scores (~300 tokens) |
| `gitnexus://repo/{name}/cluster/{name}` | Area members with file paths (~500 tokens) |
| `gitnexus://repo/{name}/process/{name}` | Step-by-step execution trace (~200 tokens) |

````

#### `gitnexus/package.json:33-40`

```json
  "files": [
    "dist",
    "hooks",
    "scripts",
    "skills",
    "vendor",
    "web"
  ],
```

<!-- source-snippets:end -->
</details>
