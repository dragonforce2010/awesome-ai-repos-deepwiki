---
name: stitch
description: |
  当你需要通过官方 SDK 封装的 `stitch` CLI 检查或变更 Google Stitch 项目与屏幕时使用本技能。
  触发场景包括：列出 Stitch 项目、创建项目、列出或检查屏幕、从文本生成屏幕、编辑屏幕、检查 Stitch 鉴权状态，或在不想把 MCP 长期挂在活跃工具链里时使用 Stitch。
---

# Stitch（面向 Agent 的 CLI）

当任务涉及 Google Stitch 的项目、屏幕或鉴权状态，且本地 CLI 比常驻 MCP 更合适时使用本技能。

重要命名细节：

- npm 包名：`stitch-design-cli`
- CLI 二进制名：`stitch`

解析顺序：

1. 若 `stitch` 已在 `$PATH` 中，直接使用。
2. 否则用 `npx -y stitch-design-cli <args>` 显式运行已发布包。

不要猜测其他包名。

默认立场：

- 优先使用官方 SDK 封装的 `stitch` CLI，而不是浏览器自动化。
- 机器可读输出优先使用 `--json`。
- 在生成或编辑屏幕之前，优先做只读巡检。
- 仅当任务确实需要常驻工具使用或比本 CLI 暴露更低层能力时，才直接使用 Stitch MCP。

## 默认工作流

- 若缺少鉴权：运行 `stitch auth set`
- 健康检查：`stitch doctor --json`
- 查看鉴权状态：`stitch auth status --json`
- 列出工具：`stitch tool list --json`
- 列出项目：`stitch project list --json`
- 创建项目：`stitch project create --title "Design Sandbox" --json`
- 列出屏幕：`stitch screen list --project-id <project-id> --json`
- 检查屏幕：`stitch screen get --project-id <project-id> --screen-id <screen-id> --include-image --json`
- 生成屏幕：`stitch screen generate --project-id <project-id> --prompt "..." --device-type DESKTOP --json`
- 编辑屏幕：`stitch screen edit --project-id <project-id> --screen-id <screen-id> --prompt "..." --json`
- 生成变体：`stitch screen variants --project-id <project-id> --screen-id <screen-id> --prompt "..." --variant-count 3 --creative-range EXPLORE --json`

常见设计迭代流的推荐顺序：

1. `stitch doctor --json`
2. `stitch project list --json`
3. `stitch screen list --project-id <project-id> --json`
4. `stitch screen get --project-id <project-id> --screen-id <screen-id> --include-image --json`
5. `stitch screen edit --project-id <project-id> --screen-id <screen-id> --prompt "..." --json`
6. `stitch screen variants --project-id <project-id> --screen-id <screen-id> --prompt "..." --variant-count 3 --json`

## 鉴权

CLI 支持官方 Stitch SDK 暴露的两种鉴权模式：

- API Key
- OAuth access token 加 project id

若 `stitch doctor --json` 报告缺少鉴权：

- 最佳交互路径：`stitch auth set`
- 最佳临时路径：`STITCH_API_KEY=... stitch doctor --json`
- 保存本地配置：`printf '%s' "$STITCH_API_KEY" | stitch auth set --stdin`
- OAuth 本地配置：`stitch auth set --access-token "$STITCH_ACCESS_TOKEN" --project-id "$GOOGLE_CLOUD_PROJECT"`
- OAuth 环境变量路径：`STITCH_ACCESS_TOKEN=... GOOGLE_CLOUD_PROJECT=... stitch doctor --json`

避免把完整密钥粘贴到日志或聊天中。

## 快速验证

若不确定当前 shell 应使用哪种调用方式：

```bash
command -v stitch >/dev/null 2>&1 && stitch doctor --json || npx -y stitch-design-cli doctor --json
```

## 重要约束

- v1 仅覆盖项目与屏幕相关流程。
- 不要假设已暴露 design-system 操作。
- 不要假设已暴露截图上传作为种子输入。
- `project get` 绑定官方 `get_project` 工具。
- `screen edit` 与 `screen variants` 都支持多个 `--screen-id` 值。
- 编辑屏幕前，务必确认 project id 与 screen id。

## 契约

稳定的 JSON 行为见 `docs/CONTRACT_V1.md`。
