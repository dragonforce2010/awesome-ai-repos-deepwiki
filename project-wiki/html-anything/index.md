# html-anything DeepWiki

欢迎阅读 `html-anything` 深度技术 Wiki。本项目基于大模型（Agent）时代的“以 HTML 直接交付代替 Markdown 过程产物”的设计哲学，构建了本地优先、零 Key 复用、精美排版的前端流式渲染与多端导出发布生态。

本技术 Wiki 将深入该项目的源码实现，解密其多进程探测与 stdio/NDJSON 管道通信适配、Zustand 状态持久化、SSE 流式沙箱预览以及多端（微信/知乎/Twitter）一键发布导出的核心技术原理。

---

## 📖 技术章节导航

### 1. 项目概览
- **[项目概览](pages/overview.md)**：探讨多窗口切换痛点，构建 9 类输出场景的描述，并梳理 Wiki 整体的阅读路线。

### 2. 进程协作与适配
- **[系统架构与进程协作模型](pages/system-architecture.md)**：分析 Next.js 宿主、Server 路由和本地 Agent CLI 三层进程模型，解析双向 stdio 管道及 SSE 队列设计。
- **[本地 Agent 探测与路径扫描](pages/agent-detection.md)**：解密 `userToolchainDirs` 启发式目录探测机制，突破 GUI 启动环境变量丢失限制自动扫描 8 种 coding-agent CLI。
- **[Agent Argv 组装与流式 NDJSON 翻译协议](pages/agent-adapter-protocol.md)**：探讨不同协议下的 argv 组装，详解 `rescueHtmlFromToolUse` 机制与 `ParseState` 乱流去重状态机。

### 3. 模板与流式渲染
- **[去 AI-slop 模板与 Skills 约束机制](pages/templates-skills.md)**：深度剖析 75 套内置 Skills 模板管理，探讨如何通过中西文字体、基线网格和去AI化硬编码视觉规范规避 LLM 自由排版错误。
- **[SSE 流式管道与沙箱实时预览](pages/streaming-rendering.md)**：分析基于 EventSource 的 SSE 流式响应，探讨 sandboxed iframe 实时注入 srcdoc 并确保本地安全的预览机制。

### 4. 导出发布与工程化
- **[多端一键发布与导出机制](pages/export-publish.md)**：详解微信公众号 juice 样式内联、推特 clipboardItem 2x PNG 截图、知乎公式图占位等导出细节技术实现。
- **[Next.js 路由与本地配置持久化](pages/websetup-deployment.md)**：分析 Settings 页面配置持久化和本地目录状态数据存储结构。
- **[E2E 浏览器测试与 Playwright 自动化验证](pages/testing-ci-pipeline.md)**：分析 monorepo 下 `@html-anything/e2e` 包和 CI 中 Playwright 的自动化校验套件。

---

## 🗂 交付汇总与快速入口

- **全站单文件导出**：[exports/full-wiki.md](exports/full-wiki.md)
- **翻译的 Skills 本地定义**：[skills/](skills/) 包含 8 套置顶推荐 Skills 的详细 Prompt 定义与硬约束。
