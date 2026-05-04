<details>
<summary>相关源文件</summary>

- [apps/daemon/src/server.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) - daemon 路由主体。
- [apps/daemon/src/db.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/db.ts) - SQLite schema 和迁移。
- [apps/daemon/src/app-config.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/app-config.ts) - daemon 侧 app preferences 持久化、过滤和并发写入。
- [packages/contracts/src/api/app-config.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/packages/contracts/src/api/app-config.ts) - Web/daemon 共享的 app-config API 类型。
- [apps/daemon/src/projects.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/projects.ts) - 项目文件读写、归档、路径校验。
- [apps/daemon/src/media.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) - 媒体生成 dispatcher 和文件安全校验。

</details>

# Daemon API、本地数据与安全边界

Daemon 是 Open Design 的本机权限边界。它既提供业务 API，也把本地文件、SQLite、agent spawn、media provider、BYOK proxy 统一在一个进程里。因此维护 daemon 时，必须同时关注功能和路径/网络安全。

## API 面

`server.ts` 的路由覆盖多个资源域：

| 路由域 | 代表路由 | 职责 |
| --- | --- | --- |
| 健康与版本 | `/health`、版本信息 | Web 判断 daemon 是否可用。 |
| Projects | project list/create、conversation、messages、comments | 管理项目元数据和默认会话。 |
| Import | Claude Design ZIP import | 把外部设计项目导入本地结构。 |
| Agents/Skills/DS | `/api/agents`、`/api/skills`、`/api/design-systems` | 暴露本机能力和文件协议资产。 |
| Prompt templates | `/api/prompt-templates` | 图像/视频 prompt 模板目录。 |
| Artifacts/files | save/lint/archive/raw/upload/delete | 保存和读取项目文件。 |
| Runs | `/api/runs`、`/events`、cancel、legacy `/api/chat` | agent 运行生命周期。 |
| Media | media config/models/generate/wait | 图像、视频、音频生成。 |
| App config | `/api/app-config` | daemon 持久化 onboarding、agent、模型、skill 和 design system 偏好。 |
| BYOK proxy | Anthropic/OpenAI proxy | 使用用户 key 代理请求并做目标限制。 |

具体入口分布在 `server.ts`：agents/skills 在 1097-1122 行，design systems 和 prompt templates 在 1208-1241 行，artifact 和文件路由在 1347-1807 行，media/app-config 在 1822-2021 行，runs 路由在 2495-2536 行，BYOK proxy 在 2568-2763 行。[apps/daemon/src/server.ts:1097-1122](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) [apps/daemon/src/server.ts:1208-1241](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) [apps/daemon/src/server.ts:1347-1807](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) [apps/daemon/src/server.ts:1822-2021](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) [apps/daemon/src/server.ts:2495-2536](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts)

## SQLite 只存元数据

`db.ts` 明确把 SQLite 用作 metadata store，项目文件仍保存在磁盘上。[apps/daemon/src/db.ts:1-7](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/db.ts) `openDb` 在 `.od/app.sqlite` 下启用 WAL 和外键，然后执行迁移。[apps/daemon/src/db.ts:16-28](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/db.ts) schema 覆盖 projects、templates、conversations、messages、preview_comments、tabs、deployments 等表，并通过后续列添加保持向前兼容。[apps/daemon/src/db.ts:38-183](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/db.ts)

## App config 持久化

最新主线新增了 daemon-backed app preferences：Web 通过 `GET/PUT /api/app-config` 同步 onboarding、agent、per-agent model/reasoning、skill 和 design system 选择，daemon 把它们写入 `<dataDir>/app-config.json`，从而在浏览器 storage 清空或 origin 变化后保留启动配置。[apps/daemon/src/app-config.ts:1-8](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/app-config.ts) 允许字段集中在 `ALLOWED_KEYS`，读写时会过滤未知键、验证 `agentModels` 形状，并用 per-dataDir 写锁串行化 read-modify-write。[apps/daemon/src/app-config.ts:27-97](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/app-config.ts) [apps/daemon/src/app-config.ts:99-153](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/app-config.ts)

HTTP 层对 app-config 做同源检查：`/api/app-config` 只接受本地同源或可信 Web port 的请求，跨 origin 会被拒绝。[apps/daemon/src/server.ts:1857-1883](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) 共享 contract 定义 `AppConfigPrefs` 和更新请求形状，避免 Web/daemon 字段漂移。[packages/contracts/src/api/app-config.ts:1-18](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/packages/contracts/src/api/app-config.ts)

这个边界有两个含义：

- 备份/迁移项目时不能只拿 SQLite，也要拿项目文件目录。
- Debug run 或 artifact 问题时，要同时看 DB message/tabs 和项目 files。

## 项目文件边界

`projects.ts` 用 `projectDir`、`listProjectFiles`、`readProjectFile`、`writeProjectFile`、`resolveSafe`、`validateProjectPath` 等函数把文件操作限制在 project root 内。[apps/daemon/src/projects.ts:21-39](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/projects.ts) [apps/daemon/src/projects.ts:162-223](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/projects.ts) [apps/daemon/src/projects.ts:258-285](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/projects.ts) 打包归档时会排除 dotfiles 和 `.artifact.json`。[apps/daemon/src/projects.ts:75-137](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/projects.ts)

需要特别注意：源码中存在项目目录删除/文件删除实现，但本次 DeepWiki 生成没有执行任何删除命令。维护该区域时应把“用户项目文件是否可被 agent 或 API 意外删改”作为风险点单独测试。

## BYOK proxy 与 SSRF 边界

Daemon 末尾实现了 Anthropic/OpenAI BYOK proxy，并有目标地址防护：阻断 localhost、link-local 和 RFC1918 私网地址。[apps/daemon/src/server.ts:2568-2763](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) 这很关键，因为 Web UI 和 agent 都可能触发网络请求；如果 proxy 允许任意 URL，会把用户本机网络暴露给远端内容或 prompt 注入。

## Media 文件安全

`media.ts` 也有路径和类型边界：生成结果必须落在项目 image/video/audio 路径规则内，扩展名受白名单限制，provider/stub 路径由 config 控制。[apps/daemon/src/media.ts:1-38](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) [apps/daemon/src/media.ts:93-156](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) [apps/daemon/src/media.ts:192-260](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts)

## 维护检查表

- 新增路由时先确认 project id、path、body size 和 content-type 限制。
- 新增文件写入时复用 `resolveSafe`/`validateProjectPath`，不要手写路径拼接。
- 新增 provider/proxy 时显式写出允许的 host、scheme、超时和错误透传策略。
- 改 run 事件时同时更新 daemon event schema 和 Web provider 翻译逻辑。

## 相关页面

- [Agent 适配器与运行链路](agent-runtime.md)
- [图像、视频、音频生成与模板库](media-generation.md)
