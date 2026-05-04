<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/README.md)
- [pyproject.toml](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/pyproject.toml)
- [src/notebooklm/__init__.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/__init__.py)
- [AGENTS.md](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/AGENTS.md)

</details>

# 项目概览

notebooklm-py 是一个非官方的 Google NotebookLM Python 库与 CLI 工具，通过逆向工程的 batchexecute RPC 协议提供对 NotebookLM 的完整编程访问能力——包括 Web UI 未暴露的功能。项目支持三种使用方式：Python 异步 API、命令行工具（CLI）和 AI Agent 集成（Claude Code / Codex / OpenClaw）。

## 定位与核心能力

该库的核心价值在于将 Google NotebookLM 的隐式 RPC 接口封装为类型安全的 Python API 和直观的 CLI 命令。它不仅覆盖了 Web UI 的全部功能，还提供了批量下载、Quiz/Flashcard 多格式导出、Mind Map JSON 提取、Slide Deck PPTX 导出、单页修订等 Web UI 不具备的能力。

Sources: [README.md](../../../project-repos/notebooklm-py/README.md)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md`

````markdown
# notebooklm-py
<p align="left">
  <img src="https://raw.githubusercontent.com/teng-lin/notebooklm-py/main/notebooklm-py.png" alt="notebooklm-py logo" width="128">
</p>

**A Comprehensive NotebookLM Skill & Unofficial Python API.** Full programmatic access to NotebookLM's features—including capabilities the web UI doesn't expose—via Python, CLI, and AI agents like Claude Code, Codex, and OpenClaw.

[![PyPI version](https://img.shields.io/pypi/v/notebooklm-py.svg)](https://pypi.org/project/notebooklm-py/)
[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13%20%7C%203.14-blue)](https://pypi.org/project/notebooklm-py/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/teng-lin/notebooklm-py/actions/workflows/test.yml/badge.svg)](https://github.com/teng-lin/notebooklm-py/actions/workflows/test.yml)
<p>
  <a href="https://trendshift.io/repositories/19116" target="_blank"><img src="https://trendshift.io/api/badge/repositories/19116" alt="teng-lin%2Fnotebooklm-py | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</p>

**Source & Development**: <https://github.com/teng-lin/notebooklm-py>

> **⚠️ Unofficial Library - Use at Your Own Risk**
>
> This library uses **undocumented Google APIs** that can change without notice.
>
> - **Not affiliated with Google** - This is a community project
> - **APIs may break** - Google can change internal endpoints anytime
> - **Rate limits apply** - Heavy usage may be throttled
>
> Best for prototypes, research, and personal projects. See [Troubleshooting](docs/troubleshooting.md) for debugging tips.

## What You Can Build

🤖 **AI Agent Tools** - Integrate NotebookLM into Claude Code, Codex, and other LLM agents. Ships with a root [NotebookLM skill](SKILL.md) for GitHub and `npx skills add` discovery, local `notebooklm skill install` support for Claude Code and `.agents` skill directories, and repo-level Codex guidance in [`AGENTS.md`](AGENTS.md).

📚 **Research Automation** - Bulk-import sources (URLs, PDFs, YouTube, Google Drive), run web/Drive research queries with auto-import, and extract insights programmatically. Build repeatable research pipelines.

🎙️ **Content Generation** - Generate Audio Overviews (podcasts), videos, slide decks, quizzes, flashcards, infographics, data tables, mind maps, and study guides. Full control over formats, styles, and output.

📥 **Downloads & Export** - Download all generated artifacts locally (MP3, MP4, PDF, PNG, CSV, JSON, Markdown). Export to Google Docs/Sheets. **Features the web UI doesn't offer**: batch downloads, quiz/flashcard export in multiple formats, mind map JSON extraction.

## Three Ways to Use

| Method | Best For |
|--------|----------|
| **Python API** | Application integration, async workflows, custom pipelines |
| **CLI** | Shell scripts, quick tasks, CI/CD automation |
| **Agent Integration** | Claude Code, Codex, LLM agents, natural language automation |

## Features

### Complete NotebookLM Coverage

| Category | Capabilities |
|----------|--------------|
| **Notebooks** | Create, list, rename, delete |
| **Sources** | URLs, YouTube, files (PDF, text, Markdown, Word, audio, video, images), Google Drive, pasted text; refresh, get guide/fulltext |
| **Chat** | Questions, conversation history, custom personas |
| **Research** | Web and Drive research agents (fast/deep modes) with auto-import |
| **Sharing** | Public/private links, user permissions (viewer/editor), view level control |

### Content Generation (All NotebookLM Studio Types)

| Type | Options | Download Format |
|------|---------|-----------------|
| **Audio Overview** | 4 formats (deep-dive, brief, critique, debate), 3 lengths, 50+ languages | MP3/MP4 |
| **Video Overview** | 3 formats (explainer, brief, cinematic), 9 visual styles, plus a dedicated `cinematic-video` CLI alias | MP4 |
| **Slide Deck** | Detailed or presenter format, adjustable length; individual slide revision | PDF, PPTX |
| **Infographic** | 3 orientations, 3 detail levels | PNG |
| **Quiz** | Configurable quantity and difficulty | JSON, Markdown, HTML |
| **Flashcards** | Configurable quantity and difficulty | JSON, Markdown, HTML |
| **Report** | Briefing doc, study guide, blog post, or custom prompt | Markdown |
| **Data Table** | Custom structure via natural language | CSV |
| **Mind Map** | Interactive hierarchical visualization | JSON |

### Beyond the Web UI

These features are available via API/CLI but not exposed in NotebookLM's web interface:

- **Batch downloads** - Download all artifacts of a type at once
- **Quiz/Flashcard export** - Get structured JSON, Markdown, or HTML (web UI only shows interactive view)
- **Mind map data extraction** - Export hierarchical JSON for visualization tools
- **Data table CSV export** - Download structured tables as spreadsheets
- **Slide deck as PPTX** - Download editable PowerPoint files (web UI only offers PDF)
- **Slide revision** - Modify individual slides with natural-language prompts
- **Report template customization** - Append extra instructions to built-in format templates
- **Save chat to notes** - Save Q&A answers or conversation history as notebook notes
- **Source fulltext access** - Retrieve the indexed text content of any source
- **Programmatic sharing** - Manage permissions without the UI

## Installation

```bash
# Basic installation
pip install notebooklm-py

