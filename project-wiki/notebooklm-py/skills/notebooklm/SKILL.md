---
name: notebooklm
description: Google NotebookLM 完整 API - 全量编程访问，包括 Web UI 未暴露的功能。创建笔记本、添加来源、生成所有制品类型、多格式下载。当用户明确说 /notebooklm 或意图如"创建一个关于 X 的播客"时激活
---

# NotebookLM 自动化

Google NotebookLM 的完整编程访问能力——包括 Web UI 未暴露的功能。创建笔记本、添加来源（URL、YouTube、PDF、音频、视频、图片）、与内容对话、生成所有制品类型、以多种格式下载结果。

## 安装

**从 PyPI 安装（推荐）：**
```bash
pip install notebooklm-py
```

**从 GitHub 安装（使用最新发布标签，不要用 main 分支）：**
```bash
LATEST_TAG=$(curl -s https://api.github.com/repos/teng-lin/notebooklm-py/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
pip install "git+https://github.com/teng-lin/notebooklm-py@${LATEST_TAG}"
```

⚠️ **不要从 main 分支安装**（`pip install git+https://github.com/teng-lin/notebooklm-py`）。main 分支可能包含未发布/不稳定的变更。始终使用 PyPI 或特定发布标签，除非你在测试未发布功能。

**Skill 安装方式：**

- `notebooklm skill install` 将此 Skill 安装到 CLI 管理的本地 Agent 目录。
- `npx skills add teng-lin/notebooklm-py` 从 GitHub 仓库安装此 Skill 到兼容的 Agent Skill 目录。
- 如果你已经在 Agent Skill 目录中阅读此文件，说明 Skill 已安装。你只需要 Python 包和以下认证。

**CLI 管理的安装：**
```bash
notebooklm skill install
```

## 前置条件

**重要：** 使用任何命令前，必须先认证：

```bash
notebooklm login          # 打开浏览器进行 Google OAuth
notebooklm list           # 验证认证是否正常
```

如果命令因认证错误失败，重新运行 `notebooklm login`。

### CI/CD、多账户和并行 Agent

| 变量 | 用途 |
|------|------|
| `NOTEBOOKLM_HOME` | 自定义配置目录（默认：`~/.notebooklm`） |
| `NOTEBOOKLM_PROFILE` | 活跃 Profile 名称（默认：`default`） |
| `NOTEBOOKLM_AUTH_JSON` | 内联认证 JSON - 无需文件写入 |

**CI/CD 设置：** 从包含 `storage_state.json` 内容的 Secret 设置 `NOTEBOOKLM_AUTH_JSON`。

**多账户：** 使用命名 Profile（`notebooklm profile create work`，然后 `notebooklm -p work login`）。或者为每个账户使用不同的 `NOTEBOOKLM_HOME` 目录。

**并行 Agent：** CLI 将笔记本上下文存储在共享文件（`~/.notebooklm/context.json`）中。多个并发 Agent 使用 `notebooklm use` 可能互相覆盖上下文。

**并行工作流解决方案：**
1. **始终使用显式笔记本 ID**（推荐）：传递 `-n <notebook_id>`（用于 `wait`/`download` 命令）或 `--notebook <notebook_id>`（用于其他命令），而不是依赖 `use`
2. **Per-agent 隔离 via Profile：** `export NOTEBOOKLM_PROFILE=agent-$ID`（每个 Profile 有自己的上下文文件）
3. **Per-agent 隔离 via Home：** 为每个 Agent 设置唯一的 `NOTEBOOKLM_HOME`：`export NOTEBOOKLM_HOME=/tmp/agent-$ID`
4. **使用完整 UUID：** 在自动化中避免部分 ID（可能产生歧义）

## Agent 设置验证

开始工作流前，验证 CLI 是否就绪：

1. `notebooklm status` → 应显示 "Authenticated as: email@..."
2. `notebooklm list --json` → 应返回有效 JSON（即使笔记本列表为空）
3. 如果任一失败 → 运行 `notebooklm login`

