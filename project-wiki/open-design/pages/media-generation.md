<details>
<summary>相关源文件</summary>

- [README.md](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md) - media generation、prompt gallery、HyperFrames 说明。
- [apps/daemon/src/media.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) - provider dispatcher、路径校验和生成逻辑。
- [apps/daemon/src/media-models.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media-models.ts) - image/video/audio 模型表。
- [apps/daemon/src/prompt-templates.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompt-templates.ts) - prompt template 扫描和验证。
- [apps/daemon/src/prompts/media-contract.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/media-contract.ts) - media surface 的 agent 执行契约。
- [apps/daemon/src/server.ts](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts) - media config/models/generate/wait 路由。

</details>

# 图像、视频、音频生成与模板库

Open Design 把媒体生成视为非 HTML surface：agent 不应该在 `<artifact>` 里伪造二进制内容，而是通过 daemon 的 media dispatcher 写入真实文件。README 也把 media generation、prompt gallery 和 HyperFrames 列为项目的核心扩展能力。[README.md:489-560](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/README.md)

## Dispatcher 模型

`media.ts` 顶部说明了 dispatcher contract：支持 openai、volcengine、grok 等 provider，同时对 stub 路径做 gating。[apps/daemon/src/media.ts:1-38](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) 默认值和 stub 开关在 62-90 行；项目 image 路径和扩展名校验在 93-156 行；`generateMedia` 会校验 surface/model/options 并分发到允许模型。[apps/daemon/src/media.ts:62-156](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts) [apps/daemon/src/media.ts:192-260](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/media.ts)

Daemon 的 media routes 提供模型/config/generate/wait 等接口，和 Web 创建项目时选择的 image/video/audio metadata 对接。[apps/daemon/src/server.ts:1822-2021](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/server.ts)

## Prompt Templates

`prompt-templates.ts` 扫描 `prompt-templates/{image,video}` 并保留 source attribution。[apps/daemon/src/prompt-templates.ts:1-9](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompt-templates.ts) 列表、读取和字段校验分别处理 title、summary、category、tags、model、aspect、source 等信息。[apps/daemon/src/prompt-templates.ts:14-107](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompt-templates.ts)

这让媒体项目可以从模板开始，而不是只靠用户一句自然语言 prompt。模板信息也会进入 project metadata，再被 prompt composer 注入给 agent。[apps/daemon/src/prompts/system.ts:224-240](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/system.ts)

## Media Contract

`media-contract.ts` 明确把 media surface 的唯一执行路径定义为 `od media generate`，并说明 daemon 会写入文件、FileViewer 自动拾取，agent 只负责 prompt 和叙述。[apps/daemon/src/prompts/media-contract.ts:1-20](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/media-contract.ts) 契约还说明了 daemon 注入的 `OD_BIN`、`OD_PROJECT_ID`、`OD_PROJECT_DIR`、`OD_DAEMON_URL` 环境变量，以及命令参数和返回 JSON。[apps/daemon/src/prompts/media-contract.ts:58-103](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/media-contract.ts)

对于长任务，generate 可能快速返回 `{taskId}`，随后 agent 通过 `od media wait` 循环长轮询，直到 done/failed/running 终态。[apps/daemon/src/prompts/media-contract.ts:180-219](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/media-contract.ts)

## HyperFrames 特例

Media contract 对 `hyperframes-html` 做了 carve-out：composition HTML 由 agent 编写，但 Chrome-bound render 在 daemon 进程执行，以避免某些 agent shell sandbox 下的 Chrome 子进程问题。[apps/daemon/src/prompts/media-contract.ts:116-171](https://github.com/nexu-io/open-design/blob/9d700ec74fc671af845d68af472f7c5c6e0fcfc9/apps/daemon/src/prompts/media-contract.ts) 这也是为什么媒体链路同时需要 agent、daemon 和项目文件目录三方协同。

## 相关页面

- [Prompt 栈、发现表单与 Artifact 交付](prompt-artifact-flow.md)
- [Daemon API、本地数据与安全边界](daemon-api.md)
