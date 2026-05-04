<details>
<summary>相关源文件</summary>

- [README.md](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md) - 项目定位、核心特性、架构图、quickstart、仓库结构和路线图。
- [package.json](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json) - 包元数据、CLI bin、脚本和引擎约束。
- [pnpm-workspace.yaml](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/pnpm-workspace.yaml) - workspace 包范围。
- [docs/architecture.md](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/docs/architecture.md) - 架构文档入口。

</details>

# 项目概览

Open Design 的核心定位是“本地优先的设计 agent 工作台”：用户在一个桌面/Web 界面里创建设计项目，选择 agent、skill、design system、模板或媒体模型，然后由本地 daemon 把请求转交给 Claude Code、Codex、Gemini、Cursor、Copilot 等 CLI。仓库 README 明确把它描述为开源、本地优先、带 12 个 CLI、skills 和 design systems 的系统，而不是只服务单一模型的聊天壳。[README.md:1-3](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md)

## 它解决的对象

| 对象 | 在系统中的含义 | 主要来源 |
| --- | --- | --- |
| Project | 一个本地创作空间，包含对话、文件、artifact、preview comments、tabs 和 deployment 记录。 | `apps/daemon/src/db.ts`、`apps/daemon/src/projects.ts` |
| Agent | 运行在本机的代码/设计 agent CLI，由 daemon 检测并统一成 adapter。 | `apps/daemon/src/agents.ts` |
| Skill | 文件系统里的 `SKILL.md`，描述某类产物的工作流、触发器、资产和 OD 扩展字段。 | `docs/skills-protocol.md`、`apps/daemon/src/skills.ts` |
| Design System | `DESIGN.md` 文件，提供可注入 prompt 的颜色、字体、间距和组件规则。 | `apps/daemon/src/design-systems.ts` |
| Artifact | agent 输出的 HTML/媒体/文档文件及 `.artifact.json` manifest，供预览、导出和 lint。 | `apps/web/src/artifacts/manifest.ts` |
| Media Job | image/video/audio surface 通过 `od media generate` 分发给 provider 或 HyperFrames。 | `apps/daemon/src/media.ts` |

## 仓库形态

根 `package.json` 声明包名 `open-design`、`od` CLI bin 和 `tools-dev/tools-pack` 等脚本，同时约束 Node `~24.0.0`、pnpm `>=10.33.2 <11`。[package.json:1-25](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json) [package.json:31-40](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/package.json) 这意味着它不是一个单包前端项目，而是一个 pnpm monorepo：Web app、daemon、desktop、packaged app、shared packages、tools、skills、design systems、docs、e2e 都在同一仓库维护。

README 的 “At a glance” 把系统能力压缩为几个维度：支持 12 个 agent CLI、BYOK 路径、skills、design systems、媒体生成、artifact 生命周期和桌面壳。[README.md:49-66](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md) 这些维度正好对应后续页面的拆分：运行时、daemon API、Web 工作台、skills/design systems、媒体和打包发布。

## 创作闭环

Open Design 的主循环不是“用户输入 -> 模型回答”这么简单，而是一个受约束的设计流程。README 把关键机制概括为：先问结构化问题、用 TodoWrite 暴露计划、注入 seed/checklist、最后交付 artifact。[README.md:32-40](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md) 源码中这条闭环落在三个地方：

1. Web 创建项目时收集 metadata、skill、design system、模板和媒体选项。
2. Daemon 组合 system prompt，把 discovery、官方设计 prompt、design system、craft、skill、metadata、deck/media 特殊契约按顺序注入。
3. Agent 运行产生事件流和 artifact，Web 解析、保存、预览并提供导出。

## 维护时的优先级

Open Design 的“事实来源”分布在代码和 Markdown 协议中。维护时应优先看运行代码，再回看文档说明：

- 路由和状态边界以 `apps/daemon/src/server.ts`、`db.ts`、`projects.ts` 为准。
- Agent 能力以 `apps/daemon/src/agents.ts` 的 adapter 列表和 `docs/agent-adapters.md` 的设计意图共同判断。
- Skill 字段以 `docs/skills-protocol.md` 解释，实际解析以 `apps/daemon/src/skills.ts` 为准。
- Web 的真实用户体验以 `apps/web/src/components/ProjectView.tsx`、`FileViewer.tsx`、`PreviewModal.tsx` 为准。
- 打包和开发生命周期以 `tools/dev/src/index.ts`、`apps/packaged/src/sidecars.ts` 为准。

## 相关页面

- [系统架构与拓扑](system-architecture.md)
- [Agent 适配器与运行链路](agent-runtime.md)
- [Skills、Design Systems 与 Craft 注入](skills-design-systems.md)
