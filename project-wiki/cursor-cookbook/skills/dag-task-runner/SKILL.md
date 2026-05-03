---
name: dag-task-runner
description: 将用户的任务分解为由子任务构成的 DAG，并通过 Cursor SDK 本地子智能体按拓扑排序执行，将实时流式状态渲染到 canvas 画布中。每个任务都有一个复杂度（HIGH/MED/LOW）用于映射到不同模型。当用户要求并行拆解任务、将任务分解为 DAG、并行运行子智能体或将大型任务拆分为依赖图时使用。
---

# DAG Task Runner

将用户描述的任务分解为 JSON 格式的 DAG，随后将每个节点作为一个 Cursor SDK 的本地子智能体来运行（并将父节点的输出拼接到子节点的 Prompt 中）。实时的 DAG 状态（包含正在运行的每个子智能体的输出流）将被渲染到一个 `.canvas.tsx` 文件中；运行器在每次状态流转时重写该文件，IDE 则通过热重载机制，让用户实时看到子智能体在 `PENDING -> RUNNING -> FINISHED/ERROR` 等状态间的流转。

本技能可以作为项目级技能（`.cursor/skills/dag-task-runner`）或个人级技能（`~/.cursor/skills/dag-task-runner`）运行。已安装的运行器入口文件位于技能目录中的 `scripts/run_dag.ts`。你也可以通过设置 `DAG_RUNNER_DIR` 来覆盖自动探测的 `scripts` 目录。

## 何时使用

当用户说出以下任何短语时触发：

- "decompose this task", "break this into a DAG", "fan out subagents"（分解该任务、将此拆分为 DAG、分发子智能体）
- "run this as a graph of subtasks"（将其作为一个子任务图运行）
- 任何一个包含明显依赖关系及并行可能性的多步骤请求

若任务只是单词修改、简单提问，或结构呈线性且仅需单次智能体交互即可处理，则跳过不使用本技能。

## 工作流

### 第 1 步 — 生成 DAG JSON

你需要（作为父智能体）根据你对用户任务的理解，直接内联编写一份 DAG。数据模式如下：

```json
{
  "title": "<short human-readable title for the run>",
  "models": {
    "HIGH": "gpt-5.3-codex",
    "MED": "composer-2",
    "LOW": "auto-low"
  },
  "tasks": [
    {
      "id": "<unique kebab-case id>",
      "depends_on": ["<id>", "..."],
      "complexity": "HIGH | MED | LOW",
      "subtask_prompt": "<self-contained prompt for the subagent>"
    }
  ]
}
```

规则：

- 每一个 `depends_on` 数组的条目都必须引用另一个任务的 `id`。
- 不得出现循环依赖。运行器会在解析阶段直接拒绝带有循环的 DAG。
- `complexity` 属性控制子智能体使用的模型（参见下表）。选择 `HIGH` 用于新颖或复杂的推理，`MED` 用于常规的业务实现，`LOW` 用于机械劳动或查询任务。
- 可选的顶层 `models` 字段能覆盖该 DAG 默认的复杂度 → 模型映射。
- `subtask_prompt` 读起来应该是一个独立的请求 —— 运行器会自动为它前置拼接一段对上游任务输出的简要总结，因此你不需要在 prompt 中再次重复。
- **千万不要** 把两个会写入同一个文件的任务分配在同一个层级（rank）中（同一层级的兄弟节点是并发执行的，这会导致写入竞争）。

#### 最大化并行度 —— 这是运行器的核心价值所在

运行器会通过 `Promise.all` 在同一层级 (rank) 内 **并发 (concurrently)** 执行任务。一个完全线性的 `A → B → C → D` DAG 完全是在浪费并发能力。在最终确定 DAG 之前，请积极对问题进行解构以浮现独立的并行工作：

