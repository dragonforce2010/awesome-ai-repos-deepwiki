# 🌟 Garden Skills

> 生产就绪的 Agent 辅助技能（Agent Skills）的收集与开发技术维基。

## 📖 项目简介

**Garden Skills** 是一个精心设计与维护的 Agent 技能包仓库，兼容 Claude Code, Cursor, Codex, Gemini 等支持读取 `SKILL.md` 的 AI 运行时。它通过将复杂的开发或操作流程转化为高度细化、边界清晰的方法论与指令包，使 Agent 能够超越简单的 Prompt 交互，在特定领域（如网页视频展示、前端设计工程、复杂图像生图、深潜式知识库检索）产出符合工业级标准、且具有专业风骨的交付物。

有关项目的完整技术脉络和设计，请阅读我们的 [DeepWiki 技术维基](file:///Users/bytedance/workspace/deepwiki/garden-skills/index.md)。

---

## 🗺️ 深度技术文档导航

为了让后续维护团队和合作工程师能够无缝理解、优化整个项目，我们提供了结构完备的技术文档：

* **第一部分：项目概览与定位**
  * [项目概览与核心痛点](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/overview.md) ── 详细剖析大模型应用中的“泛滥 AI 味”、“指令漂移”等硬伤，阐述 Garden 技能设计的核心哲学。
* **第二部分：底层架构与组织机制**
  * [系统架构与组织设计](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/system-architecture.md) ── 解密 monorepo 的极简目录设计、零依赖的构建脚本、以及基于 Tag 的 GitHub Actions 自动发布与 README 链条同步管道。
  * [分发与安装机制](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/distribution-and-installation.md) ── 说明 Agent 如何通过 `npx skills add` 的拉取命令，以及如何配置 Marketplace 完成多端接入。
* **第三部分：核心技能实现原理（Deep-Dive）**
  * [Web 视频制作技能 (web-video-presentation)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/web-video-presentation.md) ── 详解“口播文本作为唯一真理源（narration-first）”的设计、固定比例舞台的 CSS 缩放、以及 provider-agnostic 的 TTS 音频自动化生成流程。
  * [前端设计工程技能 (web-design-engineer)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/web-design-engineer.md) ── 揭秘如何为 AI 注入优秀视觉审美。涵盖“六步构建法”、多风格 Recipe 体系、反 AI Cliché 黑名单及参数化 Tweaks 控制面板。
  * [GPT 图像生成与编辑技能 (gpt-image-2)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/gpt-image-2.md) ── 深度剖析 Mode A/B/C 三种运行时环境自适应机制、70+ 个场景的结构化 Prompt 模板和图像二次编辑与局部遮罩的工作流。
  * [本地知识库检索技能 (kb-retriever)](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/kb-retriever.md) ── 解决 RAG 中超大文件 Token 暴涨的策略。说明分层 data_structure 树状导航、“先学习再处理”的硬性规程和 5 轮迭代控制的检索架构。
* **第四部分：开发与质量保障**
  * [开发与质量保障指南](file:///Users/bytedance/workspace/deepwiki/garden-skills/pages/development-and-quality.md) ── 详解技能生命周期、manifest 配置、零依赖的本地 `validate` 校验机理和多层硬性自检协议。

---

## 🛠️ 快速体验

```bash
# 1. 克隆代码库
git clone https://github.com/ConardLi/garden-skills.git
cd garden-skills

# 2. 列出并校验所有技能 (零依赖)
npm run list
npm run validate
```
更多细节请查阅维基主页 [index.md](file:///Users/bytedance/workspace/deepwiki/garden-skills/index.md)。
