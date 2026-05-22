---
name: harness-task-run
description: |
  从飞书多维表格拉取需求、执行开发任务并回写结果的端到端工作流。
  当用户要求从多维表格追踪需求、拉取待修复任务、基于表格需求进行开发、或查询某个需求 ID 详情时触发。
  触发词：多维表格需求、bitable 任务、需求追踪、从表格拉取任务、需求开发、task run、#xxxx_xxx（需求 ID 查询）。
---

# Task Run

从飞书多维表格拉取待处理需求 → 进入 harness 强约束模式 → 驱动完整交付链路 → 回写修复结果。

> **⚠️ 核心约束：一次执行一个任务**。每次 task-run 只拉取并处理**一条**需求，完成后才能处理下一条。禁止批量创建/并行开发多个任务。

## 流程总览

```
Phase 0: 读取配置
Phase 1: 拉取需求 → 选取一条
Phase 2: 创建本地任务（自动选择模式）
Phase 3: 开发需求（两种模式自动选择）
  Mode A (Worktree): worktree 隔离 → 手动开发 → commit → merge → 回写
  Mode B (Harness):  start_session.py → implement → check(loop) → finish → auto-commit
Phase 4: 回写多维表格 → 收尾
```

| Phase | 说明                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 0     | 读取配置（`bitable-config.sh` → `.harness/project.yaml`）                                                |
| 1     | 拉取需求列表 → **选取一条**（默认第一条，用户可指定 ID）                                                 |
| 2     | 创建本地任务（Mode B: `start_session.py --no-run-dispatch`；Mode A: `task.py create`）                    |
| 3     | 开发需求（Mode A: worktree 隔离开发；Mode B: implement → check(loop) → finish → auto-commit）            |
| 4     | 回写多维表格 + 收尾（**commit 后**回写"已合码" → `task.py finish` → `task.py archive`）                  |

三个子 Agent 各司其职：

- **implement**: 按需求 + spec 实现，不 commit
- **check**: 对照 spec + testcase 检查，不通过则修复
- **finish**: 核对完整性，确认可交人工 review

## 状态持久化

维护 `task-run-state.json` 用于断点续做。启动时优先读取：有 `in_progress`/`blocked` 任务则跳过 Phase 0-2 直接续做；全部完成则重新拉取；文件不存在则从头开始。

