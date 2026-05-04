<details>
<summary>相关源文件</summary>

生成本页时使用的主要源文件：

- [src/config.ts](../../../project-repos/lark-context/src/config.ts)
- [README.md](../../../project-repos/lark-context/README.md)
- [src/commands/init.ts](../../../project-repos/lark-context/src/commands/init.ts)

</details>

# 配置、路径与隐私边界

配置系统的目标是：**同一套代码既能在笔记型电脑上交互使用，又能在 CI/Headless 环境用环境变量完全重写路径**。`loadConfig` 的优先级被写成 CLI flag → env → yaml → 默认值四段；`init` 则确保 `~/.lark-context` 与 `~/.claude/lark-memory`（可改写）存在。

| 环境变量 | 作用 |
|---------|------|
| `LARK_CONTEXT_CONFIG` | 覆盖默认 `~/.lark-context/config.yaml` |
| `LARK_CONTEXT_MEMORY_DIR` | 覆盖记忆输出根目录 |
| `LARK_CONTEXT_RAW_DIR` | 覆盖 SQLite 与中间状态目录 |

## 内网安装与飞书 Wiki（`lark-cli` 可读）

对已 OAuth 的开发者机器，`lark-cli` 可直接拉取云文档/Wiki 的 markdown，例如：

```bash
lark-cli docs +fetch \
  --doc "https://bytedance.larkoffice.com/wiki/Lk61wCa7YiW6w6kk0klcTKRKn6g" \
  --format json
```

团队在内网飞书 Wiki 中补充的安装路径（**以 Wiki 正文为准，以下为常见摘要**）：

- **CLI 包**：`@tiktok-fe/lark-context` 可通过内网 registry 安装，例如 `npm i -g @tiktok-fe/lark-context --registry http://bnpm.byted.org`（与开源文档里 `bnpm i -g` 叙述一致时以此侧边栏为准）。  
- **原生模块**：全局 `better-sqlite3` 若走 pnpm，需要 `pnpm approve-builds -g` 之类流程，避免安装后无法加载 SQLite。  
- **Skill**：可直接 `npx skills add git@code.byted.org:tiktok/lark-context.git -g -y`，与「从 Git 源分发 skill」的路径对齐。

公网 DeepWiki **不会**自动同步 Wiki 全文；更新叙事时应在本地执行上述 `+fetch`，再人工摘录进本站点。

## 隐私与数据驻留

README 在动机层面强调：**digest 阶段不调用外部 LLM API**，由 Claude Code 本地读写 markdown；再叠加 `show` 只读 SQLite 的行为，**在没有网络权限的机器上仍可持续阅读历史沉淀**（前提是之前已完成 `pull` / `ingest-doc`）。

## V1 能力边界（产品级约束）

README 将以下能力明确标为 V1 之外或限制：无自动 cron、首次拉取 200 页封顶、仅处理白名单群、部分老版文档类型、私聊/@消息/多维表格等留给 V2。阅读源码时应把这些当作**刻意的范围控制**，而不是遗漏实现。

Sources: [src/config.ts:6-133](../../../project-repos/lark-context/src/config.ts#L6-L133), [README.md:120-185](../../../project-repos/lark-context/README.md#L120-L185), [src/commands/init.ts:27-44](../../../project-repos/lark-context/src/commands/init.ts#L27-L44)

## 相关页面

- [系统架构](system-architecture.md) — `lark-cli` 依赖与错误语义  
- [CLI 命令参考](cli-commands.md) — 命令级 flag 与 stdin/out  
- [测试、构建与 Python 遗留](testing-and-legacy.md) — 如何在测试里重定向 HOME  
