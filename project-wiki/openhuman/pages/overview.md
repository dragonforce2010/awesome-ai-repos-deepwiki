<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [README.md](../../project-repos/openhuman/README.md)
- [Cargo.toml](../../project-repos/openhuman/Cargo.toml)
- [package.json](../../project-repos/openhuman/package.json)

</details>

# 项目概览

大多数 AI 助手在第一次对话时是"冷启动"的：它不知道你的邮件、代码仓库、Slack 频道或昨天的会议记录。OpenHuman 的赌注是——**在几分钟内通过自动同步与本地记忆树，让 Agent 拥有与你工作栈一致的上下文**，而不是等你手工喂插件。

项目定位是 **Personal AI super intelligence**：本地优先的 Memory Tree + Obsidian 风格 Markdown vault，配合托管服务完成账号登录、模型路由、Web 搜索代理与 Composio 集成 OAuth。桌面端用 **React + Tauri v2** 呈现 UI-first 体验，**Rust 核心**承载全部业务逻辑。

**与同类方案的差异**：
- 对比 Hermes / OpenClaw：OpenHuman 强调 **20 分钟 auto-fetch** 周期拉取已连接集成，无需用户反复 prompt。
- 对比纯 Chat 客户端：内置 **TokenJuice** 在工具输出进入 LLM 前做规则化压缩，官方宣称可降 token 成本与延迟。
- 对比插件型 Agent：118+ Composio 集成 + 原生 coder 工具集 + MCP + 语音/Meet Agent 开箱即用。

**规模快照**（commit `225b1da`）：约 4038 个 tracked 文件；Rust 1821、TS 713、TSX 621；单 crate `openhuman` 下 100+ 领域模块；pnpm monorepo + Tauri 多平台壳层。

## 核心能力矩阵

| 能力域 | 关键模块 | 用户可见价值 |
|--------|----------|--------------|
| 记忆 | `memory_tree`, `memory_store` | 本地 SQLite + wiki `.md`，≤3k token 分块 |
| Agent | `agent`, `agent_orchestration` | 多 Agent 编排、工具策略、审批 |
| 推理 | `inference`, `routing` | 云端路由 + Ollama 本地可选 |
| 集成 | `composio`, `integrations` | OAuth 一键连接 Gmail/Notion/GitHub 等 |
| 通道 | `channels` | Telegram/Discord/WhatsApp 等双向消息 |
| 后台 | `subconscious` | 无用户输入时的持续思考与 escalation |
| 压缩 | `tokenjuice` | git/npm/cargo 等工具输出规则化瘦身 |

## 新手阅读路线

1. [系统架构](system-architecture.md) — 三层分工与数据流总览  
2. [Memory Tree 流水线](memory-tree-pipeline.md) — 理解"为什么 Agent 记得住你"  
3. [Agent 编排](agent-orchestration.md) + [工具与 MCP](tools-mcp.md) — 对话如何驱动行动  
4. [安全与隐私](security-privacy.md) — 本地/云端边界  
5. [质量与重构](quality-risks-refactor.md) — 二次开发前必读风险面

## 相关页面

- [系统架构](system-architecture.md)
- [Memory Tree 流水线](memory-tree-pipeline.md)
- [安全与隐私边界](security-privacy.md)