# With browser login support (required for first-time setup)
pip install "notebooklm-py[browser]"
playwright install chromium
```

If `playwright install chromium` fails with `TypeError: onExit is not a function`, see the Linux workaround in [Troubleshooting](docs/troubleshooting.md#linux).

### Development Installation

For contributors or testing unreleased features:

```bash
pip install git+https://github.com/teng-lin/notebooklm-py@main
```

⚠️ The main branch may contain unstable changes. Use PyPI releases for production.

## Quick Start

<p align="center">
  <a href="https://asciinema.org/a/767284" target="_blank"><img src="https://asciinema.org/a/767284.svg" width="600" /></a>
  <br>
  <em>16-minute session compressed to 30 seconds</em>
</p>

### CLI

```bash
````

<!-- source-snippets:end -->
</details>
### 功能矩阵

| 类别 | 能力 |
|------|------|
| **Notebooks** | 创建、列表、重命名、删除 |
| **Sources** | URL、YouTube、文件（PDF/文本/Markdown/Word/音频/视频/图片）、Google Drive、粘贴文本；刷新、获取 Guide/Fulltext |
| **Chat** | 提问、对话历史、自定义 Persona |
| **Research** | Web/Drive 研究 Agent（fast/deep 模式）并自动导入 |
| **Sharing** | 公开/私密链接、用户权限（viewer/editor）、查看级别控制 |
| **Artifacts** | Audio、Video、Slide Deck、Infographic、Quiz、Flashcards、Report、Data Table、Mind Map |