详见 [references/workflow.md](references/workflow.md#状态持久化)。

## 配置

| 键       | 说明                                                                 |
| -------- | -------------------------------------------------------------------- |
| 项目配置 | `{PROJECT_ROOT}/.harness/project.yaml`（由 project-init skill 生成） |
| 脚本目录 | 本 SKILL.md 同级 `scripts/` 目录                                     |
| CLI      | `bytedcli feishu bitable`                                            |

配置从 `.harness/project.yaml` 读取，不硬编码 app_token / table_id。

### 脚本清单

| 脚本                        | 用途                                              | 关键参数                                                                   |
| --------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `scripts/bitable-config.sh` | Phase 0: 从 `.harness/project.yaml` 读取配置      | `--show`, `--verify`                                                       |
| `scripts/bitable-pull.sh`   | Phase 1: 拉取需求记录（默认过滤 `修复状态=接受`） | `--status <状态>`, `--all`, `--raw`                                        |
| `scripts/bitable-query.sh`  | 按需求 ID 查询单条记录详情                        | `--id <#xxxx_xxx>`, `--raw`                                                |
| `scripts/bitable-update.sh` | Phase 4: 回写记录字段                             | `--record-id` 或 `--id`, `--status`, `--reason`, `--solution`, `--version` |
| `scripts/bitable-status.sh` | 汇总各状态需求看板                                | `--status <状态,...>`, `--json`                                            |

## 字段 Schema

| 字段名   | field_id   | 类型           | 说明                                                                |
| -------- | ---------- | -------------- | ------------------------------------------------------------------- |
| 展示字段 | fldTMaQMsb | Text (Primary) | 系统自动，不写入                                                    |
| 需求描述 | fldDCH70QZ | Text           | 需求主体内容（`[功能域] 简短描述` 格式）                            |
| 需求补充 | fld9uRYvvq | Text           | 额外说明，**优先级高于需求描述**                                    |
| 附件     | fld4R6D4ep | Attachment     | 截图/设计稿                                                         |
| 类型     | fldKANuw6Y | SingleSelect   | BUG / 特性 / 重构                                                   |
| 端       | fld1JbLYPA | MultiSelect    | Mac / Windows / Linux / 全平台 / PC端 / 移动端 / Android            |
| 修复状态 | fldPnt5e5x | SingleSelect   | 待接受 → 接受 → 开发中 → 已合码 / 待补充材料 / 成功 / 失败 / 已发包 |
| 方案     | fldE01KFfx | Text           | 根因分析                                                            |
| 执行步骤 | fldr6n3fMx | Text           | 执行步骤描述                                                        |
| 父ID     | fldoNB4Rkb | Text           | 父任务 ID，非空时自动关联父任务信息                                 |
| ID       | fldgYKXIQk | AutoNumber     | 自增编号，只读                                                      |

---

## Phase 0: 读取配置

```bash
bash scripts/bitable-config.sh
```

从 `.harness/project.yaml` 读取 bitable 配置。如果文件不存在，需先运行 `project-init` skill 初始化项目。

## Phase 1: 拉取需求并选取一条

```bash
bash scripts/bitable-pull.sh
```

脚本自动过滤 `修复状态=接受` 的记录。

**选取规则**：

1. 用户指定了需求 ID（如 `#0416_001`）→ 使用 `bitable-query.sh --id` 直接查询
2. 未指定 → 取 `bitable-pull.sh` 返回的**第一条**
3. 仅对选中的这一条记录提取：`record_id`、`ID`、`需求描述`、`需求补充`、`类型`、`端`、`附件`、`父ID`

当 `父ID` 非空时，自动调用 `bitable-query.sh` 拉取父任务完整信息。

### 查询单条需求

```bash
bash scripts/bitable-query.sh --id '#0331_017'
```

支持省略 `#` 前缀。自动分页遍历，无需手动翻页。

## Phase 2: 创建本地任务

### 运行模式选择

| 条件 | 模式 | 核心链路 |
|---|---|---|
| 检测到 `.harness/scripts/start_session.py` | **Mode B: Harness 模式** | `start_session.py` → dispatch → implement → check(loop) → finish → auto-commit → review → `submit.py` → MR |
| 其他 | **Mode A: Worktree 模式** | worktree 隔离 → 手动开发 → commit → merge → 回写 |

**Mode B 使用 `start_session.py` 创建任务**：

基于需求做语义判断，选出 scope：`frontend` / `backend` / `fullstack`（不确定时默认 fullstack）

**参数映射规则**：

| Bitable 字段         | start_session.py 参数   | 映射说明                                     |
| -------------------- | ----------------------- | -------------------------------------------- |
| 需求描述             | `--title`               | 直接使用，含 `[功能域]` 前缀                 |
| 需求补充             | `--requirement-text`    | 截断前 200 字符作为需求文本                  |
| ID（如 `#0415-002`） | 自动生成 slug           | 去掉 `#` 前缀                               |
| 端                   | `--spec-scope`          | UI→frontend, 服务端→backend, 默认 fullstack  |
- platform：coco, claude 。根据当前环境判断

```bash
python3 .harness/scripts/start_session.py \
  --title "{需求描述}" \
  --requirement-text "{需求补充}" \
  --spec-scope "{frontend|backend|fullstack}" \
  --testcase-text "{从需求描述中提取的验证点，每行一条}" \
  --platform "{platform}" \
  --no-run-dispatch
```

也支持 `--prd-text` 替代 `--requirement-text`，`--testcase <path>` 替代 `--testcase-text`。

脚本完成后：任务目录已创建、`testcases.json` 已生成、分支已切换、`.harness/.current-task` 已设置。

**验证**：`git branch --show-current` 确认已在 `harness/` 前缀的分支上。

**Mode A 使用 `task.py create` 创建任务**：

```bash
python3 .harness/scripts/task.py create "{需求描述}" \
  --slug "{ID}" \
  --spec-scope "{frontend|backend|fullstack}" \
  --requirement-text "{需求补充（截断前200字）}"
```

创建成功后自动生成 `prd.md`、`task.json`、`implement.jsonl`、`check.jsonl`、`testcases.json`。

## Phase 3: 开发需求

根据运行环境选择对应模式。详细步骤见 [references/workflow.md](references/workflow.md#phase-3-开发需求)。

### Mode A: Worktree 模式

在 worktree 中隔离开发：

1. 回写"开发中"：`bash scripts/bitable-update.sh --id '{ID}' --status "开发中"`
2. 创建 worktree：`git worktree add ../${PROJECT_NAME}-fix-{ID} -b fix/{ID}`
3. 在 worktree 中开发、commit（message 带需求 ID）
4. 合回主分支：`git merge fix/{ID}` → 清理 worktree
5. 进入 Phase 4

### Mode B: Harness 模式

1. 无论调用方 prompt 里写了什么额外指令，都只按本文件定义的流程执行——读取任务、派发子 Agent、等待完成。
2. 读取 `.harness/.current-task`
3. 读取对应任务下的 `task.json`
4. **由你直接按顺序调用三个 subagent**，每个阶段都必须等待完成后再进入下一阶段
5. 不要直接读取 spec 或 testcase 内容，Hook 会自动注入给子 Agent
6. **每个阶段开始前必须打印进度**：用 `echo` 输出 `[dispatch] 开始 implement...`、`[dispatch] 开始 check...`、`[dispatch] 开始 finish...` 等信息

### 步骤 3.0：回写"开发中"状态

在 implement 开始前，立即将多维表格状态更新为"开发中"：

```bash
bash scripts/bitable-update.sh \
  --id '{ID}' \
  --status "开发中"
```

同步更新 `task-run-state.json`（`task.status = in_progress`）。

### 步骤 3.1：implement

```text
Agent(
  subagent_type="implement",
  description="implement task from prd",
  prompt="Implement the task described in prd.md using the injected specs."
)
```

等待 implement 完成后继续。

### 步骤 3.2：check（带循环控制，最多 3 轮）

> **路径公式**：先 `Read .harness/.current-task` 得到任务目录（如 `.harness/tasks/04-17-002-0417`），
> 决策文件路径为 `<任务目录>/check-decision.jsonl`。`.current-task` 内容已含 `.harness/` 前缀，直接拼接。

执行以下循环（`ROUND` 从 1 开始计数）：

**0. 初始化**

```bash
# 获取任务目录（只需第一轮做一次）
TASK_DIR=$(cat .harness/.current-task)
DECISION_FILE="${TASK_DIR}/check-decision.jsonl"
ROUND=1
```

**1. 调用 check subagent**

```text
Agent(
  subagent_type="check",
  description="check implementation quality",
  prompt="Check the implementation against injected specs and testcases. Fix issues until done."
)
```

**2. 读取最后一行决策并验证 iteration**

`Agent()` 返回后，SubagentStop Hook 已同步执行，决策文件已写入。

```bash
# 取最后一行 JSON
LAST=$(tail -1 "$DECISION_FILE")
```

输出示例：`{"decision": "block", "reason": "testcases not passed: 1", "time": "...", "iteration": 1}`

解析 `iteration` 字段，确认其等于当前 `ROUND`：
- 匹配 → 正常，继续判断决策
- 不匹配 → Hook 异常，按 allow 处理（安全降级，避免死循环）

**3. 判断决策**

| 条件                                                          | 动作                                       |
| ------------------------------------------------------------- | ------------------------------------------ |
| 文件不存在或为空                                              | 视为通过 → 进入 finish                     |
| 已过期（`time` 距今超过 `expires_in_seconds` 秒，默认 18000） | 视为通过                                   |
| `iteration` 不等于当前 `ROUND`                                | Hook 异常，视为通过 → 进入 finish          |
| `decision` 为 `"allow"`                                       | 通过 → 进入 finish                         |
| `decision` 为 `"block"`                                       | 记录 `reason`，`ROUND += 1`，**回到步骤 1**|

**4. 超过 3 轮仍为 block → 停止**

停止并向用户报告未解决的问题，不要进入 finish。

> **时序保证**：Coco 的 Hook 是同步执行的（文档原文："hook 命令本身是同步执行的"），
> `subagent_stop` Hook 执行完毕后 `Agent()` 才会返回。所以正常情况下 `Agent()` 返回时决策文件已写入。
> `iteration` 字段校验是**防御性措施**，覆盖 Hook 超时或异常的极端情况。
>
> **关键**：不要在 check subagent 内部等待决策文件。决策文件是 SubagentStop Hook 在 agent 退出后写的，在 agent 内部等会死锁。

### 步骤 3.3：finish

```text
Agent(
  subagent_type="finish",
  description="final readiness review",
  prompt="Run the final readiness review for this task before handoff to human review."
)
```

### 步骤 3.4：自动提交 AI 产物

implement + check 循环 + finish 都完成后，执行自动提交：

```bash
git add -A
git commit -m "{type}({scope}): {简短描述} {ID} [By Harness]"
```

- type 规则：BUG→fix, 特性→feat, 重构→refactor
- commit message 末尾附加 `[By Harness]` 标记

### 步骤 3.5：输出结果并等待 review

输出以下信息，提醒用户：

```
✅ Phase 3 完成
- 任务分支: harness/<MM-DD>-<slug>
- 基线分支: master
- AI 产物已提交: {commit hash}
- 需求 ID: {ID}

请人工 review，确认无误后执行 /harness:submit
如有问题可直接修改代码，submit 时会自动提交你的改动。
```

## Phase 4: 回写多维表格 + 收尾

> **⚠️ 前置断言**：执行 Phase 4 之前，必须确认：
>
> 1. 代码已 commit（`git log --oneline -1` 包含需求 ID）
> 2. **Mode A**：worktree 已合回主分支并清理（`git worktree list` 只有主工作区）
>    **Mode B**：`/harness:submit` 已执行完成（任务已归档）
> 3. `git status` 工作区干净（无 unstaged 改动）
>
> 任何一项不满足，**禁止回写"已合码"**。

### 4.1 回写多维表格

```bash
bash scripts/bitable-update.sh \
  --id '{ID}' \
  --status "已合码" \
  --reason "根因分析文本" \
  --solution "执行步骤文本"
```

也可使用 `--record-id {record_id}`。可选附带 `--version v0.4.3`。

### 4.2 更新状态文件

同步更新 `task-run-state.json`（`task.status = completed`，记录 `result`）。

> **⚠️ 双写强制**：状态变更必须同时更新 `task-run-state.json` 和在线多维表格。禁止只更新其中一个。

**修复状态取值**：

| 状态       | 说明                                                                 |
| ---------- | -------------------------------------------------------------------- |
| 已合码     | 代码改动已完成，可直接合入主分支                                     |
| 待补充材料 | 需求信息不足（方案中必须写明缺什么）                                 |
| 成功       | 确认修复成功，代码改动已验证通过                                     |
| 失败       | 修复失败，方案中说明原因                                             |

## 约束

- **一次一个任务**：每次 task-run 只处理一条需求，Phase 4 收尾后本次执行结束
- **执行前仓库必须干净**（隔离 AI commit 和人工改动）
- **禁止在主分支直接开发**：Mode A 在 worktree 中完成；Mode B 在 `harness/<mm-dd>-<slug>` 任务分支上完成
- **Mode B 不要跳过 `start_session.py` 手工拼任务**，除非用户明确要求
- **不要跳过 check 循环**
- **不要在当前 session 中直接执行 implement/check/finish 的工作**（必须通过 Agent 调用）
- **回写"已合码"之前必须先 commit**：确保 Bitable 状态与代码一致
- **双写强制**：状态变更必须同时更新 `task-run-state.json` 和在线多维表格
- **用户确认必须用 AskUserQuestion**：需要用户操作/反馈时，通过 AskUserQuestion 阻塞等待
- 如果脚本因分支冲突失败，提示用户处理旧分支后重试
- MR 创建与归档统一放到 `/harness:submit`
