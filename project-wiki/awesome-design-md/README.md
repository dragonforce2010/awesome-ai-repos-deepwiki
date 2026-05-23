# awesome-design-md DeepWiki

> **这是 VoltAgent 维护的一套「可复制的品牌视觉语言文档库」：把 71 个真实网站的 UI 提炼成 AI 代理能直接阅读的 `DESIGN.md`，解决「让 agent 做页面却像随机 Bootstrap」这一痛点——无需 Figma 导出、JSON schema 或专用解析器。**

## 源码快照

| 字段 | 值 |
|------|-----|
| 仓库 | [https://github.com/voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md) |
| 记录提交 | `3883984baf05226208a5dae15730a3593548b808` |
| Wiki 生成日 | `2026-05-23` |

## 目录导航

| 分区 | 页面 | 内容简介 |
|------|------|----------|
| 概览 | [项目概览](pages/overview.md) | DESIGN.md 概念、与 AGENTS.md 分工、仓库定位 |
| 概览 | [目录与仓库结构](pages/catalog-architecture.md) | `design-md/<slug>/` 约定、静态内容模型 |
| DESIGN.md 格式 | [DESIGN.md 文档格式](pages/design-md-format.md) | YAML 机器层 + Markdown 叙事层 |
| DESIGN.md 格式 | [Token 与组件模型](pages/token-component-model.md) | `{colors.*}` 引用与组件 token 表 |
| 品牌目录 | [品牌目录与分类](pages/brand-catalog.md) | 71 品牌、九大主题分类 |
| 品牌目录 | [品牌档案深度对比](pages/brand-profile-examples.md) | Vercel / Voltagent / Notion 对照 |
| 使用与生态 | [代理消费工作流](pages/agent-consumption.md) | 复制、提示词、与 AGENTS.md 协同 |
| 使用与生态 | [分发与 getdesign.md 生态](pages/distribution-ecosystem.md) | 托管预览、Issue 请求流程 |
| 使用与生态 | [贡献与治理](pages/contributing-governance.md) | 贡献限制、MIT 与免责声明 |

## 仓库全景

```text
awesome-design-md/
├── README.md                          # 品牌目录索引 + DESIGN.md 概念说明
├── CONTRIBUTING.md                    # 贡献规则（不接受新 DESIGN.md PR）
├── LICENSE                            # MIT + 视觉身份免责声明
├── .github/
│   ├── ISSUE_TEMPLATE/design-md-request.yml
│   └── FUNDING.yml
└── design-md/                         # 71 个品牌子目录
    ├── vercel/
    │   ├── DESIGN.md                  # 完整设计系统（YAML + Markdown）
    │   └── README.md                  # 指向 getdesign.md 预览
    ├── voltagent/
    ├── stripe/
    └── …                              # 每品牌一个 slug 目录
```

## 核心入口

| 文件 | 为什么重要 |
|------|------------|
| [README.md](../../../project-repos/awesome-design-md/README.md) | 定义 DESIGN.md 概念、71 品牌分类索引、使用三步法 |
| [design-md/vercel/DESIGN.md](../../../project-repos/awesome-design-md/design-md/vercel/DESIGN.md) | 最完整的双轨格式范例（700+ 行 YAML token + 叙事章节） |
| [design-md/voltagent/DESIGN.md](../../../project-repos/awesome-design-md/design-md/voltagent/DESIGN.md) | 维护方自家品牌档案，dark-first + emerald accent |
| [CONTRIBUTING.md](../../../project-repos/awesome-design-md/CONTRIBUTING.md) | 明确「不接受新 DESIGN.md PR」的质量治理策略 |
| [.github/ISSUE_TEMPLATE/design-md-request.yml](../../../project-repos/awesome-design-md/.github/ISSUE_TEMPLATE/design-md-request.yml) | 社区请求新品牌的结构化入口 |

## 你想了解什么？

- **DESIGN.md 到底是什么、和 AGENTS.md 怎么分工？** → [项目概览](pages/overview.md)
- **每份文件内部长什么样？YAML 和 Markdown 各管什么？** → [DESIGN.md 文档格式](pages/design-md-format.md)
- **`{colors.primary}` 这种引用怎么串起来？** → [Token 与组件模型](pages/token-component-model.md)
- **我想让 Cursor/Claude 照着 Stripe 风格做 landing page** → [代理消费工作流](pages/agent-consumption.md)
- **README 里链到 getdesign.md 是什么意思？** → [分发与 getdesign.md 生态](pages/distribution-ecosystem.md)

## 可继续追问的主题

- **`preview.html` 去哪了？** README 承诺每站有 preview，但 Git 仓库当前只保留 `DESIGN.md` + 短 README；可视化预览托管在 getdesign.md。
- **为什么 CONTRIBUTING 拒绝新 DESIGN.md PR？** 质量与法律风险由维护方集中把控，社区只能修正现有条目。
- **Stitch 官方格式 vs 本库扩展** README 列 9 个章节，部分文件还含 `Responsive Behavior` / `Agent Prompt Guide` 等扩展节。

## 单文件导出

完整合并版见 [`exports/full-wiki.md`](exports/full-wiki.md)。
