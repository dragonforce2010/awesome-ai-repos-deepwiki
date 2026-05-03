# Huashu Design DeepWiki

> **面向 agent 的 HTML 高保真设计 skill：用自然语言驱动原型、幻灯片、动画、视频导出、设计方向顾问和专家评审。**

## 目录导航

| 分区 | 页面 | 重要性 | 内容简介 |
|------|------|--------|----------|
| 概览 | [项目概览](pages/overview.md) | high | 仓库定位、交付能力、目录地图与阅读路线。 |
| 系统架构 | [Skill 编排与主提示词](pages/skill-orchestration.md) | high | 解释 SKILL.md 如何把事实验证、资产协议、工作流和任务路由组织成 agent 行为。 |
| 系统架构 | [Starter Components 架构](pages/starter-components.md) | high | 说明 assets 下的动画、幻灯片、设备边框和变体画布组件边界。 |
| 核心功能 | [Design Context 与核心资产协议](pages/design-context-assets.md) | high | 解析从已有上下文出发、事实验证和品牌/产品资产采集的硬流程。 |
| 核心功能 | [设计方向顾问与风格库](pages/fallback-design-styles.md) | high | 覆盖需求模糊时的 Fallback 模式、20 种设计哲学和 24 个 showcase。 |
| 核心功能 | [原型、Tweaks 与验证闭环](pages/prototypes-tweaks-verification.md) | medium | 说明移动原型交付形态、Tweaks localStorage 模式和 Playwright 验证。 |
| 交付管线 | [幻灯片、PDF 与可编辑 PPTX 管线](pages/slide-deck-pptx.md) | high | 解释 HTML-first deck 架构、PDF/PPTX 分支和 html2pptx 的约束。 |
| 交付管线 | [Motion、视频导出与音频系统](pages/motion-video-audio.md) | high | 覆盖 Stage/Sprite 时间轴、Playwright 录制、MP4/GIF 派生、BGM+SFX 双轨。 |
| 质量与分发 | [工作流、质量门与测试提示](pages/workflow-quality.md) | medium | 整理 Junior Designer 检查点、反 AI slop、异常处理和测试 prompt。 |
| 质量与分发 | [仓库资产、分发边界与授权](pages/repository-assets-license.md) | medium | 总结仓库静态资产、忽略规则、个人素材隐私和个人使用许可证。 |

## 仓库快照

```text
huashu-design/
├── SKILL.md                 # Agent 读取的主规则与任务路由
├── README.md / README.en.md # 用户侧介绍与安装说明
├── assets/                  # Starter Components、showcases、BGM/SFX、素材模板
├── references/              # 按任务深入读取的规则文档
├── scripts/                 # HTML 验证、视频、PDF、PPTX 导出工具
├── demos/                   # 能力演示 HTML
├── test-prompts.json        # 行为样例与人工测试提示
└── LICENSE                  # Personal Use License
```

## 核心入口

| 文件 | 作用 |
|---|---|
| `SKILL.md` | skill 的 frontmatter、触发词、核心原则、工作流和 references 路由 |
| `references/workflow.md` | Junior Designer 工作流、问题模板、variations 与交付总结规则 |
| `references/slide-decks.md` | HTML-first 幻灯片架构与 PDF/PPTX 决策树 |
| `assets/animations.jsx` | Stage/Sprite 时间轴动画引擎 |
| `assets/deck_index.html` | 多文件 HTML deck 聚合器 |
| `scripts/render-video.js` | Playwright recordVideo 到 MP4 的导出脚本 |
| `scripts/html2pptx.js` | DOM 到 PowerPoint 原生对象的转换器 |

## 快速导航

- **想了解项目是什么？** → 阅读 [项目概览](pages/overview.md)
- **想维护主提示词？** → 阅读 [Skill 编排与主提示词](pages/skill-orchestration.md)
- **想理解可复用组件？** → 阅读 [Starter Components 架构](pages/starter-components.md)
- **想做 deck/PPTX？** → 阅读 [幻灯片、PDF 与可编辑 PPTX 管线](pages/slide-deck-pptx.md)
- **想做动画和视频？** → 阅读 [Motion、视频导出与音频系统](pages/motion-video-audio.md)
- **想审查质量和授权？** → 阅读 [工作流、质量门与测试提示](pages/workflow-quality.md) 与 [仓库资产、分发边界与授权](pages/repository-assets-license.md)

## 可继续追问的主题

- `SKILL.md` 的规则优先级：适合追问事实验证、资产协议和检查点之间的关系。
- `html2pptx.js` 的限制：适合追问为什么可编辑 PPTX 需要牺牲部分 Web 视觉能力。
- `animations.jsx` 与 `render-video.js` 的录制协议：适合追问 `__ready`、`__recording`、loop 和 trim 的协作方式。
- `references/design-styles.md` 与 `assets/showcases/INDEX.md`：适合追问如何扩展新的设计哲学或 showcase。

## Source Note

- Source: `https://github.com/alchaincyf/huashu-design`
- Commit: `23f60d9b4304f20851469987c6e2c92242b94a45`
- Local source: `/Users/bytedance/workspace/deepwiki/project-repos/huashu-design`