### 超越 Web UI 的功能

| 功能 | 说明 |
|------|------|
| 批量下载 | 一次下载某类型的所有制品 |
| Quiz/Flashcard 导出 | JSON、Markdown、HTML 格式 |
| Mind Map 数据提取 | 层级 JSON 导出 |
| Data Table CSV 导出 | 结构化表格下载 |
| Slide Deck PPTX | 可编辑 PowerPoint（Web UI 仅提供 PDF） |
| 单页修订 | 自然语言修改单张幻灯片 |
| Report 模板追加 | 在内置格式模板后追加自定义指令 |
| Source Fulltext | 获取任意 Source 的索引文本内容 |

Sources: [README.md](../../../project-repos/notebooklm-py/README.md)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md`

````markdown
# notebooklm-py
<p align="left">
  <img src="https://raw.githubusercontent.com/teng-lin/notebooklm-py/main/notebooklm-py.png" alt="notebooklm-py logo" width="128">
</p>

**A Comprehensive NotebookLM Skill & Unofficial Python API.** Full programmatic access to NotebookLM's features—including capabilities the web UI doesn't expose—via Python, CLI, and AI agents like Claude Code, Codex, and OpenClaw.

[![PyPI version](https://img.shields.io/pypi/v/notebooklm-py.svg)](https://pypi.org/project/notebooklm-py/)
[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13%20%7C%203.14-blue)](https://pypi.org/project/notebooklm-py/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/teng-lin/notebooklm-py/actions/workflows/test.yml/badge.svg)](https://github.com/teng-lin/notebooklm-py/actions/workflows/test.yml)
<p>
  <a href="https://trendshift.io/repositories/19116" target="_blank"><img src="https://trendshift.io/api/badge/repositories/19116" alt="teng-lin%2Fnotebooklm-py | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
</p>

**Source & Development**: <https://github.com/teng-lin/notebooklm-py>

> **⚠️ Unofficial Library - Use at Your Own Risk**
>
> This library uses **undocumented Google APIs** that can change without notice.
>
> - **Not affiliated with Google** - This is a community project
> - **APIs may break** - Google can change internal endpoints anytime
> - **Rate limits apply** - Heavy usage may be throttled
>
> Best for prototypes, research, and personal projects. See [Troubleshooting](docs/troubleshooting.md) for debugging tips.

## What You Can Build

🤖 **AI Agent Tools** - Integrate NotebookLM into Claude Code, Codex, and other LLM agents. Ships with a root [NotebookLM skill](SKILL.md) for GitHub and `npx skills add` discovery, local `notebooklm skill install` support for Claude Code and `.agents` skill directories, and repo-level Codex guidance in [`AGENTS.md`](AGENTS.md).

📚 **Research Automation** - Bulk-import sources (URLs, PDFs, YouTube, Google Drive), run web/Drive research queries with auto-import, and extract insights programmatically. Build repeatable research pipelines.

🎙️ **Content Generation** - Generate Audio Overviews (podcasts), videos, slide decks, quizzes, flashcards, infographics, data tables, mind maps, and study guides. Full control over formats, styles, and output.

📥 **Downloads & Export** - Download all generated artifacts locally (MP3, MP4, PDF, PNG, CSV, JSON, Markdown). Export to Google Docs/Sheets. **Features the web UI doesn't offer**: batch downloads, quiz/flashcard export in multiple formats, mind map JSON extraction.

## Three Ways to Use

| Method | Best For |
|--------|----------|
| **Python API** | Application integration, async workflows, custom pipelines |
| **CLI** | Shell scripts, quick tasks, CI/CD automation |
| **Agent Integration** | Claude Code, Codex, LLM agents, natural language automation |

## Features

### Complete NotebookLM Coverage

| Category | Capabilities |
|----------|--------------|
| **Notebooks** | Create, list, rename, delete |
| **Sources** | URLs, YouTube, files (PDF, text, Markdown, Word, audio, video, images), Google Drive, pasted text; refresh, get guide/fulltext |
| **Chat** | Questions, conversation history, custom personas |
| **Research** | Web and Drive research agents (fast/deep modes) with auto-import |
| **Sharing** | Public/private links, user permissions (viewer/editor), view level control |

### Content Generation (All NotebookLM Studio Types)

| Type | Options | Download Format |
|------|---------|-----------------|
| **Audio Overview** | 4 formats (deep-dive, brief, critique, debate), 3 lengths, 50+ languages | MP3/MP4 |
| **Video Overview** | 3 formats (explainer, brief, cinematic), 9 visual styles, plus a dedicated `cinematic-video` CLI alias | MP4 |
| **Slide Deck** | Detailed or presenter format, adjustable length; individual slide revision | PDF, PPTX |
| **Infographic** | 3 orientations, 3 detail levels | PNG |
| **Quiz** | Configurable quantity and difficulty | JSON, Markdown, HTML |
| **Flashcards** | Configurable quantity and difficulty | JSON, Markdown, HTML |
| **Report** | Briefing doc, study guide, blog post, or custom prompt | Markdown |
| **Data Table** | Custom structure via natural language | CSV |
| **Mind Map** | Interactive hierarchical visualization | JSON |

### Beyond the Web UI

These features are available via API/CLI but not exposed in NotebookLM's web interface:

- **Batch downloads** - Download all artifacts of a type at once
- **Quiz/Flashcard export** - Get structured JSON, Markdown, or HTML (web UI only shows interactive view)
- **Mind map data extraction** - Export hierarchical JSON for visualization tools
- **Data table CSV export** - Download structured tables as spreadsheets
- **Slide deck as PPTX** - Download editable PowerPoint files (web UI only offers PDF)
- **Slide revision** - Modify individual slides with natural-language prompts
- **Report template customization** - Append extra instructions to built-in format templates
- **Save chat to notes** - Save Q&A answers or conversation history as notebook notes
- **Source fulltext access** - Retrieve the indexed text content of any source
- **Programmatic sharing** - Manage permissions without the UI

## Installation

```bash
# Basic installation
pip install notebooklm-py