Sources: [README.md:1-80](../../../project-repos/openhuman/README.md#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `README.md:1-80`

````markdown
<h1 align="center">OpenHuman</h1>

<p align="center">
 <img src="./gitbooks/.gitbook/assets/demo.png" alt="The Tet" />
</p>

<p align="center" style="display: inline-block">
	<a href="https://trendshift.io/repositories/23680" target="_blank" style="display: inline-block">
		<img src="https://trendshift.io/api/badge/repositories/23680" alt="tinyhumansai%2Fopenhuman | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/>
	</a>
	<a href="https://www.producthunt.com/products/openhuman?embed=true&amp;utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_campaign=badge-openhuman" target="_blank" rel="noopener noreferrer">
		<img alt="OpenHuman - An open source AI harness built with the human in mind | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=1136902&amp;theme=light&amp;period=daily&amp;t=1778916022823">
		</a>
		<a href="https://www.producthunt.com/products/openhuman?embed=true&amp;utm_source=badge-top-post-badge&amp;utm_medium=badge&amp;utm_campaign=badge-openhuman" target="_blank" rel="noopener noreferrer">
			<img alt="OpenHuman - An open source AI harness built with the human in mind | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=1136902&amp;theme=light&amp;period=weekly&amp;t=1779351403565">
		</a>
</p>
<p align="center" style="display: inline-block">
 <a href="https://www.producthunt.com/products/openhuman?embed=true&amp;utm_source=badge-top-post-topic-badge&amp;utm_medium=badge&amp;utm_campaign=badge-openhuman" target="_blank" rel="noopener noreferrer">
  <img alt="OpenHuman - An open source AI harness built with the human in mind | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=1136902&amp;theme=light&amp;period=weekly&amp;topic_id=268&amp;t=1779351808756">
  </a>
  <a href="https://www.producthunt.com/products/openhuman?embed=true&amp;utm_source=badge-top-post-topic-badge&amp;utm_medium=badge&amp;utm_campaign=badge-openhuman" target="_blank" rel="noopener noreferrer">
   <img alt="OpenHuman - An open source AI harness built with the human in mind | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=1136902&amp;theme=light&amp;period=weekly&amp;topic_id=46&amp;t=1779351808756">
   </a>
 </p>


<p align="center">
 <strong>OpenHuman is your Personal AI super intelligence: local memory, managed services where needed, simple and powerful.</strong>
</p>


<p align="center">
 <a href="https://discord.tinyhumans.ai/">Discord</a> •
 <a href="https://www.reddit.com/r/tinyhumansai/">Reddit</a> •
 <a href="https://x.com/intent/follow?screen_name=tinyhumansai">X/Twitter</a> •
 <a href="https://tinyhumans.gitbook.io/openhuman/">Docs</a> •
 <a href="https://x.com/intent/follow?screen_name=senamakel">Follow @senamakel (Creator)</a>
</p>

<p align="center">
  🇺🇸 <a href="./README.md">English</a> | 🇨🇳 <a href="./README.zh-CN.md">简体中文</a> | 🇯🇵 <a href="./README.ja-JP.md">日本語</a> | 🇰🇷 <a href="./README.ko.md">한국어</a> | 🇩🇪 <a href="./README.de.md">Deutsch</a>
</p>


<p align="center">
 <img src="https://img.shields.io/badge/status-early%20beta-orange" alt="Early Beta" />
 <a href="https://github.com/tinyhumansai/openhuman/releases/latest"><img src="https://img.shields.io/github/v/release/tinyhumansai/openhuman?label=latest" alt="Latest Release" /></a>
 <a href="https://github.com/tinyhumansai/openhuman/stargazers"><img src="https://img.shields.io/github/stars/tinyhumansai/openhuman?style=flat" alt="GitHub Stars" /></a>
 <a href="./LICENSE"><img src="https://img.shields.io/github/license/tinyhumansai/openhuman" alt="License" /></a>
 <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/lang-简体中文-blue" alt="简体中文" /></a>
 <a href="./README.ja-JP.md"><img src="https://img.shields.io/badge/lang-日本語-blue" alt="日本語" /></a>
 <a href="./README.ko.md"><img src="https://img.shields.io/badge/lang-한국어-blue" alt="한국어" /></a>
 <a href="./README.de.md"><img src="https://img.shields.io/badge/lang-Deutsch-blue" alt="Deutsch" /></a>
</p>

> **Early Beta**: Under active development. Expect rough edges.

> **Local + managed services, upfront:** OpenHuman stores its Memory Tree, Obsidian-style Markdown vault, workspace config, and local runtime state on your machine. The default managed experience still uses OpenHuman-hosted services for account sign-in, model routing, web search proxying, and managed integration/OAuth flows through the Composio connector layer. Choose custom/local settings if you want to bring your own model, search, or Composio credentials; some real-time triggers and hosted features still require the managed backend.

# Install

Download installers from [tinyhumans.ai/openhuman](https://tinyhumans.ai/openhuman?utm_source=github&utm_medium=readme) or from the [GitHub Releases](https://github.com/tinyhumansai/openhuman/releases/latest) page. For terminal installs, the native package paths below are preferred — they ride your OS package-manager's signing chain.

## Recommended install (native packages)

These paths verify the artifact through your OS package manager's signing chain (Homebrew bottle hash, signed apt repo, MSI signature).

**macOS (Homebrew tap):**

```bash
brew tap tinyhumansai/core
brew install openhuman
```

**Linux (Debian/Ubuntu — signed apt repo):**

```bash
sudo apt-get install -y --no-install-recommends gnupg2 curl ca-certificates
curl -fsSL https://tinyhumansai.github.io/openhuman/apt/KEY.gpg \
````

<!-- source-snippets:end -->
</details>
