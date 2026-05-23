<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.zh-CN.md](../../../project-repos/html-anything/README.zh-CN.md)
- [README.md](../../../project-repos/html-anything/README.md)

</details>

# 项目概览

在以大语言模型（LLM）为代表的 Coding Agent 时代，人机协作开发的方式正在经历深刻的变化。传统的 Markdown 格式主要是给创作者编写草稿或编写轻量文档时使用的中间格式，而用户最终阅读、发布和消费的实际上是更加美观、排版自由且极具交互性的 HTML 页面。

`html-anything` 是一款专为 Agent 时代打造的**本地优先、零配置、精美排版**的 HTML 编辑器系统。它通过自动识别并复用本地的 8 种 Coding-agent CLI（如 Claude Code, Cursor Agent, Codex 等），配合 75 套精细设计的“去 AI-slop 化”视觉 Skills 模板，能够在 30 秒内将 Markdown、CSV、Excel、JSON、SQL 等任意输入自动编译成高度美观、即刻交付的多端 HTML 页面，并提供微信公众号、Twitter (X)、知乎、高清图片等一键导出能力，为内容创作者与开发者提供了前所未有的流式人机协作排版体验。

## 能力全景

- **本地 Agent 免 Key 探测与复用**：深度复用本地已经登录过的 CLI 会话（如 `claude login` 等），实现零边际 API token 消耗成本。
- **SSE 流式实时渲染与沙箱隔离**：配合 SSE（Server-Sent Events）将本地 Agent 进程的 stdout 实时推送至前端，利用 sandboxed iframe 安全渲染预览，提供“看着 AI 现场写代码”的动态交互。
- **硬编码视觉去 AI-slop 约束**：内置 75 套 Skill 模板，在 Prompt 中强制约束 8px 物理基线网格、中文SC/英文字体栈、对比度 >= 4.5 与真实数据输出，杜绝 AI 自由发挥导致的粗糙感。
- **一键多端适配导出**：使用样式内联库 `juice` 适配公众号粘贴，支持 2x PNG 截图载入剪贴板发布至 Twitter/小红书，并提供 LaTeX 公式占位符对知乎进行兼容性导出。

## 9 类输出场景

在主界面中，系统将 Skills 模板归集为 9 类，涵盖常见的内容交付与展示场景：
1. **杂志文章**：精美排版与配色的长图文 editorial 样式。
2. **Keynote PPT**：以 slide-canvas 驱动的网页幻灯片。
3. **极简简历**：极具纸感质地与排版逻辑的 A4 简历。
4. **营销海报**：用于社交传播的巨字 Serif headline 报纸风海报。
5. **小红书图文卡**：专为移动端社交排版优化的 pastel 多色背景图文卡。
6. **推特分享卡**：小巧紧凑的社交图表与引用金句卡。
7. **Web 产品原型**：Brutalist 粗犷风或 Soft 柔和风的 SaaS 仪表盘、Landing 落地页。
8. **数据可视化报告**：精细的图表对比与数据面板。
9. **Hyperframes 视频**：兼容 Remotion 规范的多帧时序视频脚本。

## 阅读推荐路线

为了深入掌握 `html-anything` 的技术架构，推荐您按以下路线深入阅读：
- **核心架构与通信**：查阅 [系统架构与进程协作模型](system-architecture.md) 了解 Node.js 服务与本地 CLI 的双向 stdin/stdout 通信机制。
- **Agent 本地扫描**：阅读 [本地 Agent 探测与路径扫描](agent-detection.md) 了解它是如何冲破 GUI 环境变量限制探测 CLI 路径的。
- **流式渲染与沙箱**：跳转到 [SSE 流式管道与沙箱实时预览](streaming-rendering.md) 学习 ReadableStream 组装与 iframe 安全渲染。
- **硬编码 Prompt 规则**：阅读 [去 AI-slop 模板与 Skills 约束](templates-skills.md) 领悟设计约束的工程落地。