1. **默认不设依赖项**。只有当子任务确实、物理上缺少了父任务的输出就无法启动时，才添加 `depends_on` 条目。“逻辑上的先后顺序” 并不构成依赖。
2. **将只读性质的研究与探索拆分到宽泛的第一层级中**。代码库 grep、文档阅读、依赖项扫描、Schema 查询、测试盘点 —— 这些几乎总应该被安排在第一层级 (rank 1) 且彼此间无依赖。
3. **分发实现后的收尾工作**。测试、文档、更新日志、类型修改、Lint 修复等通常均依赖于同一个核心实现任务，且除此之外无依赖 —— 请将它们并排放在同一个层级，而不是串成一条链。
4. **使用菱形 (Diamonds) 而不是直线 (Lines)**。如果两个任务共同输入到第三个任务，请将模型结构明确为：层级 1 包含这两个父节点，层级 2 是负责合并的子节点。
5. **同一层级内文件写入的安全性**。这是一条硬性约束：如果两个任务会写同一个文件，绝不要把它们放在同一个层级里。要么用 `depends_on` 将它们串行化，要么合并成一个单一的任务。

质量底线：当你勾勒层级结构（rank 1 → rank 2 → …）时，在任何非微小的问题中，至少得有一个层级内包含一个以上的任务。如果你的 DAG 就是由一连串只有单任务的层级组成的单链，那说明你几乎肯定错失了并发机会 —— 回去重新规划。

运行器附带的示例 (`examples/example_dag.json`) 演示了这种模式：层级 1 并发了两个只读的研究任务，层级 2 将它们合并为设计方案，层级 3 负责核心代码实现，而层级 4 则再次并发散发到编写测试与补充文档。

将 JSON 写入到一个临时文件里，**并立刻生成初始的 canvas**，以便用户可以在子智能体启动的期间将其打开。请在单个 shell 代码块内执行以下所有操作：

```bash
# 0. Locate the runner and pick a canvas path
resolve_runner_dir() {
  if [ -n "${DAG_RUNNER_DIR:-}" ] && [ -f "$DAG_RUNNER_DIR/run_dag.ts" ]; then
    printf '%s\n' "$DAG_RUNNER_DIR"
    return 0
  fi

  git_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  for dir in \
    "$PWD/.cursor/skills/dag-task-runner/scripts" \
    "${git_root:+$git_root/.cursor/skills/dag-task-runner/scripts}" \
    "$HOME/.cursor/skills/dag-task-runner/scripts"
  do
    if [ -n "$dir" ] && [ -f "$dir/run_dag.ts" ]; then
      printf '%s\n' "$dir"
      return 0
    fi
  done

  echo "Could not find dag-task-runner/scripts. Copy .cursor/skills/dag-task-runner into this project, install it under ~/.cursor/skills, or set DAG_RUNNER_DIR." >&2
  return 1
}

RUNNER_DIR="$(resolve_runner_dir)"
CANVAS_PATH="$HOME/.cursor/projects/<workspace-slug>/canvases/dag-<slug>.canvas.tsx"

# 1. Write the DAG JSON
cat > /tmp/dag-<slug>.json <<'JSON'
{ "title": "...", "tasks": [ ... ] }
JSON

# 2. Ensure deps are installed (skips if already present)
[ -x "$RUNNER_DIR/node_modules/.bin/tsx" ] || \
  (cd "$RUNNER_DIR" && (pnpm install --silent || npm install --silent))

# 3. Generate the initial all-PENDING canvas (no CURSOR_API_KEY needed)
"$RUNNER_DIR/node_modules/.bin/tsx" "$RUNNER_DIR/run_dag.ts" \
  --init-only \
  --dag /tmp/dag-<slug>.json \
  --canvas-path "$CANVAS_PATH"

# 4. Best-effort auto-open of the canvas file; ignore failure in headless/non-macOS environments
open "$CANVAS_PATH" >/dev/null 2>&1 || true
```

Canvas 画布的路径为：

```
~/.cursor/projects/<workspace-slug>/canvases/dag-<slug>.canvas.tsx
```

`<workspace-slug>` 是由 cwd 的绝对路径派生出来的，其把 `/` 及其它特殊字符均替换为 `-`。计算方式为：取 `pwd`，去掉开头的 `/`，并将所有剩余的 `/` 替换为 `-`。例如：cwd 是 `/Users/me/Code/myapp` → slug 为 `Users-me-Code-myapp`。对这个 DAG JSON 的文件名使用相同的 `<slug>`，以便它们能轻松关联上。

