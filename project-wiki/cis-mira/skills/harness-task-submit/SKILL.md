---
name: harness-task-submit
description: |
  人工 review 后提交任务、回写飞书多维表格并归档的端到端工作流。
  当用户完成代码 review、要求提交当前任务、回写多维表格状态、归档任务或创建 MR 时触发。
  触发词：harness:submit、harness submit、task submit、提交任务、回写多维表格、归档任务、创建 MR。
---

# Task Submit

人工 review 完成后 → 执行 submit.py → 回写多维表格 → 更新状态文件 → 归档。

> **⚠️ 核心约束：必须先完成 task-run 的 Phase 3**。submit 是 task-run 的后续阶段，对应 Phase 4（回写 + 收尾）。禁止跳过 implement/check/finish 直接 submit。

## 流程总览

```
Phase 1: 前置检查（确认 task-run Phase 3 已完成）
Phase 2: 执行 submit.py（提交改动 + 记录 session + 归档 + 创建 MR）
Phase 3: 回写多维表格（已合码 + 方案 + 执行步骤）
Phase 4: 更新状态文件 + 收尾
```

| Phase | 说明                                                                                          |
| ----- | --------------------------------------------------------------------------------------------- |
| 1     | 前置检查：确认 implement/check/finish 已跑完、人工 review 已完成                              |
| 2     | 执行 `submit.py`（自动 commit + session + archive + MR）                                      |
| 3     | 回写多维表格（`bitable-update.sh` 写入"已合码" + 方案 + 执行步骤）                           |
| 4     | 更新 `task-run-state.json` + 收尾                                                             |

## 配置

| 键       | 说明                                                                 |
| -------- | -------------------------------------------------------------------- |
| 项目配置 | `{PROJECT_ROOT}/.harness/project.yaml`（由 project-init skill 生成） |
| 脚本目录 | `skills/harness-task-run/scripts/`（复用 task-run 的回写脚本）       |
| CLI      | `bytedcli feishu bitable`                                            |

### 依赖脚本

| 脚本                                               | 来源           | 用途                     |
| -------------------------------------------------- | -------------- | ------------------------ |
| `.harness/scripts/submit.py`                        | harness 框架   | 提交改动 + session + MR  |
| `skills/harness-task-run/scripts/bitable-config.sh` | task-run skill | 读取 bitable 配置        |
| `skills/harness-task-run/scripts/bitable-update.sh` | task-run skill | 回写多维表格字段         |
| `skills/harness-task-run/scripts/bitable-query.sh`  | task-run skill | 查询单条需求（可选验证） |

---

## Phase 1: 前置检查

执行 submit 前，必须逐项确认以下条件：

### 1.1 确认 task-run 已完成

```bash
# 确认当前在任务分支上
git branch --show-current
# 预期输出: harness/<MM-DD>-<slug> 或 fix/<ID>
```

### 1.2 确认 implement/check/finish 已跑完

**Mode B（Harness 模式）**：

```bash
# 读取当前任务
TASK_DIR=$(cat .harness/.current-task)
# 检查 task.json 中 current_phase 是否为 finished
python3 -c "
import json
with open('${TASK_DIR}/task.json') as f:
    task = json.load(f)
print(task.get('current_phase', 'unknown'))
"
```

预期输出：`finished`。如果不是 `finished`，**禁止继续**，提示用户先完成 `/harness:start`。

**Mode A（Worktree 模式）**：

```bash
# 确认代码已 commit
git log --oneline -1
# 确认 worktree 已清理（只有主工作区）
git worktree list
```

### 1.3 确认人工 review 已完成

通过 AskUserQuestion 向用户确认：

```
你已经完成人工 review，确认可以提交吗？
```

> **⚠️ 禁止跳过人工确认**。submit 的前置条件之一是人工 review 已完成。

---

## Phase 2: 执行 submit.py

### 2.0 读取需求上下文

从 `task-run-state.json` 读取当前任务信息（`ID`、`record_id`、`desc`、`type` 等），供后续 Phase 3 回写使用。

```bash
python3 -c "
import json
with open('task-run-state.json') as f:
    state = json.load(f)
task = state['task']
print(f\"ID={task['id']}\")
print(f\"record_id={task['record_id']}\")
print(f\"desc={task['desc']}\")
print(f\"type={task['type']}\")
"
```

### 2.2 运行 submit.py

**Mode B（Harness 模式）**：