## 此 Skill 何时激活

**显式：** 用户说 "/notebooklm"、"use notebooklm" 或提及工具名称

**意图检测：** 识别如下请求：
- "创建一个关于 [主题] 的播客"
- "总结这些 URL/文档"
- "从我的研究生成测验"
- "将此转为音频概览"
- "创建学习闪卡"
- "生成视频解说"
- "制作信息图"
- "创建概念思维导图"
- "以 Markdown 下载测验"
- "将这些来源添加到 NotebookLM"

## 自主性规则

**自动执行（无需确认）：**
- `notebooklm status` - 检查上下文
- `notebooklm auth check` - 诊断认证问题
- `notebooklm list` - 列出笔记本
- `notebooklm source list` - 列出来源
- `notebooklm artifact list` - 列出制品
- `notebooklm language list` - 列出支持的语言
- `notebooklm language get` - 获取当前语言
- `notebooklm language set` - 设置语言（全局设置）
- `notebooklm artifact wait` - 等待制品完成（在子 Agent 上下文中）
- `notebooklm source wait` - 等待来源处理（在子 Agent 上下文中）
- `notebooklm research status` - 检查研究状态
- `notebooklm research wait` - 等待研究（在子 Agent 上下文中）
- `notebooklm use <id>` - 设置上下文（⚠️ 仅限单 Agent - 并行工作流使用 `-n` 标志）
- `notebooklm create` - 创建笔记本
- `notebooklm ask "..."` - 对话查询（不带 `--save-as-note`）
- `notebooklm history` - 显示对话历史（只读）
- `notebooklm source add` - 添加来源
- `notebooklm profile list` - 列出 Profile
- `notebooklm profile create` - 创建 Profile
- `notebooklm profile switch` - 切换活跃 Profile
- `notebooklm doctor` - 检查环境健康

**执行前需确认：**
- `notebooklm delete` - 破坏性操作
- `notebooklm generate *` - 长时间运行，可能失败
- `notebooklm download *` - 写入文件系统
- `notebooklm artifact wait` - 长时间运行（在主对话中）
- `notebooklm source wait` - 长时间运行（在主对话中）
- `notebooklm research wait` - 长时间运行（在主对话中）
- `notebooklm ask "..." --save-as-note` - 写入笔记
- `notebooklm history --save` - 写入笔记

## 快速参考