### 第 2 步 — 在聊天中提供 Canvas 链接

既然文件已经在磁盘上存在，请发布一个 Markdown 超链接，要求超链接文字正好为 `Open Canvas`，对应的 URL 采用 `file://` 格式，同时给出绝对路径以作后备：

> I created a live canvas: [Open Canvas](file:///Users/&lt;user&gt;/.cursor/projects/&lt;workspace-slug&gt;/canvases/dag-&lt;slug&gt;.canvas.tsx)
> Fallback path: `/Users/<user>/.cursor/projects/<workspace-slug>/canvases/dag-<slug>.canvas.tsx`

必须始终使用链接文本 `Open Canvas`。在 `file://` URL 与备用路径中都要采用绝对路径，绝对不能使用 `~/`。务必在 **第 3 步之前** 执行此操作，这样用户便可以在子智能体还在启动时点击打开该 canvas。尽管第 1 步的 shell 脚本里已尝试用 `open` 自动打开，若该命令失效，依旧可通过此处聊天对话中的链接作保证。

### 第 3 步 — 运行 DAG

先确保配置了 `CURSOR_API_KEY`（运行器在缺少 key 时会立刻报错并终止），然后启动它：

```bash
[ -n "$CURSOR_API_KEY" ] || { [ -f .env ] && set -a && source .env && set +a; }

"$RUNNER_DIR/node_modules/.bin/tsx" "$RUNNER_DIR/run_dag.ts" \
  --dag /tmp/dag-<slug>.json \
  --canvas-path "$CANVAS_PATH"
```

这边的 `--canvas-path` 须和第一步的路径完全一致。运行器随后将：

1. 验证 DAG 并复用已有的 canvas 文件。
2. 依据层级排序（Kahn 拓扑排序），将当前已就绪的同级任务全部作为本地 Cursor SDK 智能体并发启动，且在各个节点发生状态跳转时覆写 canvas，把流式助手文本实时输进相应的任务卡片内。
3. 自动跳过那些它上游依赖已经失败的任务（将其标记为 `ERROR` 且携带一条包含 "Skipped: upstream task(s) … failed" 的异常信息）。
4. 捕获每个子智能体最终输出的文字、状态、Token 消耗以及运行时长。
5. 在执行完毕后写入带有概要统计信息的终版 canvas 画布。
6. 一旦接收到 SIGINT/SIGTERM/SIGHUP 信号，取消所有当前执行中的子智能体，并在进程结束前保存一次 canvas 画布。

#### CLI 参数旋钮

| Flag | Default | Purpose |
|------|---------|---------|
| `--models-file <path>` | — | 包含部分“复杂度 → 模型”覆盖映射关系的 JSON 文件。 |
| `--task-timeout-ms <ms>` | `1200000` (20 min) | 如果超过此时长则将任务标记为 `ERROR`。 |
| `--stream-publish-ms <ms>` | `500` | 控制实时 canvas 流式写入的速度与频率。 |
| `--stream-idle-timeout-ms <ms>` | `300000` (5 min) | 若该窗口期内未能接收到任何流事件则标记为 `ERROR`。 |
| `--debounce <ms>` | `200` | 写入 canvas 时的节流 (debounce) 间隔。 |

### 第 4 步 — 总结摘要

当运行器退出后，用简短的话语对成功或失败的任务作出总结，并利用文本 `[Open Canvas](file:///Users/<user>/.cursor/projects/<workspace-slug>/canvases/dag-<slug>.canvas.tsx)` 重新抛出该链接，方便用户不用回滚太远即可继续访问 canvas 画布。只在有需要时才提供那个用于 fallback 的绝对路径。

## 复杂度 → 模型 映射表

| 复杂度 (Complexity) | 模型 (Model)       |
|-------------------|--------------------|
| HIGH              | `gpt-5.3-codex`   |
| MED               | `composer-2`       |
| LOW               | `auto-low`         |

你可以利用顶级的 DAG `models` 对象来在当前任务内联覆盖上述集合的任意部分，抑或通过参数 `--models-file <path>` 传入可复用的规则文件。优先级关系为：默认值 < DAG `models` < `--models-file` 参数。由于不同的账户可使用的模型列表不同；可借助 SDK 文档里记录的 `Cursor.models.list()` 来确认可用的有效 ID。

## 认证 (Auth)

运行器从环境变量中读取 `CURSOR_API_KEY`。按照你平时管理机密的方式来设置它：

```bash
export CURSOR_API_KEY=crsr_...
```

如果当前 workspace 中包含带此变量的 `.env` 文件，可尝试预先 source 它：

```bash
set -a && source .env && set +a
```

## CLI 选项

| Flag                        | Default              | Notes                                                                              |
|-----------------------------|----------------------|------------------------------------------------------------------------------------|
| `--dag`                     | required             | DAG JSON 文件路径。                                                         |
| `--canvas-path`             | composed from below  | 指向 canvas 文件的完整绝对路径。推荐该配置 —— 它也是父智能体托管流程的默认做法。|
| `--canvas`                  | —                    | 画布文件名主体（不含 `.canvas.tsx` 后缀）。只在不提供 `--canvas-path` 时才采用。   |
| `--canvases-dir`            | derived from cwd     | 覆盖写入 canvas 画布文件的输出目录。只与 `--canvas` 一同使用。                 |
| `--cwd`                     | `process.cwd()`      | 供每一个子智能体执行工作时作为当前执行环境所在的目录。                                             |
| `--models-file`             | —                    | 包含部分的 “复杂度 → 模型” 配置重写的 JSON 文件。                    |
| `--debounce`                | `200` (ms)           | canvas 防抖与节流间隔。                                                    |
| `--init-only`               | `false`              | 生成一个只有 `PENDING` 的初始 canvas 文件随后退出。此时并不必须提供 `CURSOR_API_KEY`。     |
| `--task-timeout-ms`         | `1200000` (20 min)   | 当任务执行长于此时限则被判处为 `ERROR` 异常。                                  |
| `--stream-publish-ms`       | `500` (ms)           | 控制刷新流式更新频率，以此来防止频繁执行 git clone 之类导致的耗能与性能浪费。                 |
| `--stream-idle-timeout-ms`  | `300000` (5 min)     | 当这段窗口时间中没有任何信息流传出时，抛出 `ERROR`。                |

## 注意事项

- 本工具仅限 Local 运行时 —— 所有子智能体都在针对 `--cwd` 的指向（默认是调用命令处所在路径）跑程序。
- 同一层级里的兄弟任务同时平行运行；绝对不能让它们改写并入同一个目标文件。
- 这个运行器不会针对当前配置内置的 MCP 服务或其他进一步递归派生的 sub-sub-agents。
- 对于任何处于上游依赖链路已经垮掉导致 Fail 的任务，它们都会自动被判定不再执行，转为带 "Skipped: upstream task(s) … failed" 标记。有效防范毫无指望情况下的无端 API 调用。
- 为了保证渲染生成的 canvas 大小在合理范畴中，每个任务卡片打印在上面的流日志至多限制为 `STREAM_CAP = 4000` 个字符；对传入后辈结点的上下游背景限定在至多给到每位父级最多 2000 个字符为上限。
- 发生了超时的作业会直接报 `ERROR` 终结抛错而非被卡死一直停顿呈 `RUNNING`。
- 如果发生 SIGINT/SIGTERM/SIGHUP 将会自动结束停止一切进行间的子级代理并且最后妥善完成并封存该回溯画布数据而后完全关闭服务退出结束。
- 未捕捉到的 SDK API 异常拒绝（Unhandled Rejection）将会受到抑制以防止其致死运行器而无法自我终结退出挂断；但是针对未能防抓的异常则执行完日志便干脆地关停全盘进程。

## 参考资料

- 演示级别的 DAG 编排示例图定义：`examples/example_dag.json`（在被安装过以后存在于同目录下作为兄弟模块展现）
- 安装完毕后执行程序的真正切入点：属于 `$RUNNER_DIR` 指代根层内部目录树里的 `run_dag.ts`
- Cursor SDK 文档手册页链接：https://cursor.com/docs/api/sdk/typescript