# With browser login support (required for first-time setup)
pip install "notebooklm-py[browser]"
playwright install chromium
```

If `playwright install chromium` fails with `TypeError: onExit is not a function`, see the Linux workaround in [Troubleshooting](docs/troubleshooting.md#linux).

### Development Installation

For contributors or testing unreleased features:

```bash
pip install git+https://github.com/teng-lin/notebooklm-py@main
```

⚠️ The main branch may contain unstable changes. Use PyPI releases for production.

## Quick Start

<p align="center">
  <a href="https://asciinema.org/a/767284" target="_blank"><img src="https://asciinema.org/a/767284.svg" width="600" /></a>
  <br>
  <em>16-minute session compressed to 30 seconds</em>
</p>

### CLI

```bash
````

<!-- source-snippets:end -->
</details>
## 仓库结构

```text
notebooklm-py/
├── src/notebooklm/           # 主包源码
│   ├── __init__.py           # 公共 API 导出
│   ├── client.py             # NotebookLMClient 入口
│   ├── _core.py              # ClientCore 基础设施
│   ├── _artifacts.py         # 制品生成/下载 API
│   ├── _chat.py              # 对话 API
│   ├── _sources.py           # Source 管理 API
│   ├── _notebooks.py         # Notebook 管理 API
│   ├── _notes.py             # 笔记 API
│   ├── _research.py          # 研究 API
│   ├── _settings.py          # 设置 API
│   ├── _sharing.py           # 分享 API
│   ├── auth.py               # 认证与 Token 提取
│   ├── types.py              # 数据类与枚举
│   ├── exceptions.py         # 异常层级
│   ├── paths.py              # 路径解析与 Profile
│   ├── rpc/                  # RPC 协议层
│   │   ├── encoder.py        # 请求编码
│   │   ├── decoder.py        # 响应解码
│   │   └── types.py          # RPC 枚举与常量
│   ├── cli/                  # CLI 命令实现
│   │   ├── grouped.py        # 分组帮助
│   │   ├── generate.py       # 生成命令
│   │   ├── download.py       # 下载命令
│   │   └── ...               # 其他命令模块
│   └── notebooklm_cli.py     # CLI 入口
├── tests/                    # 测试套件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试（VCR）
│   ├── e2e/                  # 端到端测试
│   └── cassettes/            # VCR 录制文件
├── docs/                     # 文档
├── scripts/                  # 诊断脚本
├── .github/workflows/        # CI/CD
├── SKILL.md                  # Agent Skill 定义
└── pyproject.toml            # 项目配置
```