| 任务 | 命令 |
|------|------|
| 认证 | `notebooklm login` |
| 诊断认证问题 | `notebooklm auth check` |
| 完整认证诊断 | `notebooklm auth check --test` |
| 列出笔记本 | `notebooklm list` |
| 创建笔记本 | `notebooklm create "标题"` |
| 设置上下文 | `notebooklm use <notebook_id>` |
| 显示上下文 | `notebooklm status` |
| 添加 URL 来源 | `notebooklm source add "https://..."` |
| 添加文件 | `notebooklm source add ./file.pdf` |
| 添加 YouTube | `notebooklm source add "https://youtube.com/..."` |
| 列出来源 | `notebooklm source list` |
| 按 ID 删除来源 | `notebooklm source delete <source_id>` |
| 按标题删除来源 | `notebooklm source delete-by-title "精确标题"` |
| 等待来源处理 | `notebooklm source wait <source_id>` |
| Web 研究（快速） | `notebooklm source add-research "查询"` |
| Web 研究（深度） | `notebooklm source add-research "查询" --mode deep --no-wait` |
| 检查研究状态 | `notebooklm research status` |
| 等待研究 | `notebooklm research wait --import-all` |
| 对话 | `notebooklm ask "问题"` |
| 对话（指定来源） | `notebooklm ask "问题" -s src_id1 -s src_id2` |
| 对话（带引用） | `notebooklm ask "问题" --json` |
| 对话（保存为笔记） | `notebooklm ask "问题" --save-as-note` |
| 显示对话历史 | `notebooklm history` |
| 保存所有历史为笔记 | `notebooklm history --save` |
| 继续特定对话 | `notebooklm ask "问题" -c <conversation_id>` |
| 获取来源全文 | `notebooklm source fulltext <source_id>` |
| 获取来源指南 | `notebooklm source guide <source_id>` |
| 生成播客 | `notebooklm generate audio "指令"` |
| 生成播客（JSON） | `notebooklm generate audio --json` |
| 生成视频 | `notebooklm generate video "指令"` |
| 生成报告 | `notebooklm generate report --format briefing-doc` |
| 生成测验 | `notebooklm generate quiz` |
| 修订幻灯片 | `notebooklm generate revise-slide "提示" --artifact <id> --slide 0` |
| 检查制品状态 | `notebooklm artifact list` |
| 等待完成 | `notebooklm artifact wait <artifact_id>` |
| 下载音频 | `notebooklm download audio ./output.mp3` |
| 下载视频 | `notebooklm download video ./output.mp4` |
| 下载幻灯片（PDF） | `notebooklm download slide-deck ./slides.pdf` |
| 下载幻灯片（PPTX） | `notebooklm download slide-deck ./slides.pptx --format pptx` |
| 下载报告 | `notebooklm download report ./report.md` |
| 下载思维导图 | `notebooklm download mind-map ./map.json` |
| 下载数据表 | `notebooklm download data-table ./data.csv` |
| 下载测验 | `notebooklm download quiz quiz.json` |
| 下载测验（Markdown） | `notebooklm download quiz --format markdown quiz.md` |
| 下载闪卡 | `notebooklm download flashcards cards.json` |
| 下载闪卡（Markdown） | `notebooklm download flashcards --format markdown cards.md` |
| 删除笔记本 | `notebooklm notebook delete <id>` |
| 列出语言 | `notebooklm language list` |
| 获取语言 | `notebooklm language get` |
| 设置语言 | `notebooklm language set zh_Hans` |
| 列出 Profile | `notebooklm profile list` |
| 创建 Profile | `notebooklm profile create work` |
| 切换 Profile | `notebooklm profile switch work` |
| 删除 Profile | `notebooklm profile delete old` |
| 重命名 Profile | `notebooklm profile rename old new` |
| 一次性使用 Profile | `notebooklm -p work list` |
| 健康检查 | `notebooklm doctor` |
| 健康检查（自动修复） | `notebooklm doctor --fix` |

**并行安全：** 在并行工作流中使用显式笔记本 ID。支持 `-n` 简写的命令：`artifact wait`、`source wait`、`research wait/status`、`download *`。下载命令还支持 `-a/--artifact`。其他命令使用 `--notebook`。对于对话，使用 `-c <conversation_id>` 定位特定对话。

**部分 ID：** 使用 UUID 的前 6+ 个字符。必须是唯一前缀（歧义时失败）。适用于基于 ID 的命令如 `use`、`source delete` 和 `wait`。对于精确来源标题删除，使用 `source delete-by-title "标题"`。自动化中优先使用完整 UUID 以避免歧义。

## 命令输出格式

带 `--json` 的命令返回可解析的结构化数据：

**创建笔记本：**
```
$ notebooklm create "Research" --json
{"id": "abc123de-...", "title": "Research"}
```

**添加来源：**
```
$ notebooklm source add "https://example.com" --json
{"source_id": "def456...", "title": "Example", "status": "processing"}
```

**生成制品：**
```
$ notebooklm generate audio "Focus on key points" --json
{"task_id": "xyz789...", "status": "pending"}
```

**带引用的对话：**
```
$ notebooklm ask "What is X?" --json
{"answer": "X is... [1] [2]", "conversation_id": "...", "turn_number": 1, "is_follow_up": false, "references": [...]}
```

