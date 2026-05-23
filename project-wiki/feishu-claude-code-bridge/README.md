# feishu-claude-code-bridge DeepWiki

> **feishu-claude-code-bridge 是一个轻量级桥接 Bot，致力于将本地 Claude Code CLI 的强大代码诊断与修改能力直接引流至飞书 (Lark) 聊天窗口。通过扫码向导、流式卡片渲染和多工作空间隔离，它解决了本地开发终端与远程协同界面之间的物理屏障，使 AI 能够直接赋能团队的敏捷协作与开发效率。**

---

## 目录导航

| 分区 | 页面 | 内容简介 |
| :--- | :--- | :--- |
| **概览** | [项目概览](pages/overview.md) | 诞生背景、核心能力、与同类方案的差异及阅读路线。 |
| **架构** | [系统架构与进程模型](pages/system-architecture.md) | 双进程隔离设计、优雅关机生命周期与守护注册机理。 |
| **核心实现** | [Claude CLI 集成与适配器](pages/claude-integration.md) | CLI 启动参数标准化、JSON 字符流解析与 OAuth 授权防超时。 |
| | [飞书 Bot 消息与连接管理](pages/feishu-bot-core.md) | 600ms 静默防抖队列、并发限制池与安静日志输出。 |
| | [交互式卡片渲染与分发](pages/interactive-cards.md) | CardKit 2.0 模板、RunState 归约器与按钮回调拦截。 |
| | [会话与指令系统](pages/commands-sessions.md) | 斜杠命令拦截、SessionStore 多会话和命名工作空间管理。 |
| **基础设施** | [守护进程与后台托管](pages/daemon-management.md) | 跨 OS 服务抽象，macOS launchd、Linux systemd、Windows 任务计划。 |
| | [安全防线与配置系统](pages/security-config.md) | 隐身级访问控制、Zod 配置验证与 AES-256 加密凭据存储。 |
| | [媒体流与辅助工具](pages/media-utils.md) | 富媒体附件流下载、24h 自动清理 GC 与终端扫码向导。 |

## 仓库全景

```text
feishu-claude-code-bridge/
├── bin/
│   └── lark-channel-bridge.mjs     # 宿主 CLI 入口可执行脚本
├── src/
│   ├── agent/                      # CLI 代理适配层 (Claude CLI 进程控制)
│   ├── bot/                        # 飞书网关层 (WebSocket 长连接与消息分发)
│   ├── card/                       # 卡片渲染层 (交互卡片 templates 与 dispatcher)
│   ├── cli/                        # 宿主命令行层 (Commander 命令与 preflight 检查)
│   ├── commands/                   # 斜杠指令业务逻辑层
│   ├── config/                     # 密钥托管与 Zod Schema 配置文件
│   ├── daemon/                     # OS 服务管理器适配器 (launchd/systemd/schtasks)
│   ├── media/                      # 飞书资源文件缓存管理器
│   ├── runtime/                    # 运行态进程注册表 (防止多开)
│   ├── session/                    # 会话数据持久化
│   ├── utils/                      # 飞书客户端授权工具
│   └── workspace/                  # 工作空间目录存储
├── package.json
└── tsconfig.json
```

## 核心入口

| 源码文件 | 作用与职责 |
| :--- | :--- |
| [src/cli/commands/start.ts](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/feishu-claude-code-bridge/src/cli/commands/start.ts) | 宿主进程启动总入口，装配连接网关与 Adapter 并绑定信号监听。 |
| [src/agent/claude/adapter.ts](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/feishu-claude-code-bridge/src/agent/claude/adapter.ts) | Claude 代理适配器，拼装 System Prompt 并 spawn 子进程。 |
| [src/bot/channel.ts](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/feishu-claude-code-bridge/src/bot/channel.ts) | 飞书 WebSocket 长连接核心，控制消息排队与流式响应转发。 |
| [src/card/run-state.ts](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/feishu-claude-code-bridge/src/card/run-state.ts) | 声明式状态归约机，将子进程的 JSON 事件序列转换成渲染状态。 |
| [src/daemon/service-adapter.ts](file:///Users/bytedance/workspace/workspace-local-task/deepwiki/project-repos/feishu-claude-code-bridge/src/daemon/service-adapter.ts) | 跨 OS 服务适配器，用于注册和卸载后台守护进程。 |

## 你想了解什么？

- **这个项目是如何跟本地 Claude 协同并读取文件的？** $\rightarrow$ [项目概览](pages/overview.md) 和 [Claude CLI 集成与适配器](pages/claude-integration.md)
- **多开 Bot 会造成消息冲突吗？** $\rightarrow$ [系统架构与进程模型](pages/system-architecture.md) 中的**进程注册中心**
- **如何在后台默默运行且开机自启？** $\rightarrow$ [守护进程与后台托管](pages/daemon-management.md)
- **卡片上的工具名和文本是怎么实时流式出来的？** $\rightarrow$ [交互式卡片渲染与分发](pages/interactive-cards.md)

---

> **源码信息**
> - 仓库地址: `https://github.com/zarazhangrui/feishu-claude-code-bridge.git`
> - 活跃分支: `main`
> - 本轮 Commit: `d59e0464e514fd348488dc61a52d7d3334de0aad`
> - 生成时间: 2026年5月23日
