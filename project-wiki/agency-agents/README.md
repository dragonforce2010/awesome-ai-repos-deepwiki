# agency-agents DeepWiki

> **一个 Markdown-first 的 AI 专家目录库：用标准化 agent 文件、转换脚本和 NEXUS 编排文档，把专门角色分发到 Claude Code、Cursor、Gemini CLI、OpenClaw、Qwen、Kimi 等工具。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 仓库定位、核心资产、阅读路线和使用边界。 |
| 概览 | [仓库结构与内容地图](pages/repository-map.md) | high | 解释顶层目录、文件类型、文档与自动化入口。 |
| Agent 资产模型 | [Agent 编写模型](pages/agent-authoring-model.md) | high | 说明 agent Markdown frontmatter、正文结构、设计原则和贡献流程。 |
| Agent 资产模型 | [Agent 目录与专业分工](pages/agent-catalog.md) | high | 梳理各 category 的 agent 数量、分工和代表性角色。 |
| 编排与使用 | [NEXUS 多 Agent 编排](pages/nexus-orchestration.md) | high | 解释 NEXUS 的七阶段流水线、模式、质量门和 Dev-QA 循环。 |
| 编排与使用 | [示例与使用场景](pages/examples-use-cases.md) | medium | 总结 README、examples 和 NEXUS quickstart 中的组合使用方式。 |
| 转换、安装与本地化 | [转换流水线](pages/conversion-pipeline.md) | medium | 说明 convert.sh 如何把 Markdown agent 转成各工具格式。 |
| 转换、安装与本地化 | [安装与工具集成](pages/installation-and-tooling.md) | high | 说明 install.sh 的检测、安装目标和 home/project scoped 区别。 |
| 转换、安装与本地化 | [中文本地化支持](pages/localization.md) | medium | 说明 i18n 脚本、中文 agent 名称映射和 Copilot 安装后的本地化路径。 |
| 质量与安全 | [质量门禁与安全边界](pages/quality-security.md) | medium | 覆盖 lint 规则、CI、贡献前检查和安全政策。 |

## 仓库快照

```text
agency-agents/
├── academic/                 # 学术和世界构建类 agent
├── design/                   # UX/UI/品牌/视觉类 agent
├── engineering/              # 工程实现、架构、DevOps、安全等 agent
├── finance/                  # 财务、税务、投资研究类 agent
├── game-development/         # 游戏开发、引擎、叙事、技术美术 agent
├── integrations/             # 多工具集成说明和生成格式目录
├── marketing/ paid-media/    # 增长、内容、广告投放类 agent
├── product/ project-management/
├── sales/ support/ testing/
├── spatial-computing/ specialized/
├── strategy/                 # NEXUS 多 agent 编排和 playbooks
└── scripts/                  # convert / install / lint / i18n
```

## 核心入口

| 文件 | 作用 |
|------|------|
| `README.md` | 项目定位、agent roster、快速开始和使用场景 |
| `CONTRIBUTING.md` | agent 文件模板、设计原则、PR 流程 |
| `integrations/README.md` | 支持工具、安装和再生成说明 |
| `scripts/convert.sh` | 把源 Markdown agent 转成各工具格式 |
| `scripts/install.sh` | 把源文件或转换产物安装到工具目录 |
| `scripts/lint-agents.sh` | 校验 agent frontmatter 和结构 |
| `strategy/QUICKSTART.md` | NEXUS Full/Sprint/Micro 快速启动 |
| `strategy/nexus-strategy.md` | NEXUS 完整编排 doctrine |

## 快速导航

- **想了解项目是什么？** → 阅读 [项目概览](pages/overview.md)
- **想新增一个 agent？** → 阅读 [Agent 编写模型](pages/agent-authoring-model.md)
- **想安装到 Cursor/Gemini/OpenClaw？** → 阅读 [安装与工具集成](pages/installation-and-tooling.md)
- **想理解 convert.sh？** → 阅读 [转换流水线](pages/conversion-pipeline.md)
- **想用多 agent 跑完整项目？** → 阅读 [NEXUS 多 Agent 编排](pages/nexus-orchestration.md)
- **想检查贡献质量和安全边界？** → 阅读 [质量门禁与安全边界](pages/quality-security.md)

## 可继续追问的主题

- `convert.sh`：不同工具格式之间如何映射，尤其 OpenClaw 的 SOUL/AGENTS/IDENTITY 拆分。
- `install.sh`：用户级与项目级安装路径差异，以及如何避免覆盖现有项目配置。
- `NEXUS`：如何把现有 agent roster 组合成项目级 pipeline。
- `agent 设计`：如何为新领域编写符合 lint 与贡献指南的 agent。

## 来源

- Repository: `https://github.com/msitarzewski/agency-agents`
- Local checkout: `/Users/bytedance/workspace/deepwiki/project-repos/agency-agents`
- Commit: `783f6a72bfd7f3135700ac273c619d92821b419a`
- Generated output: `/Users/bytedance/workspace/deepwiki/agency-agents`
