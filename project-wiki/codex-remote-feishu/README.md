# codex-remote-feishu DeepWiki

> **codex-remote-feishu 能够将远程开发环境或本地服务器上的 Codex/Claude 工作现场完美投影至飞书聊天窗口。它通过单一 Go 二进制、长连接事件网关与本地 MCP 飞书监听器，彻底解决了编辑器多窗口频繁跳转和敏感接口公网暴露的困扰，使得人机交互体验兼具强安全性与高响应速度。**

---

## 目录导航

| 分区 | 页面 | 内容简介 |
| :--- | :--- | :--- |
| **概览** | [项目概览](pages/overview.md) | 诞生背景、核心愿景、功能全景及阅读路径推荐。 |
| **架构** | [系统架构与统一二进制模型](pages/system-architecture.md) | 统一 Go 程序角色分工、软链接 launcher 与 namespaced 状态隔离。 |
| | [飞书网关 Early ACK 与 FIFO 队列](pages/feishu-gateway-queue.md) | 3s 超时前置 ACK 回应、会话隔离 FIFO 队列及消息点赞跟进。 |
| **核心实现** | [CardKit 2.0 渲染与交互状态机](pages/interactive-cards.md) | 文本 Planner 流式切分、共享进度卡摘要与 UIEvent 交互视图。 |
| | [Orchestrator 协管核心与运行态集群](pages/orchestrator-core.md) | turns 事务、pickers 瞬时上下文、catalog 缓存与物理状态隔离。 |
| | [本地飞书 MCP 工具监听器](feishu-mcp-listener.md) | 9502 本地环回 MCP 服务、实例绑定路由与富媒体投递工具。 |
| **基础设施** | [VS Code Shim 编辑器联动与接管](pages/editor-takeover.md) | 桌面版配置劫持与 Remote 环境下物理替换扩展 bundle（重命名为 codex.real）的 Shim 接管。 |
| | [WebSetup 与引导安装生命周期](pages/setup-install.md) | 一键安装脚本引导、内置 WebSetup 环境自检与 `/upgrade latest` 自愈。 |
| | [Linux Service 守护常驻与状态 API](pages/daemon-service.md) | systemd 用户级单元常驻、Linger 保活与 `/v1/status` 健康快照。 |

## 仓库全景

```text
codex-remote-feishu/
├── cmd/
│   └── codex-remote/               # 统一二进制主入口程序
├── internal/
│   ├── adapter/
│   │   ├── editor/                 # VS Code 劫持与 shim 探测层
│   │   ├── feishu/                 # 飞书网关（gateway, queue, projector）
│   │   └── relayws/                # websocket 传输层 (daemon <-> wrapper)
│   ├── app/
│   │   ├── daemon/                 # 守护进程（包含 9502 端口的本地 MCP 服务）
│   │   ├── install/                # 一键引导安装器与系统服务管理器
│   │   └── wrapper/                # codex CLI 包装与翻译器
│   └── core/
│       ├── agentproto/             # 统一底层 agent 封包协议定义
│       ├── control/                # 产品交互 Action 与 UIEvent 读模型
│       ├── orchestrator/           # 唯一状态决策中心 (turns, pickers 等 cluster)
│       └── renderer/               # 文本 Planner 流式切分工具
├── web/                            # React + Tailwind 管理与 WebSetup 界面
├── package.json
└── go.mod
```

## 核心入口

| 源码文件 | 作用与职责 |
| :--- | :--- |
| [cmd/codex-remote/main.go](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/codex-remote-feishu/cmd/codex-remote/main.go) | 统一二进制的可执行程序入口。 |
| [internal/adapter/feishu/gateway.go](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/codex-remote-feishu/internal/adapter/feishu/gateway.go) | 飞书事件流中继中心，处理 Early ACK 与分流。 |
| [internal/core/orchestrator/service.go](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/codex-remote-feishu/internal/core/orchestrator/service.go) | 全局唯一调度状态机，编排 turns 与 picker 运行时集群。 |
| [internal/app/daemon/tool_mcp.go](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/codex-remote-feishu/internal/app/daemon/tool_mcp.go) | 本地飞书 MCP 监听器，暴露 `feishu_send_im_image` 等工具。 |
| [internal/adapter/editor/shim.go](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/codex-remote-feishu/internal/adapter/editor/shim.go) | VS Code 软接管 Shim 注入，实现 `codex.real` 物理代理劫持。 |

## 你想了解什么？

- **如何实现飞书和本地 VS Code 焦点的跟随？** $\rightarrow$ [VS Code Shim 编辑器联动与接管](pages/editor-takeover.md)
- **大模型是怎么把图片和视频上传到飞书的？** $\rightarrow$ [本地飞书 MCP 工具监听器](pages/feishu-mcp-listener.md)
- **在高并发消息发送时，为什么卡片没有发生错乱？** $\rightarrow$ [飞书网关 Early ACK 与 FIFO 队列](pages/feishu-gateway-queue.md) 中的**单车道 FIFO 队列**。
- **项目是如何将后台进程、数据库状态隔离出来的？** $\rightarrow$ [Orchestrator 协管核心与运行态集群](pages/orchestrator-core.md)

---

> **源码信息**
> - 仓库地址: `https://github.com/kxn/codex-remote-feishu.git`
> - 活跃分支: `master`
> - 本轮 Commit: `d7ffa4c327062a995f250f525bab12ced6fe9aac`
> - 生成时间: 2026年5月23日