**来源全文（获取索引内容）：**
```
$ notebooklm source fulltext <source_id> --json
{"source_id": "...", "title": "...", "char_count": 12345, "content": "Full indexed text..."}
```

**理解引用：** 引用中的 `cited_text` 通常是片段或章节标题，而非完整引用段落。`start_char`/`end_char` 位置引用 NotebookLM 的内部分块索引，而非原始全文。使用 `SourceFulltext.find_citation_context()` 定位引用：
```python
fulltext = await client.sources.get_fulltext(notebook_id, ref.source_id)
matches = fulltext.find_citation_context(ref.cited_text)
if matches:
    context, pos = matches[0]
```

**提取 ID：** 从 JSON 输出解析 `id`、`source_id` 或 `task_id` 字段。

## 生成类型

所有 generate 命令支持：
- `-s, --source` 使用指定来源而非全部来源
- `--language` 设置输出语言（默认为配置语言或 'en'）
- `--json` 机器可读输出（返回 `task_id` 和 `status`）
- `--retry N` 在限速时自动重试，使用指数退避

| 类型 | 命令 | 选项 | 下载格式 |
|------|---------|---------|----------|
| 播客 | `generate audio` | `--format [deep-dive\|brief\|critique\|debate]`，`--length [short\|default\|long]` | .mp3 |
| 视频 | `generate video` | `--format [explainer\|brief]`，`--style [auto\|classic\|whiteboard\|kawaii\|anime\|watercolor\|retro-print\|heritage\|paper-craft]` | .mp4 |
| 幻灯片 | `generate slide-deck` | `--format [detailed\|presenter]`，`--length [default\|short]` | .pdf / .pptx |
| 幻灯片修订 | `generate revise-slide "提示" --artifact <id> --slide N` | `--wait`，`--notebook` | *（重新下载父幻灯片）* |
| 信息图 | `generate infographic` | `--orientation [landscape\|portrait\|square]`，`--detail [concise\|standard\|detailed]`，`--style [...]` | .png |
| 报告 | `generate report` | `--format [briefing-doc\|study-guide\|blog-post\|custom]`，`--append "额外指令"` | .md |
| 思维导图 | `generate mind-map` | *（同步，即时）* | .json |
| 数据表 | `generate data-table` | 需要描述 | .csv |
| 测验 | `generate quiz` | `--difficulty [easy\|medium\|hard]`，`--quantity [fewer\|standard\|more]` | .json/.md/.html |
| 闪卡 | `generate flashcards` | `--difficulty [easy\|medium\|hard]`，`--quantity [fewer\|standard\|more]` | .json/.md/.html |

## 超越 Web UI 的功能

| 功能 | 命令 | 说明 |
|------|---------|-------------|
| **批量下载** | `download <type> --all` | 一次下载某类型的所有制品 |
| **测验/闪卡导出** | `download quiz --format json` | 导出为 JSON、Markdown 或 HTML（Web UI 仅显示交互视图） |
| **思维导图提取** | `download mind-map` | 导出层级 JSON 供可视化工具使用 |
| **数据表导出** | `download data-table` | 下载结构化表格为 CSV |
| **幻灯片 PPTX** | `download slide-deck --format pptx` | 下载可编辑 .pptx（Web UI 仅提供 PDF） |
| **幻灯片修订** | `generate revise-slide "提示" --artifact <id> --slide N` | 用自然语言提示修改单张幻灯片 |
| **报告模板追加** | `generate report --format study-guide --append "..."` | 在内置格式模板后追加自定义指令而不丢失格式类型 |
| **来源全文** | `source fulltext <id>` | 获取任意来源的索引文本内容 |
| **保存对话为笔记** | `ask "..." --save-as-note` / `history --save` | 将问答答案或对话历史保存为笔记本笔记 |
| **编程式分享** | `share` 命令 | 无需 UI 管理分享权限 |

## 常见工作流

