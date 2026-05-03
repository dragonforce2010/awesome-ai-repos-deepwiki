# gstack DeepWiki

> **面向 AI 编码代理的技能工作流、浏览器运行时、多宿主生成器与记忆/质量体系中文技术 Wiki。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | gstack 的定位、仓库边界、主要能力和阅读路线。 |
| 核心功能 | [技能工作流](pages/skill-workflow.md) | high | gstack 如何把产品、工程、设计、QA、发布和复盘组织成连续技能链。 |
| 接口与入口 | [安装与多宿主接入](pages/setup-and-hosts.md) | high | 安装脚本、team mode、技能链接策略和 Claude/Codex/OpenCode/OpenClaw 等宿主差异。 |
| 接口与入口 | [OpenClaw 集成](pages/openclaw-integration.md) | medium | gstack 如何以 methodology source 方式接入 OpenClaw，而不是把完整运行时移植过去。 |
| 内部机制 | [技能生成系统](pages/skill-generation.md) | high | `.tmpl` 到 `SKILL.md` 的生成、resolver、host rewrite、验证和新技能扩展方式。 |
| 浏览器运行时 | [Browse 运行时](pages/browse-runtime.md) | high | Browse CLI、localhost HTTP 守护进程、Playwright 浏览器、命令分发和状态文件。 |
| 浏览器运行时 | [浏览器安全模型](pages/browser-security.md) | high | localhost 绑定、Bearer token、双监听器 tunnel、scoped token、内容安全和 CDP allowlist。 |
| 工具链 | [设计与 PDF 工具](pages/design-pdf-tools.md) | medium | Design CLI、设计技能、mockup-to-code、比较板和 make-pdf CLI 的职责边界。 |
| 数据与记忆 | [GBrain 与记忆系统](pages/gbrain-memory.md) | medium | setup-gbrain、per-remote trust policy、memory sync、secret scanning 和跨机器恢复。 |
| 测试与质量 | [测试、CI 与质量门](pages/testing-ci-quality.md) | high | bun test、技能静态验证、LLM/E2E eval、workflow freshness gate 和 Docker CI。 |
| 扩展与贡献 | [贡献、扩展与新增宿主](pages/contributing-extension.md) | medium | 开发模式、编辑技能模板、新增 host、迁移脚本、社区 PR wave 和贡献注意事项。 |

## 仓库快照

```text
gstack/
├── README.md / ARCHITECTURE.md / CLAUDE.md
├── */SKILL.md 和 */SKILL.md.tmpl      # gstack 工作流技能
├── browse/src/                       # Playwright 浏览器 CLI + daemon
├── design/src/                       # AI mockup、比较板、design-to-code CLI
├── make-pdf/src/                     # Markdown → PDF CLI
├── hosts/                            # Claude/Codex/OpenClaw 等宿主配置
├── scripts/                          # SKILL.md 生成器、resolver、质量工具
├── bin/                              # gstack 配置、GBrain、同步和辅助 CLI
├── openclaw/                         # OpenClaw prompt artifacts 与原生技能
├── docs/                             # 设计说明、GBrain、OpenClaw、host 扩展文档
├── test/ 和 browse/test/             # 静态验证、E2E、浏览器测试
└── .github/workflows/                # freshness、eval、actionlint、release gates
```

## 核心入口

| 文件 | 作用 |
|---|---|
| [README.md](../../project-repos/gstack/README.md) | 用户定位、安装、技能目录、GBrain 和排障入口 |
| [ARCHITECTURE.md](../../project-repos/gstack/ARCHITECTURE.md) | Browse daemon、安全模型、模板生成、测试架构设计原因 |
| [CLAUDE.md](../../project-repos/gstack/CLAUDE.md) | gstack 自身开发命令、项目结构和开发约束 |
| [setup](../../project-repos/gstack/setup) | 安装、构建、Playwright 校验、技能链接、多宿主 runtime root |
| [scripts/gen-skill-docs.ts](../../project-repos/gstack/scripts/gen-skill-docs.ts) | `.tmpl` 到 `SKILL.md` 的核心生成器 |
| [browse/src/server.ts](../../project-repos/gstack/browse/src/server.ts) | 长期运行的 localhost Browser daemon |
| [browse/src/commands.ts](../../project-repos/gstack/browse/src/commands.ts) | Browse 命令 registry 和 untrusted content 分类 |
| [hosts/index.ts](../../project-repos/gstack/hosts/index.ts) | 多宿主配置注册表 |

## 快速导航

- **想知道 gstack 是什么？** → [项目概览](pages/overview.md)
- **想按用户视角理解命令？** → [技能工作流](pages/skill-workflow.md)
- **想看安装和 Codex/OpenClaw 支持？** → [安装与多宿主接入](pages/setup-and-hosts.md)
- **想理解浏览器 daemon？** → [Browse 运行时](pages/browse-runtime.md)
- **想审安全边界？** → [浏览器安全模型](pages/browser-security.md)
- **想改技能或新增宿主？** → [技能生成系统](pages/skill-generation.md) 与 [贡献、扩展与新增宿主](pages/contributing-extension.md)

## 可继续追问的主题

- `Browse tunnel security`：从双监听器、scoped token、tab ownership 到 CDP allowlist 逐层审查。
- `Host generation drift`：检查 `.tmpl`、generated `SKILL.md`、`.agents/`、`.factory/` 和 OpenClaw artifacts 的一致性。
- `GBrain privacy model`：追踪 allowlist、privacy mode、secret scan、git merge driver 和 restore 流程。
- `Design pipeline`：从 `/design-shotgun` 到 `$D prompt` 和 `/design-html` 的产物边界。

## 技能翻译副本

本次输出检测到源仓库中 50 个真实技能目录，已在 [skills/](skills/) 下生成中文审阅副本；测试金样 `test/fixtures/golden/*-SKILL.md` 未作为技能目录翻译。

## Source

- Repository: https://github.com/garrytan/gstack
- Commit: `454423aeb3d3dafa88d5b57bfbe0ead05569d21e`
- Local source: `/Users/bytedance/workspace/deepwiki/project-repos/gstack`
- Generated output: `/Users/bytedance/workspace/deepwiki/gstack`