```bash
python3 .harness/scripts/submit.py
```

submit.py 自动完成：
1. `git add -A` + `git commit -m "<任务名>"`（提交人工 review 后的改动）
2. 记录 session（写入 workspace 历史）
3. 归档当前任务（task archive）
4. 创建 MR（打印 MR 链接）

**Mode A（Worktree 模式）**：

Mode A 不使用 submit.py，跳过此步骤，直接进入 Phase 3。Mode A 的 commit 和 merge 已在 task-run Phase 3 中完成。

---

## Phase 3: 回写多维表格

> **⚠️ 前置断言**：执行回写之前，必须确认：
>
> 1. 代码已 commit（`git log --oneline -1` 包含需求 ID）
> 2. **Mode A**：worktree 已合回主分支并清理
>    **Mode B**：submit.py 已执行成功
> 3. `git status` 工作区干净（无 unstaged 改动）
>
> 任何一项不满足，**禁止回写"已合码"**。

### 3.1 准备回写内容

根据开发过程，整理以下字段：

| 字段     | 说明                                                     |
| -------- | -------------------------------------------------------- |
| 修复状态 | `已合码`（正常完成）或 `待补充材料`/`失败`（异常情况）   |
| 方案     | 根因分析：区分"代码逻辑错误"/"配置缺失"/"上游依赖"等    |
| 执行步骤 | 具体到代码改动，不写泛泛描述                             |
| 版本     | 可选，如 `v0.4.3`                                        |

### 3.2 执行回写

```bash
bash skills/harness-task-run/scripts/bitable-update.sh \
  --id '{ID}' \
  --status "已合码" \
  --reason "根因分析文本" \
  --solution "执行步骤文本"
```

也可使用 `--record-id {record_id}`。可选附带 `--version v0.4.3`。

---

## Phase 4: 更新状态文件 + 收尾

### 4.1 更新 task-run-state.json

将任务状态更新为 `completed`，记录结果：

```python
import json, datetime

with open('task-run-state.json') as f:
    state = json.load(f)

state['task']['status'] = 'completed'
state['task']['result'] = {
    'status': '已合码',
    'attribution': '根因分析文本',
    'fix': '执行步骤文本',
    'commit': '{commit hash}'
}
state['updated_at'] = datetime.datetime.now().isoformat()
state['phase'] = 'Phase 4: 回写完成'

with open('task-run-state.json', 'w') as f:
    json.dump(state, f, ensure_ascii=False, indent=2)
```

> **⚠️ 双写强制**：状态变更必须同时更新 `task-run-state.json` 和在线多维表格。禁止只更新其中一个。

### 4.2 Mode A 额外收尾

```bash
# 确认工作区干净
git status

# 结束当前任务
python3 .harness/scripts/task.py finish

# 归档已完成的任务
python3 .harness/scripts/task.py archive {slug}
```

> **⚠️ archive 前必须确认 `git status` 干净**。`task.py archive` 会自动执行 `git add -A && git commit`。

### 4.3 输出完成信息

```
✅ Submit 完成
- 需求 ID: {ID}
- 修复状态: 已合码
- MR: {MR 链接}（如有）
- commit: {commit hash}

本次 task-run → task-submit 全链路完成。
```

---

## 修复状态取值

| 状态       | 说明                                                     |
| ---------- | -------------------------------------------------------- |
| 已合码     | 代码改动已完成，可直接合入主分支                         |
| 已发包     | 代码已随版本打包发布（由 release skill 自动回写）        |
| 待补充材料 | 需求信息不足（方案中必须写明缺什么）                     |
| 成功       | 确认修复成功，代码改动已验证通过                         |
| 失败       | 修复失败，方案中说明原因                                 |

## 约束

- **必须先完成 task-run Phase 3**：implement/check/finish 未完成时禁止 submit
- **必须人工确认**：通过 AskUserQuestion 确认 review 已完成，禁止自动跳过
- **回写"已合码"之前必须先 commit**：确保 Bitable 状态与代码一致
- **双写强制**：状态变更必须同时更新 `task-run-state.json` 和在线多维表格
- **Mode B 不要跳过 submit.py**：submit.py 负责 session 记录和任务归档
- **方案字段要写根因**：区分"代码逻辑错误"/"配置缺失"/"上游依赖"等
- **执行步骤要具体到代码改动**：不写泛泛描述
- **MR 链接不回写到 task.json**：默认只打印给用户
