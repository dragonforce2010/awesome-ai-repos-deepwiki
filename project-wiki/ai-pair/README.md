# ai-pair DeepWiki

> **Claude Code Skill：用「一创双审」把 Codex CLI 与 Gemini CLI 接入同一套半自动协作流（源仓库为文档 + 示例，无应用代码）。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、实验性状态、许可证、与「多答案对比」的差异 |
| 架构与角色 | [架构与角色分工](pages/architecture-and-roles.md) | high | Team Lead、创作者、审查者与 CLI 拓扑 |
| 工作流与协议 | [半自动工作流与 CLI 调用协议](pages/workflow-and-protocol.md) | high | 五步环、预检、CLI 协议、超时与降级 |
| 工作流与协议 | [Dev / Content 团队与 Agent 模板](pages/agent-teams-and-templates.md) | medium | team-stop、审查模板与 examples 对应 |
| 采用与示例 | [安装、命令与 walkthrough 示例](pages/installation-and-usage.md) | high | 三个 CLI、安装路径、命令与示例阅读顺序 |
| 排障与边界 | [排障、验证与开源边界](pages/troubleshooting-and-boundaries.md) | medium | 真调用验证、未包含能力、演进 |

## 仓库快照（源：GitHub）

```text
ai-pair/
├── SKILL.md
├── README.md
├── LICENSE
└── examples/
    ├── dev-team.md
    └── content-team.md
```

## 核心入口（源文件）

| 文件 | 职责 |
|------|------|
| [SKILL.md](https://github.com/axtonliu/ai-pair/blob/60961fa39156468385f972c7b4cecdc5fc6ee9a1/SKILL.md) | Skill 定义：命令、协议、Agent 英文模板 |
| [README.md](https://github.com/axtonliu/ai-pair/blob/60961fa39156468385f972c7b4cecdc5fc6ee9a1/README.md) | 双语用户文档与排障 |
| [examples/dev-team.md](https://github.com/axtonliu/ai-pair/blob/60961fa39156468385f972c7b4cecdc5fc6ee9a1/examples/dev-team.md) | 开发团队 walkthrough |
| [examples/content-team.md](https://github.com/axtonliu/ai-pair/blob/60961fa39156468385f972c7b4cecdc5fc6ee9a1/examples/content-team.md) | 内容团队 walkthrough |

## 快速导航

- **想了解项目定位与形态？** → [项目概览](pages/overview.md)
- **想看清角色与谁调用哪个 CLI？** → [架构与角色分工](pages/architecture-and-roles.md)
- **想落实超时、临时文件、降级与 team-stop？** → [半自动工作流与 CLI 调用协议](pages/workflow-and-protocol.md)
- **要对照英文 Agent 模板与示例？** → [Dev / Content 团队与 Agent 模板](pages/agent-teams-and-templates.md)
- **要安装与命令速查？** → [安装、命令与 walkthrough 示例](pages/installation-and-usage.md)
- **审查「像没走 CLI」或开源边界？** → [排障、验证与开源边界](pages/troubleshooting-and-boundaries.md)

## Skill 中文译本

源仓库根目录 `SKILL.md` 的中文副本（遵循翻译规则，便于评审）：

- [skills/ai-pair/SKILL.md](skills/ai-pair/SKILL.md)

## 可继续追问的主题

- **审查者是否在真调用 CLI？** 对照 [排障、验证与开源边界](pages/troubleshooting-and-boundaries.md) 与 `SKILL.md` 中 `Source:` / `CLI Raw Output` 约定。
- **如何把 Codex `review` 子命令与文件投递串起来？** 阅读 [半自动工作流与 CLI 调用协议](pages/workflow-and-protocol.md) 与 [Dev / Content 团队与 Agent 模板](pages/agent-teams-and-templates.md) 中的模板优先级。
- **内容团队与开发团队的审查维度差异？** 对照 [架构与角色分工](pages/architecture-and-roles.md) 与两个 `examples/*.md`。

## 源备注

- **仓库**：https://github.com/axtonliu/ai-pair
- **提交**：`60961fa39156468385f972c7b4cecdc5fc6ee9a1`
- **单文件导出**：[exports/full-wiki.md](exports/full-wiki.md)