Sources: [AGENTS.md](../../../project-repos/notebooklm-py/AGENTS.md), [pyproject.toml](../../../project-repos/notebooklm-py/pyproject.toml)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `AGENTS.md`

````markdown
# Repository Guidelines

**Status:** Active
**Last Updated:** 2026-03-13

## Project Structure & Module Organization

`src/notebooklm/` contains the async client and typed APIs. Internal feature modules use `_` prefixes such as `_sources.py` and `_artifacts.py`; `src/notebooklm/cli/` holds Click commands, and `src/notebooklm/rpc/` handles protocol encoding and decoding. Tests are split by scope: `tests/unit/`, `tests/integration/`, and `tests/e2e/`. Recorded HTTP fixtures live in `tests/cassettes/`. Examples are in `docs/examples/`, and diagnostics live in `scripts/`.

## Build, Test, and Development Commands

Use `uv` for local work:

```bash
uv sync --extra dev --extra browser
uv run pytest
uv run ruff check src/ tests/
uv run ruff format src/ tests/
uv run mypy src/notebooklm
uv run pre-commit run --all-files
```

Run `uv run pytest tests/e2e -m readonly` only after `notebooklm login` and setting test notebook env vars.

## Coding Style & Naming Conventions

Target Python 3.10+, 4-space indentation, and double quotes. Ruff enforces formatting and import order with a 100-character line length. Keep module and test file names in `snake_case`; prefer descriptive Click command names that match existing groups such as `source`, `artifact`, and `research`. Preserve the internal/public split: `_*.py` for implementation, exported types in `src/notebooklm/__init__.py`.

## Testing Guidelines

Put pure logic in `tests/unit/`, VCR-backed flows in `tests/integration/`, and authenticated NotebookLM coverage in `tests/e2e/`. Name tests `test_<behavior>.py` and record cassettes with `NOTEBOOKLM_VCR_RECORD=1 uv run pytest tests/integration/test_vcr_*.py -v`. Coverage is expected to stay at or above the configured 90% threshold.

## Commit, PR, and Agent Notes

Follow the existing commit style: `feat(cli): ...`, `fix(cli): ...`, `refactor(test): ...`, `style: ...`. PRs should include a short summary, linked issue when relevant, and the commands run locally. For Codex or other parallel agents, prefer `--json`, pass explicit notebook IDs instead of relying on `notebooklm use`, and isolate runs with `NOTEBOOKLM_HOME=/tmp/<agent-id>` when multiple agents share one machine.
````

#### `pyproject.toml`