### 研究到播客（交互式）
**时间：** 总计 5-10 分钟

1. `notebooklm create "Research: [主题]"` — *如果失败：用 `notebooklm login` 检查认证*
2. 为每个 URL/文档 `notebooklm source add` — *如果一个失败：记录警告，继续其他*
3. 等待来源：`notebooklm source list --json` 直到所有 status=READY — *生成前必须完成*
4. `notebooklm generate audio "聚焦 [特定角度]"`（被询问时确认） — *如果限速：等 5 分钟，重试一次*
5. 记录返回的 artifact ID
6. 稍后检查 `notebooklm artifact list` 获取状态
7. 完成后 `notebooklm download audio ./podcast.mp3`（被询问时确认）

### 研究到播客（子 Agent 自动化）
**时间：** 5-10 分钟，但在后台运行

当用户想要完全自动化（生成并在就绪时下载）：

1. 像往常一样创建笔记本和添加来源
2. 等待来源就绪（使用 `source wait` 或检查 `source list --json`）
3. 运行 `notebooklm generate audio "..." --json` → 从输出解析 `artifact_id`
4. **启动后台 Agent** 使用 Task 工具：
   ```
   Task(
     prompt="等待笔记本 {notebook_id} 中的制品 {artifact_id} 完成，然后下载。
             使用: notebooklm artifact wait {artifact_id} -n {notebook_id} --timeout 600
             然后: notebooklm download audio ./podcast.mp3 -a {artifact_id} -n {notebook_id}",
     subagent_type="general-purpose"
   )
   ```
5. 主对话在 Agent 等待时继续

**子 Agent 中的错误处理：**
- 如果 `artifact wait` 返回退出码 2（超时）：报告超时，建议检查 `artifact list`
- 如果下载失败：先检查制品状态是否为 COMPLETED

### 文档分析
**时间：** 1-2 分钟

1. `notebooklm create "Analysis: [项目]"`
2. `notebooklm source add ./doc.pdf`（或 URL）
3. `notebooklm ask "总结要点"`
4. `notebooklm ask "主要论点是什么？"`
5. 按需继续对话

### 批量导入
**时间：** 取决于来源数量

1. `notebooklm create "Collection: [名称]"`
2. 添加多个来源：
   ```bash
   notebooklm source add "https://url1.com"
   notebooklm source add "https://url2.com"
   notebooklm source add ./local-file.pdf
   ```
3. `notebooklm source list` 验证

**来源限制：** 因计划而异—Standard: 50, Plus: 100, Pro: 300, Ultra: 600 每笔记本。CLI 不强制这些限制；由你的 NotebookLM 账户应用。
**支持类型：** PDF、YouTube URL、Web URL、Google Docs、文本文件、Markdown、Word 文档、音频文件、视频文件、图片

### 深度 Web 研究（子 Agent 模式）
**时间：** 2-5 分钟，后台运行

1. 创建笔记本：`notebooklm create "Research: [主题]"`
2. 启动深度研究（非阻塞）：
   ```bash
   notebooklm source add-research "主题查询" --mode deep --no-wait
   ```
3. **启动后台 Agent** 等待并导入：
   ```
   Task(
     prompt="等待笔记本 {notebook_id} 中的研究完成并导入来源。
             使用: notebooklm research wait -n {notebook_id} --import-all --timeout 300
             报告导入了多少来源。",
     subagent_type="general-purpose"
   )
   ```
4. 主对话在 Agent 等待时继续

**何时使用各模式：**
- `--mode fast`：特定主题，需要快速概览（5-10 个来源，数秒）
- `--mode deep`：广泛主题，需要全面分析（20+ 个来源，2-5 分钟）

## 输出风格

**进度更新：** 每步简短状态
- "正在创建笔记本 'Research: AI'..."
- "正在添加来源: https://example.com..."
- "正在启动音频生成... (task ID: abc123)"

