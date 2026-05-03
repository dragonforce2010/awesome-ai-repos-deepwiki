# 👁️ Agent Reach — DeepWiki

> 项目源码：[Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | Commit: `17624268a059ccfb23eba8a2ba50f9f92c8dc0ca` | 版本: 1.3.0

**给你的 AI Agent 一键装上互联网能力。** Python CLI + 安装器，帮助 AI Agent 访问 14+ 互联网平台。

---

## 📚 Wiki 目录

| 页面 | 说明 |
|------|------|
| [项目概览](./pages/overview.html) | 项目定位、核心价值、支持平台总表 |
| [架构设计](./pages/architecture.html) | 脚手架 vs 框架、可插拔渠道架构、选型依据 |
| [快速上手](./pages/quickstart.html) | 一句话安装、自动依赖检测、环境识别 |
| [渠道详解](./pages/channels.html) | 16个平台的 backends、check机制、认证方式 |
| [CLI 命令参考](./pages/cli-reference.html) | install / doctor / configure / uninstall 等子命令详解 |
| [配置系统](./pages/config.html) | YAML配置、目录权限、环境变量、敏感信息处理 |
| [Agent Skill 集成](./pages/skill.html) | SKILL.md多语言自动安装、skill注册流程 |
| [测试体系](./pages/tests.html) | pytest测试、test.sh集成测试、CI配置 |

---

## 🎯 一句话理解 Agent Reach

**定位：** 脚手架（Scaffolding），不是框架。
**安装完成后，Agent 直接调用上游工具**，不需要经过 Agent Reach 的封装层。

---

## 支持的平台（16个）

| 零配置（装好即用） | 需认证（Cookie/Key） |
|---|---|
| 🌐 网页、📺 YouTube、📡 RSS、📦 GitHub公开 | 🐦 Twitter、📖 Reddit、📕 小红书 |
| 📺 B站、📰 微博、💻 V2EX、📈 雪球 | 🎵 抖音、💼 LinkedIn、💬 微信公众号 |
| 🔍 全网搜索（Exa MCP） | 🎙️ 小宇宙播客 |

---

## 快速安装

```bash
pip install -e .
agent-reach install --env=auto
```

或把这句话发给 AI Agent：

> 帮我安装 Agent Reach：https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md

---

## 核心命令

```bash
agent-reach doctor        # 诊断所有渠道状态
agent-reach install       # 安装 + 配置
agent-reach configure      # 设置 Cookie / Token / 代理
agent-reach uninstall     # 卸载
```

---

*由 DeepWiki 自动生成 | 源码仓库：[Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach)*
