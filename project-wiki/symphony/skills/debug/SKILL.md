---
name: debug
description:
  通过追踪 Symphony 和 Codex 日志中的 issue/session 标识符来调查卡住的运行和执行故障；
  当运行停滞、反复重试或意外失败时使用。
---

# Debug

## 目标

- 找出运行卡住、重试或失败的原因。
- 快速将 Linear issue 身份关联到 Codex session。
- 按正确顺序阅读正确的日志以定位根因。

## 日志来源

- 主运行时日志：`log/symphony.log`
  - 默认来自 `SymphonyElixir.LogFile`（`log/symphony.log`）。
  - 包含 orchestrator、agent runner 和 Codex app-server 生命周期日志。
- 轮转的运行时日志：`log/symphony.log*`
  - 当相关运行较早时检查这些文件。

## 关联键

- `issue_identifier`：人类可读的工单键（例如：`MT-625`）
- `issue_id`：Linear UUID（稳定的内部 ID）
- `session_id`：Codex thread-turn 对（`<thread_id>-<turn_id>`）

`elixir/docs/logging.md` 要求 issue/session 生命周期日志包含这些字段。调试时将它们作为关联键使用。

## 快速分诊（卡住的运行）

1. 确认该工单的调度器/worker 症状。
2. 查找该工单的最近日志行（优先使用 `issue_identifier`）。
3. 从匹配行中提取 `session_id`。
4. 追踪该 `session_id` 的启动、流处理、完成/失败和停滞处理日志。
5. 判定故障类别：超时/停滞、app-server 启动失败、turn 失败或 orchestrator 重试循环。

## 命令

```bash
# 1) 按工单键缩小范围（最快的入口点）
rg -n "issue_identifier=MT-625" log/symphony.log*

# 2) 如需要，按 Linear UUID 缩小范围
rg -n "issue_id=<linear-uuid>" log/symphony.log*

# 3) 提取该工单的所有 session ID
rg -o "session_id=[^ ;]+" log/symphony.log* | sort -u

# 4) 端到端追踪某个 session
rg -n "session_id=<thread>-<turn>" log/symphony.log*

# 5) 聚焦停滞/重试信号
rg -n "Issue stalled|scheduling retry|turn_timeout|turn_failed|Codex session failed|Codex session ended with error" log/symphony.log*
```

## 调查流程

1. 定位工单切片：
    - 按 `issue_identifier=<KEY>` 搜索。
    - 如噪声太大，加上 `issue_id=<UUID>`。
2. 建立时间线：
    - 找到第一条 `Codex session started ... session_id=...`。
    - 后续跟进 `Codex session completed`、`ended with error` 或 worker 退出行。
3. 分类问题：
    - 停滞循环：`Issue stalled ... restarting with backoff`。
    - App-server 启动失败：`Codex session failed ...`。
    - Turn 执行失败：`turn_failed`、`turn_cancelled`、`turn_timeout` 或 `ended with error`。
    - Worker 崩溃：`Agent task exited ... reason=...`。
4. 验证范围：
    - 检查故障是仅限于某个 issue/session 还是跨多个工单重复出现。
5. 收集证据：
    - 保存关键日志行，包含时间戳、`issue_identifier`、`issue_id` 和 `session_id`。
    - 记录可能的根因和确切的失败阶段。

## 阅读 Codex Session 日志

在 Symphony 中，Codex session 诊断信息输出到 `log/symphony.log`，以 `session_id` 为键。按生命周期阅读：

1. `Codex session started ... session_id=...`
2. 相同 `session_id` 的 session 流/生命周期事件
3. 终止事件：
    - `Codex session completed ...`，或
    - `Codex session ended with error ...`，或
    - `Issue stalled ... restarting with backoff`

针对特定 session 的调查，保持追踪范围窄：

1. 获取该工单的一个 `session_id`。
2. 构建仅该 session 的时间戳切片：
    - `rg -n "session_id=<thread>-<turn>" log/symphony.log*`
3. 标记确切的失败阶段：
    - 流事件前的启动失败（`Codex session failed ...`）。
    - 流事件后的 Turn/运行时失败（`turn_*` / `ended with error`）。
    - 停滞恢复（`Issue stalled ... restarting with backoff`）。
4. 将发现与附近行的 `issue_identifier` 和 `issue_id` 配对，确认没有混淆并发运行。

**始终**将 session 发现与 `issue_identifier`/`issue_id` 配对，避免混淆并发运行。

## 注意事项

- 大日志优先使用 `rg` 而非 `grep`。
- 在判断数据缺失前检查轮转日志（`log/symphony.log*`）。
- 如新日志语句中缺少必要的上下文字段，对齐 `elixir/docs/logging.md` 约定。
