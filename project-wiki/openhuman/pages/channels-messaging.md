<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/openhuman/channels](../../project-repos/openhuman/src/openhuman/channels)
- [gitbooks/features/integrations/README.md](../../project-repos/openhuman/gitbooks/features/integrations/README.md)

</details>

# 消息通道

`channels` 域实现 **双向消息**：Telegram、Discord、Matrix（feature）、WhatsApp Web（feature）、Yuanbao 等。

## 模式

- **Inbound**：webhook/long-poll → 归一化为 thread message → Agent  
- **Outbound**：Agent 回复 → channel adapter → 平台 API  
- **Credential channels**：用户自填 bot token / webhook URL  

UI 在 `app/src/components/channels/` 提供配置与状态 badge；RPC 封装在 `tauriCommands`。

## 与 Memory 的交叉

通道消息可进入 memory_conversations 索引（FTS5 + 跨脚本 tokenize），与 Memory Tree 的"文档型"记忆互补。

**Insight**：Telegram inline approvals 有独立 design spec（`docs/superpowers/specs/2026-05-23-telegram-inline-approvals-design.md`）——通道不仅是通知，还是 **移动审批面**。

## 相关页面

- [集成与 Composio](integrations-composio.md)
- [Agent 编排与循环](agent-orchestration.md)
- [React 前端](react-frontend.md)

Sources: [src/openhuman/channels:1-80](../../../project-repos/openhuman/src/openhuman/channels#L1-L80)

<details class="source-snippets">
<summary>引用源码</summary>

<!-- source-snippets:start -->

#### `src/openhuman/channels:1-80`

> 引用目标是目录，无法展开源码片段：`src/openhuman/channels`

<!-- source-snippets:end -->
</details>
