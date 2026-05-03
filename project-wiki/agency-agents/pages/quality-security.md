<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [scripts/lint-agents.sh](../../../project-repos/agency-agents/scripts/lint-agents.sh)
- [.github/workflows/lint-agents.yml](../../../project-repos/agency-agents/.github/workflows/lint-agents.yml)
- [CONTRIBUTING.md](../../../project-repos/agency-agents/CONTRIBUTING.md)
- [SECURITY.md](../../../project-repos/agency-agents/SECURITY.md)
- [testing/testing-reality-checker.md](../../../project-repos/agency-agents/testing/testing-reality-checker.md)

</details>

# 质量门禁与安全边界

仓库的质量控制以 `lint-agents.sh` 和 GitHub Actions 为主。linter 检查每个 agent Markdown 是否有 frontmatter、是否包含 `name`、`description`、`color`，并对推荐 section、正文长度、OpenClaw 可拆分性发出 warning。Sources: [scripts/lint-agents.sh:1-10](../../../project-repos/agency-agents/scripts/lint-agents.sh#L1-L10), [scripts/lint-agents.sh:31-34](../../../project-repos/agency-agents/scripts/lint-agents.sh#L31-L34), [scripts/lint-agents.sh:53-133](../../../project-repos/agency-agents/scripts/lint-agents.sh#L53-L133)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `scripts/lint-agents.sh:1-10`

```bash
#!/usr/bin/env bash
#
# Validates agent markdown files:
#   1. YAML frontmatter must exist with name, description, color (ERROR)
#   2. Recommended sections checked but only warned (WARN)
#   3. File must have meaningful content
#
# Usage: ./scripts/lint-agents.sh [file ...]
#   If no files given, scans all agent directories.

```

#### `scripts/lint-agents.sh:31-34`

```bash

REQUIRED_FRONTMATTER=("name" "description" "color")
RECOMMENDED_SECTIONS=("Identity" "Core Mission" "Critical Rules")

```

#### `scripts/lint-agents.sh:53-133`

```bash
lint_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "ERROR $file: not a file or does not exist"
    errors=$((errors + 1))
    return
  fi

  # 1. Check frontmatter delimiters
  local first_line
  first_line=$(head -1 "$file")
  if [[ "$first_line" != "---" ]]; then
    echo "ERROR $file: missing frontmatter opening ---"
    errors=$((errors + 1))
    return
  fi

  # Extract frontmatter (between first and second ---)
  local frontmatter
  frontmatter=$(awk 'NR==1{next} /^---$/{exit} {print}' "$file")

  if [[ -z "$frontmatter" ]]; then
    echo "ERROR $file: empty or malformed frontmatter"
    errors=$((errors + 1))
    return
  fi

  # 2. Check required frontmatter fields
  for field in "${REQUIRED_FRONTMATTER[@]}"; do
    if ! echo "$frontmatter" | grep -qE "^${field}:"; then
      echo "ERROR $file: missing frontmatter field '${field}'"
      errors=$((errors + 1))
    fi
  done

  # 3. Check recommended sections (warn only)
  local body
  body=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' "$file")

  for section in "${RECOMMENDED_SECTIONS[@]}"; do
    if ! echo "$body" | grep -qi "$section"; then
      echo "WARN  $file: missing recommended section '${section}'"
      warnings=$((warnings + 1))
    fi
  done

  # 4. Check file has meaningful content (awk strips wc's leading whitespace on macOS/BSD)
  local word_count
  word_count=$(echo "$body" | wc -w | awk '{print $1}')
  if [[ "${word_count:-0}" -lt 50 ]]; then
    echo "WARN  $file: body seems very short (< 50 words)"
    warnings=$((warnings + 1))
  fi

  local soul_headers=0
  local agents_headers=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^##[[:space:]] ]]; then
      local header_lower
      header_lower=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
      local target
      target=$(classify_header_target "$header_lower")
      if [[ "$target" == "soul" ]]; then
        soul_headers=$((soul_headers + 1))
      else
        agents_headers=$((agents_headers + 1))
      fi
    fi
  done <<< "$body"

  if [[ $soul_headers -eq 0 ]]; then
    echo "WARN  $file: no section headers map to SOUL.md in convert.sh"
    warnings=$((warnings + 1))
  fi

  if [[ $agents_headers -eq 0 ]]; then
    echo "WARN  $file: no section headers map to AGENTS.md in convert.sh"
    warnings=$((warnings + 1))
  fi
}
```

<!-- source-snippets:end -->
</details>

```mermaid
flowchart TD
  PR["Pull Request"] --> Changed["changed agent files"]
  Changed --> Lint["scripts/lint-agents.sh"]
  Lint --> FM["frontmatter required"]
  Lint --> Sections["recommended sections"]
  Lint --> Resulterrors > 0?
  Result -->|"yes"| Fail["CI failed"]
  Result -->|"no"| Pass["PASSED"]
```

Sources: [github/workflows/lint-agents.yml:1-20](../../../project-repos/agency-agents/.github/workflows/lint-agents.yml#L1-L20), [github/workflows/lint-agents.yml:21-55](../../../project-repos/agency-agents/.github/workflows/lint-agents.yml#L21-L55), [scripts/lint-agents.sh:161-170](../../../project-repos/agency-agents/scripts/lint-agents.sh#L161-L170)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/lint-agents.yml:1-20`

```yaml
name: Lint Agent Files

on:
  pull_request:
    paths:
      - "academic/**"
      - "design/**"
      - "engineering/**"
      - "finance/**"
      - "game-development/**"
      - "marketing/**"
      - "paid-media/**"
      - "sales/**"
      - "product/**"
      - "project-management/**"
      - "testing/**"
      - "support/**"
      - "spatial-computing/**"
      - "specialized/**"

```

#### `github/workflows/lint-agents.yml:21-55`

```yaml
jobs:
  lint:
    name: Validate agent frontmatter and structure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get changed agent files
        id: changed
        run: |
          FILES=$(git diff --name-only --diff-filter=ACMR origin/$&#123;&#123; github.base_ref &#125;&#125;...HEAD -- \
            'academic/**/*.md' 'design/**/*.md' 'engineering/**/*.md' 'finance/**/*.md' 'game-development/**/*.md' 'marketing/**/*.md' 'paid-media/**/*.md' 'sales/**/*.md' 'product/**/*.md' \
            'project-management/**/*.md' 'testing/**/*.md' 'support/**/*.md' \
            'spatial-computing/**/*.md' 'specialized/**/*.md')
          {
            echo "files<<ENDOFLIST"
            echo "$FILES"
            echo "ENDOFLIST"
          } >> "$GITHUB_OUTPUT"
          if [ -z "$FILES" ]; then
            echo "No agent files changed."
          else
            echo "Changed files:"
            echo "$FILES"
          fi

      - name: Run agent linter
        if: steps.changed.outputs.files != ''
        env:
          CHANGED_FILES: $&#123;&#123; steps.changed.outputs.files &#125;&#125;
        run: |
          chmod +x scripts/lint-agents.sh
          ./scripts/lint-agents.sh $CHANGED_FILES
```

#### `scripts/lint-agents.sh:161-170`

```bash
echo ""
echo "Results: ${errors} error(s), ${warnings} warning(s) in ${#files[@]} files."

if [[ $errors -gt 0 ]]; then
  echo "FAILED: fix the errors above before merging."
  exit 1
else
  echo "PASSED"
  exit 0
fi
```

<!-- source-snippets:end -->
</details>

## CI 工作流

`.github/workflows/lint-agents.yml` 仅在 PR 修改 agent category 目录时触发，先通过 `git diff` 找出变更的 Markdown agent 文件，再对这些文件运行 `scripts/lint-agents.sh`。Sources: [github/workflows/lint-agents.yml:1-20](../../../project-repos/agency-agents/.github/workflows/lint-agents.yml#L1-L20), [github/workflows/lint-agents.yml:30-55](../../../project-repos/agency-agents/.github/workflows/lint-agents.yml#L30-L55)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `github/workflows/lint-agents.yml:1-20`

```yaml
name: Lint Agent Files

on:
  pull_request:
    paths:
      - "academic/**"
      - "design/**"
      - "engineering/**"
      - "finance/**"
      - "game-development/**"
      - "marketing/**"
      - "paid-media/**"
      - "sales/**"
      - "product/**"
      - "project-management/**"
      - "testing/**"
      - "support/**"
      - "spatial-computing/**"
      - "specialized/**"

```

#### `github/workflows/lint-agents.yml:30-55`

```yaml
      - name: Get changed agent files
        id: changed
        run: |
          FILES=$(git diff --name-only --diff-filter=ACMR origin/$&#123;&#123; github.base_ref &#125;&#125;...HEAD -- \
            'academic/**/*.md' 'design/**/*.md' 'engineering/**/*.md' 'finance/**/*.md' 'game-development/**/*.md' 'marketing/**/*.md' 'paid-media/**/*.md' 'sales/**/*.md' 'product/**/*.md' \
            'project-management/**/*.md' 'testing/**/*.md' 'support/**/*.md' \
            'spatial-computing/**/*.md' 'specialized/**/*.md')
          {
            echo "files<<ENDOFLIST"
            echo "$FILES"
            echo "ENDOFLIST"
          } >> "$GITHUB_OUTPUT"
          if [ -z "$FILES" ]; then
            echo "No agent files changed."
          else
            echo "Changed files:"
            echo "$FILES"
          fi

      - name: Run agent linter
        if: steps.changed.outputs.files != ''
        env:
          CHANGED_FILES: $&#123;&#123; steps.changed.outputs.files &#125;&#125;
        run: |
          chmod +x scripts/lint-agents.sh
          ./scripts/lint-agents.sh $CHANGED_FILES
```

<!-- source-snippets:end -->
</details>

## 贡献质量要求

贡献指南要求新增 agent 在提交前真实测试、匹配模板、包含 2-3 个代码或模板示例、定义可衡量 success criteria、完成校对；同时建议大范围工具和架构变化先开 Discussion。Sources: [CONTRIBUTING.md:243-275](../../../project-repos/agency-agents/CONTRIBUTING.md#L243-L275), [CONTRIBUTING.md:276-318](../../../project-repos/agency-agents/CONTRIBUTING.md#L276-L318)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `CONTRIBUTING.md:243-275`

```markdown
## 🔄 Pull Request Process

### What Belongs in a PR (and What Doesn't)

The fastest path to a merged PR is **one markdown file** — a new or improved agent. That's the sweet spot.

For anything beyond that, here's how we keep things smooth:

#### Always welcome as a PR
- Adding a new agent (one `.md` file)
- Improving an existing agent's content, examples, or personality
- Fixing typos or clarifying docs

#### Start a Discussion first
- New tooling, build systems, or CI workflows
- Architectural changes (new directories, new scripts, site generators)
- Changes that touch many files across the repo
- New integration formats or platforms

We love ambitious ideas — a [Discussion](https://github.com/msitarzewski/agency-agents/discussions) just gives the community a chance to align on approach before code gets written. It saves everyone time, especially yours.

#### Things we'll always close
- **Committed build output**: Generated files (`_site/`, compiled assets, converted agent files) should never be checked in. Users run `convert.sh` locally; all output is gitignored.
- **PRs that bulk-modify existing agents** without a prior discussion — even well-intentioned reformatting can create merge conflicts for other contributors.

### Before Submitting

1. **Test Your Agent**: Use it in real scenarios, iterate on feedback
2. **Follow the Template**: Match the structure of existing agents
3. **Add Examples**: Include at least 2-3 code/template examples
4. **Define Metrics**: Include specific, measurable success criteria
5. **Proofread**: Check for typos, formatting issues, clarity

```

#### `CONTRIBUTING.md:276-318`

````markdown
### Submitting Your PR

1. **Fork** the repository
2. **Create a branch**: `git checkout -b add-agent-name`
3. **Make your changes**: Add your agent file(s)
4. **Commit**: `git commit -m "Add [Agent Name] specialist"`
5. **Push**: `git push origin add-agent-name`
6. **Open a Pull Request** with:
   - Clear title: "Add [Agent Name] - [Category]"
   - Description of what the agent does
   - Why this agent is needed (use case)
   - Any testing you've done

### PR Review Process

1. **Community Review**: Other contributors may provide feedback
2. **Iteration**: Address feedback and make improvements
3. **Approval**: Maintainers will approve when ready
4. **Merge**: Your contribution becomes part of The Agency!

### PR Template

```markdown
## Agent Information
**Agent Name**: [Name]
**Category**: [engineering/design/marketing/etc.]
**Specialty**: [One-line description]

## Motivation
[Why is this agent needed? What gap does it fill?]

## Testing
[How have you tested this agent? Real-world use cases?]

## Checklist
- [ ] Follows agent template structure
- [ ] Includes personality and voice
- [ ] Has concrete code/template examples
- [ ] Defines success metrics
- [ ] Includes step-by-step workflow
- [ ] Proofread and formatted correctly
- [ ] Tested in real scenarios
```
````

<!-- source-snippets:end -->
</details>

## 安全边界

安全政策把 agent files 视为非执行 prompt definitions，并明确禁止存储 API keys、tokens、credentials；shell scripts 是可执行入口，需要合并前审查，且应报告 suspicious prompt injection。Sources: [SECURITY.md:13-24](../../../project-repos/agency-agents/SECURITY.md#L13-L24), [SECURITY.md:25-30](../../../project-repos/agency-agents/SECURITY.md#L25-L30)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `SECURITY.md:13-24`

```markdown
## Scope

This repository contains Markdown-based agent definitions and shell scripts for installation and conversion.

### Agent files (.md)
- Non-executable prompt definitions
- No API keys, secrets, or credentials should be stored in agent files

### Shell scripts (scripts/)
- install.sh, convert.sh, and lint-agents.sh are executable
- Contributors should review scripts for unintended behavior before running

```

#### `SECURITY.md:25-30`

```markdown
## Best Practices for Contributors

- Never commit API keys, tokens, or credentials
- Never add executable code inside agent Markdown files
- Shell scripts must be reviewed before merging
- Report suspicious agent definitions that attempt prompt injection
```

<!-- source-snippets:end -->
</details>

## 质量文化

Testing division 中的 Reality Checker 代表仓库质量哲学：默认 `NEEDS WORK`，拒绝没有证据的 production ready 声明，要求截图、测试结果、用户旅程和性能数据支撑。Sources: [testing/testing-reality-checker.md:19-39](../../../project-repos/agency-agents/testing/testing-reality-checker.md#L19-L39), [testing/testing-reality-checker.md:122-141](../../../project-repos/agency-agents/testing/testing-reality-checker.md#L122-L141)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `testing/testing-reality-checker.md:19-39`

```markdown
## 🎯 Your Core Mission

### Stop Fantasy Approvals
- You're the last line of defense against unrealistic assessments
- No more "98/100 ratings" for basic dark themes
- No more "production ready" without comprehensive evidence
- Default to "NEEDS WORK" status unless proven otherwise

### Require Overwhelming Evidence
- Every system claim needs visual proof
- Cross-reference QA findings with actual implementation
- Test complete user journeys with screenshot evidence
- Validate that specifications were actually implemented

### Realistic Quality Assessment
- First implementations typically need 2-3 revision cycles
- C+/B- ratings are normal and acceptable
- "Production ready" requires demonstrated excellence
- Honest feedback drives better outcomes

## 🚨 Your Mandatory Process
```

#### `testing/testing-reality-checker.md:122-141`

```markdown
## 🚫 Your "AUTOMATIC FAIL" Triggers

### Fantasy Assessment Indicators
- Any claim of "zero issues found" from previous agents
- Perfect scores (A+, 98/100) without supporting evidence
- "Luxury/premium" claims for basic implementations
- "Production ready" without demonstrated excellence

### Evidence Failures
- Can't provide comprehensive screenshot evidence
- Previous QA issues still visible in screenshots
- Claims don't match visual reality
- Specification requirements not implemented

### System Integration Issues
- Broken user journeys visible in screenshots
- Cross-device inconsistencies
- Performance problems (>3 second load times)
- Interactive elements not functioning

```

<!-- source-snippets:end -->
</details>

## 相关页面

- [Agent 编写模型](agent-authoring-model.md)
- [NEXUS 多 Agent 编排](nexus-orchestration.md)
- [安装与工具集成](installation-and-tooling.md)
