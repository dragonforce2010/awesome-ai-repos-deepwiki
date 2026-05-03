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
