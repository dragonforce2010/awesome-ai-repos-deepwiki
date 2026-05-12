# Awesome AI Repos · DeepWiki

[English abstract](#abstract) · 面向 AI 开发者与爱好者的 **高质量、源码可溯源** 中文技术维基聚合站。

**在线站点**：<https://dragonforce2010.github.io/awesome-ai-repos-deepwiki/>

**源仓库**：<https://github.com/dragonforce2010/awesome-ai-repos-deepwiki>

---

## 项目定位

本仓库维护一套 **VitePress 多站点维基**：在 `project-wiki/<wiki-id>/` 下为精选开源 AI / Agent / 工具链项目生成 **叙事化中文文档**（概述、架构、关键流程、扩展与质量门禁），并尽量以 **文件路径 + 行号** 与上游源码对齐，便于读者对照阅读。

我们追求：

- **高信息密度**：不止复述 README，而是解释设计权衡与实现脉络。  
- **可验证**：重要结论可回到上游仓库的具体文件与版本（见各 wiki 的 `source-manifest.json` 与文中引用）。  
- **对爱好者友好**：中文主叙事，保留 API、文件名、命令等英文标识符，降低学习与检索成本。

收录范围以 **协议友好、可公开分析** 的开源仓库为主；新增 wiki 需通过生成流水线（见下文「贡献与生成」）并保持构建可通过。

---

## Abstract

This repository hosts a **static documentation hub** for curated open-source AI-related projects. Each wiki under `project-wiki/` is generated with **source-grounded** Chinese narrative pages, optional skill-folder translations, Mermaid diagrams, and manifests pointing at pinned upstream revisions. The site is published with **GitHub Actions** to **GitHub Pages** (no Netlify credits required for this deployment path).

---

## 目录结构

| 路径 | 说明 |
|------|------|
| `project-wiki/` | 各子 wiki 的页面、`wiki-structure.json`、`exports/full-wiki.md` 等 |
| `project-wiki/.vitepress/` | VitePress 主题、侧栏/导航生成逻辑 |
| `.github/workflows/` | Pages 构建与部署工作流 |
| `project-repos/` | **不纳入 Git**：本地克隆上游仓库的目录（见 `.gitignore`） |

---

## 本地构建

**前置**：Node 20+、[pnpm](https://pnpm.io/) 10.x（与 `package.json` 中 `packageManager` 一致）。

本地开发默认使用站点根路径 **`/`**（与线上一致的子路径由 `VITEPRESS_BASE` 控制）。`pnpm dev` 已在脚本里**清空 `VITEPRESS_BASE`**，避免你 shell 里仍导出旧的 `/deepwiki/` 导致静态资源与路由全部跑偏。

```bash
pnpm install
pnpm dev
```

若你需要在本地**模拟 GitHub Pages 子路径**（与线上完全一致），使用：

```bash
pnpm dev:public-base
```

与 **GitHub Pages** 一致的仅构建/预览（仓库名为 `awesome-ai-repos-deepwiki` 时）：

```bash
VITEPRESS_BASE=/awesome-ai-repos-deepwiki/ pnpm run build
VITEPRESS_BASE=/awesome-ai-repos-deepwiki/ pnpm exec vitepress serve project-wiki
```

---

## 部署说明

- **托管**：GitHub Pages（`build_type: workflow`）。  
- **触发**：推送到默认分支 `master` 后由 `.github/workflows/deploy-github-pages.yml` 构建并发布。  
- **注意**：GitHub 上 **私有仓库** 在免费计划中无法启用 Pages；本站点以 **公开仓库** 形式提供服务。  
- **`VITEPRESS_BASE`** 必须与 **GitHub 仓库名** 一致（当前为 `/awesome-ai-repos-deepwiki/`）。若仅重命名远程仓库，请同步修改工作流中的环境变量与上述本地构建命令。

---

## 贡献与生成（deepwiki-it）

新增或更新某一上游仓库的维基时，建议在本地使用 **deepwiki-it** 技能流水线（清单脚本、Mermaid/引用后处理、`pnpm run build` 校验）。核心约定：

1. 上游克隆放在 `project-repos/<repo-short-name>/`（可不提交）。  
2. 生成物仅提交 `project-wiki/<wiki-id>/`。  
3. `wiki-id` 与克隆目录名不一致时，引用修复脚本可能需要在 `project-repos/` 下建立与 `wiki-id` 同名的符号链接（详见技能文档）。

本仓库 **不** 接受向上游子仓库回写生成内容，除非贡献者明确另有安排。

---

## 安全与隐私

请参阅根目录 [`SECURITY.md`](./SECURITY.md)。切勿将 **API Key、Token、内网地址** 等写入 wiki 或提交记录。生成脚本若在清单中写入了本机绝对路径，公开发布前宜评估是否需脱敏。

---

## 许可证

以仓库内 `LICENSE` 为准（若未添加，默认以维护者后续声明为准）。

---

## 致谢

叙事与信息架构参考 [AsyncFuncAI/deepwiki-open](https://github.com/AsyncFuncAI/deepwiki-open) 所体现的 DeepWiki 体验；本站实现、策展与中文叙述由本仓库维护者负责。