Sources: [README.zh-CN.md:1-84](../../../project-repos/html-anything/README.zh-CN.md#L1-L84)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.zh-CN.md:1-84`

```markdown
# HTML Anything

<p align="center"><sub>来自 <a href="https://github.com/nexu-io/open-design"><b>Open Design</b></a> 团队 —— <b>40k★ · 200+ 贡献者</b>,更生产级、迭代更快。html-anything 是聚焦在 agent 时代 HTML 编辑器这一刀的专项; 如果你喜欢这个味道, 同一拨人做的 <a href="https://github.com/nexu-io/open-design">Open Design</a> 是它在更大规模上的形态, 顺手也看看。</sub></p>

<p align="center"><b>项目主页:</b> <a href="https://open-design.ai/html-anything/"><b>open-design.ai/html-anything/</b></a> —— 不用 clone 也能先看看 HTML Anything 长什么样、能干啥。</p>

> **Markdown 是草稿, HTML 才是给人读的成品 —— 让本地 agent 直接写 HTML。** Agent 时代的 HTML 编辑器 —— 既然你已经不亲手改文档、全都让 Claude 改了, 那 agent 的输出就该是读者真正想看的 HTML, 而不是中间态的 markdown。本地优先、零 API Key、复用你已经登录好的 CLI session —— **8 个 coding-agent CLI** 在 `PATH` 上自动识别（Claude Code · Cursor Agent · Codex · Gemini CLI · GitHub Copilot CLI · OpenCode · Qwen Coder · Aider），驱动 **75 套 skill 模板** 和 **9 类可交付场景**（杂志文章 · Keynote PPT · 简历 · 海报 · 小红书 · 推特卡 · Web 原型 · 数据报告 · Hyperframes 视频）。一键复制到公众号 / 推特 / 知乎，或者下载 `.html` / `.png`。

<p align="center">
  <img src="docs/assets/banner.png" alt="HTML Anything — agent 时代的 HTML 编辑器，在你的笔记本上" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square" /></a>
  <a href="#-自动识别本地-agent"><img alt="Agents" src="https://img.shields.io/badge/agents-8%20CLIs-black?style=flat-square" /></a>
  <a href="#-skills"><img alt="Skills" src="https://img.shields.io/badge/skills-75-orange?style=flat-square" /></a>
  <a href="#一键发布到平台"><img alt="Export" src="https://img.shields.io/badge/export-WeChat%20%C2%B7%20X%20%C2%B7%20Zhihu%20%C2%B7%20PNG-9b59b6?style=flat-square" /></a>
  <a href="#-30-秒上手"><img alt="Quickstart" src="https://img.shields.io/badge/quickstart-30%20seconds-green?style=flat-square" /></a>
  <a href="#架构"><img alt="No API key" src="https://img.shields.io/badge/no-API%20key%20required-ff6b35?style=flat-square" /></a>
</p>

<!-- 本项目站在 nexu-io/open-design 的肩膀上 — 下面这一行的社群标签都指向它,顺道带流量。 -->
<p align="center">
  <a href="https://discord.gg/keeVPMrueT"><img alt="Discord（html-anything）" src="https://img.shields.io/badge/discord-html--anything-5865f2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://x.com/nexudotio"><img alt="X 关注 @nexudotio" src="https://img.shields.io/badge/follow-%40nexudotio-000000?style=flat-square&logo=x&logoColor=white" /></a>
  <a href="https://github.com/nexu-io/open-design/releases/latest"><img alt="open-design 最新版本" src="https://img.shields.io/github/v/release/nexu-io/open-design?style=flat-square&label=release&color=8e44ad" /></a>
  <a href="https://github.com/nexu-io/open-design/graphs/commit-activity"><img alt="open-design 月提交数" src="https://img.shields.io/github/commit-activity/m/nexu-io/open-design?style=flat-square&label=commits%2Fmonth&color=f39c12" /></a>
  <a href="#-看看效果"><img alt="设计系统" src="https://img.shields.io/badge/design%20systems-9-1abc9c?style=flat-square" /></a>
  <a href="https://github.com/nexu-io/open-design"><img alt="基于 open-design" src="https://img.shields.io/badge/built%20on-nexu--io%2Fopen--design-ff7043?style=flat-square&logo=github&logoColor=white" /></a>
</p>

<p align="center"><a href="README.md">English</a> · <b>简体中文</b></p>

---

## 🎨 看看效果

picker 顶部 **推荐 / Featured** 分组里默认置顶的 8 个 skill —— 对应 `SKILL.md` frontmatter 里的 `recommended:` 字段,数字越小排得越靠前。每个都附 `example.html`,repo 里双击就能看效果,不用登录、不用启服。

<table>
<tr>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/deck-guizang-editorial/"><img src="docs/screenshots/skills/deck-guizang-editorial.png" alt="deck-guizang-editorial" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/deck-guizang-editorial/"><code>deck-guizang-editorial</code></a></b> · <i>deck</i> · <code>recommended: 1</code><br/>编辑墨水 PPT,灵感来自 <a href="https://github.com/op7418/guizang-ppt-skill"><code>op7418/guizang-ppt-skill</code></a> —— 10 套锁死版面 × 5 套调色板(墨水 / 靛蓝瓷 / 森林墨 / 牛皮纸 / 沙丘),纸感印刷质感,开起来像一本电子杂志而不是 PPT。</sub>
</td>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/deck-swiss-international/"><img src="docs/screenshots/skills/deck-swiss-international.png" alt="deck-swiss-international" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/deck-swiss-international/"><code>deck-swiss-international</code></a></b> · <i>deck</i> · <code>recommended: 2</code><br/>瑞士国际主义 PPT —— 16 列网格 + 单一饱和 accent(Klein Blue / Lemon / Mint / Safety Orange),22 套锁死版面。冷静、理性、学院派,开会时让人觉得 "这一定是 designer 做的"。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/doc-kami-parchment/"><img src="docs/screenshots/skills/doc-kami-parchment.png" alt="doc-kami-parchment" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/doc-kami-parchment/"><code>doc-kami-parchment</code></a></b> · <i>doc</i> · <code>recommended: 3</code><br/>暖羊皮纸 + 墨蓝单色 editorial 文档系统,灵感来自 <a href="https://github.com/tw93/kami"><code>tw93/kami</code></a>。<code>#f5f4ed</code> 底色 + 单一衬线字体,长报告、读书笔记、one-pager、简历都能套,比纯白 markdown 高一个量级。</sub>
</td>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/magazine-poster/"><img src="docs/screenshots/skills/magazine-poster.png" alt="magazine-poster" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/magazine-poster/"><code>magazine-poster</code></a></b> · <i>poster</i> · <code>recommended: 4</code><br/>报纸风长图海报 —— 巨字 serif headline + 双栏正文 + 6 个编号小节 + cream 纸感底色,开起来像一份印好的 Sunday paper,不是网页。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/video-hyperframes/"><img src="docs/screenshots/skills/video-hyperframes.png" alt="video-hyperframes" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/video-hyperframes/"><code>video-hyperframes</code></a></b> · <i>frame / video</i> · <code>recommended: 5</code><br/>Hyperframes / Remotion 兼容的视频脚本 —— 6–10 个连续 <code>1920×1080</code> 帧,自带 duration / transition 注释和自动播放脚本。直接交给 <a href="https://github.com/heygen-com/hyperframes"><code>heygen-com/hyperframes</code></a> 或 Remotion 渲 <code>.mp4</code>。</sub>
</td>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/frame-glitch-title/"><img src="docs/screenshots/skills/frame-glitch-title.png" alt="frame-glitch-title" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/frame-glitch-title/"><code>frame-glitch-title</code></a></b> · <i>frame</i> · <code>recommended: 6</code><br/>故障艺术标题帧 —— cyan / magenta 像散偏移 + CRT 扫描线 + 数据腐败副标 + 角落 ASCII 噪点。Cyberpunk hero 或视频转场用。</sub>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/vfx-text-cursor/"><img src="docs/screenshots/skills/vfx-text-cursor.png" alt="vfx-text-cursor" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/vfx-text-cursor/"><code>vfx-text-cursor</code></a></b> · <i>vfx</i> · <code>recommended: 7</code><br/>VFX 文字光标开场 —— 光标在画布上"打字",每个字带 hot pink × cyan 像散拖尾 + 定向光斑。丢一句金句进去,就是电影级的视频片头。</sub>
</td>
<td width="50%" valign="top">
<a href="next/src/lib/templates/skills/frame-logo-outro/"><img src="docs/screenshots/skills/frame-logo-outro.png" alt="frame-logo-outro" /></a><br/>
<sub><b><a href="next/src/lib/templates/skills/frame-logo-outro/"><code>frame-logo-outro</code></a></b> · <i>frame</i> · <code>recommended: 8</code><br/>品牌 Logo 收尾帧 —— Logo 分块装配 + glow bloom + tagline 上浮 + CTA。产品发布或品牌片的片尾闭幕镜头。</sub>
</td>
</tr>
</table>

完整 skill 目录(按 mode 分类)见下方 [🎨 Skills](#-skills) 章节。

```

<!-- source-snippets:end -->
</details>
