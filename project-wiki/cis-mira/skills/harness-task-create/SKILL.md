---
name: harness-task-create
description: |
  将功能需求、Bug、重构任务批量提交到多维表格的端到端工作流。
  当用户要求"创建任务"、"提交需求到表格"、"录入 bug"、"批量创建任务"、
  "检查已提交的任务"、"反查任务"时触发。
  支持从代码分析、竞品对比、大盘报告等场景自动提取需求并写入多维表格。
version: 2.0.0
---

# Task Create

从需求描述（自然语言 / 结构化清单 / 代码分析结果）→ 格式化 → 提交到飞书多维表格 → 反查校验。

## 目标表格

从 `.harness/project.yaml` 读取 bitable 配置（由 `project-init` 生成）。

## 配置

| 键 | 说明 |
|---|---|
| 项目配置 | `{PROJECT_ROOT}/.harness/project.yaml` |
| 本地配置 | `{PROJECT_ROOT}/.harness/local.yaml`（gitignored） |
| 脚本目录 | 本 SKILL.md 同级 `scripts/` |
| CLI | `bytedcli feishu bitable` |

### 脚本路径约定

```bash
DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR="$DIR/.."
```

### 脚本清单

| 脚本 | 用途 | 关键参数 |
|------|------|----------|
| `scripts/local-config.sh` | 初始化本地配置（Story + 执行人） | `--assignee`, `--story` |
| `scripts/task-create.sh` | 创建单条任务记录 | `--desc`, `--detail`, `--type`, `--platform`, `--status`, `--parent-id`, `--story`, `--assignee` |
| `scripts/task-batch-create.sh` | 从 JSON 文件批量创建 | `--file <path>`, `--story`, `--assignee` |
| `scripts/task-review.sh` | 反查最近创建的记录，校验写入正确性 | `--last <N>`, `--id <ID>`, `--verify-file <path>` |

## 字段 Schema

详细字段定义见 `references/field-schema.md`。核心写入字段：

| 字段名 | field_id | 类型 | 写入说明 |
|--------|----------|------|----------|
| 需求描述 | fldaSA4i3l | Text | **`[功能域] 简短描述`** 格式，必填 |
| 需求补充 | fldZcLNJCW | Text | 详细说明 + 已有实现引用 |
| 类型 | fldDI5MqmQ | SingleSelect | `BUG` / `特性` / `重构` |
| 端 | fldrouqAbU | MultiSelect | `Mac` / `Windows` / `Linux` / `全平台` / `PC端` / `移动端` / `Android` |
| 修复状态 | fldAWwQNj7 | SingleSelect | 新需求一律填 `待接受` |
| Story | fldKQMtrVY | SingleSelect | 需求故事分类（从 local.yaml 或参数获取） |
| 负责人邮箱前缀 | fldMMOvJE0 | Text | 负责人邮箱前缀（从 local.yaml 或参数获取） |
| 父ID | fldV4oihxz | Text | 可选，关联父需求 ID |
| Checklist | fld7LvcwwW | Text | 可选，验收检查项 |

以下字段**不写入**（由系统或开发流程填写）：展示字段、ID、提交人、附件、修复版本、方案、执行步骤、TraeSession、开发进度、负责人（Person 类型，由负责人邮箱前缀触发自动填充）。

### 本地配置（local.yaml）

首次使用前运行 `local-config.sh` 初始化本地配置：

```bash
bash scripts/local-config.sh
# 或非交互式
bash scripts/local-config.sh --assignee luwei.will --story "AI 编程"
```

生成的 `.harness/local.yaml` 已加入 `.gitignore`，不会污染线上配置：

```yaml
defaults:
  assignee: "luwei.will"    # 负责人邮箱前缀
  story: "AI 编程"           # 默认 Story 分类
```

参数优先级：**命令行参数 > JSON 中的值 > local.yaml > 空**

### 需求描述格式

```
[功能域] 功能简短描述
```

示例：`[未读消息] 侧边栏未读消息轮询 + 加粗标记`、`[模型切换] 对话内支持切换模型`

### 需求补充格式

```
## 功能说明
详细描述该功能的行为、交互逻辑。

## 参考实现
- **应用**: cis-mira / mira_app
- **关键文件**:
  - `src/hooks/use-unread-poll.ts:L1-L61` — 轮询核心逻辑
  - `src/store/atoms/unread-status.ts:L1-L36` — 状态管理
```

无参考实现时省略"参考实现"部分。

## 工作流概览

| Phase | 说明 |
|-------|------|
| 0 | 确认配置（读取 `.harness/project.yaml`） |
| 1 | 需求提取与格式化 |
| 2 | 提交到多维表格（单条/批量） |
| 3 | 反查校验（必选步骤） |
| 4 | Skill 自省更新 |

> 详细工作流见 [references/workflow.md](references/workflow.md)

## 注意事项

- 新需求的 `修复状态` 一律填 `待接受`，禁止直接写 `接受` 或其他状态
- `端` 字段是 **MultiSelect**（多选），传数组；`类型` 和 `修复状态` 是 SingleSelect，传字符串
- 需求描述必须以 `[功能域]` 开头，便于需求池筛选和分组
- 批量创建时每条之间间隔 200ms，避免 API 限流
- 反查是**必选步骤**，不是可选的——每次提交后必须反查确认
