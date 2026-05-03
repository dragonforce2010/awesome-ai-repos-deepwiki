# 项目概览

<details>
<summary>相关源码文件</summary>

- [README.md](https://github.com/Panniantong/Agent-Reach/blob/17624268/README.md)
- [CLAUDE.md](https://github.com/Panniantong/Agent-Reach/blob/17624268/CLAUDE.md)
- [pyproject.toml](https://github.com/Panniantong/Agent-Reach/blob/17624268/pyproject.toml)
</details>

# 👁️ Agent Reach — 项目概览

## 项目定位

**一句话描述：** 给你的 AI Agent 一键装上互联网能力。

Agent Reach 是一个 **Python CLI 安装器 + 诊断工具**，不是 wrapper 层。安装完成后，Agent 直接调用上游工具（twitter-cli、yt-dlp、gh CLI 等），无需经过 Agent Reach 的封装。

**源码：** `agent_reach/cli.py`（CLI入口）、`agent_reach/core.py`（核心类）、`agent_reach/doctor.py`（诊断引擎）

```mermaid
graph LR
    User["用户 / AI Agent"] -->|pip install + agent-reach install| AR[Agent Reach CLI]
    AR -->|安装上游工具| Upstream["twitter-cli / yt-dlp / gh CLI / ... "]
    Upstream -->|直接调用| Platform["Twitter / YouTube / GitHub / ..."]
```

## 核心价值主张

| 痛点 | Agent Reach 解决方案 |
|------|-------------------|
| 每个平台 API 配置繁琐 | 一句话安装：`agent-reach install --env=auto` |
| Cookie 认证流程复杂 | Cookie-Editor 浏览器导出 → 发给 Agent 即可 |
| 平台封禁/反爬不断变化 | 底层工具（yt-dlp、twitter-cli等）持续追踪更新 |
| 部署在服务器上缺代理 | 自动识别服务器环境，给出代理建议 |
| 不知道哪个渠道通了 | `agent-reach doctor` 一键诊断 |

## 支持的平台（16个）

| 平台 | 零配置 | 需配置 | 认证方式 | 底层工具 |
|------|--------|--------|----------|---------|
| 🌐 网页 | ✅ | — | 无 | Jina Reader |
| 📺 YouTube | ✅ | — | 无 | yt-dlp |
| 📡 RSS | ✅ | — | 无 | feedparser |
| 🔍 全网搜索 | — | ✅ | MCP (Exa, 免费) | mcporter + Exa |
| 📦 GitHub | ✅ 公开 | ✅ 私有 | Token | gh CLI |
| 🐦 Twitter/X | ✅ 读单条 | ✅ 搜索/发推 | Cookie | twitter-cli |
| 📺 B站 | ✅ 本地 | ✅ 服务器 | 代理 | yt-dlp |
| 📖 Reddit | ✅ 搜索+阅读 | ✅ Cookie | rdt-cli | |
| 📕 小红书 | — | ✅ | Cookie | xhs-cli |
| 🎵 抖音 | — | ✅ | 无需登录 | douyin-mcp-server |
| 💼 LinkedIn | ✅ 公开页 | ✅ Profile详情 | Cookie | linkedin-mcp |
| 💬 微信公众号 | ✅ | — | 无 | Exa + Camoufox |
| 📰 微博 | ✅ | — | 无 | Weibo MCP (Panniantong fork) |
| 💻 V2EX | ✅ | — | 无 | 内置 |
| 📈 雪球 | ✅ | — | 无 | 内置 |
| 🎙️ 小宇宙播客 | — | ✅ | Groq API Key | 脚本 + Whisper |

## 版本与依赖

- **当前版本：** 1.3.0
- **Python 版本：** 3.10+
- **关键依赖：** loguru（日志）、rich（CLI输出）、pyyaml（配置）、pytest（测试）
- **系统依赖：** gh CLI、Node.js（mcporter）、ffmpeg（播客转录）

## 目录结构

```
agent_reach/
├── cli.py              # CLI 入口（argparse）
├── core.py             # AgentReach 核心类
├── config.py           # YAML 配置管理
├── doctor.py           # 渠道健康检查引擎
├── cookie_extract.py   # 浏览器 Cookie 自动提取
├── channels/           # 16个平台渠道（各一个文件）
│   ├── base.py         # Channel 基类
│   ├── twitter.py      # twitter-cli
│   ├── youtube.py      # yt-dlp
│   ├── github.py       # gh CLI
│   └── ...
├── integrations/      # MCP server 集成
├── guides/             # 使用指南
└── skill/             # OpenClaw/Claude Code Skill 文件
```

## 快速安装命令

```bash
# 一句话安装
pip install -e .
agent-reach install --env=auto

# 诊断
agent-reach doctor

# 安装可选渠道
agent-reach install --channels=twitter,weibo,xiaohongshu --env=auto
```

## 相关页面

- [架构设计](./architecture.html) — 脚手架 vs 框架、可插拔设计
- [渠道详解](./channels.html) — 每个渠道的 check 机制和 backends
- [CLI 命令参考](./cli-reference.html) — 所有子命令详解
# 架构设计

<details>
<summary>相关源码文件</summary>

- [agent_reach/core.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/core.py)
- [agent_reach/channels/base.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/channels/base.py)
- [agent_reach/channels/__init__.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/channels/__init__.py)
- [CLAUDE.md](https://github.com/Panniantong/Agent-Reach/blob/17624268/CLAUDE.md)
</details>

# 架构设计

## 核心定位：脚手架（Scaffolding），不是框架

Agent Reach 的核心哲学是 **"只做选型和配置，不做封装"**。

每个平台背后是一个独立的上游工具。**不满意？换掉就行。**

```mermaid
graph TD
    subgraph Agent Reach 层
        AR["Agent Reach CLI<br/>install / doctor / configure"]
    end

    subgraph 上游工具层
        TC["twitter-cli"]
        YT["yt-dlp"]
        GH["gh CLI"]
        RD["rdt-cli"]
        XHS["xhs-cli"]
        MC["mcporter + Exa"]
        FP["feedparser"]
        WB["Weibo MCP"]
        CF["Camoufox + Exa"]
    end

    subgraph 平台层
        TW["Twitter/X"]
        YT_P["YouTube"]
        GH_P["GitHub"]
        RD_P["Reddit"]
        XHS_P["小红书"]
        BILI["B站"]
        WB_P["微博"]
        XZ["雪球"]
        WC["微信公众号"]
        V2["V2EX"]
    end

    AR --> |"安装 + 诊断"| TC
    AR --> |"安装 + 诊断"| YT
    AR --> |"安装 + 诊断"| GH
    AR --> |"安装 + 诊断"| RD
    AR --> |"安装 + 诊断"| XHS
    AR --> |"安装 + 诊断"| MC
    AR --> |"安装 + 诊断"| FP
    AR --> |"安装 + 诊断"| WB

    TC --> TW
    YT --> YT_P
    GH --> GH_P
    RD --> RD_P
    XHS --> XHS_P
    MC --> |"Exa 搜索"| Internet["🌐 整个互联网"]
    FP --> RSS_P["RSS 源"]
    WB --> WB_P
    CF --> WC
    YT --> BILI
```

## Channel 抽象

每个平台在 `agent_reach/channels/` 下对应一个文件，继承自 `Channel` 基类。

```python
# agent_reach/channels/base.py
class Channel(ABC):
    name: str = ""          # 唯一标识，如 "youtube"
    description: str = ""   # 中文描述，如 "YouTube 视频和字幕"
    backends: List[str] = [] # 上游工具列表，如 ["yt-dlp"]
    tier: int = 0           # 0=零配置, 1=需免费Key, 2=需登录配置

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """判断此 URL 是否属于本平台"""
        ...

    def check(self, config=None) -> Tuple[str, str]:
        """检查上游工具是否可用"""
        return "ok", f"{'、'.join(self.backends) if self.backends else '内置'}"
```

**渠道注册机制：**

```python
# agent_reach/channels/__init__.py
ALL_CHANNELS = [
    GitHubChannel(),
    TwitterChannel(),
    YouTubeChannel(),
    # ... 共16个
]
```

Doctor 引擎通过遍历 `ALL_CHANNELS` 调用各渠道的 `check()` 方法来生成诊断报告。

## Tier 分层设计

| Tier | 说明 | 渠道示例 |
|------|------|---------|
| 0 | 零配置，装好即用 | 网页、YouTube字幕、RSS、GitHub公开、B站、微博、V2EX、雪球 |
| 1 | 需要免费 API Key 或 Cookie | Twitter读推文、Reddit、小红书、抖音、LinkedIn |
| 2 | 需要复杂配置或付费代理 | B站服务器代理、小宇宙播客（Groq Key） |

## 设计原则

1. **不重复造轮子** — 所有功能都通过调用上游开源工具实现
2. **可插拔** — 任何渠道文件不满意，直接替换，不影响其他渠道
3. **本地优先** — Cookie/Token 只存在 `~/.agent-reach/config.yaml`，权限 600，不上传
4. **幂等安装** — 重复安装不会重复配置，只报"已安装"
5. **零配置渠道优先** — 默认安装零配置渠道，需要复杂配置的渠道需要显式指定

## 安全设计

- **配置目录权限：** `~/.agent-reach/` 仅所有者可读写（`chmod 700`）
- **Cookie 不上传** — 只存本地
- **安全模式：** `agent-reach install --safe` 只列出需要什么，不自动修改系统
- **Dry Run：** `agent-reach install --dry-run` 预览所有操作，不做任何改动

## 相关页面

- [快速上手](./quickstart.html)
- [CLI 命令参考](./cli-reference.html)
- [配置系统](./config.html)
# 快速上手

<details>
<summary>相关源码文件</summary>

- [agent_reach/cli.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/cli.py)（特别是 `_cmd_install`、`_detect_environment`、`_install_skill` 函数）
- [docs/install.md](https://github.com/Panniantong/Agent-Reach/blob/17624268/docs/install.md)
- [docs/update.md](https://github.com/Panniantong/Agent-Reach/blob/17624268/docs/update.md)
</details>

# 快速上手

## 一句话安装（适合 AI Agent）

把这句话发给任何 AI Agent（Claude Code、OpenClaw、Cursor 等）：

```
帮我安装 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md
```

> ⚠️ **OpenClaw 用户：** 首次安装前需确认 exec 权限已开启：
> ```bash
> openclaw config set tools.profile "coding"
> openclaw gateway restart
> ```

## 安装步骤分解

Agent 收到命令后会依次执行：

```mermaid
flowchart TD
    A["pip install -e .<br/>安装 agent-reach CLI"] --> B["安装系统依赖<br/>gh CLI、Node.js"]
    B --> C["安装 mcporter<br/>配置 Exa 搜索"]
    C --> D["检测环境<br/>本地 or 服务器?"]
    D --> E{环境判断}
    E -->|本地| F["导入浏览器 Cookie<br/>Chrome → Twitter/XHS 等"]
    E -->|服务器| G["给出代理配置建议<br/>$1/月 residential proxy"]
    F --> H["agent-reach doctor<br/>测试所有渠道"]
    G --> H
    H --> I["_install_skill()<br/>安装 SKILL.md 到各 Agent 目录"]
    I --> J["✅ 安装完成<br/>X/Y 渠道可用"]
```

## 安装模式

| 模式 | 命令 | 说明 |
|------|------|------|
| 全自动 | `agent-reach install --env=auto` | 自动检测环境，安装所有零配置渠道 |
| 安全模式 | `agent-reach install --env=auto --safe` | 不修改系统，只列出需要什么 |
| 预览 | `agent-reach install --env=auto --dry-run` | 预览所有操作，不实际安装 |
| 指定渠道 | `agent-reach install --channels=twitter,weibo,xiaohongshu` | 只安装指定渠道 |

## 环境自动检测逻辑

```python
def _detect_environment():
    """返回 'local' 或 'server'"""
    indicators = 0
    # SSH session → indicators += 2
    # Docker/.container → indicators += 2
    # 无 DISPLAY → indicators += 1
    # 云厂商特征 → indicators += 2
    # systemd-detect-virt != none → indicators += 1
    return "server" if indicators >= 2 else "local"
```

**服务器环境特殊处理：**
- B站需要代理（rdt-cli for Reddit 无需代理）
- 提示用户配置 residential proxy（~$1/月）

## 安装后验证

```bash
# 一键诊断
agent-reach doctor

# 预期输出示例
# ✅ GitHub — gh CLI
# ✅ Twitter — twitter-cli
# ✅ YouTube — yt-dlp
# -- Reddit — rdt-cli 未安装（运行 pipx install rdt-cli）
# ✅ Bilibili — yt-dlp
# ...
```

## 装好后怎么用

**不需要记命令。** Agent 读完 SKILL.md 后自己知道该调什么：

- "帮我看看这个链接" → Jina Reader
- "这个 GitHub 仓库是做什么的" → gh CLI
- "这个视频讲了什么" → yt-dlp
- "帮我看看这条推文" → twitter-cli
- "订阅这个 RSS" → feedparser

## 更新 Agent Reach

```
帮我更新 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/update.md
```

## 完整命令参考

```bash
# 开发安装
pip install -e .

# 安装
agent-reach install --env=auto
agent-reach install --channels=twitter,weibo,xiaohongshu --env=auto

# 诊断
agent-reach doctor

# 配置
agent-reach configure twitter-cookies "AUTH_TOKEN CT0"
agent-reach configure github-token ghp_xxxxx
agent-reach configure --from-browser chrome

# 卸载
agent-reach uninstall
agent-reach uninstall --dry-run
agent-reach uninstall --keep-config  # 只删skill，保留token

# 检查更新
agent-reach check-update

# 健康检查（无输出=一切正常）
agent-reach watch
```

## 相关页面

- [CLI 命令参考](./cli-reference.html)
- [架构设计](./architecture.html)
- [配置系统](./config.html)
# 渠道详解

<details>
<summary>相关源码文件</summary>

- [agent_reach/channels/__init__.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/channels/__init__.py)
- [agent_reach/channels/base.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/channels/base.py)
- [config/mcporter.json](https://github.com/Panniantong/Agent-Reach/blob/17624268/config/mcporter.json)
</details>

# 渠道详解（16个平台）

## 渠道总表

```python
# ALL_CHANNELS 注册顺序
ALL_CHANNELS = [
    GitHubChannel(),      # 0
    TwitterChannel(),     # 1
    YouTubeChannel(),     # 2
    RedditChannel(),      # 3
    BilibiliChannel(),    # 4
    XiaoHongShuChannel(), # 5
    DouyinChannel(),      # 6
    LinkedInChannel(),    # 7
    WeChatChannel(),      # 8
    WeiboChannel(),       # 9
    XiaoyuzhouChannel(),  # 10
    V2EXChannel(),        # 11
    XueqiuChannel(),      # 12
    RSSChannel(),         # 13
    ExaSearchChannel(),   # 14
    WebChannel(),         # 15
]
```

## Tier 0 — 零配置渠道

### 🌐 WebChannel — 任意网页

- **Backend:** Jina Reader（`curl https://r.jina.ai/<URL>`）
- **Check:** `shutil.which("curl")`
- **无需任何认证**
- **适用场景：** 任意公开网页的 Markdown 化读取

```mermaid
graph LR
    URL["任意 URL"] --> JR["Jina Reader API<br/>r.jina.ai"]
    JR --> MD["Markdown 输出"]
```

### 📺 YouTubeChannel — YouTube + B站

- **Backend:** yt-dlp
- **Check:** `shutil.which("yt-dlp")`
- **功能：** 字幕提取、视频元数据、视频搜索
- **配置：** Node.js 作为 JS runtime（`--js-runtimes node`）

```bash
# 提取字幕
yt-dlp --write-sub --skip-download "URL"
# 提取元数据
yt-dlp --dump-json "URL"
```

### 📡 RSSChannel — 任意 RSS/Atom 源

- **Backend:** feedparser
- **Check:** `import feedparser`
- **无需任何认证**

### 📦 GitHubChannel — GitHub 公开 API

- **Backend:** gh CLI
- **Check:** `shutil.which("gh")`
- **零配置功能：** 公开仓库读取、搜索
- **需 Token：** 私有仓库、Issue/PR 操作、Fork
- **Token 配置：** `agent-reach configure github-token <TOKEN>`

```bash
# 公开仓库
gh repo view owner/repo
# 搜索
gh search repos "LLM framework"
```

### 📺 BilibiliChannel — B站

- **Backend:** yt-dlp（本地）、bili-cli
- **Tier 0（本地）：** 字幕提取、视频搜索
- **Tier 2（服务器）：** 需要 residential 代理（~$1/月）
- **代理配置：** `agent-reach configure proxy http://user:pass@ip:port`

### 📰 WeiboChannel — 微博

- **Backend:** Weibo MCP（Panniantong fork，带 visitor passport auth 修复）
- **Check:** `mcporter config list` 中有 "weibo"
- **功能：** 热搜、搜索内容/用户/话题、用户动态、评论
- **安装：** `mcporter config add weibo --command mcp-server-weibo`

### 💻 V2EXChannel — V2EX

- **Backend:** 内置（无外部工具）
- **功能：** 热门帖子、节点帖子、帖子详情+回复、用户信息

### 📈 XueqiuChannel — 雪球

- **Backend:** 内置（无外部工具）
- **功能：** 股票行情、搜索股票、热门帖子、热门股票排行

## Tier 1 — 需认证渠道

### 🐦 TwitterChannel — Twitter/X

- **Backend:** twitter-cli
- **安装：** `pipx install twitter-cli`
- **零配置：** 读单条推文（`twitter tweet URL`）
- **需 Cookie：** 搜索推文、浏览时间线、发推
- **Cookie 格式：** `auth_token` + `ct0`
- **配置方式：**
  ```bash
  agent-reach configure twitter-cookies "AUTH_TOKEN CT0"
  # 或
  agent-reach configure --from-browser chrome
  ```

### 📖 RedditChannel — Reddit

- **Backend:** rdt-cli
- **安装：** `pipx install rdt-cli`
- **无需代理：** rdt-cli 本身已解决访问问题
- **登录：** `rdt login`（从浏览器提取 Cookie）
- **功能：** 搜索帖子、读帖子全文和评论

### 📕 XiaoHongShuChannel — 小红书

- **Backend:** xhs-cli（xiaohongshu-cli）
- **安装：** `pipx install xiaohongshu-cli`
- **登录：** `xhs login`（Cookie-Editor 导出）
- **功能：** 搜索笔记、阅读详情、查看评论、发帖
- **Docker 容器：** `xpzouying/xiaohongshu-mcp`

### 🎵 DouyinChannel — 抖音

- **Backend:** douyin-mcp-server（MCPorter MCP）
- **无需登录：** 只需分享链接
- **功能：** 视频信息解析、无水印下载链接获取

### 💼 LinkedInChannel — LinkedIn

- **Backend:** linkedin-mcp-server
- **功能：** 公开页面（无需登录）、Profile详情（需Cookie）
- **安装：** mcporter 配置

### 💬 WeChatChannel — 微信公众号

- **Backend:** Exa（搜索）+ Camoufox（可选，浏览器自动化）
- **零配置：** 搜索 + 阅读公众号文章（全文 Markdown）
- **可选：** Camoufox 增强登录态访问

### 🎙️ XiaoyuzhouChannel — 小宇宙播客

- **Backend:** `transcribe_xiaoyuzhou.sh` + Whisper（Groq API）
- **安装：** `agent-reach install --channels=xiaoyuzhou`
- **依赖：** ffmpeg、Groq API Key（免费额度）
- **功能：** 播客音频转文字

## Tier 2 — 需复杂配置

### 🔍 ExaSearchChannel — 全网语义搜索

- **Backend:** mcporter + Exa MCP（`https://mcp.exa.ai/mcp`）
- **特点：** AI 语义搜索，MCP 接入免 Key，免费
- **安装：** `mcporter config add exa https://mcp.exa.ai/mcp`
- **check：** `mcporter config list` 中有 "exa"

## MCP 工具配置（mcporter.json）

```json
// config/mcporter.json
{
  "mcpServers": {
    "exa": "https://mcp.exa.ai/mcp",
    "xiaohongshu": "xpzouying/xiaohongshu-mcp",
    "weibo": "Panniantong/mcp-server-weibo#main",
    "douyin": "yzfly/douyin-mcp-server"
  }
}
```

## 相关页面

- [架构设计](./architecture.html)
- [CLI 命令参考](./cli-reference.html)
# CLI 命令参考

<details>
<summary>相关源码文件</summary>

- [agent_reach/cli.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/cli.py)（所有 `_cmd_*` 函数）
</details>

# CLI 命令参考

## `agent-reach install` — 一键安装

```bash
agent-reach install [选项]
```

| 选项 | 说明 |
|------|------|
| `--env=auto` | 自动检测本地/服务器（默认） |
| `--env=local` | 本地电脑 |
| `--env=server` | 服务器/VPS |
| `--proxy URL` | 为 B站 配置代理 |
| `--channels=xxx` | 指定安装的渠道（如 `twitter,weibo,xiaohongshu`，或 `all`） |
| `--safe` | 安全模式：不自动修改系统，只列出需要什么 |
| `--dry-run` | 预览模式：显示所有操作，不实际修改 |
| `-v, --verbose` | 显示 debug 日志 |

**完整示例：**
```bash
agent-reach install --env=auto --channels=all --verbose
```

## `agent-reach doctor` — 渠道健康检查

```bash
agent-reach doctor
```

输出格式（Rich 彩色输出）：

```
Agent Reach 状态
========================================

✅ 装好即用：
  ✅ GitHub — gh CLI
  ✅ YouTube — yt-dlp
  ✅ RSS — feedparser
  ...

状态：8/16 个渠道可用
还有 8 个可选渠道可以解锁（Twitter、小红书、...），告诉你的 Agent「帮我装 XXX」即可
```

## `agent-reach configure` — 配置管理

```bash
agent-reach configure <key> [value...]
agent-reach configure --from-browser <chrome|firefox|edge|brave|opera>
```

| key | 说明 |
|-----|------|
| `proxy` | B站 residential 代理 URL |
| `github-token` | GitHub Personal Access Token |
| `groq-key` | Groq API Key（播客转录用） |
| `twitter-cookies` | Twitter auth_token 和 ct0 |
| `youtube-cookies` | YouTube 浏览器 Cookie 来源 |
| `xhs-cookies` | 小红书 Cookie |

**Twitter Cookie 配置示例：**
```bash
# 方式1：直接提供 token
agent-reach configure twitter-cookies "auth_token_xxx ct0_yyy"

# 方式2：从 Cookie 字符串解析
agent-reach configure twitter-cookies "auth_token=xxx; ct0=yyy; ..."
```

**从浏览器自动提取：**
```bash
agent-reach configure --from-browser chrome
```

## `agent-reach uninstall` — 卸载

```bash
agent-reach uninstall [选项]
```

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览要删除的内容 |
| `--keep-config` | 只删除 skill 文件，保留 token 配置 |

**删除范围：**
- `~/.agent-reach/`（含所有 token/cookie）
- 各 Agent 的 skill 文件
- mcporter 中的 MCP 配置

## `agent-reach skill` — Agent Skill 管理

```bash
agent-reach skill --install   # 安装 SKILL.md
agent-reach skill --uninstall # 卸载 SKILL.md
```

**安装目标（按优先级）：**
1. `~/.agents/skills/`（通用 agents）
2. `~/.openclaw/skills/`（OpenClaw）
3. `~/.claude/skills/`（Claude Code）

**SKILL.md 多语言支持：**
- 系统语言为英文 → 安装 `SKILL_en.md`
- 其他语言 → 安装 `SKILL.md`（中文）

## `agent-reach setup` — 交互式配置向导

```bash
agent-reach setup
```

引导用户依次配置：
1. Exa 全网搜索（推荐）
2. GitHub Token（可选，提升 API 限额）
3. Groq API Key（可选，播客转录）

## `agent-reach check-update` — 检查更新

```bash
agent-reach check-update
```

检查 GitHub 最新 release，若有新版本输出更新命令。

## `agent-reach watch` — 定时健康检查

```bash
agent-reach watch
```

设计用于定时任务（cron）。仅在有问题时输出，无问题则输出单行状态。

## `agent-reach format` — 格式化平台输出

```bash
agent-reach format xhs
```

从 stdin 读取 JSON，输出格式化后的小红书结果。

## 子命令速查表

| 子命令 | 功能 | 常用场景 |
|--------|------|---------|
| `install` | 安装和配置 | 首次安装、扩展渠道 |
| `doctor` | 诊断渠道状态 | 排查问题 |
| `configure` | 设置配置项 | 添加 Cookie、Token、代理 |
| `uninstall` | 卸载 | 清理环境 |
| `skill --install` | 注册为 Agent Skill | 让 Agent 知道怎么调用 |
| `setup` | 交互式向导 | 首次配置 |
| `check-update` | 检查更新 | 维护 |
| `watch` | 定时监控 | 集成到 cron |
| `format xhs` | 格式化输出 | 小红书数据处理 |

## 相关页面

- [快速上手](./quickstart.html)
- [配置系统](./config.html)
- [Agent Skill 集成](./skill.html)
# 配置系统

<details>
<summary>相关源码文件</summary>

- [agent_reach/config.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/config.py)
- [agent_reach/cookie_extract.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/cookie_extract.py)
</details>

# 配置系统

## 配置目录

```
~/.agent-reach/
├── config.yaml        # 所有凭据和配置（权限 600）
└── tools/            # 第三方工具克隆目录
    ├── xiaoyuzhou/   # 小宇宙转录脚本
    └── wechat-article-for-ai/  # 微信公众号工具
```

## config.yaml 结构

```yaml
# ~/.agent-reach/config.yaml 示例（已脱敏）
twitter_auth_token: "abc123..."
twitter_ct0: "def456..."
github_token: "ghp_xxxxx..."
groq_api_key: "gsk_xxxxx..."
bilibili_proxy: "http://user:pass@host:port"
```

## Config 类核心逻辑

```python
class Config:
    CONFIG_DIR = Path.home() / ".agent-reach"
    CONFIG_FILE = CONFIG_DIR / "config.yaml"

    def get(self, key: str, default: Any = None) -> Any:
        # 1. 先查 config.yaml
        # 2. 再查环境变量（大写）
        ...

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()  # 写文件 + 设置 0o600 权限
```

**配置优先级：** `config.yaml` > 环境变量

## Feature 配置要求

```python
FEATURE_REQUIREMENTS = {
    "exa_search":     ["exa_api_key"],
    "twitter_xreach":  ["twitter_auth_token", "twitter_ct0"],
    "groq_whisper":   ["groq_api_key"],
    "github_token":    ["github_token"],
}
```

## 安全机制：文件权限

首次写入 config.yaml 时，使用 `os.open` 直接创建权限为 `0o600` 的文件：

```python
fd = os.open(
    str(self.config_path),
    os.O_WRONLY | os.O_CREAT | os.O_TRUNC,
    stat.S_IRUSR | stat.S_IWUSR,  # 0o600
)
```

**目的：** 避免在磁盘上产生权限过宽的临时文件。

Doctor 引擎会检测 config.yaml 权限是否被意外放宽：

```python
# doctor.py 中的安全检查
if mode & (stat.S_IRGRP | stat.S_IROTH):
    # 警告：其他用户可读！
    "[bold red][!] 安全提示：config.yaml 权限过宽[/bold red]"
```

## Cookie 提取机制

`agent_reach/cookie_extract.py` 负责从浏览器自动提取 Cookie：

- **支持浏览器：** Chrome、Firefox、Edge、Brave、Opera
- **macOS：** 使用 `security find-generic-password` 从 Keychain 提取
- **导出格式：** 支持 Cookie-Editor JSON 和 Header String 两种格式

```python
# 支持的输入格式
# 1. Cookie-Editor JSON:
#    '[{"name":"auth_token","value":"xxx","domain":".twitter.com",...}, ...]'
# 2. Header String:
#    "auth_token=xxx; ct0=yyy; ..."
```

## 环境变量覆盖

所有配置项都支持通过环境变量覆盖（大写）：

| config.yaml key | 环境变量 |
|----------------|---------|
| `twitter_auth_token` | `TWITTER_AUTH_TOKEN` |
| `twitter_ct0` | `TWITTER_CT0` |
| `github_token` | `GITHUB_TOKEN` |
| `groq_api_key` | `GROQ_API_KEY` |

## 敏感信息脱敏

`to_dict()` 方法对敏感字段进行脱敏：

```python
def to_dict(self) -> dict:
    masked = {}
    for k, v in self.data.items():
        if any(s in k.lower() for s in ("key", "token", "password", "proxy")):
            masked[k] = f"{str(v)[:8]}..." if v else None
        else:
            masked[k] = v
    return masked
```

## 相关页面

- [CLI 命令参考](./cli-reference.html)
- [渠道详解](./channels.html)
# Agent Skill 集成

<details>
<summary>相关源码文件</summary>

- [agent_reach/cli.py](https://github.com/Panniantong/Agent-Reach/blob/17624268/agent_reach/cli.py)（`_install_skill`、`_uninstall_skill` 函数）
- [agent_reach/skill/](https://github.com/Panniantong/Agent-Reach/tree/17624268/agent_reach/skill/)
</details>

# Agent Skill 集成

## 安装流程

Agent Reach 安装完成后会自动调用 `_install_skill()`，将 `SKILL.md` 安装到各 Agent 的 skills 目录：

```mermaid
flowchart TD
    A["_install_skill() 被调用"] --> B{"检测 skill 目录优先级"}
    B -->|1| OA["~/.agents/skills/agent-reach/"]
    B -->|2| OB["~/.openclaw/skills/agent-reach/"]
    B -->|3| OC["~/.claude/skills/agent-reach/"]
    OA --> D{"目录是否存在?"}
    OB --> D
    OC --> D
    D -->|是| E["复制 skill 目录"]
    D -->|否| F["跳过（不报错）"]
    E --> G["SKILL.md + references/"]
```

## Skill 安装目标（按优先级）

```python
skill_dirs = [
    os.path.expanduser("~/.agents/skills"),    # 1. 通用 agents（最高优先级）
    os.path.expanduser("~/.openclaw/skills"),  # 2. OpenClaw
    os.path.expanduser("~/.claude/skills"),    # 3. Claude Code
]
```

**同时检查 `OPENCLAW_HOME` 环境变量：**
```python
if openclaw_home := os.environ.get("OPENCLAW_HOME"):
    skill_dirs.insert(0, os.path.join(openclaw_home, ".openclaw", "skills"))
```

## 多语言 SKILL.md

```python
def _skill_resource_name() -> str:
    locale_candidates = (
        os.environ.get("AGENT_REACH_LANG", ""),
        os.environ.get("LC_ALL", ""),
        os.environ.get("LC_MESSAGES", ""),
        os.environ.get("LANG", ""),
    )
    # 系统语言为英文 → SKILL_en.md
    # 其他语言 → SKILL.md（中文）
```

**文件结构：**
```
agent_reach/skill/
├── SKILL.md           # 中文版（默认）
├── SKILL_en.md        # 英文版
└── references/        # 参考文档
    ├── twitter.md
    ├── youtube.md
    └── ...
```

## Skill 安装内容

```python
def _copy_skill_dir(target: str) -> bool:
    # 1. 清空已存在的安装
    if os.path.exists(target):
        shutil.rmtree(target)

    # 2. 复制 SKILL.md（根据语言选择版本）
    # 3. 复制 references/ 目录
```

## 卸载 Skill

```bash
agent-reach skill --uninstall
```

卸载范围：
- `~/.openclaw/skills/agent-reach/`
- `~/.claude/skills/agent-reach/`
- `~/.agents/skills/agent-reach/`

**注意：** `agent-reach uninstall` 也会自动调用 `_uninstall_skill()`

## SKILL.md 能做什么

安装 SKILL.md 后，Agent 知道：

1. **每个平台怎么调用** — 不需要你记命令
2. **什么时候用 Cookie** — Twitter、小红书等需要认证的平台
3. **安全注意事项** — 专用小号、不上传凭据
4. **遇到问题怎么办** — `agent-reach doctor` 诊断

## 版本号一致性要求

> ⚠️ **重要：** 版本号必须在三处保持一致：
> 1. `pyproject.toml` 的 `version`
> 2. `agent_reach/__init__.py` 的 `__version__`
> 3. `tests/test_cli.py` 中的预期版本

## 相关页面

- [CLI 命令参考](./cli-reference.html)
- [配置系统](./config.html)
# 测试体系

<details>
<summary>相关源码文件</summary>

- [tests/](https://github.com/Panniantong/Agent-Reach/tree/17624268/tests/)
- [.github/workflows/pytest.yml](https://github.com/Panniantong/Agent-Reach/blob/17624268/.github/workflows/pytest.yml)
- [test.sh](https://github.com/Panniantong/Agent-Reach/blob/17624268/test.sh)
</details>

# 测试体系

## 测试文件结构

```
tests/
├── test_channel_contracts.py   # 渠道契约测试
├── test_channels.py            # 各渠道逻辑测试
├── test_cli.py                 # CLI 命令测试
├── test_config.py              # 配置系统测试
├── test_core.py                # 核心类测试
├── test_doctor.py              # 诊断引擎测试
├── test_skill_command.py       # Skill 命令测试
├── test_twitter_channel.py      # Twitter 特定测试
├── test_xhs_format.py          # 小红书格式化测试
└── test_xiaoyuzhou_install.py  # 小宇宙安装测试
```

## pytest 测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试文件
pytest tests/test_cli.py -v

# 运行特定测试用例
pytest tests/test_cli.py::test_doctor_command -v
```

## test.sh 集成测试

```bash
bash test.sh
```

完整集成测试流程：

```mermaid
flowchart LR
    A["创建临时 venv"] --> B["pip install -e ."]
    B --> C["agent-reach install --env=auto"]
    C --> D["agent-reach doctor"]
    D --> E{渠道状态检查}
    E -->|通过| F["pytest tests/ -v"]
    E -->|失败| G["报告失败的渠道"]
    F --> H["清理 venv"]
```

## CI 配置

`.github/workflows/pytest.yml` — GitHub Actions 自动化测试：

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: pip install -e .
      - run: pytest tests/ -v
```

## CLI 测试要点

```python
# tests/test_cli.py 测试覆盖的子命令
def test_install_command(): ...
def test_doctor_command(): ...
def test_configure_command(): ...
def test_uninstall_command(): ...
def test_skill_command(): ...
def test_version_command(): ...
```

**版本号一致性检查：**
```python
def test_version():
    # 确保 pyproject.toml、__init__.py、test_cli.py 版本一致
    assert __version__ == "1.3.0"
```

## 渠道契约测试

每个渠道必须实现的契约：

```python
# test_channel_contracts.py
def test_all_channels_have_required_methods():
    for ch in get_all_channels():
        assert hasattr(ch, 'can_handle')
        assert hasattr(ch, 'check')
        assert isinstance(ch.name, str)
        assert isinstance(ch.tier, int)

def test_can_handle_patterns():
    # YouTube 渠道必须能处理 youtube.com/watch?v=xxx
    yt = YouTubeChannel()
    assert yt.can_handle("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert not yt.can_handle("https://twitter.com/xxx")
```

## Doctor 引擎测试

```python
def test_check_all_returns_dict():
    results = check_all(Config())
    assert isinstance(results, dict)
    for name, result in results.items():
        assert 'status' in result
        assert result['status'] in ('ok', 'warn', 'off', 'error')

def test_format_report_non_empty():
    results = check_all(Config())
    report = format_report(results)
    assert len(report) > 0
```

## 配置系统测试

```python
def test_config_default_path():
    c = Config()
    assert c.config_path.name == "config.yaml"

def test_set_and_get():
    c = Config()
    c.set("test_key", "test_value")
    assert c.get("test_key") == "test_value"

def test_env_override():
    os.environ["TEST_KEY"] = "env_value"
    c = Config()
    assert c.get("test_key") == "env_value"  # env 覆盖 config
```

## 相关页面

- [CLI 命令参考](./cli-reference.html)
- [架构设计](./architecture.html)
