# stitch-design-cli DeepWiki

> **面向 Agent 与脚本的 Google Stitch 官方 SDK 封装 CLI：可预测的 JSON 信封、鉴权与 stderr 纪律，映射到远程 Stitch MCP。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览与定位 | [项目概览](pages/overview.md) | high | 动机、边界、与官方平台关系 |
| 概览与定位 | [系统架构与模块边界](pages/system-architecture.md) | high | `src/` 分层与依赖方向 |
| 运行时与集成 | [CLI 命令面](pages/cli-commands.md) | high | Commander 子命令与工具映射 |
| 运行时与集成 | [认证与配置解析](pages/auth-and-config.md) | high | 配置合并、文件路径、OAuth 规则 |
| 运行时与集成 | [Stitch SDK 适配层](pages/stitch-sdk-layer.md) | high | `StitchToolClient` 与 `Stitch` 包装 |
| 契约、数据与工程化 | [JSON 契约与错误模型](pages/json-output-and-errors.md) | high | 信封、退出码、`makeError` |
| 契约、数据与工程化 | [响应归一化与屏幕变更结果](pages/normalization-pipeline.md) | medium | `normalize.ts` 与 `followUp` |
| 契约、数据与工程化 | [测试、CI 与发布](pages/testing-ci-release.md) | medium | GitHub Actions、gitleaks、npm publish |
| 契约、数据与工程化 | [Agent Skill 与运维提示](pages/agent-skill.md) | medium | `SKILL.md` 与 Trusted Publishing 备注 |

## 仓库快照

```text
stitch-design-cli/
├── .github/workflows/
├── docs/
├── scripts/
├── src/
├── test/
├── package.json
├── README.md
├── SKILL.md
└── docs/CONTRACT_V1.md
```

## 快速导航

- **想了解项目定位与 v1 边界？** → [项目概览](pages/overview.md)
- **想从源码理解执行流？** → [系统架构与模块边界](pages/system-architecture.md)
- **想查子命令与官方工具对应？** → [CLI 命令面](pages/cli-commands.md)
- **想集成 `--json` 解析或错误码？** → [JSON 契约与错误模型](pages/json-output-and-errors.md)

## 核心入口

| 文件 | 作用 |
|------|------|
| [src/cli.ts](../../project-repos/stitch-design-cli/src/cli.ts) | Commander 入口与子命令实现 |
| [src/config.ts](../../project-repos/stitch-design-cli/src/config.ts) | 配置读写与 env 合并 |
| [src/stitch-client.ts](../../project-repos/stitch-design-cli/src/stitch-client.ts) | SDK 客户端工厂 |
| [src/normalize.ts](../../project-repos/stitch-design-cli/src/normalize.ts) | 响应归一化与 follow-up 命令 |
| [src/output.ts](../../project-repos/stitch-design-cli/src/output.ts) | JSON 信封与错误归一化 |
| [docs/CONTRACT_V1.md](../../project-repos/stitch-design-cli/docs/CONTRACT_V1.md) | 机器可读行为契约 |

## 可继续追问的主题

- **`screen variants` 与列表延迟**：结合 [响应归一化与屏幕变更结果](pages/normalization-pipeline.md) 与 `docs/CONTRACT_V1.md` 中的 `notes` / `followUp` 字段，追问「如何写稳健的轮询重试策略而不误伤仍在生成的屏幕」。
- **CI 与 npm pack 公共面**：阅读 [测试、CI 与发布](pages/testing-ci-release.md) 与 `scripts/public-surface-check.mjs` 全文，评估是否要把新的敏感文件模式纳入阻断规则。

## 源与生成信息

- **上游仓库**：https://github.com/danielgwilson/stitch-design-cli
- **分析提交**：`71e62a260313d7e3030f2d6a17067c455c7f4873`
- **本地克隆**：`/Users/bytedance/workspace/deepwiki/project-repos/stitch-design-cli`
- **本 DeepWiki 输出根**：`/Users/bytedance/workspace/deepwiki/project-wiki/stitch-design-cli`

## Agent Skill 中文副本

仓库根 `SKILL.md` 的中文翻译位于 [skills/stitch/SKILL.md](skills/stitch/SKILL.md)。

## 单文件导出

合并版见 [exports/full-wiki.md](exports/full-wiki.md)。
