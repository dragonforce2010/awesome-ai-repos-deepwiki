# notebooklm-py DeepWiki

> **Google NotebookLM 非官方 Python API 与 CLI 工具的中文技术百科**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、核心能力、仓库结构与阅读路线 |
| 系统架构 | [系统架构](pages/system-architecture.md) | high | 顶层架构、模块边界、依赖方向与核心数据流 |
| 系统架构 | [RPC 协议层](pages/rpc-protocol.md) | high | batchexecute 编解码、请求构建、响应解析与错误处理 |
| 核心功能 | [认证与安全](pages/auth-and-security.md) | high | Cookie 认证、Token 提取、多账户 Profile 与安全实践 |
| 核心功能 | [客户端 API](pages/client-api.md) | high | NotebookLMClient 入口与八个子 API 模块 |
| 接口与入口 | [CLI 界面](pages/cli-interface.md) | medium | Click 命令结构、分组帮助、Session 上下文与错误处理 |
| 接口与入口 | [制品生成与下载](pages/artifact-generation.md) | medium | 9 种制品类型的生成流程、轮询机制与下载方式 |
| 数据管理 | [数据类型与模型](pages/data-types-and-models.md) | medium | 数据类、枚举映射与异常层级 |
| 测试与质量 | [测试与质量](pages/testing-and-quality.md) | medium | 三层测试架构、VCR 录制、覆盖率门槛与质量工具链 |
| 部署与基础设施 | [部署与 CI/CD](pages/deployment-and-ci.md) | medium | PyPI 发布、CI 工作流、RPC 健康检查与打包验证 |
| 扩展与定制 | [Agent Skill 集成](pages/agent-skill-integration.md) | medium | SKILL.md、Claude Code / Codex / npx skills 生态 |

## 仓库快照

```text
notebooklm-py/
├── src/notebooklm/           # 主包源码
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
│   └── cli/                  # CLI 命令实现
├── tests/                    # 测试套件
├── docs/                     # 文档
├── .github/workflows/        # CI/CD
├── SKILL.md                  # Agent Skill 定义
└── pyproject.toml            # 项目配置
```

## 核心入口

| 文件 | 角色 |
|------|------|
| [src/notebooklm/client.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/client.py) | `NotebookLMClient` 门面，唯一公共入口 |
| [src/notebooklm/_core.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/_core.py) | `ClientCore` 基础设施，RPC 调用编排 |
| [src/notebooklm/rpc/types.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/rpc/types.py) | RPC 方法标识与枚举常量 |
| [src/notebooklm/auth.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/auth.py) | Cookie 认证与 Token 提取 |
| [src/notebooklm/types.py](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/src/notebooklm/types.py) | 用户可见数据类与枚举 |
| [SKILL.md](https://github.com/teng-lin/notebooklm-py/blob/d6cef809dee4f03794e89bd089dd426b34a67345/SKILL.md) | Agent Skill 定义 |

## 快速导航

- **想了解项目是什么？** → 阅读 [项目概览](pages/overview.md)
- **想理解整体架构？** → 阅读 [系统架构](pages/system-architecture.md)
- **想深入 RPC 协议？** → 阅读 [RPC 协议层](pages/rpc-protocol.md)
- **想了解认证机制？** → 阅读 [认证与安全](pages/auth-and-security.md)
- **想使用 Python API？** → 阅读 [客户端 API](pages/client-api.md)
- **想使用命令行？** → 阅读 [CLI 界面](pages/cli-interface.md)
- **想了解制品生成？** → 阅读 [制品生成与下载](pages/artifact-generation.md)
- **想了解数据模型？** → 阅读 [数据类型与模型](pages/data-types-and-models.md)
- **想了解测试体系？** → 阅读 [测试与质量](pages/testing-and-quality.md)
- **想了解发布流程？** → 阅读 [部署与 CI/CD](pages/deployment-and-ci.md)
- **想集成 AI Agent？** → 阅读 [Agent Skill 集成](pages/agent-skill-integration.md)

## 可继续追问的主题

- `RPC 方法标识变更检测`：当 Google 更新混淆后的方法 ID 时，如何快速定位并修复？可阅读 `scripts/check_rpc_health.py` 和 `.github/workflows/rpc-health.yml`
- `batchexecute 协议逆向`：如何捕获和分析 NotebookLM 的网络流量以发现新的 RPC 方法？可阅读 `docs/rpc-development.md` 和 `docs/rpc-reference.md`
- `多 Agent 并发安全`：多个 AI Agent 同时操作同一 NotebookLM 账户时的隔离策略？可阅读 `SKILL.md` 的 CI/CD/Multiple Accounts 章节

## 来源信息

- 仓库：https://github.com/teng-lin/notebooklm-py
- 提交：`d6cef809dee4f03794e89bd089dd426b34a67345`
