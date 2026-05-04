# openclaw-lark DeepWiki

> **OpenClaw 官方飞书/Lark 频道插件**：在 OpenClaw 中以 `feishu` 频道接入飞书消息，并注册 IM/文档/多维表格/日历/任务等工具族。

## 源码快照

- **仓库**：https://github.com/larksuite/openclaw-lark
- **分析提交**：`a584cc5e387983bb6ef38dab1f97c9d9e6bba9f1`（`main`）

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 定位、能力表、Node/OpenClaw 版本要求、官方使用指南链接 |
| 架构与集成 | [系统架构](pages/system-architecture.md) | high | `index.ts` 分层、`ChannelPlugin` 与工具注册关系 |
| 架构与集成 | [OpenClaw 插件注册与运行时](pages/plugin-openclaw-integration.md) | high | `register()`、`before_tool_call`/`after_tool_call`、CLI 与诊断 |
| 架构与集成 | [频道契约、能力与配置](pages/channel-capabilities-config.md) | high | 配对、目录、threading、`FEISHU_CONFIG_JSON_SCHEMA` |
| 消息链路 | [入站消息七阶段流水线](pages/inbound-seven-stage-pipeline.md) | high | `handler.ts` 编排、`gate.ts` 策略、`dispatch.ts` |
| 消息链路 | [出站回复、卡片与流式输出](pages/outbound-reply-cards.md) | high | `send`/`deliver`、`reply-dispatcher`、工具调用追踪 |
| 工具与协议 | [飞书工具面：OAPI、MCP 文档与交互](pages/feishu-tools-surface.md) | high | OAPI 索引、MCP Doc、OAuth、`AskUserQuestion` |
| 安全与治理 | [安全策略与多账号隔离](pages/security-and-governance.md) | high | 群/发送者两层模型、`checkMultiAccountIsolation`、README 风险 |
| 技能与交付物 | [随包技能与文档资产](pages/bundled-skills.md) | medium | `skills/` 与 `openclaw.plugin.json` 的 `skills` 字段 |
| 测试与发布 | [测试、CI 与质量门禁](pages/testing-ci-and-quality.md) | medium | `pnpm` CI、Vitest、`tsdown` 构建 |

## 仓库快照

```text
openclaw-lark/
├── bin/openclaw-lark.js
├── index.ts
├── openclaw.plugin.json
├── package.json
├── skills/
├── src/
│   ├── card/
│   ├── channel/
│   ├── commands/
│   ├── core/
│   ├── messaging/
│   └── tools/
└── tests/
```

## 核心入口

| 路径 | 作用 |
|------|------|
| [index.ts](../project-repos/openclaw-lark/index.ts) | 插件 `default export`：注册频道、工具、事件与 `feishu-diagnose` CLI |
| [src/channel/plugin.ts](../project-repos/openclaw-lark/src/channel/plugin.ts) | `feishuPlugin`：`ChannelPlugin` 全量契约实现 |
| [src/messaging/inbound/handler.ts](../project-repos/openclaw-lark/src/messaging/inbound/handler.ts) | 入站七阶段流水线编排 |
| [src/messaging/inbound/dispatch.ts](../project-repos/openclaw-lark/src/messaging/inbound/dispatch.ts) | Agent 分发、系统命令与评论目标等特殊路径 |
| [src/tools/oapi/index.ts](../project-repos/openclaw-lark/src/tools/oapi/index.ts) | 全部直连飞书 OAPI 的工具注册入口 |

## 快速导航

- **想了解项目定位与风险** → [项目概览](pages/overview.md)
- **想从架构图开始读** → [系统架构](pages/system-architecture.md)
- **想理清工具从哪注册** → [飞书工具面：OAPI、MCP 文档与交互](pages/feishu-tools-surface.md)
- **想查群聊门禁与多租户** → [安全策略与多账号隔离](pages/security-and-governance.md)
- **想对照随包 Skill** → 本目录下 [skills/](skills/feishu-bitable/SKILL.md) 与 [随包技能与文档资产](pages/bundled-skills.md)

## 可继续追问的主题

- **「消息从飞书事件到 Agent」完整时序**：从 [入站消息七阶段流水线](pages/inbound-seven-stage-pipeline.md) 跟到 [出站回复、卡片与流式输出](pages/outbound-reply-cards.md)，再结合 `src/card/reply-dispatcher.ts`。
- **「feishu_ 工具命名与覆盖范围」**：以 [飞书工具面](pages/feishu-tools-surface.md) 为索引，下钻 `src/tools/oapi/**` 与 `src/tools/mcp/doc/**`。
- **「多飞书租户 + 多账号」隔离是否与 OpenClaw 配置一致**：阅读 [安全策略与多账号隔离](pages/security-and-governance.md) 中的 `session.dmScope` 与 `bindings` 相关说明。
