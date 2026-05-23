---
name: relay-stack-playbook
description: "在此仓库的 Relay 栈（Codex 协议翻译、relayd、relay-wrapper、飞书集成、VS Code 远程集成，或围绕 /list、/attach、/use、消息丢失的调试）上工作时使用。总结了此项目特定的执行顺序、验证步骤和常见故障模式。"
---

# relay-stack-playbook

当改动或调试涉及以下内容时使用此技能：
- `relayd`
- `relay-wrapper`
- 飞书入站/出站表现
- VS Code 远程集成
- Codex app-server 协议翻译
- `/list`、`/attach`、`/use`、`/stop`、线程路由、队列状态、丢失的回复

## 核心规则

- 从运行时证据开始，而不是从第一个看似合理的修复方案开始。
- 在编辑代码前按层级拆解问题：
  - `wrapper`：原生协议翻译和显式标注
  - `server/orchestrator`：产品状态、队列、线程路由、渲染决策
  - `feishu gateway`：入站动作解析与出站投递
- wrapper 必须标注辅助/内部流量；不得默默吞掉真实的运行时生命周期事件。
- 辅助生命周期必须通过协议 ID 进行关联（例如 `request id -> result.thread.id` 和 `request id -> result.turn.id`）。不要使用“相同线程”或时间启发式算法。
- 产品可见性决策属于服务器层，不属于 wrapper。
- 除非与从日志中捕获的真实帧相匹配，否则不要信任 mock。

## 首要检查

在改动代码前，按顺序收集这些事实：

0. 优先使用仓库辅助脚本：
   - 运行 `./scripts/relay/collect-diagnostics.sh`。
   - 它能一次性捕获固定的底层证据：
     - 代理环境变量
     - 服务状态
     - 进程与端口检查
     - `/api/admin/bootstrap-state`
     - `/v1/status`
     - 最近的 relayd 日志

1. 检查 relay 运行态状态。
   - 读取 `relayd` 状态。
   - 验证实际的进程和监听端口。
2. 从 localhost 查询 `/v1/status`（不受代理干扰）。
   - 优先使用 `references/commands.md` 中的原始本地 socket 命令。
   - 确认：
     - 实例是在线的
     - 各种活跃及选择的 Thread 和 Turn ID
     - 队列项状态与模式
3. 阅读最近的 `relayd` 日志。
4. 如果 VS Code 显示结果但飞书没有：
   - wrapper -> relay 路径至少部分工作，优先检查 relay 界面状态与网关失败信息。

## 验证

- 本地测试前清除代理变量。
- 改动协议或状态机后，运行：
  - `go test ./...`
- 当 bug 用户可见时，验证确切的症状路径：飞书输入 -> relay 状态改变 -> wrapper/原生行为 -> 飞书输出。