**长时间操作的即发即忘：**
- 启动生成，立即返回 artifact ID
- 不要在主对话中轮询或等待 - 生成需要 5-45 分钟
- 用户手动检查状态，或使用子 Agent 的 `artifact wait`

**JSON 输出：** 使用 `--json` 标志获取机器可读输出

## 错误处理

**失败时，向用户提供选择：**
1. 重试操作
2. 跳过并继续其他
3. 调查错误

**错误决策树：**

| 错误 | 原因 | 操作 |
|-------|-------|--------|
| 认证/Cookie 错误 | 会话过期 | 运行 `notebooklm auth check` 然后 `notebooklm login` |
| "No notebook context" | 上下文未设置 | 使用 `-n <id>` 或 `--notebook <id>` 标志（并行），或 `notebooklm use <id>`（单 Agent） |
| "No result found for RPC ID" | 限速 | 等待 5-10 分钟，重试 |
| `GENERATION_FAILED` | Google 限速 | 等待后重试 |
| 下载失败 | 生成未完成 | 检查 `artifact list` 获取状态 |
| 无效笔记本/来源 ID | 错误 ID | 运行 `notebooklm list` 验证 |
| RPC 协议错误 | Google 更改了 API | 可能需要 CLI 更新 |

## 退出码

所有命令使用一致的退出码：

| 代码 | 含义 | 操作 |
|------|---------|--------|
| 0 | 成功 | 继续 |
| 1 | 错误（未找到、处理失败） | 检查 stderr，参见错误处理 |
| 2 | 超时（仅 wait 命令） | 延长超时或手动检查状态 |

## 已知限制

**限速：** 音频、视频、测验、闪卡、信息图和幻灯片生成可能因 Google 限速而失败。这是 API 限制，不是 Bug。

**可靠操作：** 这些始终可用：
- 笔记本（列表、创建、删除、重命名）
- 来源（添加、列表、删除）
- 对话/查询
- 思维导图、学习指南、报告、数据表生成

**不可靠操作：** 这些可能因限速失败：
- 音频（播客）生成
- 视频生成
- 测验和闪卡生成
- 信息图和幻灯片生成

**处理时间差异显著。** 长时间操作使用子 Agent 模式：

| 操作 | 典型时间 | 建议超时 |
|-----------|--------------|-------------------|
| 来源处理 | 30s - 10 min | 600s |
| 研究（快速） | 30s - 2 min | 180s |
| 研究（深度） | 15 - 30+ min | 1800s |
| 笔记 | 即时 | n/a |
| 思维导图 | 即时（同步） | n/a |
| 测验、闪卡 | 5 - 15 min | 900s |
| 报告、数据表 | 5 - 15 min | 900s |
| 音频生成 | 10 - 20 min | 1200s |
| 视频生成 | 15 - 45 min | 2700s |

**轮询间隔：** 手动检查状态时，每 15-30 秒轮询一次以避免过多 API 调用。

## 语言配置

语言设置控制生成制品的输出语言（音频、视频等）。

**重要：** 语言是影响账户中所有笔记本的**全局**设置。

```bash
notebooklm language list       # 列出所有 80+ 种支持语言
notebooklm language get        # 显示当前语言设置
notebooklm language set zh_Hans  # 简体中文
```

**常见语言代码：**
| 代码 | 语言 |
|------|----------|
| `en` | English |
| `zh_Hans` | 中文（简体） |
| `zh_Hant` | 中文（繁體） |
| `ja` | 日本語 |
| `ko` | 한국어 |

**按命令覆盖：** 在 generate 命令上使用 `--language` 标志：
```bash
notebooklm generate audio --language ja   # 日语播客
```

## 故障排除

```bash
notebooklm --help              # 主要命令
notebooklm auth check          # 诊断认证问题
notebooklm auth check --test   # 完整认证验证（含网络测试）
notebooklm --version           # 检查版本
notebooklm skill install       # 刷新 CLI 管理的安装
```
