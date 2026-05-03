# Open Design DeepWiki

> 来源仓库：[nexu-io/open-design](https://github.com/nexu-io/open-design)，分析提交：`9d700ec74fc671af845d68af472f7c5c6e0fcfc9`。

Open Design 是一个 local-first 的设计 agent 工作台。它把 12 类 agent CLI、`SKILL.md` 技能、`DESIGN.md` 设计系统、媒体生成、artifact 预览和桌面 sidecar 生命周期放到同一个本地应用里。这个 DeepWiki 产物以源码为准，面向后续维护者解释系统如何启动、如何把用户输入变成 agent 运行、如何保存/预览产物，以及哪些边界需要谨慎处理。

## 导航

| 页面 | 关注点 |
| --- | --- |
| [项目概览](pages/overview.md) | 解释 Open Design 的定位、仓库构成、核心对象和使用入口。 |
| [系统架构与拓扑](pages/system-architecture.md) | 梳理 Web、daemon、agent CLI、桌面容器和静态部署之间的拓扑关系。 |
| [Agent 适配器与运行链路](pages/agent-runtime.md) | 说明 agent 检测、适配器接口、run 生命周期、SSE 事件和取消/恢复机制。 |
| [Daemon API、本地数据与安全边界](pages/daemon-api.md) | 覆盖 daemon 路由、SQLite 元数据、项目文件边界、BYOK 代理和 SSRF 防护。 |
| [Web 工作台、预览与导出](pages/web-workspace.md) | 跟踪前端状态加载、项目视图、iframe 预览、artifact manifest 和导出能力。 |
| [Skills、Design Systems 与 Craft 注入](pages/skills-design-systems.md) | 解释 SKILL.md 协议、注册表优先级、design-system 解析、craft references 和输出镜像。 |
| [Prompt 栈、发现表单与 Artifact 交付](pages/prompt-artifact-flow.md) | 描述 discovery form、prompt 分层、metadata 注入、artifact 保存和 lint 反馈闭环。 |
| [图像、视频、音频生成与模板库](pages/media-generation.md) | 解释媒体 surface 的模型选择、prompt template、dispatcher 契约和长任务等待。 |
| [Desktop、Sidecar 与本地生命周期](pages/desktop-packaging-lifecycle.md) | 说明 desktop runtime、packaged sidecars、tools-dev 生命周期管理和平台差异。 |
| [测试、CI、发布与运维边界](pages/testing-release-ops.md) | 汇总 monorepo 脚本、E2E 覆盖、GitHub Actions 验证和稳定/测试版发布流水线。 |

## 关键入口

| 入口 | 说明 |
| --- | --- |
| `package.json` | monorepo 包名、`od` CLI bin、构建/测试脚本和 Node/pnpm 版本约束。 |
| `apps/daemon/src/server.ts` | 本地 HTTP daemon，承载项目、skills、design systems、runs、media、artifact、BYOK proxy 等 API。 |
| `apps/web/src/App.tsx` | Web 工作台的 bootstrap 入口，负责加载 daemon 配置、agents、skills、design systems、项目列表和模板。 |
| `apps/web/src/components/ProjectView.tsx` | 单项目创作主界面，连接对话、运行流、artifact 解析、文件持久化、预览和评论。 |
| `apps/web/src/state/config.ts` | Web 本地配置、daemon app-config 同步、媒体 provider 同步和配置迁移。 |
| `apps/daemon/src/agents.ts` | 多 agent CLI 的适配器定义、可执行文件探测、模型探测和 spawn 参数。 |
| `apps/daemon/src/app-config.ts` | daemon 持久化 onboarding、agent、模型、skill 和 design system 偏好，避免浏览器 storage 重置后丢失启动状态。 |
| `apps/desktop/src/main/runtime.ts` | Electron BrowserWindow、IPC、PPTX save-as 和本地 Web runtime 装载。 |
| `tools/dev/src/index.ts` | `pnpm od-tools-dev` 的 start/status/stop/restart/logs/check 等本地生命周期命令。 |

## 输出文件

- `wiki-structure.json`：页面结构、来源文件和章节分组。
- `source-manifest.json`：源码文件清单，由 `deepwiki-it` 脚本生成。
- `00-repo-inventory.md`：仓库扫描摘要。
- `pages/*.md`：10 个中文主题页，每页开头包含可折叠来源文件块。
- `exports/full-wiki.md`：按导航顺序拼接的完整 Wiki。
- `skills/**/SKILL.md`：源码仓库中 `SKILL.md` 的中文镜像，保留命令、路径、代码块和协议字段。
