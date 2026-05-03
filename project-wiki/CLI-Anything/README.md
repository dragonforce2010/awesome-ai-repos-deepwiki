# CLI-Anything DeepWiki

> **让所有软件变为 Agent 原生 — 通过自动化 CLI 生成桥接 AI Agent 与世界软件的鸿沟**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、核心理念、支持的软件目录与阅读路径 |
| 系统架构 | [系统架构](pages/system-architecture.md) | high | 整体分层、模块边界、数据流方向 |
| 核心功能 | [七阶段生成流水线](pages/seven-phase-pipeline.md) | high | 从代码分析到 PyPI 发布的自动化方法论 |
| 核心功能 | [Harness 包结构与实现模式](pages/harness-structure.md) | high | agent-harness 的标准布局、Click CLI、REPL 交互 |
| CLI-Hub | [CLI-Hub 包管理器](pages/cli-hub.md) | high | 注册表、安装策略、搜索发现、预览功能 |
| 技能系统 | [SKILL.md 技能系统](pages/skill-system.md) | medium | 自动生成、规范格式、npx skills 集成 |
| 技能系统 | [多 Agent 平台集成](pages/agent-platform-integration.md) | medium | Claude Code、Pi、OpenCode、OpenClaw、Codex 集成 |
| 预览 | [预览与轨迹系统](pages/preview-system.md) | medium | preview bundle、live session、trajectory 可视化 |
| 测试 | [测试与质量保障](pages/testing-and-quality.md) | medium | 多层测试策略、2280+ 测试、E2E 验证 |
| 基础设施 | [CI/CD 与注册表基础设施](pages/ci-cd-and-registry.md) | medium | GitHub Actions、PyPI 发布、Pages 部署 |

## 仓库快照

```text
CLI-Anything/
├── cli-anything-plugin/       # Claude Code 插件 (HARNESS.md 方法论 SOP)
│   ├── HARNESS.md             # 方法论单一权威来源
│   ├── commands/              # 插件命令定义
│   ├── repl_skin.py           # 统一 REPL 界面
│   ├── skill_generator.py     # SKILL.md 自动生成器
│   └── templates/             # Jinja2 模板
├── cli-hub/                   # CLI-Hub PyPI 包管理器
│   └── cli_hub/               # registry, installer, analytics, preview
├── skills/                    # 所有 SKILL.md 的规范化根目录
│   ├── cli-anything-blender/
│   ├── cli-anything-gimp/
│   └── ...                    # 50+ 技能定义
├── <software>/agent-harness/  # 各软件的 CLI harness 实现
│   ├── cli_anything/<sw>/     # Click CLI 包
│   ├── setup.py               # pip 安装入口
│   └── <SOFTWARE>.md          # 架构 SOP 文档
├── codex-skill/               # Codex 技能入口
├── openclaw-skill/            # OpenClaw 技能入口
├── opencode-commands/         # OpenCode 命令入口
├── registry.json              # harness 注册表
├── public_registry.json       # 公共 CLI 注册表
└── .github/workflows/         # CI/CD 流水线
```

## 核心入口

| 文件 | 用途 |
|------|------|
| `cli-anything-plugin/HARNESS.md` | 七阶段方法论 SOP — 整个项目的权威规范 |
| `cli-hub/cli_hub/cli.py` | CLI-Hub 命令行入口 (Click) |
| `cli-hub/cli_hub/registry.py` | 注册表获取与缓存逻辑 |
| `cli-hub/cli_hub/installer.py` | 多策略安装分发 (pip/npm/uv/bundled) |
| `cli-anything-plugin/skill_generator.py` | SKILL.md 自动生成器 |
| `registry.json` | harness CLI 注册元数据 |
| `cli-anything-plugin/repl_skin.py` | 统一 REPL 界面 (ReplSkin) |

## 快速导航

- **想了解项目是什么？** → 阅读 [项目概览](pages/overview.md)
- **想理解整体架构？** → 阅读 [系统架构](pages/system-architecture.md)
- **想知道 CLI 是怎么生成的？** → 阅读 [七阶段生成流水线](pages/seven-phase-pipeline.md)
- **想知道生成的 CLI 长什么样？** → 阅读 [Harness 包结构](pages/harness-structure.md)
- **想安装和使用现有 CLI？** → 阅读 [CLI-Hub 包管理器](pages/cli-hub.md)
- **想让 Agent 自动发现 CLI？** → 阅读 [SKILL.md 技能系统](pages/skill-system.md)
- **想接入你的 Agent 平台？** → 阅读 [多 Agent 平台集成](pages/agent-platform-integration.md)

## 可继续追问的主题

- `HARNESS.md 方法论深度`：阅读 `cli-anything-plugin/HARNESS.md` 全文及 `guides/` 目录，适合追问渲染间隙、时间码精度、滤镜翻译等高级话题。
- `单个 harness 的实现细节`：选择 `blender/agent-harness/` 或 `gimp/agent-harness/` 阅读完整包结构，适合做 DeepResearch 对比不同 harness 的实现模式差异。
- `预览协议的演进`：阅读 `docs/PREVIEW_PROTOCOL.md` + `docs/PREVIEW_MECHANISM_PROGRESS.md` + `cli-hub/cli_hub/preview.py`，适合追问 preview bundle 与 live session 的设计决策。
- `注册表与公共 CLI 扩展`：阅读 `registry.json` + `public_registry.json` + `cli-hub/cli_hub/installer.py`，适合追问多安装源分发策略。

---

*来源: [https://github.com/HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) @ `26bd973`*

*生成日期: 2026-04-30*