```toml
[project]
name = "notebooklm-py"
version = "0.3.4"
description = "Unofficial Python library for automating Google NotebookLM"
dynamic = ["readme"]
requires-python = ">=3.10"
license = {text = "MIT"}
authors = [
    {name = "Teng Lin", email = "teng.lin@gmail.com"}
]
keywords = ["notebooklm", "google", "ai", "automation", "rpc", "client", "api"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Programming Language :: Python :: 3.14",
    "Topic :: Software Development :: Libraries :: Python Modules",
]
dependencies = [
    "httpx>=0.27.0",
    "click>=8.0.0",
    "rich>=13.0.0",
]

[project.urls]
Homepage = "https://github.com/teng-lin/notebooklm-py"
Repository = "https://github.com/teng-lin/notebooklm-py"
Documentation = "https://github.com/teng-lin/notebooklm-py#readme"
Issues = "https://github.com/teng-lin/notebooklm-py/issues"

[project.optional-dependencies]
browser = ["playwright>=1.40.0"]
cookies = ["rookiepy>=0.1.0"]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-httpx>=0.30.0",
    "pytest-cov>=4.0.0",
    "pytest-rerunfailures>=14.0",
    "pytest-timeout>=2.3.0",
    "python-dotenv>=1.0.0",
    "mypy>=1.0.0",
    "pre-commit>=4.5.1",
    "ruff==0.8.6",
    "vcrpy>=6.0.0",
]
all = ["notebooklm-py[browser,dev]"]

[project.scripts]
notebooklm = "notebooklm.notebooklm_cli:main"

[build-system]
requires = ["hatchling", "hatch-fancy-pypi-readme"]
build-backend = "hatchling.build"

[tool.hatch.metadata.hooks.fancy-pypi-readme]
content-type = "text/markdown"

[[tool.hatch.metadata.hooks.fancy-pypi-readme.fragments]]
path = "README.md"

# Convert relative doc links to version-tagged absolute URLs
[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(docs/'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/docs/'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(CHANGELOG\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/CHANGELOG.md)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(SECURITY\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/SECURITY.md)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(LICENSE\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/LICENSE)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(SKILL\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/SKILL.md)'

[tool.hatch.build.targets.wheel]
packages = ["src/notebooklm"]
force-include = {"SKILL.md" = "notebooklm/data/SKILL.md", "AGENTS.md" = "notebooklm/data/CODEX.md"}

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
addopts = "--ignore=tests/e2e"
# Global timeout prevents tests from hanging indefinitely (CI safety net)
# Individual tests can override with @pytest.mark.timeout(seconds)
timeout = 60
markers = [
    "e2e: end-to-end tests requiring authentication (run with pytest tests/e2e -m e2e)",
    "variants: parameter variant tests (skip to save quota)",
    "readonly: read-only tests against user's test notebook",
    "vcr: tests using VCR.py recorded cassettes (run with NOTEBOOKLM_VCR_RECORD=1 to record)",
]

[tool.coverage.run]
source = ["src/notebooklm"]
branch = true

[tool.coverage.report]
show_missing = true
fail_under = 90

[tool.mypy]
python_version = "3.10"
warn_return_any = false
warn_unused_ignores = true
disallow_untyped_defs = false
check_untyped_defs = true
```

<!-- source-snippets:end -->
</details>
## 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Python 3.10+ |
| HTTP 客户端 | httpx（异步） |
| CLI 框架 | Click + Rich |
| 浏览器自动化 | Playwright（仅登录用） |
| 测试 | pytest + pytest-asyncio + VCR.py |
| 代码质量 | Ruff + mypy + pre-commit |
| 构建 | hatchling |
| 发布 | PyPI |

Sources: [pyproject.toml](../../../project-repos/notebooklm-py/pyproject.toml)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `pyproject.toml`

