<details>
<summary>相关源文件</summary>

- [apps/web/src/App.tsx](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/App.tsx) - Web app bootstrap、配置和主视图切换。
- [apps/web/src/state/config.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/state/config.ts) - localStorage 配置、daemon config 同步、媒体 provider 同步和迁移。
- [apps/web/src/types.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/types.ts) - AppConfig、agentModels、onboarding 等前端类型。
- [apps/web/src/components/ProjectView.tsx](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx) - 项目对话、run、artifact、文件和评论主流程。
- [apps/web/src/components/FileWorkspace.tsx](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/FileWorkspace.tsx) - 文件树、上传、打开和删除 UI。
- [apps/web/src/runtime/srcdoc.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/srcdoc.ts) - iframe srcdoc 包装、storage shim、评论桥和 deck bridge。
- [apps/web/src/artifacts/manifest.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/artifacts/manifest.ts) - artifact manifest 推断和验证。
- [apps/web/src/runtime/exports.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/exports.ts) - HTML/ZIP/Markdown/PDF/PPTX 导出。

</details>

# Web 工作台、预览与导出

Web 工作台是用户看到的 Open Design。它不直接读写任意本机资源，而是围绕 daemon API 聚合项目、agent、skills、design systems、prompt templates 和 artifact 状态。

## Bootstrap

`App.tsx` 的顶层 state 包含 config、daemon 状态、agents、skills、design systems、projects、templates 和 prompt templates。[apps/web/src/App.tsx:49-64](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/App.tsx) 启动后它探测 daemon，加载 agents/skills/design systems/projects/templates/prompt templates/version，并同时读取 daemon app-config；daemon 侧配置会覆盖 onboarding、agent、skill、design system 和 per-agent model 偏好，然后再写回本地与 daemon 保持同步。[apps/web/src/App.tsx:86-188](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/App.tsx) 项目创建、ZIP import、配置保存和媒体 provider 同步也在顶层协调。[apps/web/src/App.tsx:228-285](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/App.tsx)

最终渲染会在 `ProjectView` 和 `EntryView` 之间切换，并挂载 settings、pet overlay 等应用级 UI。[apps/web/src/App.tsx:398-470](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/App.tsx)

## 配置同步

`state/config.ts` 仍以 localStorage 保存完整 `AppConfig`，但新增 `fetchDaemonConfig` 和 `syncConfigToDaemon`，只把 onboarding、agentId、agentModels、skillId、designSystemId 这些非敏感偏好同步到 daemon。[apps/web/src/state/config.ts:219-276](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/state/config.ts) `AppConfig` 类型中也显式记录 per-CLI model picker 状态，老配置没有该字段时回落到 agent 默认模型。[apps/web/src/types.ts:140-155](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/types.ts)

## 项目视图

`ProjectView` 是创作主链路。它维护 conversations、messages、comments、artifact、files、tabs、run refs 等状态。[apps/web/src/components/ProjectView.tsx:95-163](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx) 页面加载时拉取会话、消息和评论；发送消息时准备附件、metadata、agent 参数并落库；streaming 期间解析 daemon 事件并持久化 agent 产出的文件。[apps/web/src/components/ProjectView.tsx:164-217](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx) [apps/web/src/components/ProjectView.tsx:710-999](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx)

当 agent 产出 artifact 时，前端会解析、更新 live artifact，并在保存文件时处理文件名冲突。[apps/web/src/components/ProjectView.tsx:782-859](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx) [apps/web/src/components/ProjectView.tsx:1019-1035](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/ProjectView.tsx)

## 预览 iframe

`srcdoc.ts` 负责把 HTML fragment 或完整 document 包成 iframe 可执行的 srcdoc，同时注入 base、sandbox shim、deck bridge 和 comment bridge。[apps/web/src/runtime/srcdoc.ts:1-37](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/srcdoc.ts) 其中 storage shim 让 sandbox iframe 里的 localStorage/sessionStorage 调用不会破坏预览；comment bridge 用 postMessage 提取点击目标；deck bridge 支持滚动式和 class visibility 式 deck。[apps/web/src/runtime/srcdoc.ts:59-205](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/srcdoc.ts)

这个设计把“预览能运行”和“不能越权访问父页面”分开处理：iframe 允许脚本执行，但通过 srcdoc 包装和 bridge 控制交互面。

## Artifact manifest 与导出

`manifest.ts` 定义 artifact 版本、允许的 kind/renderer/export/status，并提供 HTML artifact manifest 创建、解析、校验和 legacy 推断。[apps/web/src/artifacts/manifest.ts:9-42](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/artifacts/manifest.ts) [apps/web/src/artifacts/manifest.ts:72-183](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/artifacts/manifest.ts)

`exports.ts` 负责导出模型：PDF/HTML/ZIP/Markdown 在浏览器侧处理，PPTX 走 server-side 或桌面能力。[apps/web/src/runtime/exports.ts:1-13](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/exports.ts) HTML/ZIP/MD、项目 zip fallback 和 PDF 打印链路分别在对应函数中实现。[apps/web/src/runtime/exports.ts:40-67](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/exports.ts) [apps/web/src/runtime/exports.ts:102-129](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/exports.ts) [apps/web/src/runtime/exports.ts:161-205](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/runtime/exports.ts)

## 文件工作区

`FileWorkspace` 展示项目文件、处理打开请求、上传文件和删除文件。[apps/web/src/components/FileWorkspace.tsx:43-68](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/FileWorkspace.tsx) [apps/web/src/components/FileWorkspace.tsx:151-232](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/web/src/components/FileWorkspace.tsx) 对用户来说它是项目文件的可见面；对系统来说它必须和 daemon 的路径校验保持一致。

## 相关页面

- [Prompt 栈、发现表单与 Artifact 交付](prompt-artifact-flow.md)
- [Daemon API、本地数据与安全边界](daemon-api.md)
