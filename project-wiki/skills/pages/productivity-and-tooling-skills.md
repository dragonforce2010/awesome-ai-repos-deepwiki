<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [skills/productivity/README.md](../../../project-repos/skills/skills/productivity/README.md)
- [skills/misc/README.md](../../../project-repos/skills/skills/misc/README.md)
- [skills/productivity/grill-me/SKILL.md](../../../project-repos/skills/skills/productivity/grill-me/SKILL.md)
- [skills/productivity/write-a-skill/SKILL.md](../../../project-repos/skills/skills/productivity/write-a-skill/SKILL.md)

</details>

# Productivity 与 Misc 技能

`productivity/` 三个技能覆盖了 **极端对齐**（`grill-me`）、**极端压缩通讯**（`caveman`），以及 **扩展这套体系自身**（`write-a-skill`）。它们不直接触碰 Issue tracker，但往往在进入 `to-issues` 或 `triage` 之前先运行，用作「语义预算管理」：`grill-me` 买确定性，`caveman` 买的是 token，`write-a-skill` 买的是可复制的团队规范。

`misc/` README 列出了四条「常备但少用」的技能：Git 操作的 Claude Code hooks 护栏、迁移到 `@total-typescript/shoehorn`、练习题脚手架、以及 Husky + lint-staged 的前置提交链。把它们与 engineering 区分开，是在告诉读者：**这些是可替换的工具脚本**，不参与作者主叙事里的「对齐 / 闭环 / 熵控制」三件事。

Sources: [skills/productivity/README.md:1-7](../../../project-repos/skills/skills/productivity/README.md#L1-L7), [skills/misc/README.md:1-8](../../../project-repos/skills/skills/misc/README.md#L1-L8), [skills/productivity/grill-me/SKILL.md:6-11](../../../project-repos/skills/skills/productivity/grill-me/SKILL.md#L6-L11), [skills/productivity/write-a-skill/SKILL.md:6-34](../../../project-repos/skills/skills/productivity/write-a-skill/SKILL.md#L6-L34)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `skills/productivity/README.md:1-7`

```markdown
# Productivity

General workflow tools, not code-specific.

- **[caveman](./caveman/SKILL.md)** — Ultra-compressed communication mode. Cuts token usage ~75% by dropping filler while keeping full technical accuracy.
- **[grill-me](./grill-me/SKILL.md)** — Get relentlessly interviewed about a plan or design until every branch of the decision tree is resolved.
- **[write-a-skill](./write-a-skill/SKILL.md)** — Create new skills with proper structure, progressive disclosure, and bundled resources.
```

#### `skills/misc/README.md:1-8`

```markdown
# Misc

Tools I keep around but rarely use.

- **[git-guardrails-claude-code](./git-guardrails-claude-code/SKILL.md)** — Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, etc.) before they execute.
- **[migrate-to-shoehorn](./migrate-to-shoehorn/SKILL.md)** — Migrate test files from `as` type assertions to @total-typescript/shoehorn.
- **[scaffold-exercises](./scaffold-exercises/SKILL.md)** — Create exercise directory structures with sections, problems, solutions, and explainers.
- **[setup-pre-commit](./setup-pre-commit/SKILL.md)** — Set up Husky pre-commit hooks with lint-staged, Prettier, type checking, and tests.
```

#### `skills/productivity/grill-me/SKILL.md:6-11`

```markdown
Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.
```

#### `skills/productivity/write-a-skill/SKILL.md:6-34`

````markdown
# Writing Skills

## Process

1. **Gather requirements** - ask user about:
   - What task/domain does the skill cover?
   - What specific use cases should it handle?
   - Does it need executable scripts or just instructions?
   - Any reference materials to include?

2. **Draft the skill** - create:
   - SKILL.md with concise instructions
   - Additional reference files if content exceeds 500 lines
   - Utility scripts if deterministic operations needed

3. **Review with user** - present draft and ask:
   - Does this cover your use cases?
   - Anything missing or unclear?
   - Should any section be more/less detailed?

## Skill Structure

```
skill-name/
├── SKILL.md           # Main instructions (required)
├── REFERENCE.md       # Detailed docs (if needed)
├── EXAMPLES.md        # Usage examples (if needed)
└── scripts/           # Utility scripts (if needed)
    └── helper.js
````

<!-- source-snippets:end -->
</details>

## Insight：为何 `write-a-skill` 属于 productivity

它把「技能工程」本身产品化：结构、渐进披露、引用资源的最佳实践与 engineering 里写代码不是同一类问题，却决定了团队能否把治理规则编码成可分发资产。

## 相关页面

- [Engineering 技能矩阵](engineering-skills-matrix.md) — 与 `/grill-with-docs` 交叉引用
- [失败模式与工程价值观](failure-modes-and-values.md) — `caveman` 直接回应「代理太啰嗦」
- [目录桶策略与治理边界](bucket-policies-and-out-of-scope.md) — `misc` 为何不在 plugin.json