```toml
[project]
name = "notebooklm-py"
version = "0.3.4"
description = "Unofficial Python library for automating Google NotebookLM"
dynamic = ["readme"]
requires-python = ">=3.10"
license = {text = "MIT"}
authors = [
    {name = "Teng Lin", email = "teng.lin@gmail.com"}
]
keywords = ["notebooklm", "google", "ai", "automation", "rpc", "client", "api"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Programming Language :: Python :: 3.14",
    "Topic :: Software Development :: Libraries :: Python Modules",
]
dependencies = [
    "httpx>=0.27.0",
    "click>=8.0.0",
    "rich>=13.0.0",
]

[project.urls]
Homepage = "https://github.com/teng-lin/notebooklm-py"
Repository = "https://github.com/teng-lin/notebooklm-py"
Documentation = "https://github.com/teng-lin/notebooklm-py#readme"
Issues = "https://github.com/teng-lin/notebooklm-py/issues"

[project.optional-dependencies]
browser = ["playwright>=1.40.0"]
cookies = ["rookiepy>=0.1.0"]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-httpx>=0.30.0",
    "pytest-cov>=4.0.0",
    "pytest-rerunfailures>=14.0",
    "pytest-timeout>=2.3.0",
    "python-dotenv>=1.0.0",
    "mypy>=1.0.0",
    "pre-commit>=4.5.1",
    "ruff==0.8.6",
    "vcrpy>=6.0.0",
]
all = ["notebooklm-py[browser,dev]"]

[project.scripts]
notebooklm = "notebooklm.notebooklm_cli:main"

[build-system]
requires = ["hatchling", "hatch-fancy-pypi-readme"]
build-backend = "hatchling.build"

[tool.hatch.metadata.hooks.fancy-pypi-readme]
content-type = "text/markdown"

[[tool.hatch.metadata.hooks.fancy-pypi-readme.fragments]]
path = "README.md"

# Convert relative doc links to version-tagged absolute URLs
[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(docs/'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/docs/'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(CHANGELOG\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/CHANGELOG.md)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(SECURITY\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/SECURITY.md)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(LICENSE\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/LICENSE)'

[[tool.hatch.metadata.hooks.fancy-pypi-readme.substitutions]]
pattern = '\]\(SKILL\.md\)'
replacement = '](https://github.com/teng-lin/notebooklm-py/blob/v$HFPR_VERSION/SKILL.md)'

[tool.hatch.build.targets.wheel]
packages = ["src/notebooklm"]
force-include = {"SKILL.md" = "notebooklm/data/SKILL.md", "AGENTS.md" = "notebooklm/data/CODEX.md"}

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
addopts = "--ignore=tests/e2e"
# Global timeout prevents tests from hanging indefinitely (CI safety net)
# Individual tests can override with @pytest.mark.timeout(seconds)
timeout = 60
markers = [
    "e2e: end-to-end tests requiring authentication (run with pytest tests/e2e -m e2e)",
    "variants: parameter variant tests (skip to save quota)",
    "readonly: read-only tests against user's test notebook",
    "vcr: tests using VCR.py recorded cassettes (run with NOTEBOOKLM_VCR_RECORD=1 to record)",
]

[tool.coverage.run]
source = ["src/notebooklm"]
branch = true

[tool.coverage.report]
show_missing = true
fail_under = 90

[tool.mypy]
python_version = "3.10"
warn_return_any = false
warn_unused_ignores = true
disallow_untyped_defs = false
check_untyped_defs = true
```

<!-- source-snippets:end -->
</details>
## 阅读路线

- **想了解项目是什么？** → 当前页面
- **想理解整体架构？** → [系统架构](system-architecture.md)
- **想深入 RPC 协议？** → [RPC 协议层](rpc-protocol.md)
- **想了解认证机制？** → [认证与安全](auth-and-security.md)
- **想使用 Python API？** → [客户端 API](client-api.md)
- **想使用命令行？** → [CLI 界面](cli-interface.md)
- **想了解制品生成？** → [制品生成与下载](artifact-generation.md)
- **想了解数据模型？** → [数据类型与模型](data-types-and-models.md)
- **想了解测试体系？** → [测试与质量](testing-and-quality.md)
- **想了解发布流程？** → [部署与 CI/CD](deployment-and-ci.md)
- **想集成 AI Agent？** → [Agent Skill 集成](agent-skill-integration.md)

## 相关页面

- [系统架构](system-architecture.md)
- [客户端 API](client-api.md)
- [CLI 界面](cli-interface.md)
